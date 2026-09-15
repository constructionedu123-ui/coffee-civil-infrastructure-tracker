"""
pipeline/geocoder.py
---------------------
Three-tier offline geocoder for Indonesian kabupaten/kota names.

Tier 1 — exact kabupaten/kota match against ADM2 GeoJSON + seed CSV centroids
Tier 2 — province-level fallback against ADM1 GeoJSON centroids
Tier 3 — hardcoded special-case overrides (IKN, Batam, etc.)
Tier 0 (pre-check) — returns "unresolved" if none of the above match
"""
from __future__ import annotations

import csv
import json
import logging
from pathlib import Path
from typing import Optional

SEED_CSV = Path(__file__).resolve().parent.parent / "data" / "kabupaten_centroids_seed.csv"

from pipeline.config import ADM1_GEOJSON, ADM2_GEOJSON, CENTROID_CACHE
from pipeline.normaliser import normalise_admin_name

log = logging.getLogger(__name__)

# ── Hardcoded overrides ───────────────────────────────────────────────────────
# Format: normalised_name → (lat, lon)
HARDCODED: dict[str, tuple[float, float]] = {
    # IKN / Nusantara
    "ikn": (-0.8441, 116.7194),
    "ibu kota nusantara": (-0.8441, 116.7194),
    "nusantara": (-0.8441, 116.7194),
    "penajam paser utara": (-1.4567, 116.3278),
    # Special regions
    "batam": (1.0784, 104.0207),
    "dki jakarta": (-6.2088, 106.8456),
    "jakarta": (-6.2088, 106.8456),
    "indonesia": (-2.5489, 118.0149),
    # National / Lintas Provinsi central Indonesia fallback
    "nasional": (-2.5489, 118.0149),
    "lintas provinsi": (-2.5489, 118.0149),
    "lintas-provinsi": (-2.5489, 118.0149),
    "lintas wilayah": (-2.5489, 118.0149),
    "lintas pulau": (-2.5489, 118.0149),
    "multi provinsi": (-2.5489, 118.0149),
    "seluruh indonesia": (-2.5489, 118.0149),
    # National power / transmission projects
    "central west java transmission": (-6.9000, 107.6000),  # Central-West Java 500kV approx
    "central ? west java": (-6.9000, 107.6000),
    "hvdc": (-6.9000, 107.6000),          # HVDC Java link
    "high voltage direct current": (-6.9000, 107.6000),
    "transmisi sumatera": (0.5000, 101.4000),  # Trans-Sumatera HV corridor
    "pltu mulut tambang": (-2.5000, 115.5000),  # Kaltim/Kalsel pit-mouth power
    # National toll road
    "trans sumatera": (0.5000, 101.4000),
    "jalan tol trans sumatera": (0.5000, 101.4000),
    # Rail
    "kereta api ekspres shia": (-6.1256, 106.6558),  # Soetta airport rail
    "ekspres shia": (-6.1256, 106.6558),
    "shia": (-6.1256, 106.6558),
    # Water / coastal (NCICD & Tanggul Laut biased to DKI Jakarta / Pantura Jawa)
    "tanggul laut": (-6.1000, 106.8500),   # Jakarta / Pantura sea wall
    "tanggul laut jakarta": (-6.1000, 106.8500),
    "tanggul pantai": (-6.1000, 106.8500),
    "ncicd": (-6.1000, 106.8500),          # National Capital Integrated Coastal Development
    "national capital integrated coastal development": (-6.1000, 106.8500),
    "pantura": (-6.8500, 109.1300),        # Pantura Jawa corridor
    "jatiluhur": (-6.5127, 107.3594),
    "spam regional jatiluhur": (-6.5127, 107.3594),
    # Aceh Strategic Infrastructure (Northern Indonesia must retain lat > 0)
    "lhok guci": (4.3500, 96.1800),        # Aceh Barat mainland
    "di. lhok guci": (4.3500, 96.1800),
    "di lhok guci": (4.3500, 96.1800),
    "aceh barat": (4.4500, 96.1800),
    "keureuto": (4.9600, 97.1000),         # Aceh Utara
    "bendungan keureuto": (4.9600, 97.1000),
    "rukoh": (5.1800, 95.8800),            # Pidie, Aceh
    "bendungan rukoh": (5.1800, 95.8800),
    "tiro": (5.1500, 95.8500),             # Pidie, Aceh
    "bendungan tiro": (5.1500, 95.8500),
    "jambo aye": (4.9500, 97.4500),        # Aceh Timur / Utara
    "jambo aye kanan": (4.9500, 97.4500),
    # Oil & gas
    "jambaran": (-7.1500, 111.5800),       # Jambaran-Tiung Biru, East Java
    "tiung biru": (-7.1500, 111.5800),
    "masela": (-7.4667, 130.8000),         # Masela block, Maluku
    "wilayah kerja masela": (-7.4667, 130.8000),
    "tangguh": (-2.6000, 134.1000),        # Tangguh LNG, Papua Barat
    "tangguh lng": (-2.6000, 134.1000),
    "rdmp": (-1.2654, 116.8312),           # RDMP Balikpapan refinery
    "kilang minyak eksisting": (-1.2654, 116.8312),
    # Ports
    "kuala tanjung": (2.9667, 99.4167),   # North Sumatra hub port
    "pelabuhan patimban": (-6.3000, 107.6833),
    # Toll roads & corridors
    "binjai langsa": (4.0400, 98.2250),    # Binjai - Langsa Toll Road corridor (Trans Sumatera)
    "tol binjai langsa": (4.0400, 98.2250),
    "binjai - langsa": (4.0400, 98.2250),
}

