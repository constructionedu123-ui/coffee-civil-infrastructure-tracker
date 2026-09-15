"""
pipeline/setup_data.py
-----------------------
One-time data setup:
  1. Downloads HDX Indonesia ADM1 + ADM2 GeoJSON files to /data/
  2. Pre-computes centroid lookup dicts and caches to data/centroids_cache.json

Run this ONCE before the pipeline:
    python -m pipeline.setup_data
"""
from __future__ import annotations

import json
import logging
import sys
from pathlib import Path

import requests
from tqdm import tqdm

from pipeline.config import ADM1_GEOJSON, ADM2_GEOJSON, CENTROID_CACHE, DATA_DIR

log = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")

# ── Alternative download URLs (HDX redirects can be unreliable) ───────────────
# We try multiple mirrors in order
ADM1_URLS = [
    # Primary: superpikar (province polygons), property key: "state"
    "https://raw.githubusercontent.com/superpikar/indonesia-geojson/master/indonesia-en.geojson",
    # Fallback: HDX (if URL is updated)
    "https://data.humdata.org/dataset/cod-ab-indonesia/resource/"
    "aa39c8d4-4a5d-48de-b2cc-dc91c8a1b5e4/download/idn_admbnda_adm1_bps_20200401.geojson",
]
ADM2_URLS = [
    # Primary: indonesia-peta kabupaten-kota GeoJSON
    "https://raw.githubusercontent.com/ans-4175/peta-indonesia-geojson/master/indonesia-prov.json",
    # Second: gadm-based community dataset
    "https://raw.githubusercontent.com/superpikar/indonesia-geojson/master/indonesia.geojson",
]


def _download(urls: list[str], dest: Path, label: str) -> bool:
    """Try each URL in order; write to dest on success. Returns True on success."""
    for url in urls:
        log.info("Trying %s from: %s", label, url)
        try:
            with requests.get(url, stream=True, timeout=60) as resp:
                resp.raise_for_status()
                total = int(resp.headers.get("content-length", 0))
                dest.parent.mkdir(parents=True, exist_ok=True)
                with dest.open("wb") as f, tqdm(
                    total=total, unit="B", unit_scale=True, desc=label
                ) as bar:
                    for chunk in resp.iter_content(chunk_size=8192):
                        f.write(chunk)
                        bar.update(len(chunk))
            log.info("Downloaded %s → %s", label, dest)
            return True
        except Exception as exc:
            log.warning("Failed (%s): %s", url, exc)

    log.error("All download attempts failed for %s", label)
    return False


def _build_and_cache_centroids() -> None:
    """Build centroid dicts from GeoJSON and save to cache."""
    from pipeline.geocoder import _build_centroid_dict, _save_cache

    adm1: dict[str, tuple[float, float]] = {}
    adm2: dict[str, tuple[float, float]] = {}

    if ADM1_GEOJSON.exists():
        # superpikar uses "state" key; HDX uses "ADM1_EN"/"ADM1_ID"
        adm1 = _build_centroid_dict(
            ADM1_GEOJSON,
            name_fields=["state", "ADM1_EN", "ADM1_ID", "name", "NAME_1", "provinsi"]
        )
        log.info("ADM1 centroids computed: %d entries", len(adm1))
    else:
        log.warning("ADM1 GeoJSON missing; skipping")

    if ADM2_GEOJSON.exists():
        # Various community GeoJSONs use different property keys
        adm2 = _build_centroid_dict(
            ADM2_GEOJSON,
            name_fields=[
                "ADM2_EN", "ADM2_ID", "KABKOT", "name", "NAME_2",
                "kabupaten", "Kabupaten", "district", "District",
                "state",  # ans-4175 dataset uses this
            ]
        )
        log.info("ADM2 centroids computed: %d entries", len(adm2))
    else:
        log.warning("ADM2 GeoJSON missing; only province-level geocoding will work")

    _save_cache(adm1, adm2)
    log.info("Centroid cache saved to %s", CENTROID_CACHE)


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    ok1 = True
    ok2 = True

    if not ADM1_GEOJSON.exists():
        ok1 = _download(ADM1_URLS, ADM1_GEOJSON, "ADM1 (Provinces)")
    else:
        log.info("ADM1 GeoJSON already exists; skipping download")

    if not ADM2_GEOJSON.exists():
        ok2 = _download(ADM2_URLS, ADM2_GEOJSON, "ADM2 (Kabupaten/Kota)")
    else:
        log.info("ADM2 GeoJSON already exists; skipping download")

    if not (ok1 or ok2):
        log.error("Could not download any GeoJSON data. Check your internet connection.")
        sys.exit(1)

    log.info("Building centroid lookup cache …")
    _build_and_cache_centroids()
    log.info("✓ Setup complete. You can now run: python -m pipeline.run_pipeline")


if __name__ == "__main__":
    main()
