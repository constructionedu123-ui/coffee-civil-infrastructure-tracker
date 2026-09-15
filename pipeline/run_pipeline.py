"""
pipeline/run_pipeline.py
-------------------------
CLI orchestrator for the Indonesian Infrastructure Map data pipeline.

Usage
-----
    # First-time setup (download GeoJSON):
    python -m pipeline.setup_data

    # Run full pipeline (scrape + geocode + store + export):
    python -m pipeline.run_pipeline

    # Scrape only one source:
    python -m pipeline.run_pipeline --source kppip
    python -m pipeline.run_pipeline --source bpjt

    # Skip re-scraping; just re-export GeoJSON from existing DB:
    python -m pipeline.run_pipeline --export-only

    # Custom DB path:
    python -m pipeline.run_pipeline --db path/to/custom.sqlite
"""
from __future__ import annotations

import argparse
import hashlib
import logging
import sys
from datetime import datetime
from pathlib import Path

# Ensure UTF-8 output on Windows console (cp1252 fix)
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from tqdm import tqdm

from pipeline.config import DB_PATH, GEOJSON_OUTPUT
from pipeline.geocoder import geocode
from pipeline.normaliser import infer_pjpk, infer_funding_scheme
from pipeline.schema import ProjectRecord
from pipeline.storage.database import get_summary, init_db, upsert_many
from pipeline.storage.geojson_export import export_geojson

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("pipeline")


# ── Helper ────────────────────────────────────────────────────────────────────

def _make_project_id(name: str, source: str) -> str:
    key = f"{name.strip().lower()}|{source}"
    return hashlib.sha256(key.encode()).hexdigest()[:16]


def _enrich_and_validate(raw: dict) -> dict | None:
    """
    Apply geocoding to a raw scraped dict and validate with Pydantic.
    Returns a flat dict ready for DB insertion, or None on validation failure.
    """
    combined = f"{raw.get('project_name', '')} {raw.get('province', '')} {raw.get('location_text', '')}".lower()

    # Special Bias: Tanggul Laut / NCICD biased to DKI Jakarta / Pantura Jawa
    if "tanggul laut" in combined or "ncicd" in combined or "tanggul pantai" in combined:
        lat, lon = -6.1000, 106.8500
        method = "hardcoded"
        if not raw.get("province") or raw.get("province") in ("Nasional", "Lintas Provinsi"):
            raw["province"] = "DKI Jakarta"
        if not raw.get("regency"):
            raw["regency"] = "Jakarta Utara (Pantura)"
    else:
        # Geocode — try location_text, then province, then fall back to project name
        location_text = raw.get("location_text") or raw.get("province") or ""
        lat, lon, method = geocode(location_text)

        # If unresolved and a separate province name is known, try province directly
        if method == "unresolved" and raw.get("province") and raw.get("province") != location_text:
            lat, lon, method = geocode(raw["province"])

        # Last resort: try geocoding tokens extracted from the project name itself
        if method == "unresolved":
            project_name = raw.get("project_name", "")
            lat, lon, method = geocode(project_name)

        # Fallback for 'Nasional' / 'Lintas Provinsi' / Multi-province entries -> central Indonesia
        if method == "unresolved":
            if any(k in combined for k in ["nasional", "lintas provinsi", "lintas-provinsi", "lintas pulau", "hvdc", "indonesia"]):
                lat, lon = -2.5489, 118.0149
                method = "national_fallback"
                if not raw.get("province"):
                    raw["province"] = "Nasional"

    if not raw.get("province"):
        name_l = (raw.get("project_name") or "").lower()
        if "sumatera" in name_l:
            raw["province"] = "Sumatera (Lintas Provinsi)"
        elif "jawa" in name_l:
            raw["province"] = "Jawa (Lintas Provinsi)"
        elif "kalimantan" in name_l:
            raw["province"] = "Kalimantan (Lintas Provinsi)"
        elif "sulawesi" in name_l:
            raw["province"] = "Sulawesi (Lintas Provinsi)"
        elif method == "national_fallback":
            raw["province"] = "Nasional"
        elif method in ("hardcoded", "province_fallback"):
            raw["province"] = "Lintas Provinsi"

    # Special Bias: DI Lhok Guci placed specifically on Aceh Barat mainland
    if "lhok guci" in combined:
        lat, lon = 4.3500, 96.1800
        method = "hardcoded"
        raw["province"] = "Aceh"
        raw["regency"] = "Aceh Barat"

    # Special Bias: Jalan Tol Binjai Langsa on Sumatra mainland corridor
    if "binjai" in combined and "langsa" in combined:
        lat, lon = 4.0400, 98.2250
        method = "hardcoded"
        raw["province"] = "Aceh / Sumatera Utara"
        raw["regency"] = "Binjai - Langsa"

    # Sanitization rule: For any project in northern regions, if latitude < 0, convert to abs(latitude)
    prov_lower = (raw.get("province") or "").lower()
    name_lower = (raw.get("project_name") or "").lower()
    loc_lower = (raw.get("location_text") or "").lower()
    check_str = f"{prov_lower} {name_lower} {loc_lower}"

    if any(k in check_str for k in [
        "aceh", "sumatera utara", "sumut", "north sumatra", "medan", "binjai", "langkat", "langsa",
        "riau", "kepri", "batam", "kalimantan utara", "kaltara", "sulawesi utara", "sulut"
    ]):
        if lat is not None and lat < 0:
            log.info("Sanitizing negative latitude for northern project '%s': %f -> %f", raw.get("project_name"), lat, abs(lat))
            lat = abs(lat)

    raw["latitude"] = lat
    raw["longitude"] = lon
    raw["geocode_method"] = method
    raw["project_id"] = _make_project_id(raw.get("project_name", ""), raw.get("source_name", ""))

    # Enrich PJPK (Ministry / Responsible Agency) and Funding Scheme if missing or generic
    category = raw.get("category", "Transport")
    raw["pjpk"] = infer_pjpk(raw.get("project_name", ""), category, raw.get("pjpk"))
    raw["funding_scheme"] = infer_funding_scheme(raw.get("project_name", ""), category, raw.get("funding_scheme"))

    # Validate
    try:
        rec = ProjectRecord(
            project_name=raw["project_name"],
            source_url=raw["source_url"],
            source_name=raw["source_name"],
            category=raw.get("category", "Transport"),
            status=raw.get("status", "Unknown"),
            budget_idr=raw.get("budget_idr"),
            budget_raw=raw.get("budget_raw"),
            contractor=raw.get("contractor"),
            funding_scheme=raw.get("funding_scheme"),
            pjpk=raw.get("pjpk"),
            province=raw.get("province"),
            regency=raw.get("regency"),
            latitude=lat,
            longitude=lon,
            geocode_method=method,
        )
    except Exception as exc:
        log.warning("Validation failed for '%s': %s", raw.get("project_name"), exc)
        return None

    result = rec.model_dump()
    result["project_id"] = raw["project_id"]
    result["scraped_at"] = rec.scraped_at.isoformat()
    return result


