#!/usr/bin/env python3
"""
Coffee Civil News Bot — Google Sheets Article Appender
=======================================================
Mengambil data artikel teknik sipil yang telah di-generate dan
menambahkannya ke Google Sheet secara otomatis menggunakan
Google Sheets API v4 via Service Account.

SETUP (wajib dilakukan sekali):
─────────────────────────────────────────────────────────
1. Buka https://console.cloud.google.com/
2. Buat project baru (atau pilih yang ada)
3. Aktifkan: "Google Sheets API" dan "Google Drive API"
4. Buat Service Account:
   IAM & Admin → Service Accounts → Create Service Account
5. Download key JSON: Actions → Manage Keys → Add Key → JSON
6. Simpan file key sebagai "service_account.json" di folder yang sama
   dengan script ini.
7. Buka Google Sheet Anda → klik Share → tambahkan email Service Account
   (dari file JSON, field "client_email") → berikan akses "Editor"
8. Salin SPREADSHEET_ID dari URL sheet:
   https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit
   dan paste ke variabel SPREADSHEET_ID di bawah.

Dependencies:
    pip install gspread google-auth
"""

import os
import sys
import json
import textwrap
from datetime import datetime, timezone

# ─────────────────────────────────────────────────────────────────────────────
# KONFIGURASI
# ─────────────────────────────────────────────────────────────────────────────

# Path ke file JSON Service Account (relatif terhadap direktori script ini)
SERVICE_ACCOUNT_FILE = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "service_account.json"
)

# ID Google Sheet Anda (dari URL: /spreadsheets/d/<ID>/edit)
# Ganti dengan ID sheet Anda yang sesungguhnya:
SPREADSHEET_ID = os.environ.get(
    "GSHEET_SPREADSHEET_ID",
    "YOUR_SPREADSHEET_ID_HERE"
)

# Nama tab/worksheet di dalam spreadsheet
WORKSHEET_NAME = "Coffee Civil Articles"

# Nama kolom header (urutan ini menentukan urutan kolom di sheet)
HEADERS = [
    "No",
    "Tanggal Publish",
    "Judul Artikel",
    "Kategori",
    "Tags",
    "Excerpt / Ringkasan",
    "Konten Lengkap (HTML)",
    "Jumlah Kata (Est.)",
    "Sumber Referensi",
    "Status",
    "Catatan",
]

# ─────────────────────────────────────────────────────────────────────────────
# DATA ARTIKEL
# Tambahkan entri baru ke list ARTICLES untuk menambah artikel berikutnya.
# Setiap entri adalah satu dict yang mewakili satu artikel.
# ─────────────────────────────────────────────────────────────────────────────

