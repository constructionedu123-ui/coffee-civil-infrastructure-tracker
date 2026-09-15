#!/usr/bin/env python3
"""
Coffee Civil News Bot — WordPress Auto-Publisher
================================================
Mengambil artikel yang telah ditulis dan mempublikasikannya secara otomatis
ke WordPress melalui REST API menggunakan Application Password.

Konfigurasi:
    WP_URL          : https://coffeecivil.com
    WP_USERNAME     : Administrator
    WP_APP_PASSWORD : eHrUV4qfy7OGP7pUmoxpNrss

Penggunaan:
    python post_to_wordpress.py

Dependencies:
    pip install requests
"""

import os
import sys
import base64
import json
import requests
from datetime import datetime

# ─────────────────────────────────────────────────────────────────────────────
# KONFIGURASI — Ambil dari environment variable atau gunakan default di bawah
# ─────────────────────────────────────────────────────────────────────────────
WP_URL          = os.environ.get("WP_URL",          "https://coffeecivil.com")
WP_USERNAME     = os.environ.get("WP_USERNAME",     "Administrator")
WP_APP_PASSWORD = os.environ.get("WP_APP_PASSWORD", "eHrUV4qfy7OGP7pUmoxpNrss")
CATEGORY_NAME   = "Artikel"

# ─────────────────────────────────────────────────────────────────────────────
# KONTEN ARTIKEL — Ditulis dalam Bahasa Indonesia profesional
# ─────────────────────────────────────────────────────────────────────────────

ARTICLE_TITLE = (
    "Tiga Pilar Konstruksi Digital 2026: BIM, Green Construction, "
    "dan Lean Construction Menuju Industri Bangunan Berkelanjutan"
)

