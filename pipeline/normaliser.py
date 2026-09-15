"""
pipeline/normaliser.py
-----------------------
Field-level cleaning: budget parsing, status normalisation, category detection.
"""
from __future__ import annotations

import re
import unicodedata
from typing import Optional

from pipeline.config import IKN_KEYWORDS, KPPIP_SECTOR_CATEGORY, STATUS_KEYWORDS

# ── Budget parsing ────────────────────────────────────────────────────────────

# Regex to capture numeric value + magnitude unit
_BUDGET_RE = re.compile(
    r"(?:rp\.?|idr\.?|usd\.?|us\$)?\s*"
    r"([\d.,]+)"
    r"\s*(triliun|trilion|trillion|miliar|milion|million|m|t|b|juta|rb)?",
    re.IGNORECASE,
)

# Multiplier to convert everything to trillions IDR
_UNIT_MULTIPLIER: dict[str, float] = {
    "triliun": 1.0,
    "trilion": 1.0,
    "trillion": 1.0,
    "t": 1.0,
    "miliar": 0.001,
    "milion": 0.001,
    "million": 0.001,
    "m": 0.001,
    "b": 0.001,       # billion treated as miliar (IDR context)
    "juta": 0.000001,
    "rb": 0.000000001,
}

# Approximate USD → IDR conversion (rough static)
_USD_IDR_RATE = 15_500.0


def parse_budget(text: Optional[str]) -> Optional[float]:
    """
    Parse a budget string into trillions IDR.
    Returns None when parsing fails.

    Examples
    --------
    >>> parse_budget("Rp 9,1 triliun")
    9.1
    >>> parse_budget("US$ 1.2 billion")
    18.6
    >>> parse_budget("IDR 500 miliar")
    0.5
    """
    if not text:
        return None

    is_usd = bool(re.search(r"usd|us\$|dollar", text, re.IGNORECASE))

    # Normalise Indonesian decimal comma
    clean = text.replace(",", ".")
    # Remove thousand-separator dots (e.g. "9.100.000")
    clean = re.sub(r"\.(?=\d{3}(?:[.,]|\b))", "", clean)

    match = _BUDGET_RE.search(clean)
    if not match:
        return None

    try:
        value = float(match.group(1).replace(",", "."))
    except ValueError:
        return None

    unit = (match.group(2) or "").lower().strip()
    multiplier = _UNIT_MULTIPLIER.get(unit, 1.0)

    result = value * multiplier

    # Convert USD to IDR if necessary (rough)
    if is_usd:
        result = result * _USD_IDR_RATE / 1e12

    return round(result, 6) if result > 0 else None


# ── Status normalisation ──────────────────────────────────────────────────────

def normalise_status(text: Optional[str]) -> str:
    """
    Map a raw status/description string to a canonical status enum value.

    Returns one of: "Planning", "Construction", "Operational", "Completed", "Unknown"
    """
    if not text:
        return "Unknown"

    lowered = text.lower()
    for keyword, status in STATUS_KEYWORDS.items():
        if keyword in lowered:
            return status
    return "Unknown"


# ── Category detection ────────────────────────────────────────────────────────

def detect_category(project_name: str, sector_slug: str = "") -> str:
    """
    Determine category from sector slug (primary) and project name (IKN override).
    """
    name_lower = project_name.lower()
    for kw in IKN_KEYWORDS:
        if kw in name_lower:
            return "IKN"

    slug_lower = sector_slug.lower().strip("/")
    for slug, cat in KPPIP_SECTOR_CATEGORY.items():
        if slug in slug_lower:
            return cat

    return "Transport"   # default fallback


# ── Text normalisation helpers ────────────────────────────────────────────────

def strip_accents(text: str) -> str:
    """Remove diacritics from a string."""
    nfkd = unicodedata.normalize("NFKD", text)
    return "".join(c for c in nfkd if not unicodedata.combining(c))


def normalise_admin_name(name: str) -> str:
    """
    Normalise an Indonesian kabupaten/kota name for fuzzy lookup:
    - lowercase
    - strip diacritics
    - remove prefixes: Kab., Kabupaten, Kota, Kab, Dki, D.I., etc.
    """
    name = name.lower().strip()
    name = strip_accents(name)
    name = re.sub(
        r"^(kabupaten|kab\.|kab |kota |kota|d\.i\.|dki|d\.k\.i\.|kepulauan)\s*",
        "",
        name,
        flags=re.IGNORECASE,
    )
    return name.strip()