ARTICLES = [
    {
        "judul": (
            "Tiga Pilar Konstruksi Digital 2026: BIM, Green Construction, "
            "dan Lean Construction Menuju Industri Bangunan Berkelanjutan"
        ),
        "kategori": "Artikel",
        "tags": "BIM, Building Information Modeling, Green Construction, Lean Construction, "
                "Konstruksi Digital, Konstruksi Berkelanjutan, Digital Twin, Dekarbonisasi, "
                "GREENSHIP, Integrated Project Delivery",
        "excerpt": (
            "Tiga metodologi konstruksi digital — BIM, Green Construction, dan Lean Construction — "
            "telah berkonvergensi menjadi ekosistem terpadu. Pelajari bagaimana tren global 2026 ini "
            "meredefinisi industri bangunan dan apa artinya bagi para profesional konstruksi Indonesia."
        ),
        "konten_html": textwrap.dedent("""\
            <div style="font-family:'Segoe UI',Roboto,Arial,sans-serif;line-height:1.85;color:#e2e8f0;max-width:860px;margin:0 auto;">

            <p style="font-size:1.15rem;font-weight:500;color:#94d2bd;border-left:4px solid #0a9396;padding-left:1.2rem;margin-bottom:2rem;">
            Industri konstruksi global sedang mengalami pergeseran paradigma yang belum pernah terjadi sebelumnya.
            Tiga metodologi — <strong>Building Information Modeling (BIM)</strong>, <strong>Green Construction</strong>,
            dan <strong>Lean Construction</strong> — kini tidak lagi berdiri sendiri sebagai alat bantu teknis,
            melainkan telah melebur menjadi sebuah ekosistem digital terpadu yang mendefinisikan ulang cara kita
            merancang, membangun, dan mengoperasikan infrastruktur di abad ke-21.
            </p>

            <h2 style="color:#0a9396;font-size:1.5rem;font-weight:700;border-bottom:2px solid #0a9396;padding-bottom:0.5rem;margin-top:2.5rem;">
            &#127959; BIM: Dari Model 3D Menuju Ekosistem Data Proyek yang Hidup
            </h2>

            <p>Laporan industri terkini dari berbagai firma konsultan teknik global — termasuk analisis dari
            <em>United BIM</em> dan <em>Eracore</em> — mengonfirmasi bahwa <strong>BIM pada 2026 telah berevolusi
            jauh melampaui sekadar perangkat pemodelan tiga dimensi</strong>. BIM kini menjadi tulang punggung
            digital (<em>digital backbone</em>) suatu proyek yang merentang dari fase desain skematik hingga
            pengelolaan aset pascakonstruksi.</p>

            <p>Salah satu perkembangan paling signifikan adalah integrasi <strong>kecerdasan buatan (AI) ke dalam
            alur kerja koordinasi BIM</strong>. Sistem deteksi tabrakan (<em>clash detection</em>) berbasis AI kini
            mampu mengelompokkan ratusan konflik geometris, menghapus duplikasi, dan menyarankan resolusi berdasarkan
            pola historis — secara dramatis mengurangi waktu koordinasi antardisiplin (arsitektur, struktur,
            mekanikal-elektrikal-plumbing). Lebih jauh, antarmuka BIM berbasis bahasa natural (<em>conversational BIM</em>)
            mulai memungkinkan manajer proyek untuk "berdialog" dengan model BIM guna mengekstraksi kuantitas,
            memprediksi keterlambatan, atau mensimulasikan skenario nilai rekayasa.</p>

            <p>Dimensi keempat dan kelima BIM — integrasi <strong>4D (penjadwalan konstruksi)</strong> dan
            <strong>5D (estimasi biaya)</strong> — semakin banyak diadopsi oleh kontraktor utama untuk
            mencapai kepastian anggaran (<em>cost certainty</em>) dan prediktabilitas jadwal. Dikombinasikan
            dengan platform berbasis <em>cloud</em>, seluruh pemangku kepentingan proyek kini dapat mengakses
            satu sumber kebenaran tunggal (<em>single source of truth</em>) secara real-time.</p>

            <div style="background:linear-gradient(135deg,#0a2e38 0%,#0a3d4a 100%);border:1px solid #0a9396;border-radius:8px;padding:1.2rem 1.5rem;margin:1.5rem 0;color:#94d2bd;font-size:0.95rem;">
            <strong style="color:#0a9396;">&#128202; Fakta Kunci:</strong> Integrasi <em>Digital Twin</em> berbasis
            sensor IoT dengan model BIM memungkinkan manajer fasilitas memantau konsumsi energi, performa
            peralatan M&amp;E, dan kebutuhan pemeliharaan secara prediktif — mengurangi biaya operasional
            gedung hingga 15–25% selama siklus hidup aset.
            </div>

            <h2 style="color:#52b788;font-size:1.5rem;font-weight:700;border-bottom:2px solid #52b788;padding-bottom:0.5rem;margin-top:2.5rem;">
            &#127807; Green Construction: Urgensi Global yang Tidak Bisa Ditunda
            </h2>

            <p><em>Global Status Report for Buildings and Construction 2025–2026</em> yang diterbitkan oleh
            UN Environment Programme (UNEP) dan Global Alliance for Buildings and Construction (GlobalABC)
            menyajikan gambaran yang tegas namun mengkhawatirkan: sektor bangunan dan konstruksi masih
            menyumbang <strong>37% dari total emisi CO&#8322; global</strong> dan hampir <strong>50% dari total
            ekstraksi material global</strong>. Terlepas dari pertumbuhan sertifikasi bangunan hijau yang
            hampir tiga kali lipat selama satu dekade terakhir, sektor ini belum berada di jalur yang tepat
            menuju dekarbonisasi penuh pada 2050.</p>

            <p>Tren yang paling menentukan mencakup: (1) adopsi <strong>prinsip ekonomi sirkular</strong> —
            merancang struktur untuk kemudahan pembongkaran (<em>design for disassembly</em>), penggunaan
            kembali komponen struktural, dan substitusi material konvensional dengan bahan berbasis bio seperti
            kayu rekayasa (<em>engineered timber</em>), bambu laminasi, dan beton daur ulang; (2) inovasi
            material rendah karbon seperti injeksi CO&#8322; pada campuran beton (teknologi CarbonCure); dan
            (3) integrasi <strong>Building-Integrated Photovoltaics (BIPV)</strong> yang menjadikan selubung
            bangunan sebagai pembangkit energi terbarukan.</p>

            <p>Bagi Indonesia, urgensi ini terasa lebih nyata mengingat laju pembangunan infrastruktur yang masif
            dalam kerangka Proyek Strategis Nasional. Adopsi standar <em>green building</em> seperti GREENSHIP
            (GBCI) secara konsisten pada gedung-gedung baru adalah investasi jangka panjang.</p>

            <h2 style="color:#e9c46a;font-size:1.5rem;font-weight:700;border-bottom:2px solid #e9c46a;padding-bottom:0.5rem;margin-top:2.5rem;">
            &#9881; Lean Construction 5.0: Eliminasi Pemborosan di Era Digital
            </h2>

            <p>Lean Construction — yang berakar dari filosofi Toyota Production System — kini telah berevolusi
            menjadi apa yang para praktisi sebut sebagai <strong>"Lean 5.0"</strong>: fusi antara prinsip
            eliminasi pemborosan (<em>waste elimination</em>) dengan ekosistem teknologi Industri 4.0.
            <em>Last Planner System&#174; (LPS)</em> kini diperkuat dengan analitik data berbasis AI yang mampu
            memprediksi gangguan aliran kerja (<em>workflow disruption</em>) sebelum terjadi di lapangan.</p>

            <p>Konstruksi modular dan prefabrikasi mampu mengurangi limbah material hingga 90% dibandingkan
            metode konvensional <em>in-situ</em>. <strong>Integrated Project Delivery (IPD)</strong> sebagai
            kerangka kontraktual Lean — di mana pemilik, desainer, dan kontraktor berbagi risiko dan keuntungan
            dalam satu perjanjian tunggal — terus terbukti sebagai instrumen paling efektif untuk menyelaraskan
            insentif seluruh pemangku kepentingan proyek.</p>

            <p>Dalam paradigma Lean 5.0, <strong>emisi karbon tertanam (<em>embodied carbon</em>) diperlakukan
            sebagai salah satu bentuk pemborosan (<em>muda</em>) yang harus dieliminasi</strong>, mengintegrasikan
            laporan ESG ke dalam metrik kinerja proyek sehari-hari.</p>

            <h2 style="color:#ee9b00;font-size:1.5rem;font-weight:700;border-bottom:2px solid #ee9b00;padding-bottom:0.5rem;margin-top:2.5rem;">
            &#128301; Konvergensi Tiga Pilar: Masa Depan Konstruksi Indonesia
            </h2>

            <p>BIM menyediakan <em>platform data</em>; Green Construction menentukan <em>target kinerja
            lingkungan</em>; sementara Lean menyediakan <em>metodologi eksekusi</em> untuk mencapai kedua
            tujuan tersebut secara efisien. Kontraktor dan konsultan Indonesia yang mampu mengintegrasikan
            ketiga pendekatan ini akan memiliki keunggulan kompetitif yang substansial — baik dalam memenangkan
            proyek pemerintah yang semakin mensyaratkan kriteria keberlanjutan, maupun dalam menarik investasi
            asing yang sangat sensitif terhadap rekam jejak ESG.</p>

            <p>Transformasi ini bukan sekadar adopsi perangkat lunak baru. Ini adalah perubahan budaya
            profesional yang menuntut insinyur sipil Indonesia untuk menguasai literasi data, memahami siklus
            hidup karbon material struktural, dan mampu memfasilitasi proses perencanaan berbasis komitmen
            lintas disiplin. Masa depan konstruksi Indonesia ada di tangan mereka yang berani memeluk
            kompleksitas ini hari ini.</p>

            <hr style="border-color:#334155;margin:2rem 0;" />
            <p style="font-size:0.85rem;color:#64748b;text-align:center;">
            <em>Artikel ini disusun berdasarkan laporan global terkini dari UNEP GlobalABC,
            United BIM, Eracore, dan Lean Construction Institute. Diterbitkan oleh redaksi Coffee Civil,
            September 2026.</em>
            </p>
            </div>"""),
        "sumber": (
            "UNEP GlobalABC – Global Status Report for Buildings & Construction 2025-2026; "
            "United BIM – BIM Trends 2026; Eracore – BIM Strategy Report; "
            "Lean Construction Institute – Lean 5.0 Trends 2025"
        ),
        "status": "Siap Publish",
        "catatan": "Artikel utama September 2026. Cloudflare memblokir WP REST API — tersimpan di sheet sebagai fallback.",
    },
    # ── Tambahkan artikel berikutnya di sini dengan format yang sama ──
    # {
    #     "judul": "...",
    #     "kategori": "Artikel",
    #     "tags": "...",
    #     "excerpt": "...",
    #     "konten_html": "...",
    #     "sumber": "...",
    #     "status": "Draft",
    #     "catatan": "...",
    # },
]