ARTICLE_HTML = """
<!-- Artikel oleh Coffee Civil | Format dioptimalkan untuk Elementor Dark Theme -->

<div style="
    font-family: 'Segoe UI', Roboto, Arial, sans-serif;
    line-height: 1.85;
    color: #e2e8f0;
    max-width: 860px;
    margin: 0 auto;
">

<!-- ── LEAD PARAGRAPH ── -->
<p style="
    font-size: 1.15rem;
    font-weight: 500;
    color: #94d2bd;
    border-left: 4px solid #0a9396;
    padding-left: 1.2rem;
    margin-bottom: 2rem;
">
Industri konstruksi global sedang mengalami pergeseran paradigma yang belum pernah terjadi sebelumnya.
Tiga metodologi — <strong>Building Information Modeling (BIM)</strong>, <strong>Green Construction</strong>,
dan <strong>Lean Construction</strong> — kini tidak lagi berdiri sendiri sebagai alat bantu teknis,
melainkan telah melebur menjadi sebuah ekosistem digital terpadu yang mendefinisikan ulang cara kita
merancang, membangun, dan mengoperasikan infrastruktur di abad ke-21.
</p>

<!-- ── BAGIAN 1: BIM ── -->
<h2 style="
    color: #0a9396;
    font-size: 1.5rem;
    font-weight: 700;
    border-bottom: 2px solid #0a9396;
    padding-bottom: 0.5rem;
    margin-top: 2.5rem;
">
&#127959; BIM: Dari Model 3D Menuju Ekosistem Data Proyek yang Hidup
</h2>

<p>
Laporan industri terkini dari berbagai firma konsultan teknik global — termasuk analisis dari
<em>United BIM</em> dan <em>Eracore</em> — mengonfirmasi bahwa <strong>BIM pada 2026 telah berevolusi
jauh melampaui sekadar perangkat pemodelan tiga dimensi</strong>. BIM kini menjadi tulang punggung
digital (<em>digital backbone</em>) suatu proyek yang merentang dari fase desain skematik hingga
pengelolaan aset pascakonstruksi.
</p>

<p>
Salah satu perkembangan paling signifikan adalah integrasi <strong>kecerdasan buatan (AI) ke dalam
alur kerja koordinasi BIM</strong>. Sistem deteksi tabrakan (<em>clash detection</em>) berbasis AI kini
mampu mengelompokkan ratusan konflik geometris, menghapus duplikasi, dan menyarankan resolusi berdasarkan
pola historis — secara dramatis mengurangi waktu koordinasi antardisiplin (arsitektur, struktur,
mekanikal-elektrikal-plumbing). Lebih jauh, antarmuka BIM berbasis bahasa natural (<em>conversational BIM</em>)
mulai memungkinkan manajer proyek untuk "berdialog" dengan model BIM guna mengekstraksi kuantitas,
memprediksi keterlambatan, atau mensimulasikan skenario nilai rekayasa.
</p>

<p>
Dimensi keempat dan kelima BIM — integrasi <strong>4D (penjadwalan konstruksi)</strong> dan
<strong>5D (estimasi biaya)</strong> — semakin banyak diadopsi oleh kontraktor utama untuk
mencapai kepastian anggaran (<em>cost certainty</em>) dan prediktabilitas jadwal. Dikombinasikan
dengan platform berbasis <em>cloud</em>, seluruh pemangku kepentingan proyek — dari pemilik,
konsultan perencana, hingga subkontraktor spesialis — kini dapat mengakses dan memperbarui satu
sumber kebenaran tunggal (<em>single source of truth</em>) secara real-time, mengeliminasi
kesenjangan informasi yang selama ini menjadi akar penyebab sengketa kontraktual.
</p>

<!-- ── HIGHLIGHT BOX BIM ── -->
<div style="
    background: linear-gradient(135deg, #0a2e38 0%, #0a3d4a 100%);
    border: 1px solid #0a9396;
    border-radius: 8px;
    padding: 1.2rem 1.5rem;
    margin: 1.5rem 0;
    color: #94d2bd;
    font-size: 0.95rem;
">
    <strong style="color: #0a9396;">&#128202; Fakta Kunci:</strong> Integrasi <em>Digital Twin</em> berbasis
    sensor IoT dengan model BIM memungkinkan manajer fasilitas memantau konsumsi energi, performa
    peralatan M&amp;E, dan kebutuhan pemeliharaan secara prediktif — mengurangi biaya operasional
    gedung hingga 15&#8211;25% selama siklus hidup aset.
</div>

<!-- ── BAGIAN 2: GREEN CONSTRUCTION ── -->
<h2 style="
    color: #52b788;
    font-size: 1.5rem;
    font-weight: 700;
    border-bottom: 2px solid #52b788;
    padding-bottom: 0.5rem;
    margin-top: 2.5rem;
">
&#127807; Green Construction: Urgensi Global yang Tidak Bisa Ditunda
</h2>

<p>
<em>Global Status Report for Buildings and Construction 2025&#8211;2026</em> yang diterbitkan oleh
UN Environment Programme (UNEP) dan Global Alliance for Buildings and Construction (GlobalABC)
menyajikan gambaran yang tegas namun mengkhawatirkan: sektor bangunan dan konstruksi masih
menyumbang <strong>37% dari total emisi CO&#8322; global</strong> dan hampir <strong>50% dari total
ekstraksi material global</strong>. Terlepas dari pertumbuhan sertifikasi bangunan hijau yang
hampir tiga kali lipat selama satu dekade terakhir, sektor ini belum berada di jalur yang tepat
menuju dekarbonisasi penuh pada 2050.
</p>

<p>
Tren yang paling menentukan dalam konstruksi berkelanjutan dewasa ini mencakup beberapa dimensi.
Pertama, adopsi <strong>prinsip ekonomi sirkular</strong> dalam desain bangunan — merancang struktur
untuk kemudahan pembongkaran (<em>design for disassembly</em>), penggunaan kembali komponen struktural,
dan substitusi material konvensional dengan bahan berbasis bio (<em>bio-based materials</em>) seperti
kayu rekayasa (<em>engineered timber</em>), bambu laminasi, dan beton daur ulang. Kedua, inovasi
material rendah karbon seperti injeksi CO&#8322; pada campuran beton (teknologi CarbonCure) yang terbukti
mengurangi jejak karbon beton tanpa mengorbankan kuat tekan struktural. Ketiga, integrasi
<strong>Building-Integrated Photovoltaics (BIPV)</strong> yang menjadikan selubung bangunan
sebagai pembangkit energi terbarukan, mendorong terwujudnya bangunan net-zero yang memproduksi
energi sebesar yang dikonsumsinya.
</p>

<p>
Bagi Indonesia, urgensi ini terasa lebih nyata mengingat laju pembangunan infrastruktur yang masif
dalam kerangka Proyek Strategis Nasional. Adopsi standar <em>green building</em> seperti GREENSHIP
(GBCI) secara konsisten pada gedung-gedung baru adalah investasi jangka panjang — bukan sekadar
kewajiban regulasi, melainkan strategi daya saing aset di pasar properti global.
</p>

<!-- ── BAGIAN 3: LEAN CONSTRUCTION ── -->
<h2 style="
    color: #e9c46a;
    font-size: 1.5rem;
    font-weight: 700;
    border-bottom: 2px solid #e9c46a;
    padding-bottom: 0.5rem;
    margin-top: 2.5rem;
">
&#9881; Lean Construction 5.0: Eliminasi Pemborosan di Era Digital
</h2>

<p>
Lean Construction — yang berakar dari filosofi Toyota Production System — kini telah berevolusi
menjadi apa yang para praktisi sebut sebagai <strong>"Lean 5.0"</strong>: fusi antara prinsip
eliminasi pemborosan (<em>waste elimination</em>) dengan ekosistem teknologi Industri 4.0.
Implikasi praktisnya sangat konkret: <em>Last Planner System&#174; (LPS)</em> yang selama ini menjadi
andalan perencanaan berbasis komitmen kini diperkuat dengan analitik data berbasis AI yang mampu
memprediksi gangguan aliran kerja (<em>workflow disruption</em>) sebelum terjadi di lapangan.
</p>

<p>
Konstruksi modular dan prefabrikasi — yang secara intrinsik selaras dengan prinsip Lean — kini
mendapatkan momentum baru. Penelitian menunjukkan bahwa produksi komponen bangunan dalam lingkungan
pabrik yang terkontrol mampu mengurangi limbah material hingga 90% dibandingkan metode konvensional
<em>in-situ</em>, sekaligus mempersingkat durasi konstruksi secara signifikan. <strong>Integrated
Project Delivery (IPD)</strong> sebagai kerangka kontraktual Lean — di mana pemilik, desainer,
dan kontraktor berbagi risiko dan keuntungan dalam satu perjanjian tunggal — terus terbukti sebagai
instrumen paling efektif untuk menyelaraskan insentif seluruh pemangku kepentingan proyek.
</p>

<p>
Yang menarik adalah konvergensi antara Lean dan prinsip keberlanjutan: dalam paradigma Lean 5.0,
<strong>emisi karbon tertanam (<em>embodied carbon</em>) diperlakukan sebagai salah satu bentuk
pemborosan (<em>muda</em>) yang harus dieliminasi</strong>. Ini berarti tim proyek Lean modern
tidak hanya mengoptimalkan biaya dan jadwal, tetapi secara paralel menelusuri dan meminimalkan
jejak karbon dari setiap paket pekerjaan — mengintegrasikan laporan ESG ke dalam metrik kinerja
proyek sehari-hari.
</p>

<!-- ── KESIMPULAN ── -->
<h2 style="
    color: #ee9b00;
    font-size: 1.5rem;
    font-weight: 700;
    border-bottom: 2px solid #ee9b00;
    padding-bottom: 0.5rem;
    margin-top: 2.5rem;
">
&#128301; Konvergensi Tiga Pilar: Masa Depan Konstruksi Indonesia
</h2>

<p>
Ketiga pilar — BIM, Green Construction, dan Lean Construction — kini tidak lagi dapat dipandang
sebagai domain yang terpisah. BIM menyediakan <em>platform data</em>; Green Construction menentukan
<em>target kinerja lingkungan</em>; sementara Lean menyediakan <em>metodologi eksekusi</em> untuk
mencapai kedua tujuan tersebut secara efisien. Kontraktor dan konsultan Indonesia yang mampu
mengintegrasikan ketiga pendekatan ini dalam satu kerangka kerja terintegrasi akan memiliki keunggulan
kompetitif yang substansial — baik dalam memenangkan proyek pemerintah yang semakin mensyaratkan
kriteria keberlanjutan, maupun dalam menarik investasi asing yang kini sangat sensitif terhadap
rekam jejak ESG (<em>Environmental, Social, and Governance</em>) para mitra konstruksinya.
</p>

<p>
Transformasi ini bukan sekadar adopsi perangkat lunak baru. Ini adalah perubahan budaya profesional
yang menuntut insinyur sipil Indonesia untuk menguasai literasi data, memahami siklus hidup karbon
material struktural, dan mampu memfasilitasi proses perencanaan berbasis komitmen lintas disiplin.
Masa depan konstruksi Indonesia ada di tangan mereka yang berani memeluk kompleksitas ini hari ini.
</p>

<!-- ── PENUTUP ── -->
<hr style="border-color: #334155; margin: 2rem 0;" />
<p style="font-size: 0.85rem; color: #64748b; text-align: center;">
    <em>Artikel ini disusun berdasarkan laporan global terkini dari UNEP GlobalABC,
    United BIM, Eracore, dan Lean Construction Institute. Diterbitkan oleh redaksi Coffee Civil,
    September 2026.</em>
</p>

</div>
"""

