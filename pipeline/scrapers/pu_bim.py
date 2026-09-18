"""
pipeline/scrapers/pu_bim.py
----------------------------
Scraper and normaliser for Kementerian PU Building Information Modeling (BIM)
packages from https://bim.pu.go.id/paket-bim.
"""
from __future__ import annotations

import json
import logging
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Optional

import requests
from urllib3.util.retry import Retry
from requests.adapters import HTTPAdapter

from pipeline.geocoder import geocode
from pipeline.schema import CategoryType, ProjectRecord, StatusType

log = logging.getLogger(__name__)

REGISTRY_URL = "https://bim.pu.go.id/api/paket/"
DETAIL_URL_TEMPLATE = "https://bim.pu.go.id/api/paket/{uid}/"
VIEWER_URL_TEMPLATE = "https://bim.pu.go.id/{uid}"
PJPK_PU = "Kementerian Pekerjaan Umum dan Perumahan Rakyat"


def _build_pu_session() -> requests.Session:
    """Session configured with retries and SSL verification bypass if needed."""
    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
    })
    retry = Retry(
        total=3,
        backoff_factor=0.5,
        status_forcelist=[429, 500, 502, 503, 504],
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session


def classify_category(unor: Optional[str], infra_cat: Optional[str], name: str) -> CategoryType:
    """Classify project sector category based on Unor, infra type, and keywords."""
    combined = f"{unor or ''} {infra_cat or ''} {name}".lower()

    if any(k in combined for k in ["ikn", "ibu kota nusantara", "sepaku", "kipp"]):
        return "IKN"

    if any(k in combined for k in [
        "sumber daya air", "sda", "bendungan", "embung", "irigasi", "banjir",
        "pantai", "sungai", "danau", "spam", "air minum", "air baku", "drainase",
        "absah", "seawall", "tanggul", "pengendali", "sedimen", "jetty"
    ]):
        return "Water"

    if any(k in combined for k in [
        "bina marga", "jalan", "jembatan", "tol", "flyover", "underpass",
        "arteri", "preservasi", "seksi", "lingkar"
    ]):
        return "Transport"

    if any(k in combined for k in ["pltu", "plta", "energi", "listrik", "solar", "transmisi"]):
        return "Energy"

    # Cipta Karya, Prasarana Strategis, Gedung, Rusun, dsb.
    return "Housing"


def classify_status(status_str: Optional[str], progress: Optional[float]) -> StatusType:
    """Map PU status string and progress percentage to StatusType."""
    if progress is not None and progress >= 100:
        return "Completed"

    if status_str:
        s = status_str.strip().lower()
        if any(k in s for k in ["selesai", "operasional", "completed", "finish"]):
            return "Completed"
        if any(k in s for k in ["konstruksi", "sedang berjalan", "pelaksanaan", "progres"]):
            return "Construction"
        if any(k in s for k in ["rencana", "persiapan", "penyiapan", "planning"]):
            return "Planning"

    if progress is not None and progress > 0:
        return "Construction"

    return "Construction"


def clean_project_name(alias_name: Optional[str], nmpaket: Optional[str]) -> str:
    """Extract a clean human-readable project title."""
    raw = (alias_name or "").strip()
    if not raw:
        raw = (nmpaket or "").strip()

    # If format like "SDA_2024_PSN_Bendungan Bagong_Paket 3"
    if "_" in raw and not alias_name:
        parts = raw.split("_")
        raw = " ".join(parts[2:]) if len(parts) > 2 else raw.replace("_", " ")

    # Clean double spaces and underscores
    raw = re.sub(r"_+", " ", raw)
    raw = re.sub(r"\s+", " ", raw).strip()
    return raw or "Paket BIM PUPR"


def parse_location_text(location_text: Optional[str]) -> tuple[Optional[str], Optional[str]]:
    """Split location text like 'Trenggalek, Jawa Timur' into (regency, province)."""
    if not location_text or not location_text.strip():
        return None, None
    parts = [p.strip() for p in location_text.split(",") if p.strip()]
    if len(parts) >= 2:
        return parts[0], parts[-1]
    return None, parts[0]


class PUBIMScraper:
    """Scraper for Kementerian PU BIM Portal."""

    def __init__(self, max_workers: int = 12) -> None:
        self.session = _build_pu_session()
        self.max_workers = max_workers

    def fetch_registry(self) -> list[dict]:
        """Fetch the full list of packages from bim.pu.go.id/api/paket/."""
        log.info("Fetching package list from %s ...", REGISTRY_URL)
        try:
            resp = self.session.get(REGISTRY_URL, timeout=30, verify=False)
            if resp.status_code != 200:
                log.error("Failed to fetch registry: HTTP %s", resp.status_code)
                return []
            data = resp.json().get("data", [])
            log.info("Successfully fetched %d package items from PU BIM registry", len(data))
            return data
        except Exception as e:
            log.error("Error fetching PU BIM registry: %s", e)
            return []

    def fetch_detail(self, uid: str) -> Optional[dict]:
        """Fetch detail metadata for a single package UUID."""
        url = DETAIL_URL_TEMPLATE.format(uid=uid)
        try:
            resp = self.session.get(url, timeout=12, verify=False)
            if resp.status_code == 200:
                payload = resp.json()
                if payload.get("status") and isinstance(payload.get("data"), dict):
                    return payload["data"]
        except Exception:
            pass
        return None

    def scrape(self) -> list[ProjectRecord]:
        """Execute full scrape, detail enrichment, geocoding, and normalization."""
        raw_items = self.fetch_registry()
        if not raw_items:
            log.warning("No packages returned from PU BIM registry")
            return []

        # Filter valid items with a UUID
        valid_items = [it for it in raw_items if it.get("uid")]
        log.info("Ingesting %d valid packages with UUIDs (concurrency: %d workers)...", len(valid_items), self.max_workers)

        # Concurrently fetch details
        detail_map: dict[str, dict] = {}
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            future_to_uid = {
                executor.submit(self.fetch_detail, it["uid"]): it["uid"]
                for it in valid_items
            }
            completed_count = 0
            for future in as_completed(future_to_uid):
                uid = future_to_uid[future]
                completed_count += 1
                if completed_count % 100 == 0:
                    log.info("Fetched details: %d / %d", completed_count, len(valid_items))
                try:
                    res = future.result()
                    if res:
                        detail_map[uid] = res
                except Exception:
                    pass

        log.info("Fetched detail records for %d / %d packages", len(detail_map), len(valid_items))

        records: list[ProjectRecord] = []
        for item in valid_items:
            uid = item["uid"]
            detail = detail_map.get(uid, {})

            project_name = clean_project_name(
                detail.get("alias_name") or item.get("alias_name"),
                detail.get("nmpaket") or item.get("nmpaket"),
            )

            unor = detail.get("unor") or item.get("unor")
            balai = detail.get("balai")
            fiscal_year = str(detail.get("year") or item.get("year") or "").strip() or None
            infra_cat = detail.get("infra_category")
            category = classify_category(unor, infra_cat, project_name)

            # Progress %
            raw_progress = detail.get("progress")
            progress: Optional[float] = None
            if raw_progress is not None:
                try:
                    progress = round(float(raw_progress), 2)
                except (ValueError, TypeError):
                    progress = None

            status = classify_status(detail.get("status"), progress)

            # Budget
            budget_source = detail.get("budget_source") or "APBN"
            pagu_total = detail.get("pagu_total") or item.get("pagu_total")
            budget_idr: Optional[float] = None
            budget_raw: Optional[str] = None
            if pagu_total:
                try:
                    pagu_f = float(pagu_total)
                    if pagu_f > 0:
                        if pagu_f > 1_000_000_000:
                            budget_idr = round(pagu_f / 1_000_000_000_000, 4)
                        else:
                            budget_idr = round(pagu_f, 4)
                        budget_raw = f"Rp {pagu_f:,.0f}"
                except (ValueError, TypeError):
                    pass

            # Location and Coordinates
            location_text = detail.get("location")
            regency, province = parse_location_text(location_text)

            lat: Optional[float] = None
            lon: Optional[float] = None
            geocode_method = "unresolved"

            # Check direct coordinates from PU API
            lat_raw = detail.get("latitude") or item.get("latitude")
            lon_raw = detail.get("longitude") or item.get("longitude")
            if lat_raw and lon_raw:
                try:
                    lat_cand = float(lat_raw)
                    lon_cand = float(lon_raw)
                    if -11.5 <= lat_cand <= 6.5 and 94.0 <= lon_cand <= 142.0:
                        lat = round(lat_cand, 6)
                        lon = round(lon_cand, 6)
                        geocode_method = "exact_kabupaten"
                except (ValueError, TypeError):
                    pass

            # Fallback geocoding if PU coordinates are missing
            if lat is None or lon is None:
                search_query = location_text or regency or province or project_name
                g_lat, g_lon, g_method = geocode(search_query)
                if g_lat is not None and g_lon is not None:
                    lat = round(g_lat, 6)
                    lon = round(g_lon, 6)
                    geocode_method = g_method

            bim_viewer_url = VIEWER_URL_TEMPLATE.format(uid=uid)
            source_url = bim_viewer_url

            record = ProjectRecord(
                project_name=project_name,
                source_url=source_url,
                source_name="Kementerian PU (BIM)",
                category=category,
                status=status,
                budget_idr=budget_idr,
                budget_raw=budget_raw,
                funding_scheme=budget_source,
                contractor=None,
                pjpk=PJPK_PU,
                unor=unor,
                balai=balai,
                fiscal_year=fiscal_year,
                progress=progress,
                bim_viewer_url=bim_viewer_url,
                bim_uuid=uid,
                province=province,
                regency=regency,
                latitude=lat,
                longitude=lon,
                geocode_method=geocode_method,
            )
            records.append(record)

        log.info(
            "Scraped %d Kementerian PU BIM projects (%d with valid coordinates)",
            len(records),
            sum(1 for r in records if r.latitude is not None and r.longitude is not None),
        )
        return records


if __name__ == "__main__":
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path.cwd()))
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    scraper = PUBIMScraper(max_workers=12)
    recs = scraper.scrape()
    print(f"Total scraped: {len(recs)}")
    if recs:
        print("Sample record:", recs[0].model_dump())