# ── Scraper runners ───────────────────────────────────────────────────────────

def run_kppip(db_path: Path) -> int:
    from pipeline.scrapers.kppip_scraper import KppipScraper

    log.info("=== Scraping KPPIP ===")
    records: list[dict] = []

    with KppipScraper() as scraper:
        raw_records = list(tqdm(scraper.scrape(), desc="KPPIP pages", unit="project"))

    log.info("KPPIP: %d raw records scraped", len(raw_records))

    for raw in tqdm(raw_records, desc="Geocoding KPPIP", unit="project"):
        enriched = _enrich_and_validate(raw)
        if enriched:
            records.append(enriched)

    count = upsert_many(records, db_path=db_path)
    log.info("KPPIP: %d records written to DB", count)
    return count


def run_bpjt(db_path: Path) -> int:
    from pipeline.scrapers.bpjt_scraper import BpjtScraper

    log.info("=== Scraping BPJT ===")
    records: list[dict] = []

    with BpjtScraper() as scraper:
        raw_records = list(tqdm(scraper.scrape(), desc="BPJT table", unit="row"))

    log.info("BPJT: %d raw records scraped", len(raw_records))

    for raw in tqdm(raw_records, desc="Geocoding BPJT", unit="project"):
        enriched = _enrich_and_validate(raw)
        if enriched:
            records.append(enriched)

    count = upsert_many(records, db_path=db_path)
    log.info("BPJT: %d records written to DB", count)
    return count


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Indonesian Infrastructure Map – Data Pipeline"
    )
    parser.add_argument(
        "--source",
        choices=["kppip", "bpjt", "all"],
        default="all",
        help="Which source to scrape (default: all)",
    )
    parser.add_argument(
        "--db",
        type=Path,
        default=DB_PATH,
        help=f"SQLite database path (default: {DB_PATH})",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=GEOJSON_OUTPUT,
        help=f"GeoJSON output path (default: {GEOJSON_OUTPUT})",
    )
    parser.add_argument(
        "--export-only",
        action="store_true",
        help="Skip scraping; re-export GeoJSON from existing DB",
    )
    parser.add_argument(
        "--no-export",
        action="store_true",
        help="Skip GeoJSON export after scraping",
    )
    args = parser.parse_args()

    # Ensure DB is initialised
    init_db(args.db)

    if not args.export_only:
        total = 0
        if args.source in ("kppip", "all"):
            total += run_kppip(args.db)
        if args.source in ("bpjt", "all"):
            total += run_bpjt(args.db)
        log.info("Total records stored: %d", total)

    if not args.no_export:
        log.info("=== Exporting GeoJSON ===")
        exported, unresolved = export_geojson(
            output_path=args.output, db_path=args.db
        )
        log.info("Exported %d features; %d unresolved (no coordinates)", exported, unresolved)

    # Print summary
    summary = get_summary(args.db)
    print("\n── Pipeline Summary ─────────────────────────────")
    print(f"  Total projects  : {summary['total']}")
    print(f"  Geocoded        : {summary['geocoded']}")
    print(f"  By category     : {summary['by_category']}")
    print(f"  By status       : {summary['by_status']}")
    print(f"  GeoJSON output  : {args.output}")
    print("─────────────────────────────────────────────────\n")




if __name__ == "__main__":
    main()