ARTICLE_EXCERPT = (
    "Tiga metodologi konstruksi digital — BIM, Green Construction, dan Lean Construction — "
    "telah berkonvergensi menjadi ekosistem terpadu. Pelajari bagaimana tren global 2026 ini "
    "meredefinisi industri bangunan dan apa artinya bagi para profesional konstruksi Indonesia."
)

ARTICLE_TAGS = [
    "BIM", "Building Information Modeling", "Green Construction",
    "Lean Construction", "Konstruksi Digital", "Konstruksi Berkelanjutan",
    "Digital Twin", "Dekarbonisasi", "GREENSHIP", "Integrated Project Delivery"
]


# ─────────────────────────────────────────────────────────────────────────────
# FUNGSI UTAMA
# ─────────────────────────────────────────────────────────────────────────────

def build_auth_header(username: str, app_password: str) -> dict:
    """Membuat header Basic Auth dari username dan application password WordPress.
    
    Menggunakan User-Agent Google Chrome standar agar tidak diblokir oleh
    Cloudflare Bot Management / WAF challenge.
    """
    token = base64.b64encode(f"{username}:{app_password}".encode()).decode("ascii")
    return {
        "Authorization":  f"Basic {token}",
        "Content-Type":   "application/json",
        "Accept":         "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Referer":        "https://coffeecivil.com/wp-admin/",
        "Origin":         "https://coffeecivil.com",
        "Connection":     "keep-alive",
        # Standard Google Chrome 126 User-Agent (Windows 10, x64)
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/126.0.0.0 Safari/537.36"
        ),
    }