# ─────────────────────────────────────────────────────────────────────────────
# FUNGSI HELPER
# ─────────────────────────────────────────────────────────────────────────────

def count_words_html(html: str) -> int:
    """Estimasi jumlah kata dari string HTML (strip tag terlebih dahulu)."""
    import re
    text = re.sub(r"<[^>]+>", " ", html)
    words = text.split()
    return len(words)


def check_dependencies() -> bool:
    """Pastikan gspread dan google-auth terinstal."""
    missing = []
    try:
        import gspread  # noqa: F401
    except ImportError:
        missing.append("gspread")
    try:
        import google.auth  # noqa: F401
    except ImportError:
        missing.append("google-auth")

    if missing:
        print(f"[ERROR] Paket berikut belum terinstal: {', '.join(missing)}")
        print(f"        Jalankan: pip install {' '.join(missing)}")
        return False
    return True


def validate_config() -> bool:
    """Validasi konfigurasi sebelum menjalankan."""
    errors = []

    if not os.path.isfile(SERVICE_ACCOUNT_FILE):
        errors.append(
            f"File service account tidak ditemukan: {SERVICE_ACCOUNT_FILE}\n"
            "  → Download dari Google Cloud Console dan simpan sebagai 'service_account.json'"
        )

    if SPREADSHEET_ID == "YOUR_SPREADSHEET_ID_HERE":
        errors.append(
            "SPREADSHEET_ID belum diisi.\n"
            "  → Salin ID dari URL Google Sheet Anda dan update variabel SPREADSHEET_ID"
        )

    if errors:
        print("\n[FATAL] Konfigurasi tidak lengkap:")
        for err in errors:
            safe_err = err.replace("\u2192", "->")
            print(f"  * {safe_err}")
        return False
    return True


