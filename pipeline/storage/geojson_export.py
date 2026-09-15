"""
pipeline/storage/geojson_export.py
------------------------------------
Export all geocoded project records from SQLite as a GeoJSON FeatureCollection.
Records with NULL lat/lon are excluded from geometry but listed in a
separate unresolved CSV.
"""
from __future__ import annotations

import csv
import json
import logging
from pathlib import Path

from pipeline.config import GEOJSON_OUTPUT, UNRESOLVED_GEOCODES_CSV
from pipeline.storage.database import get_all_projects

log = logging.getLogger(__name__)


def export_geojson(
    output_path: Path = GEOJSON_OUTPUT,
    unresolved_csv: Path = UNRESOLVED_GEOCODES_CSV,
    db_path: Path | None = None,
) -> tuple[int, int]:
    """
    Write projects.geojson and unresolved_geocodes.csv.

    Returns
    -------
    (exported_count, unresolved_count)
    """
    kwargs = {"db_path": db_path} if db_path else {}
    rows = get_all_projects(**kwargs)

    features = []
    unresolved = []

    for row in rows:
        lat = row.get("latitude")
        lon = row.get("longitude")

        if lat is not None and lon is not None:
            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [lon, lat],
                },
                "properties": {
                    k: v
                    for k, v in row.items()
                    if k not in ("latitude", "longitude")
                },
            }
            features.append(feature)
        else:
            unresolved.append(row)

    # ── Write GeoJSON ─────────────────────────────────────────────────────────
    geojson = {
        "type": "FeatureCollection",
        "features": features,
        "metadata": {
            "total_features": len(features),
            "unresolved_count": len(unresolved),
            "source": "Coffee Civil News Bot – Phase 1 Pipeline",
        },
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as f:
        json.dump(geojson, f, ensure_ascii=False, indent=2, default=str)
    log.info("GeoJSON written: %d features → %s", len(features), output_path)

    # ── Write unresolved CSV ──────────────────────────────────────────────────
    if unresolved:
        unresolved_csv.parent.mkdir(parents=True, exist_ok=True)
        fieldnames = list(unresolved[0].keys())
        with unresolved_csv.open("w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(unresolved)
        log.info(
            "Unresolved geocodes written: %d records → %s", len(unresolved), unresolved_csv
        )

    return len(features), len(unresolved)