# ── 38 Indonesian Provinces Centroids (Indonesian + English names) ───────────
PROVINCE_CENTROIDS: dict[str, tuple[float, float]] = {
    "aceh": (4.6951, 96.7494),
    "sumatera utara": (2.1154, 99.5451),
    "sumut": (2.1154, 99.5451),
    "north sumatra": (2.1154, 99.5451),
    "sumatera barat": (-0.7399, 100.8000),
    "sumbar": (-0.7399, 100.8000),
    "west sumatra": (-0.7399, 100.8000),
    "riau": (0.5071, 101.4478),
    "kepulauan riau": (3.9457, 108.1429),
    "kepri": (3.9457, 108.1429),
    "jambi": (-1.4852, 102.4381),
    "sumatera selatan": (-3.3194, 103.9144),
    "sumsel": (-3.3194, 103.9144),
    "south sumatra": (-3.3194, 103.9144),
    "bangka belitung": (-2.7411, 106.4406),
    "babel": (-2.7411, 106.4406),
    "bengkulu": (-3.5778, 102.3464),
    "lampung": (-4.5586, 105.4068),
    "dki jakarta": (-6.2088, 106.8456),
    "jakarta": (-6.2088, 106.8456),
    "banten": (-6.4058, 106.0640),
    "jawa barat": (-6.9175, 107.6191),
    "jabar": (-6.9175, 107.6191),
    "west java": (-6.9175, 107.6191),
    "jawa tengah": (-7.1510, 110.1403),
    "jateng": (-7.1510, 110.1403),
    "central java": (-7.1510, 110.1403),
    "di yogyakarta": (-7.8754, 110.4262),
    "yogyakarta": (-7.8754, 110.4262),
    "diy": (-7.8754, 110.4262),
    "jogja": (-7.8754, 110.4262),
    "jawa timur": (-7.5361, 112.2384),
    "jatim": (-7.5361, 112.2384),
    "east java": (-7.5361, 112.2384),
    "bali": (-8.4095, 115.1889),
    "nusa tenggara barat": (-8.6529, 117.3616),
    "ntb": (-8.6529, 117.3616),
    "nusa tenggara timur": (-8.6574, 121.0794),
    "ntt": (-8.6574, 121.0794),
    "kalimantan barat": (-0.2787, 111.4753),
    "kalbar": (-0.2787, 111.4753),
    "west kalimantan": (-0.2787, 111.4753),
    "kalimantan tengah": (-1.6815, 113.3824),
    "kalteng": (-1.6815, 113.3824),
    "central kalimantan": (-1.6815, 113.3824),
    "kalimantan selatan": (-3.0926, 115.2838),
    "kalsel": (-3.0926, 115.2838),
    "south kalimantan": (-3.0926, 115.2838),
    "kalimantan timur": (0.5387, 116.4194),
    "kaltim": (0.5387, 116.4194),
    "east kalimantan": (0.5387, 116.4194),
    "kalimantan utara": (3.0731, 116.0414),
    "kaltara": (3.0731, 116.0414),
    "north kalimantan": (3.0731, 116.0414),
    "sulawesi utara": (0.6247, 123.9750),
    "sulut": (0.6247, 123.9750),
    "north sulawesi": (0.6247, 123.9750),
    "sulawesi tengah": (-1.4300, 121.4456),
    "sulteng": (-1.4300, 121.4456),
    "central sulawesi": (-1.4300, 121.4456),
    "sulawesi selatan": (-3.6687, 119.9741),
    "sulsel": (-3.6687, 119.9741),
    "south sulawesi": (-3.6687, 119.9741),
    "sulawesi tenggara": (-4.1449, 122.1746),
    "sultra": (-4.1449, 122.1746),
    "southeast sulawesi": (-4.1449, 122.1746),
    "gorontalo": (0.6999, 122.4467),
    "sulawesi barat": (-2.8441, 119.2321),
    "sulbar": (-2.8441, 119.2321),
    "west sulawesi": (-2.8441, 119.2321),
    "maluku": (-3.2385, 130.1453),
    "maluku utara": (1.5709, 127.8088),
    "malut": (1.5709, 127.8088),
    "north maluku": (1.5709, 127.8088),
    "papua": (-4.2699, 138.0804),
    "papua barat": (-1.3361, 133.1747),
    "west papua": (-1.3361, 133.1747),
    "papua selatan": (-6.5000, 139.5000),
    "papua tengah": (-3.8000, 136.5000),
    "papua pegunungan": (-4.2000, 139.0000),
    "papua barat daya": (-1.2000, 131.8000),
}


