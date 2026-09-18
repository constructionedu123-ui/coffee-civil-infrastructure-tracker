"""
pipeline/schema.py
------------------
Pydantic data model for a normalised infrastructure project record.
"""
from __future__ import annotations

import hashlib
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, computed_field, field_validator


CategoryType = Literal["Transport", "Water", "Energy", "Housing", "IKN"]
StatusType = Literal["Planning", "Construction", "Operational", "Completed", "Unknown"]
GeocodeMethodType = Literal[
    "exact_kabupaten", "province_fallback", "hardcoded", "national_fallback", "unresolved"
]



class ProjectRecord(BaseModel):
    """One normalised infrastructure project."""

    # ── Identity ────────────────────────────────────────────────────────────
    project_name: str
    source_url: str
    source_name: Literal["KPPIP", "BPJT", "Kementerian PU (BIM)"] | str

    # ── Classification ───────────────────────────────────────────────────────
    category: CategoryType = "Transport"
    status: StatusType = "Unknown"

    # ── Financial ────────────────────────────────────────────────────────────
    budget_idr: Optional[float] = None          # in trillions IDR
    budget_raw: Optional[str] = None            # original text before parsing
    funding_scheme: Optional[str] = None        # APBN, KPBU, Swasta, Penugasan BUMN

    # ── Parties & Ministry ───────────────────────────────────────────────────
    contractor: Optional[str] = None
    pjpk: Optional[str] = None                  # Penanggung Jawab Proyek Kerjasama / Kementerian Terkait
    unor: Optional[str] = None                  # Unit Organisasi (Bina Marga, SDA, Cipta Karya)
    balai: Optional[str] = None                 # Balai Wilayah / Balai Besar
    fiscal_year: Optional[str] = None           # Tahun Anggaran
    progress: Optional[float] = None            # Physical progress percentage (0 - 100)

    # ── BIM (Building Information Modeling) ──────────────────────────────────
    bim_viewer_url: Optional[str] = None        # Direct Autodesk 3D viewer link
    bim_uuid: Optional[str] = None              # PU BIM internal package UUID

    # ── Location ────────────────────────────────────────────────────────────
    province: Optional[str] = None
    regency: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    geocode_method: GeocodeMethodType = "unresolved"

    # ── Meta ─────────────────────────────────────────────────────────────────
    scraped_at: datetime = datetime.utcnow()

    @computed_field  # type: ignore[misc]
    @property
    def project_id(self) -> str:
        """Stable SHA-256 fingerprint from name + source."""
        key = f"{self.project_name.strip().lower()}|{self.source_name}"
        return hashlib.sha256(key.encode()).hexdigest()[:16]

    @field_validator("budget_idr", mode="before")
    @classmethod
    def clamp_budget(cls, v: object) -> Optional[float]:
        if v is None:
            return None
        try:
            f = float(v)
            return round(f, 4) if f > 0 else None
        except (TypeError, ValueError):
            return None

    def to_geojson_feature(self) -> dict:
        """Convert to a GeoJSON Feature dict (only if coordinates are set)."""
        if self.latitude is None or self.longitude is None:
            return {}
        props = self.model_dump(exclude={"latitude", "longitude"})
        props["project_id"] = self.project_id
        # Serialise datetime
        props["scraped_at"] = self.scraped_at.isoformat()
        return {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [self.longitude, self.latitude],
            },
            "properties": props,
        }