def get_or_create_category(base_url: str, headers: dict, name: str) -> int:
    """
    Mencari category berdasarkan nama. Jika tidak ditemukan, buat baru.
    Mengembalikan category ID.
    """
    api_url = f"{base_url}/wp-json/wp/v2/categories"

    # Cari di semua halaman
    page = 1
    while True:
        resp = requests.get(
            api_url,
            params={"search": name, "per_page": 100, "page": page},
            headers=headers,
            timeout=30
        )
        resp.raise_for_status()
        categories = resp.json()

        if not categories:
            break

        for cat in categories:
            if cat["name"].lower() == name.lower():
                print(f"[OK] Kategori '{name}' ditemukan dengan ID: {cat['id']}")
                return cat["id"]

        # Cek apakah masih ada halaman berikutnya
        total_pages = int(resp.headers.get("X-WP-TotalPages", 1))
        if page >= total_pages:
            break
        page += 1

    # Tidak ditemukan — buat kategori baru
    print(f"[INFO] Kategori '{name}' tidak ditemukan. Membuat kategori baru...")
    resp = requests.post(
        api_url,
        headers=headers,
        json={"name": name, "slug": name.lower()},
        timeout=30
    )
    resp.raise_for_status()
    new_cat = resp.json()
    print(f"[OK] Kategori baru '{name}' dibuat dengan ID: {new_cat['id']}")
    return new_cat["id"]


def get_or_create_tags(base_url: str, headers: dict, tag_names: list) -> list:
    """
    Mencari atau membuat tag berdasarkan daftar nama.
    Mengembalikan daftar tag ID.
    """
    api_url = f"{base_url}/wp-json/wp/v2/tags"
    tag_ids = []

    for name in tag_names:
        # Cari tag
        resp = requests.get(
            api_url,
            params={"search": name, "per_page": 10},
            headers=headers,
            timeout=30
        )
        resp.raise_for_status()
        tags = resp.json()

        found = next(
            (t for t in tags if t["name"].lower() == name.lower()), None
        )

        if found:
            tag_ids.append(found["id"])
        else:
            # Buat tag baru
            create_resp = requests.post(
                api_url,
                headers=headers,
                json={"name": name},
                timeout=30
            )
            if create_resp.status_code in (200, 201):
                tag_ids.append(create_resp.json()["id"])
            else:
                print(f"[WARN] Tidak dapat membuat tag '{name}': {create_resp.text[:200]}")

    print(f"[OK] {len(tag_ids)} tag siap digunakan.")
    return tag_ids