class GeocoderCache:
    """Loads & caches centroid lookups from GeoJSON files."""

    def __init__(self) -> None:
        self._adm2: dict[str, tuple[float, float]] = {}  # kabupaten/kota
        self._adm1: dict[str, tuple[float, float]] = {}  # province
        self._loaded = False

    def _load(self) -> None:
        if self._loaded:
            return

        # Try centroid cache first (pre-computed JSON)
        if CENTROID_CACHE.exists():
            try:
                with CENTROID_CACHE.open(encoding="utf-8") as f:
                    data = json.load(f)
                self._adm1 = data.get("adm1", {})
                self._adm2 = data.get("adm2", {})
                self._adm1.update(PROVINCE_CENTROIDS)
                self._sanitize_northern_entries()
                log.info(
                    "Loaded centroid cache: %d provinces, %d kabupaten",
                    len(self._adm1),
                    len(self._adm2),
                )
                self._loaded = True
                return
            except Exception as exc:
                log.warning("Could not read centroid cache: %s", exc)


        # Build from GeoJSON files
        if ADM2_GEOJSON.exists():
            self._adm2 = _build_centroid_dict(ADM2_GEOJSON, name_fields=["ADM2_EN", "ADM2_ID"])
            log.info("Built ADM2 centroid dict: %d entries", len(self._adm2))
        else:
            log.warning("ADM2 GeoJSON not found at %s — run setup_data.py first", ADM2_GEOJSON)

        if ADM1_GEOJSON.exists():
            self._adm1 = _build_centroid_dict(ADM1_GEOJSON, name_fields=["ADM1_EN", "ADM1_ID", "state"])
            log.info("Built ADM1 centroid dict: %d entries", len(self._adm1))
        else:
            log.warning("ADM1 GeoJSON not found at %s — run setup_data.py first", ADM1_GEOJSON)

        # Always load seed CSV to supplement GeoJSON (or replace if GeoJSON is province-only)
        seed_entries = _load_seed_csv()
        before = len(self._adm2)
        self._adm2.update(seed_entries)   # seed fills gaps; existing GeoJSON entries win
        log.info("Seed CSV added %d entries (adm2 total: %d)", len(seed_entries), len(self._adm2))
        # Also merge seed into adm1 for province fallback
        for k, v in seed_entries.items():
            if k not in self._adm1:
                self._adm1[k] = v

        self._adm1.update(PROVINCE_CENTROIDS)
        self._sanitize_northern_entries()

        # Persist cache
        _save_cache(self._adm1, self._adm2)
        self._loaded = True

    def _sanitize_northern_entries(self) -> None:
        """
        Enforce that all locations situated in northern Indonesia (Aceh, Sumatra Utara,
        Riau, Kepri, Kalimantan Utara, Sulawesi Utara, Maluku Utara) retain strictly
        positive latitudes (> 0).
        """
        northern_tokens = (
            "aceh", "medan", "binjai", "langkat", "langsa", "sumut", "sumatera utara", "nias", "sabang",
            "lhok", "guci", "pidie", "bireuen", "meulaboh", "singkil", "tamiang",
            "batam", "bintan", "natuna", "anambas", "kepri", "kepulauan riau",
            "tarakan", "bulungan", "nunukan", "malinau", "kaltara", "kalimantan utara",
            "manado", "bitung", "tomohon", "minahasa", "sangihe", "talaud", "sulut", "sulawesi utara",
        )
        for cache_dict in (self._adm1, self._adm2):
            for k in list(cache_dict.keys()):
                if any(tok in k for tok in northern_tokens):
                    lat_val, lon_val = cache_dict[k]
                    if lat_val < 0:
                        cache_dict[k] = (abs(lat_val), lon_val)

    # ── Public API ────────────────────────────────────────────────────────────

    def geocode(
        self, location_text: str
    ) -> tuple[Optional[float], Optional[float], str]:
        """
        Resolve a location string to (lat, lon, method).

        method is one of: "hardcoded", "exact_kabupaten",
                          "province_fallback", "unresolved"
        """
        self._load()

        if not location_text or not location_text.strip():
            return None, None, "unresolved"

        lat: Optional[float] = None
        lon: Optional[float] = None
        method = "unresolved"

        # ── Hardcoded special cases ───────────────────────────────────────────
        norm = normalise_admin_name(location_text)
        for key, coords in HARDCODED.items():
            if key in norm or key in location_text.lower():
                if key in (
                    "nasional", "lintas provinsi", "lintas-provinsi",
                    "lintas wilayah", "lintas pulau", "multi provinsi", "seluruh indonesia"
                ):
                    lat, lon, method = coords[0], coords[1], "national_fallback"
                    break
                lat, lon, method = coords[0], coords[1], "hardcoded"
                break

        # ── Tier 1: kabupaten/kota exact match ───────────────────────────────
        if method == "unresolved":
            tokens = _tokenise_location(location_text)
            for token in tokens:
                tok_norm = normalise_admin_name(token)
                if tok_norm in self._adm2:
                    lat, lon = self._adm2[tok_norm]
                    method = "exact_kabupaten"
                    break

        # ── Tier 2: province fallback ─────────────────────────────────────────
        if method == "unresolved":
            tokens = _tokenise_location(location_text)
            for token in tokens:
                tok_norm = normalise_admin_name(token)
                if tok_norm in self._adm1:
                    lat, lon = self._adm1[tok_norm]
                    method = "province_fallback"
                    break

        # Also try the whole string normalised
        if method == "unresolved":
            full_norm = normalise_admin_name(location_text)
            if full_norm in self._adm1:
                lat, lon = self._adm1[full_norm]
                method = "province_fallback"

        # ── Northern Indonesia Latitude Sanitization ──────────────────────────
        if lat is not None and lat < 0:
            combined_check = f"{location_text.lower()} {norm}"
            if any(k in combined_check for k in [
                "aceh", "sumatera utara", "sumut", "north sumatra", "medan", "binjai", "langkat", "langsa", "lhok", "guci",
                "kepulauan riau", "kepri", "batam", "kalimantan utara", "kaltara",
                "sulawesi utara", "sulut", "manado", "tarakan"
            ]):
                lat = abs(lat)

        return lat, lon, method