def get_or_create_worksheet(spreadsheet, worksheet_name: str, headers: list):
    """
    Ambil worksheet yang ada atau buat yang baru dengan header otomatis.
    Juga memvalidasi bahwa header baris pertama sudah sesuai.
    """
    import gspread

    try:
        ws = spreadsheet.worksheet(worksheet_name)
        print(f"[OK] Worksheet '{worksheet_name}' ditemukan.")

        # Validasi header
        existing_headers = ws.row_values(1)
        if existing_headers != headers:
            print(f"[WARN] Header di sheet tidak sesuai. Akan diperbarui...")
            ws.update("A1", [headers])
            # Format header: bold, frozen row, background color
            ws.format("A1:K1", {
                "textFormat": {"bold": True, "fontSize": 11},
                "backgroundColor": {"red": 0.098, "green": 0.098, "blue": 0.196},
                "horizontalAlignment": "CENTER",
            })
            ws.freeze(rows=1)
            print("[OK] Header diperbarui.")
        return ws

    except gspread.WorksheetNotFound:
        print(f"[INFO] Worksheet '{worksheet_name}' tidak ditemukan. Membuat baru...")
        ws = spreadsheet.add_worksheet(
            title=worksheet_name,
            rows=1000,
            cols=len(headers)
        )

        # Tulis header
        ws.update("A1", [headers])

        # Format header: bold, dark background, frozen
        ws.format("A1:K1", {
            "textFormat": {"bold": True, "fontSize": 11, "foregroundColor": {"red": 1, "green": 1, "blue": 1}},
            "backgroundColor": {"red": 0.063, "green": 0.184, "blue": 0.22},
            "horizontalAlignment": "CENTER",
        })
        ws.freeze(rows=1)

        # Set lebar kolom agar mudah dibaca
        column_widths = {
            "A": 50,   # No
            "B": 140,  # Tanggal
            "C": 300,  # Judul
            "D": 100,  # Kategori
            "E": 200,  # Tags
            "F": 350,  # Excerpt
            "G": 100,  # Konten (truncated)
            "H": 90,   # Jumlah Kata
            "I": 280,  # Sumber
            "J": 110,  # Status
            "K": 200,  # Catatan
        }
        requests_body = {
            "requests": [
                {
                    "updateDimensionProperties": {
                        "range": {
                            "sheetId": ws.id,
                            "dimension": "COLUMNS",
                            "startIndex": ord(col) - ord("A"),
                            "endIndex":   ord(col) - ord("A") + 1,
                        },
                        "properties": {"pixelSize": px},
                        "fields": "pixelSize",
                    }
                }
                for col, px in column_widths.items()
            ]
        }
        spreadsheet.batch_update(requests_body)

        print(f"[OK] Worksheet '{worksheet_name}' dibuat dengan {len(headers)} kolom.")
        return ws


