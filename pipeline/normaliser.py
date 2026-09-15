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

# -- Budget parsing ------------------------------------------------------------

# Multiplier to convert everything to trillions IDR
_UNIT_MULTIPLIER: dict[str, float] = {
    # Triliun variants
    "triliun": 1.0,
    "trilion": 1.0,
    "trillion": 1.0,
    "trilyun": 1.0,   # alternate Indonesian spelling
    "triyun":  1.0,   # alternate informal spelling
    "t": 1.0,
    # Miliar variants
    "miliar": 0.001,
    "milyar": 0.001,  # alternate Indonesian spelling
    "milion": 0.001,
    "milyun": 0.001,  # alternate informal spelling
    "million": 0.001,
    "m": 0.001,
    "b": 0.001,       # billion treated as miliar (IDR context)
    # Smaller units
    "juta": 0.000001,
    "rb": 0.000000001,
}

# Approximate USD -> IDR conversion (rough static)
_USD_IDR_RATE = 15_500.0


def parse_budget(text: Optional[str]) -> Optional[float]:
    """
    Parse an Indonesian infrastructure budget string into trillions IDR.
    Handles Indonesian number formatting correctly:
      - Comma = decimal separator:  "10,83 Triliun" -> 10.83 T
      - Dot   = decimal separator:  "8.508 Triliun" -> 8.508 T
      - Dot   = thousand separator: "1.600 Miliar"  -> 1600 Miliar -> 1.6 T
      - Both dot+comma (European):  "1.234,56 T"    -> 1234.56 T

    Returns None when parsing fails.
    """
    if not text:
        return None

    is_usd = bool(re.search(r"usd|us\$|dollar", text, re.IGNORECASE))

    # Step 1: detect unit (before any numeric transformation)
    unit_match = re.search(
        r"\b(triliun|trilion|trilyun|triyun|trillion|miliar|milyar|milion|milyun|million|juta|rb|[tmb])\b",
        text,
        re.IGNORECASE,
    )
    unit = unit_match.group(1).lower() if unit_match else ""
    multiplier = _UNIT_MULTIPLIER.get(unit, 1.0)

    # Step 2: strip currency prefix and unit suffix to isolate the number string
    num_str = re.sub(
        r"(?:rp\.?\s*|idr\.?\s*|usd\.?\s*|us\$\s*)",
        "",
        text,
        flags=re.IGNORECASE,
    )
    num_str = re.sub(
        r"\s*(?:triliun|trilion|trilyun|triyun|trillion|miliar|milyar|milion|milyun|million|juta|rb|[tmb])\b.*",
        "",
        num_str,
        flags=re.IGNORECASE,
    ).strip()

    # Step 3: resolve Indonesian dot/comma ambiguity
    #
    # KPPIP publishes values like:
    #   "1,680 Triliun"  -> comma is decimal -> 1.680 T
    #   "10,83 Triliun"  -> comma is decimal -> 10.83 T
    #   "8.508 Triliun"  -> dot is decimal   -> 8.508 T
    #   "28.720 Triliun" -> dot is decimal   -> 28.720 T
    #   "1.600 Miliar"   -> dot is thousand-sep, 1600 Miliar -> 1.6 T
    #   "9.100.000"      -> two dots, all thousand-seps (raw IDR)
    #
    # Rules:
    #  A) If BOTH comma and dot exist -> European format: dots=thousand-sep, comma=decimal
    #  B) If only COMMA -> comma is decimal
    #  C) If only DOT(s):
    #     - Multiple dots (>=2) -> all thousand-seps
    #     - Single dot:
    #       * Unit is Miliar/blank AND exactly 3 digits after dot -> thousand-sep
    #       * Otherwise -> decimal

    has_comma = "," in num_str
    has_dot   = "." in num_str

    if has_comma and has_dot:
        # European format: "1.234,56" -> remove dots, replace comma with dot
        clean_num = num_str.replace(".", "").replace(",", ".")
    elif has_comma:
        # Comma-only case. Two sub-cases based on unit context:
        #   Triliun: comma = decimal   → "1,680 T" = 1.680 T  | "16,210 T" = 16.210 T
        #   Miliar:  if comma followed by exactly 3 digits → thousand-sep
        #            → "1,410 Miliar" = 1410 Miliar = 1.41 T
        #            otherwise → decimal → "10,5 Miliar" = 10.5 Miliar = 0.0105 T
        comma_idx = num_str.index(",")
        after_comma = num_str[comma_idx + 1:].strip()
        is_miliar_unit = unit in ("miliar", "milyar", "milion", "milyun", "million", "m", "b")
        if is_miliar_unit and len(after_comma) == 3 and after_comma.isdigit():
            # Thousand separator in Miliar context
            clean_num = num_str.replace(",", "")  # "1,410" → "1410"
        else:
            # Decimal separator
            clean_num = num_str.replace(",", ".")  # "1,680" → "1.680"
    elif has_dot:
        dot_count = num_str.count(".")
        if dot_count >= 2:
            # Multiple dots: all thousand-seps
            clean_num = num_str.replace(".", "")
        else:
            # Single dot
            idx = num_str.index(".")
            after_dot = num_str[idx + 1:].strip()
            # Miliar context OR no unit AND exactly 3 digits after dot -> thousand-sep
            is_miliar_ctx = unit in ("miliar", "milion", "million", "m", "b", "", "juta", "rb")
            if len(after_dot) == 3 and is_miliar_ctx:
                clean_num = num_str.replace(".", "")  # "1.600" -> "1600"
            else:
                clean_num = num_str  # "8.508" -> "8.508" (decimal)
    else:
        clean_num = num_str

    # Step 4: strip any residual non-numeric characters except dot
    clean_num = re.sub(r"[^\d.]", "", clean_num).strip(".")

    if not clean_num:
        return None

    try:
        value = float(clean_num)
    except ValueError:
        return None

    result = value * multiplier

    # Convert USD to IDR if necessary
    if is_usd:
        result = result * _USD_IDR_RATE / 1e12

    return round(result, 6) if result > 0 else None


# -- Status normalisation ------------------------------------------------------

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


# -- Category detection --------------------------------------------------------

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


# -- Text normalisation helpers ------------------------------------------------

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
        return "BPJT - Kementerian PUPR"
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
