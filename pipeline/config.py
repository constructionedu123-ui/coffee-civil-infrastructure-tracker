"""
pipeline/config.py
------------------
Central configuration: URLs, file paths, constants.
"""
from pathlib import Path

# ── Project root ────────────────────────────────────────────────────────────
ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "data"
DB_PATH = ROOT_DIR / "data" / "projects.sqlite"
GEOJSON_OUTPUT = ROOT_DIR / "data" / "projects.geojson"
UNRESOLVED_GEOCODES_CSV = ROOT_DIR / "data" / "unresolved_geocodes.csv"
CENTROID_CACHE = DATA_DIR / "centroids_cache.json"

# ── HDX GeoJSON URLs ─────────────────────────────────────────────────────────
HDX_ADM1_URL = (
    "https://data.humdata.org/dataset/cod-ab-indonesia/resource/"
    "download/idn_admbnda_adm1_bps_20200401.geojson"
)
HDX_ADM2_URL = (
    "https://data.humdata.org/dataset/cod-ab-indonesia/resource/"
    "download/idn_admbnda_adm2_bps_20200401.geojson"
)
ADM1_GEOJSON = DATA_DIR / "idn_admbnda_adm1_bps.geojson"
ADM2_GEOJSON = DATA_DIR / "idn_admbnda_adm2_bps.geojson"

# ── Scraper settings ──────────────────────────────────────────────────────────
REQUEST_DELAY_SEC = 0.1          # polite crawl delay between requests
REQUEST_TIMEOUT_SEC = 20
MAX_RETRIES = 3
RETRY_BACKOFF = 1.0              # seconds; doubles each retry

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 "
    "(KHTML, like Gecko) Version/17.4 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0",
]

# ── KPPIP ─────────────────────────────────────────────────────────────────────
KPPIP_BASE = "https://kppip.go.id"
KPPIP_PSN_INDEX = f"{KPPIP_BASE}/proyek-strategis-nasional/"

# Sector slug → category mapping
KPPIP_SECTOR_CATEGORY: dict[str, str] = {
    "jalan-dan-jembatan": "Transport",
    "kereta": "Transport",
    "bandar-udara": "Transport",
    "pelabuhan": "Transport",
    "transportasi": "Transport",
    "teknologi": "Transport",
    "perumahan": "Housing",
    "bendungan-dan-irigasi": "Water",
    "air-bersih-dan-sanitasi": "Water",
    "tanggul-pantai": "Water",
    "energi": "Energy",
    "x-program-pembangunan-infrastruktur-ketenagalistrikan": "Energy",
    "s-pembangunan-kawasan-industri-prioritas-kawasan-ekonomi-khusus": "Transport",
    "w-infrastruktur-pendidikan": "Transport",
    "pariwisata": "Transport",
    "u-proyek-pembangunan-smelter": "Energy",
    "z-sektor-pemerataan-ekonomi": "Transport",
}

# Keywords that override category → IKN
IKN_KEYWORDS = ["ikn", "ibu kota nusantara", "nusantara", "penajam", "kalimantan timur baru"]

# ── BPJT ──────────────────────────────────────────────────────────────────────
BPJT_BASE = "https://bpjt.pu.go.id"
BPJT_JALAN_TOL_URL = f"{BPJT_BASE}/informasi/jalan-tol/"
BPJT_NEWS_URL = f"{BPJT_BASE}/berita/"
BPJT_MAX_NEWS_PAGES = 5         # number of news pages to scrape for progress data

# ── Status normalisation map ──────────────────────────────────────────────────
STATUS_KEYWORDS: dict[str, str] = {
    "beroperasi": "Operational",
    "operasional": "Operational",
    "selesai": "Completed",
    "rampung": "Completed",
    "konstruksi": "Construction",
    "pembangunan": "Construction",
    "dibangun": "Construction",
    "persiapan": "Planning",
    "penyiapan": "Planning",
    "transaksi": "Planning",
    "studi": "Planning",
    "perencanaan": "Planning",
    "kajian": "Planning",
    "pengadaan": "Planning",
}