def get_existing_titles(ws) -> set:
    """Ambil semua judul artikel yang sudah ada di sheet (kolom C) untuk deduplication."""
    try:
        # Kolom C = index 3 (1-based), skip header baris 1
        col_values = ws.col_values(3)  # Semua nilai kolom "Judul Artikel"
        return set(v.strip() for v in col_values[1:] if v.strip())  # Skip header
    except Exception:
        return set()


def build_row(no: int, article: dict) -> list:
    """
    Konversi dict artikel menjadi list kolom yang siap di-append ke Google Sheet.
    Konten HTML dipotong karena batas karakter sel Google Sheet adalah 50.000.
    """
    MAX_CELL_CHARS = 45_000  # Aman di bawah batas 50.000 Google Sheets

    html = article.get("konten_html", "")
    html_display = html[:MAX_CELL_CHARS] + "… [TRUNCATED]" if len(html) > MAX_CELL_CHARS else html

    tanggal_publish = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    word_count = count_words_html(html)

    return [
        no,
        tanggal_publish,
        article.get("judul", ""),
        article.get("kategori", ""),
        article.get("tags", ""),
        article.get("excerpt", ""),
        html_display,
        word_count,
        article.get("sumber", ""),
        article.get("status", "Draft"),
        article.get("catatan", ""),
    ]


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────