def extract_contractor_name(text: str) -> Optional[str]:
    """
    Heuristic extraction of known Indonesian contractor / BUJT names.
    Returns the first match found, or None.
    """
    known = [
        "Waskita Karya", "Hutama Karya", "Adhi Karya", "Wijaya Karya", "Brantas Abipraya",
        "PP (Persero)", "Jasa Marga", "Citra Marga", "Trans Marga", "Astra Infra",
        "Lintas Marga Sedaya", "Nusantara Infrastructure", "PT PP", "PT Waskita",
        "PT Hutama", "PT Adhi", "PT Wijaya",
    ]
    for name in known:
        if name.lower() in text.lower():
            return name
    return None


def infer_pjpk(project_name: str, category: str = "", raw_pjpk: Optional[str] = None) -> str:
    """
    Infer or clean the responsible Ministry / Government Contracting Agency (PJPK)
    for an Indonesian National Strategic Project.
    """
    if raw_pjpk and raw_pjpk.strip() and "lembaga terkait" not in raw_pjpk.lower():
        return raw_pjpk.strip()

    name = project_name.lower()
    cat = (category or "").lower()

    if "ikn" in name or "nusantara" in name or "ibu kota" in name:
        return "Otorita IKN / Kementerian PUPR"
    if "tanggul laut" in name or "ncicd" in name or "tanggul pantai" in name:
        return "Kementerian PUPR (Ditjen SDA) / Pemprov DKI Jakarta"
    if "jalan tol" in name or "tol " in name or (cat == "transport" and "jalan" in name):
        return "BPJT – Kementerian PUPR"
    if any(k in name for k in ["kereta", "mrt", "lrt", "perkeretaapian", "railway"]):
        return "Kementerian Perhubungan (Ditjen Perkeretaapian)"
    if any(k in name for k in ["bandara", "bandar udara", "airport"]):
        return "Kementerian Perhubungan (Ditjen Perhubungan Udara)"
    if any(k in name for k in ["pelabuhan", "port", "dermaga"]):
        return "Kementerian Perhubungan (Ditjen Hubla) / PT Pelindo"
    if any(k in name for k in ["bendungan", "waduk", "irigasi", "daerah irigasi"]) or cat == "water":
        if any(k in name for k in ["air minum", "spam", "sanitasi"]):
            return "Kementerian PUPR (Ditjen Cipta Karya)"
        return "Kementerian PUPR (Ditjen Sumber Daya Air)"
    if any(k in name for k in ["smelter", "kawasan industri"]):
        return "Kementerian Perindustrian / Kementerian ESDM"
    if any(k in name for k in ["kilang", "refinery", "migas", "gas", "pertamina"]):
        return "Kementerian ESDM / PT Pertamina (Persero)"
    if any(k in name for k in ["pltu", "plta", "pltp", "listrik", "transmisi", "hvdc"]) or cat == "energy":
        return "Kementerian ESDM / PT PLN (Persero)"
    if cat == "housing" or "perumahan" in name or "rusun" in name:
        return "Kementerian PUPR (Ditjen Perumahan)"

    return "Kementerian / Lembaga Terkait"


def infer_funding_scheme(project_name: str, category: str = "", raw_scheme: Optional[str] = None) -> str:
    """
    Infer canonical Indonesian infrastructure funding scheme (APBN, KPBU, BUMN, Swasta).
    """
    if raw_scheme and raw_scheme.strip():
        return raw_scheme.strip()

    name = project_name.lower()
    cat = (category or "").lower()

    if "trans sumatera" in name or "penugasan" in name:
        return "Penugasan BUMN (Hutama Karya)"
    if "jalan tol" in name or "tol " in name:
        return "KPBU / PPP (BUJT Concession)"
    if any(k in name for k in ["bendungan", "waduk", "irigasi", "tanggul laut", "ncicd"]):
        return "APBN (State Budget)"
    if any(k in name for k in ["kereta", "mrt", "lrt"]):
        return "APBN & Pinjaman Luar Negeri / SBSN"
    if any(k in name for k in ["bandara", "bandar udara", "pelabuhan"]):
        return "KPBU / Penugasan BUMN"
    if any(k in name for k in ["air minum", "spam"]):
        return "KPBU / APBN Mixed Financing"
    if any(k in name for k in ["smelter", "kawasan industri"]):
        return "Swasta / Private Investment"
    if any(k in name for k in ["kilang", "refinery", "migas"]):
        return "Penugasan BUMN / Swasta (KKS)"
    if any(k in name for k in ["pltu", "plta", "pltp", "listrik"]) or cat == "energy":
        return "IPP Swasta / PT PLN (Persero)"
    if cat == "housing" or "perumahan" in name or "rusun" in name:
        return "APBN / Fasilitas Likuiditas (FLPP)"
    if cat == "ikn" or "nusantara" in name:
        return "APBN & KPBU Nusantara"

    return "APBN / KPBU"