# ── Module-level singleton ─────────────────────────────────────────────────────
_geocoder = GeocoderCache()


def geocode(location_text: str) -> tuple[Optional[float], Optional[float], str]:
    """Public convenience function. See GeocoderCache.geocode()."""
    return _geocoder.geocode(location_text)


def reload() -> None:
    """Force re-load of centroid data (after running setup_data.py)."""
    global _geocoder
    _geocoder = GeocoderCache()


# ── Helpers ────────────────────────────────────────────────────────────────────

def _build_centroid_dict(
    geojson_path: Path, name_fields: list[str]
) -> dict[str, tuple[float, float]]:
    """
    Read a GeoJSON file and compute centroid for each feature.
    Returns dict of normalised_name → (lat, lon).

    Uses shapely if available; falls back to simple bbox midpoint.
    """
    with geojson_path.open(encoding="utf-8") as f:
        data = json.load(f)

    result: dict[str, tuple[float, float]] = {}

    for feature in data.get("features", []):
        props = feature.get("properties", {})
        geom = feature.get("geometry", {})

        # Get all name variants
        names: list[str] = []
        for field in name_fields:
            val = props.get(field, "")
            if val:
                names.append(str(val))

        lat, lon = _centroid_from_geometry(geom)
        if lat is None:
            continue

        for name in names:
            norm = normalise_admin_name(name)
            if norm:
                result[norm] = (lat, lon)

    return result


