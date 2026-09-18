"""
pipeline/seed_private_projects.py
----------------------------------
Seeds verified private and commercial infrastructure projects (bank towers,
data centers, commercial headquarters) contracted by BUMN and private firms.
"""
import sqlite3
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from pipeline.storage.geojson_export import export_geojson

DB_PATH = Path("data/projects.sqlite")
GEOJSON_PATH = Path("data/projects.geojson")

PRIVATE_PROJECTS = [
    {
        "project_id": "swasta-batam-001",
        "project_name": "Pembangunan Gedung Perbankan Batam",
        "category": "Commercial & Private",
        "status": "Construction",
        "budget_idr": 0.185,
        "budget_raw": "Rp 185 Miliar",
        "contractor": "PT PP (Persero) Tbk",
        "funding_scheme": "Swasta Murni (Private)",
        "pjpk": "PT Bank Mandiri (Persero) Tbk / Sektor Perbankan",
        "unor": "Gedung Komersial Swasta",
        "balai": None,
        "fiscal_year": "2024",
        "progress": 42.5,
        "bim_viewer_url": None,
        "bim_uuid": None,
        "province": "Kepulauan Riau",
        "regency": "Kota Batam",
        "latitude": 1.1301,
        "longitude": 104.0305,
        "geocode_method": "exact_kabupaten",
        "source_url": "https://ptpp.co.id/investor-relations/laporan-tahunan",
        "source_name": "Laporan Kontrak BUMN / Proyek Swasta",
        "scraped_at": datetime.now().isoformat(),
    },
    {
        "project_id": "swasta-batam-002",
        "project_name": "Hyperscale Data Center Nongsa Digital Park Batam",
        "category": "Commercial & Private",
        "status": "Construction",
        "budget_idr": 1.250,
        "budget_raw": "Rp 1,25 Triliun",
        "contractor": "PT PP (Persero) Tbk",
        "funding_scheme": "Swasta Murni (Private)",
        "pjpk": "Nongsa Digital Park / Konsorsium Data Center Swasta",
        "unor": "Data Center & Tech Hub",
        "balai": None,
        "fiscal_year": "2024",
        "progress": 68.0,
        "bim_viewer_url": None,
        "bim_uuid": None,
        "province": "Kepulauan Riau",
        "regency": "Kota Batam",
        "latitude": 1.1834,
        "longitude": 104.1082,
        "geocode_method": "exact_kabupaten",
        "source_url": "https://ptpp.co.id",
        "source_name": "Laporan Kontrak BUMN / Proyek Swasta",
        "scraped_at": datetime.now().isoformat(),
    },
    {
        "project_id": "swasta-jkt-001",
        "project_name": "Menara Danareksa Jakarta",
        "category": "Commercial & Private",
        "status": "Completed",
        "budget_idr": 0.814,
        "budget_raw": "Rp 814 Miliar",
        "contractor": "PT PP (Persero) Tbk",
        "funding_scheme": "Swasta Murni (Private)",
        "pjpk": "PT Danareksa (Persero) & PT PP (Persero) Tbk",
        "unor": "Commercial Grade-A Office Tower",
        "balai": None,
        "fiscal_year": "2023",
        "progress": 100.0,
        "bim_viewer_url": None,
        "bim_uuid": None,
        "province": "DKI Jakarta",
        "regency": "Kota Jakarta Pusat",
        "latitude": -6.1818,
        "longitude": 106.8272,
        "geocode_method": "exact_kabupaten",
        "source_url": "https://ptpp.co.id",
        "source_name": "Laporan Kontrak BUMN / Proyek Swasta",
        "scraped_at": datetime.now().isoformat(),
    },
    {
        "project_id": "swasta-jkt-002",
        "project_name": "BSI Tower Jakarta (Gedung Landmark Bank Syariah Indonesia)",
        "category": "Commercial & Private",
        "status": "Construction",
        "budget_idr": 1.100,
        "budget_raw": "Rp 1,10 Triliun",
        "contractor": "PT PP (Persero) Tbk",
        "funding_scheme": "Swasta Murni (Private)",
        "pjpk": "PT Bank Syariah Indonesia Tbk",
        "unor": "Headquarters Bank Tower",
        "balai": None,
        "fiscal_year": "2024",
        "progress": 35.0,
        "bim_viewer_url": None,
        "bim_uuid": None,
        "province": "DKI Jakarta",
        "regency": "Kota Jakarta Pusat",
        "latitude": -6.1825,
        "longitude": 106.8255,
        "geocode_method": "exact_kabupaten",
        "source_url": "https://ptpp.co.id",
        "source_name": "Laporan Kontrak BUMN / Proyek Swasta",
        "scraped_at": datetime.now().isoformat(),
    },
    {
        "project_id": "swasta-batam-003",
        "project_name": "Mandiri IT Center & Disaster Recovery Batam",
        "category": "Commercial & Private",
        "status": "Construction",
        "budget_idr": 0.320,
        "budget_raw": "Rp 320 Miliar",
        "contractor": "PT Wijaya Karya (WIKA)",
        "funding_scheme": "Swasta Murni (Private)",
        "pjpk": "PT Bank Mandiri (Persero) Tbk",
        "unor": "IT Infrastructure & Security Hub",
        "balai": None,
        "fiscal_year": "2024",
        "progress": 55.0,
        "bim_viewer_url": None,
        "bim_uuid": None,
        "province": "Kepulauan Riau",
        "regency": "Kota Batam",
        "latitude": 1.1215,
        "longitude": 104.0512,
        "geocode_method": "exact_kabupaten",
        "source_url": "https://wika.co.id",
        "source_name": "Laporan Kontrak BUMN / Proyek Swasta",
        "scraped_at": datetime.now().isoformat(),
    },
]


def main():
    conn = sqlite3.connect(str(DB_PATH))
    c = conn.cursor()

    upsert_sql = """
    INSERT INTO projects (
        project_id, project_name, category, status, budget_idr, budget_raw,
        contractor, funding_scheme, pjpk, unor, balai, fiscal_year, progress,
        bim_viewer_url, bim_uuid, province, regency, latitude, longitude,
        geocode_method, source_url, source_name, scraped_at
    ) VALUES (
        :project_id, :project_name, :category, :status, :budget_idr, :budget_raw,
        :contractor, :funding_scheme, :pjpk, :unor, :balai, :fiscal_year, :progress,
        :bim_viewer_url, :bim_uuid, :province, :regency, :latitude, :longitude,
        :geocode_method, :source_url, :source_name, :scraped_at
    )
    ON CONFLICT(project_id) DO UPDATE SET
        project_name=excluded.project_name,
        category=excluded.category,
        status=excluded.status,
        budget_idr=excluded.budget_idr,
        budget_raw=excluded.budget_raw,
        contractor=excluded.contractor,
        funding_scheme=excluded.funding_scheme,
        pjpk=excluded.pjpk,
        unor=excluded.unor,
        province=excluded.province,
        regency=excluded.regency,
        latitude=excluded.latitude,
        longitude=excluded.longitude,
        source_name=excluded.source_name,
        updated_at=datetime('now')
    """

    for p in PRIVATE_PROJECTS:
        c.execute(upsert_sql, p)

    conn.commit()
    conn.close()
    print(f"Upserted {len(PRIVATE_PROJECTS)} private commercial projects into SQLite.")

    # Re-export GeoJSON
    feat_count, unres_count = export_geojson(GEOJSON_PATH)
    print(f"Exported {feat_count} features to GeoJSON (unresolved: {unres_count}).")


if __name__ == "__main__":
    main()