def main():
    print("=" * 65)
    print("  COFFEE CIVIL NEWS BOT — Google Sheets Appender")
    print(f"  Waktu: {datetime.now().strftime('%d %B %Y, %H:%M:%S')}")
    print("=" * 65)

    # Step 1 — Check dependencies
    if not check_dependencies():
        sys.exit(1)

    import gspread
    from google.oauth2.service_account import Credentials

    # Step 2 — Validate config
    if not validate_config():
        sys.exit(1)

    # Step 3 — Authenticate
    print(f"\n[INFO] Mengautentikasi dengan Service Account...")
    print(f"[INFO] File kunci: {SERVICE_ACCOUNT_FILE}")
    try:
        scopes = [
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive.file",
        ]
        creds = Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=scopes)
        client = gspread.authorize(creds)

        # Baca email service account dari JSON untuk info
        with open(SERVICE_ACCOUNT_FILE) as f:
            sa_info = json.load(f)
        print(f"[OK] Autentikasi berhasil. Service Account: {sa_info.get('client_email', 'N/A')}")

    except Exception as e:
        print(f"\n[ERROR] Gagal autentikasi: {e}")
        sys.exit(1)

    # Step 4 — Buka spreadsheet
    print(f"\n[INFO] Membuka spreadsheet ID: {SPREADSHEET_ID}")
    try:
        spreadsheet = client.open_by_key(SPREADSHEET_ID)
        print(f"[OK] Spreadsheet ditemukan: '{spreadsheet.title}'")
    except gspread.SpreadsheetNotFound:
        print(f"\n[ERROR] Spreadsheet dengan ID '{SPREADSHEET_ID}' tidak ditemukan.")
        print("  → Pastikan ID benar dan Service Account sudah di-share sebagai Editor.")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] Gagal membuka spreadsheet: {e}")
        sys.exit(1)

    # Step 5 — Get or create worksheet
    ws = get_or_create_worksheet(spreadsheet, WORKSHEET_NAME, HEADERS)

    # Step 6 — Deduplication check
    existing_titles = get_existing_titles(ws)
    print(f"\n[INFO] Judul artikel yang sudah ada di sheet: {len(existing_titles)}")

    # Step 7 — Hitung nomor baris terakhir untuk kolom No
    all_rows = ws.get_all_values()
    next_row_no = len(all_rows)  # Header = baris 1, jadi baris data mulai dari 2

    # Step 8 — Append artikel baru
    appended = 0
    skipped  = 0
    rows_to_append = []

    for article in ARTICLES:
        judul = article.get("judul", "").strip()

        if judul in existing_titles:
            print(f"[SKIP] Artikel sudah ada: \"{judul[:60]}...\"")
            skipped += 1
            continue

        next_row_no += 1
        row = build_row(next_row_no, article)
        rows_to_append.append(row)
        print(f"[QUEUE] Artikel diantrekan: \"{judul[:60]}...\"")

    if not rows_to_append:
        print("\n[INFO] Tidak ada artikel baru untuk ditambahkan.")
    else:
        print(f"\n[INFO] Menambahkan {len(rows_to_append)} artikel ke sheet...")
        try:
            ws.append_rows(
                rows_to_append,
                value_input_option="USER_ENTERED",
                insert_data_option="INSERT_ROWS",
                table_range="A1"
            )

            # Format baris data yang baru di-append: alternating row color
            last_row = next_row_no
            first_new_row = last_row - len(rows_to_append) + 1
            for i, row_num in enumerate(range(first_new_row, last_row + 1)):
                bg_color = (
                    {"red": 0.094, "green": 0.094, "blue": 0.141}  # gelap
                    if i % 2 == 0 else
                    {"red": 0.122, "green": 0.122, "blue": 0.176}  # sedikit lebih terang
                )
                ws.format(f"A{row_num}:K{row_num}", {
                    "backgroundColor": bg_color,
                    "verticalAlignment": "TOP",
                    "wrapStrategy": "WRAP",
                })

            # Format kolom Status dengan warna sesuai nilai
            for i, article in enumerate(ARTICLES):
                if article.get("judul", "").strip() not in existing_titles:
                    row_num = first_new_row + i
                    status = article.get("status", "Draft")
                    status_color = {
                        "Siap Publish": {"red": 0.133, "green": 0.545, "blue": 0.133},
                        "Draft":        {"red": 0.545, "green": 0.412, "blue": 0.078},
                        "Published":    {"red": 0.078, "green": 0.3,   "blue": 0.545},
                        "Revisi":       {"red": 0.545, "green": 0.133, "blue": 0.133},
                    }.get(status, {"red": 0.3, "green": 0.3, "blue": 0.3})

                    ws.format(f"J{row_num}", {
                        "backgroundColor": status_color,
                        "textFormat": {"bold": True},
                        "horizontalAlignment": "CENTER",
                    })

            appended = len(rows_to_append)
            print(f"[OK] {appended} artikel berhasil ditambahkan ke sheet.")

        except Exception as e:
            print(f"\n[ERROR] Gagal menambahkan data ke sheet: {e}")
            sys.exit(1)

    # Step 9 — Ringkasan
    sheet_url = f"https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit"
    print("\n" + "=" * 65)
    print("  SELESAI")
    print("=" * 65)
    print(f"  Artikel ditambahkan : {appended}")
    print(f"  Artikel dilewati    : {skipped} (duplikat)")
    print(f"  Total di sheet      : {next_row_no - 1}")
    print(f"  Spreadsheet URL     : {sheet_url}")
    print("=" * 65)

    # Simpan log
    log_data = {
        "run_at":           datetime.now().isoformat(),
        "spreadsheet_id":   SPREADSHEET_ID,
        "worksheet":        WORKSHEET_NAME,
        "articles_appended": appended,
        "articles_skipped":  skipped,
        "sheet_url":        sheet_url,
    }
    log_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "gsheet_log.json")
    with open(log_path, "w", encoding="utf-8") as f:
        json.dump(log_data, f, indent=2, ensure_ascii=False)
    print(f"\n[INFO] Log tersimpan di: {log_path}")


if __name__ == "__main__":
    main()