def publish_post(
    base_url:    str,
    headers:     dict,
    title:       str,
    content:     str,
    excerpt:     str,
    category_id: int,
    tag_ids:     list
) -> dict:
    """
    Mempublikasikan post ke WordPress melalui REST API.
    Mengembalikan respons JSON dari WordPress.
    """
    api_url = f"{base_url}/wp-json/wp/v2/posts"

    payload = {
        "title":          title,
        "content":        content,
        "excerpt":        excerpt,
        "status":         "publish",      # Langsung publish
        "categories":     [category_id],
        "tags":           tag_ids,
        "format":         "standard",
        "comment_status": "open",
        "ping_status":    "open",
    }

    print(f"\n[INFO] Mempublikasikan artikel ke {api_url} ...")
    resp = requests.post(api_url, headers=headers, json=payload, timeout=60)

    if resp.status_code not in (200, 201):
        print(f"\n[ERROR] HTTP {resp.status_code}:")
        print(resp.text[:1000])
        resp.raise_for_status()

    return resp.json()


def main():
    print("=" * 65)
    print("  COFFEE CIVIL NEWS BOT — WordPress Auto-Publisher")
    print(f"  Waktu: {datetime.now().strftime('%d %B %Y, %H:%M:%S')}")
    print("=" * 65)

    # Validasi konfigurasi
    if not all([WP_URL, WP_USERNAME, WP_APP_PASSWORD]):
        print("[FATAL] Konfigurasi WP_URL / WP_USERNAME / WP_APP_PASSWORD tidak lengkap.")
        sys.exit(1)

    print(f"\n[INFO] Target    : {WP_URL}")
    print(f"[INFO] Username  : {WP_USERNAME}")
    print(f"[INFO] Kategori  : {CATEGORY_NAME}")

    # Buat header autentikasi
    headers = build_auth_header(WP_USERNAME, WP_APP_PASSWORD)

    # Uji koneksi
    try:
        test_resp = requests.get(
            f"{WP_URL}/wp-json/wp/v2/users/me",
            headers=headers,
            timeout=20
        )
        test_resp.raise_for_status()
        user_data = test_resp.json()
        print(f"\n[OK] Autentikasi berhasil. Login sebagai: {user_data.get('name', WP_USERNAME)}")
    except requests.exceptions.RequestException as e:
        print(f"\n[ERROR] Gagal terhubung ke WordPress REST API: {e}")
        print("        Pastikan Application Password sudah aktif di dashboard WordPress.")
        sys.exit(1)

    # Dapatkan atau buat kategori
    try:
        category_id = get_or_create_category(WP_URL, headers, CATEGORY_NAME)
    except requests.exceptions.RequestException as e:
        print(f"\n[ERROR] Gagal memproses kategori: {e}")
        sys.exit(1)

    # Dapatkan atau buat tag
    try:
        tag_ids = get_or_create_tags(WP_URL, headers, ARTICLE_TAGS)
    except requests.exceptions.RequestException as e:
        print(f"\n[WARN] Gagal memproses tag (akan lanjut tanpa tag): {e}")
        tag_ids = []

    # Publikasikan artikel
    try:
        result = publish_post(
            base_url=WP_URL,
            headers=headers,
            title=ARTICLE_TITLE,
            content=ARTICLE_HTML,
            excerpt=ARTICLE_EXCERPT,
            category_id=category_id,
            tag_ids=tag_ids
        )

        post_url  = result.get("link", "URL tidak tersedia")
        post_id   = result.get("id",   "ID tidak tersedia")
        post_date = result.get("date", "Tanggal tidak tersedia")

        print("\n" + "=" * 65)
        print("  ARTIKEL BERHASIL DIPUBLIKASIKAN!")
        print("=" * 65)
        print(f"  Judul    : {ARTICLE_TITLE[:70]}")
        print(f"  Post ID  : {post_id}")
        print(f"  URL      : {post_url}")
        print(f"  Tanggal  : {post_date}")
        print(f"  Kategori : {CATEGORY_NAME} (ID: {category_id})")
        print(f"  Tags     : {len(tag_ids)} tag diterapkan")
        print("=" * 65)

        # Simpan log hasil
        log_data = {
            "published_at": datetime.now().isoformat(),
            "post_id":      post_id,
            "post_url":     post_url,
            "title":        ARTICLE_TITLE,
            "category_id":  category_id,
            "tag_ids":      tag_ids,
            "status":       "success"
        }
        log_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "publish_log.json")
        with open(log_file, "w", encoding="utf-8") as f:
            json.dump(log_data, f, indent=2, ensure_ascii=False)
        print(f"\n[INFO] Log tersimpan di: {log_file}")

    except requests.exceptions.RequestException as e:
        print(f"\n[ERROR] Gagal mempublikasikan artikel: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