def _centroid_from_geometry(geom: dict) -> tuple[Optional[float], Optional[float]]:
    """Compute centroid from a GeoJSON geometry dict."""
    try:
        from shapely.geometry import shape  # type: ignore

        shp = shape(geom)
        c = shp.centroid
        return c.y, c.x
    except Exception:
        pass

    # Fallback: bbox midpoint
    try:
        coords = _flatten_coords(geom)
        if not coords:
            return None, None
        lons = [c[0] for c in coords]
        lats = [c[1] for c in coords]
        return (min(lats) + max(lats)) / 2, (min(lons) + max(lons)) / 2
    except Exception:
        return None, None


def _flatten_coords(geom: dict) -> list[list[float]]:
    """Recursively flatten all coordinate pairs from any geometry type."""
    gtype = geom.get("type", "")
    coords = geom.get("coordinates", [])
    if gtype == "Point":
        return [coords]
    if gtype in ("LineString", "MultiPoint"):
        return list(coords)
    if gtype in ("Polygon", "MultiLineString"):
        return [pt for ring in coords for pt in ring]
    if gtype == "MultiPolygon":
        return [pt for poly in coords for ring in poly for pt in ring]
    return []


def _tokenise_location(text: str) -> list[str]:
    """
    Split a location string into candidate kabupaten/kota tokens.
    Handles comma/slash/dash separated lists and multi-province routes.
    """
    import re
    import unicodedata

    # Normalise all Unicode dashes/hyphens to plain hyphen
    normalized = ""
    for ch in text:
        cat = unicodedata.category(ch)
        if cat == "Pd" or ch in ("\u2013", "\u2014", "\u2212", "\uff0d"):
            normalized += "-"
        else:
            normalized += ch

    # Strip parenthetical notes like "(16km)", "(135km)", "(170,36km)"
    normalized = re.sub(r"\([^)]*\)", " ", normalized)

    # Split on separators (including 'dan' / 'and')
    parts = re.split(r"[,/\-|&\n]+|\bdan\b|\band\b", normalized, flags=re.IGNORECASE)

    tokens: list[str] = []
    for part in parts:
        part = part.strip()
        if len(part) <= 2:
            continue
        # Strip leading junk words that are never place names
        part_clean = re.sub(
            r"^(?:jalan tol|jalan|tol|kereta api|kereta|lrt|mrt|pltu|spam|pelabuhan|"
            r"kilang minyak|kilang|lapangan|proyek|pembangunan|pengembangan|"
            r"transmisi|sistem penyediaan air minum|revitalisasi|bagian dari"
            r"\s*\d+\s*ruas)\s+",
            "",
            part,
            flags=re.IGNORECASE,
        ).strip()
        for candidate in [part, part_clean]:
            candidate = candidate.strip()
            if len(candidate) > 2:
                tokens.append(candidate)
                words = candidate.split()
                # Single words (city names like "Semarang", "Bontang")
                for w in words:
                    if len(w) > 3:
                        tokens.append(w)
                # 2-word combinations
                for i in range(len(words) - 1):
                    tokens.append(" ".join(words[i : i + 2]))
                # 3-word combinations
                for i in range(len(words) - 2):
                    tokens.append(" ".join(words[i : i + 3]))
    return list(dict.fromkeys(tokens))  # deduplicate preserving order



def _save_cache(adm1: dict, adm2: dict) -> None:
    """Persist centroid dicts to JSON cache."""
    CENTROID_CACHE.parent.mkdir(parents=True, exist_ok=True)
    with CENTROID_CACHE.open("w", encoding="utf-8") as f:
        json.dump({"adm1": adm1, "adm2": adm2}, f, ensure_ascii=False)
    log.info("Centroid cache saved to %s", CENTROID_CACHE)


def _load_seed_csv() -> dict[str, tuple[float, float]]:
    """
    Load the bundled kabupaten centroid seed CSV.
    Returns dict of normalised_name → (lat, lon).
    """
    from pipeline.normaliser import normalise_admin_name

    result: dict[str, tuple[float, float]] = {}
    if not SEED_CSV.exists():
        log.warning("Seed CSV not found at %s", SEED_CSV)
        return result
    try:
        with SEED_CSV.open(encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                name = row.get("normalised_name", "").strip()
                try:
                    lat = float(row["lat"])
                    lon = float(row["lon"])
                except (KeyError, ValueError):
                    continue
                if name:
                    result[name] = (lat, lon)
        log.info("Loaded %d entries from seed CSV", len(result))
    except Exception as exc:
        log.warning("Failed to load seed CSV: %s", exc)
    return result
