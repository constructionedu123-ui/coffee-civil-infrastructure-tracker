import json
from pathlib import Path

# Fault systems based on PuSGeN (Pusat Studi Gempa Nasional) 2017 & Badan Geologi
faults = [
    # ── JAWA ──────────────────────────────────────────────────────────────────
    {
        "name": "Sesar Lembang",
        "island": "Jawa",
        "slip_rate_mm_year": 4.0,
        "fault_type": "Strike-Slip (Sinistral)",
        "source": "PuSGeN / Badan Geologi",
        "description": "Patahan aktif membentang 29 km di utara Cekungan Bandung dari Gunung Manglayang hingga Cisarua.",
        "coordinates": [
            [107.72, -6.83],
            [107.65, -6.82],
            [107.61, -6.81],
            [107.54, -6.80],
            [107.45, -6.80]
        ]
    },
    {
        "name": "Sesar Cimandiri",
        "island": "Jawa",
        "slip_rate_mm_year": 4.0,
        "fault_type": "Strike-Slip (Sinistral)",
        "source": "PuSGeN / Badan Geologi",
        "description": "Membentang ~100 km dari Teluk Pelabuhan Ratu, melewati Sukabumi dan Cianjur hingga Padalarang.",
        "coordinates": [
            [106.52, -7.03],
            [106.70, -6.98],
            [106.85, -6.95],
            [106.92, -6.92],
            [107.03, -6.88],
            [107.13, -6.84],
            [107.25, -6.82],
            [107.35, -6.81]
        ]
    },
    {
        "name": "Sesar Baribis",
        "island": "Jawa",
        "slip_rate_mm_year": 5.0,
        "fault_type": "Thrust (Naik)",
        "source": "PuSGeN / Badan Geologi",
        "description": "Jalur sesar naik busur belakang membentang dari Majalengka, Subang, Purwakarta hingga selatan Jakarta.",
        "coordinates": [
            [108.35, -6.88],
            [108.05, -6.75],
            [107.60, -6.55],
            [107.25, -6.45],
            [106.90, -6.38],
            [106.75, -6.35]
        ]
    },
    {
        "name": "Sesar Kendeng",
        "island": "Jawa",
        "slip_rate_mm_year": 5.0,
        "fault_type": "Thrust (Naik)",
        "source": "PuSGeN / Badan Geologi",
        "description": "Zona sesar lipatan dan patahan naik melintang dari Semarang, Grobogan, Ngawi hingga Surabaya.",
        "coordinates": [
            [110.45, -7.05],
            [110.95, -7.10],
            [111.45, -7.35],
            [112.00, -7.42],
            [112.40, -7.43],
            [112.75, -7.45]
        ]
    },
    {
        "name": "Sesar Opak",
        "island": "Jawa",
        "slip_rate_mm_year": 2.4,
        "fault_type": "Strike-Slip (Sinistral)",
        "source": "PuSGeN / Badan Geologi",
        "description": "Patahan aktif sepanjang lembah Sungai Opak dari Prambanan hingga muara pantai Parangtritis.",
        "coordinates": [
            [110.51, -7.74],
            [110.43, -7.86],
            [110.36, -7.94],
            [110.29, -8.02]
        ]
    },
    {
        "name": "Sesar Pasuruan - Probolinggo",
        "island": "Jawa",
        "slip_rate_mm_year": 2.0,
        "fault_type": "Thrust (Naik)",
        "source": "PuSGeN / Badan Geologi",
        "description": "Segmen sesar aktif Jawa Timur pesisir utara Selat Madura.",
        "coordinates": [
            [112.80, -7.65],
            [113.05, -7.70],
            [113.35, -7.75]
        ]
    },

    # ── SUMATERA (GREAT SUMATRAN FAULT / SESAR SEMANGKO) ──────────────────────
    {
        "name": "Sesar Semangko - Segmen Seulimeum & Aceh",
        "island": "Sumatera",
        "slip_rate_mm_year": 15.0,
        "fault_type": "Strike-Slip (Dextral)",
        "source": "PuSGeN / Badan Geologi",
        "description": "Ujung utara Patahan Besar Sumatera membelah lembah Banda Aceh dan Jantho.",
        "coordinates": [
            [95.30, 5.75],
            [95.50, 5.55],
            [95.75, 5.25],
            [96.00, 4.90]
        ]
    },
    {
        "name": "Sesar Semangko - Segmen Tripa",
        "island": "Sumatera",
        "slip_rate_mm_year": 20.0,
        "fault_type": "Strike-Slip (Dextral)",
        "source": "PuSGeN / Badan Geologi",
        "description": "Segmen rawa Tripa & Gayo Lues di selatan Taman Nasional Gunung Leuser.",
        "coordinates": [
            [96.70, 4.20],
            [97.10, 3.75],
            [97.45, 3.35],
            [97.75, 3.00]
        ]
    },
    {
        "name": "Sesar Semangko - Segmen Renun & Toru",
        "island": "Sumatera",
        "slip_rate_mm_year": 23.0,
        "fault_type": "Strike-Slip (Dextral)",
        "source": "PuSGeN / Badan Geologi",
        "description": "Segmen aktif di sebelah barat Danau Toba dan lembah Batang Toru.",
        "coordinates": [
            [98.15, 2.70],
            [98.50, 2.30],
            [98.85, 1.85],
            [99.20, 1.45]
        ]
    },
    {
        "name": "Sesar Semangko - Segmen Angkola & Barumun",
        "island": "Sumatera",
        "slip_rate_mm_year": 24.0,
        "fault_type": "Strike-Slip (Dextral)",
        "source": "PuSGeN / Badan Geologi",
        "description": "Segmen aktif perbatasan Sumatera Utara dan Sumatera Barat melewati Padang Sidempuan.",
        "coordinates": [
            [99.30, 1.35],
            [99.65, 0.90],
            [99.95, 0.50],
            [100.15, 0.15]
        ]
    },
    {
        "name": "Sesar Semangko - Segmen Sianok",
        "island": "Sumatera",
        "slip_rate_mm_year": 12.0,
        "fault_type": "Strike-Slip (Dextral)",
        "source": "PuSGeN / Badan Geologi",
        "description": "Membentuk Ngarai Sianok, Danau Singkarak, melintasi Bukittinggi dan Padang Panjang.",
        "coordinates": [
            [100.15, 0.15],
            [100.35, -0.30],
            [100.55, -0.65],
            [100.75, -0.95]
        ]
    },
    {
        "name": "Sesar Semangko - Segmen Suliti & Siulak",
        "island": "Sumatera",
        "slip_rate_mm_year": 14.0,
        "fault_type": "Strike-Slip (Dextral)",
        "source": "PuSGeN / Badan Geologi",
        "description": "Melintasi Lembah Kerinci, kaki Gunung Kerinci dan Danau Kerinci.",
        "coordinates": [
            [100.75, -0.95],
            [101.10, -1.45],
            [101.40, -1.95],
            [101.75, -2.45]
        ]
    },
    {
        "name": "Sesar Semangko - Segmen Dikit & Musi",
        "island": "Sumatera",
        "slip_rate_mm_year": 12.0,
        "fault_type": "Strike-Slip (Dextral)",
        "source": "PuSGeN / Badan Geologi",
        "description": "Segmen di Bengkulu utara dan hulu Sungai Musi perbatasan Sumsel-Bengkulu.",
        "coordinates": [
            [101.75, -2.45],
            [102.15, -2.95],
            [102.55, -3.50],
            [102.95, -4.00]
        ]
    },
    {
        "name": "Sesar Semangko - Segmen Manna & Kumering",
        "island": "Sumatera",
        "slip_rate_mm_year": 11.0,
        "fault_type": "Strike-Slip (Dextral)",
        "source": "PuSGeN / Badan Geologi",
        "description": "Segmen di Danau Ranau dan perbatasan Lampung barat.",
        "coordinates": [
            [102.95, -4.00],
            [103.45, -4.60],
            [103.95, -5.05],
            [104.30, -5.35]
        ]
    },
    {
        "name": "Sesar Semangko - Segmen Semangko (Teluk Semangko)",
        "island": "Sumatera",
        "slip_rate_mm_year": 10.0,
        "fault_type": "Strike-Slip (Dextral)",
        "source": "PuSGeN / Badan Geologi",
        "description": "Segmen selatan Patahan Sumatera bermuara ke Teluk Semangko dan Selat Sunda.",
        "coordinates": [
            [104.30, -5.35],
            [104.55, -5.65],
            [104.85, -5.95],
            [105.10, -6.15]
        ]
    },

    # ── SULAWESI ──────────────────────────────────────────────────────────────
    {
        "name": "Sesar Palu-Koro",
        "island": "Sulawesi",
        "slip_rate_mm_year": 42.0,
        "fault_type": "Strike-Slip (Sinistral)",
        "source": "PuSGeN / Badan Geologi",
        "description": "Salah satu sesar geser teraktif di dunia; membelah Kota Palu, lembah Kulawi hingga Danau Poso.",
        "coordinates": [
            [119.75, -0.30],
            [119.82, -0.65],
            [119.86, -0.89],
            [119.98, -1.35],
            [120.20, -1.85],
            [120.50, -2.35],
            [120.65, -2.60]
        ]
    },
    {
        "name": "Sesar Matano",
        "island": "Sulawesi",
        "slip_rate_mm_year": 20.0,
        "fault_type": "Strike-Slip (Sinistral)",
        "source": "PuSGeN / Badan Geologi",
        "description": "Menghubungkan Sesar Palu-Koro ke Laut Banda melalui Danau Matano dan Sorowako.",
        "coordinates": [
            [120.65, -2.60],
            [121.15, -2.55],
            [121.75, -2.60],
            [122.25, -2.75],
            [122.65, -2.85]
        ]
    },
    {
        "name": "Sesar Lawanopo",
        "island": "Sulawesi",
        "slip_rate_mm_year": 6.0,
        "fault_type": "Strike-Slip (Sinistral)",
        "source": "PuSGeN / Badan Geologi",
        "description": "Membentang tenggara dari Danau Towuti melewati Kendari hingga Teluk Tolo.",
        "coordinates": [
            [121.45, -3.25],
            [121.85, -3.55],
            [122.25, -3.85],
            [122.65, -4.10],
            [123.00, -4.35]
        ]
    },
    {
        "name": "Sesar Walanae",
        "island": "Sulawesi",
        "slip_rate_mm_year": 7.0,
        "fault_type": "Strike-Slip / Normal",
        "source": "PuSGeN / Badan Geologi",
        "description": "Membelah Sulawesi Selatan dari utara Danau Tempe ke selatan melewati Bone hingga Bulukumba.",
        "coordinates": [
            [119.85, -3.80],
            [119.95, -4.20],
            [120.08, -4.65],
            [120.18, -5.10],
            [120.25, -5.45]
        ]
    },
    {
        "name": "Sesar Gorontalo",
        "island": "Sulawesi",
        "slip_rate_mm_year": 11.0,
        "fault_type": "Strike-Slip (Dextral)",
        "source": "PuSGeN / Badan Geologi",
        "description": "Melintang di lengan utara Sulawesi melintasi pesisir Teluk Tomini dan Gorontalo.",
        "coordinates": [
            [122.45, 1.10],
            [122.85, 0.75],
            [123.10, 0.50],
            [123.45, 0.15]
        ]
    },

    # ── NUSA TENGGARA & BALI ───────────────────────────────────────────────────
    {
        "name": "Sesar Naik Busur Belakang Bali-Lombok (Flores Thrust)",
        "island": "Bali-Nusa Tenggara",
        "slip_rate_mm_year": 12.0,
        "fault_type": "Thrust (Naik)",
        "source": "PuSGeN / Badan Geologi",
        "description": "Zona tunjaman balik di utara Bali dan Lombok, sumber utama gempa bumi Lombok 2018.",
        "coordinates": [
            [114.70, -7.80],
            [115.30, -7.85],
            [116.00, -7.95],
            [116.70, -8.05]
        ]
    },
    {
        "name": "Sesar Naik Busur Belakang Sumbawa (Flores Thrust)",
        "island": "Bali-Nusa Tenggara",
        "slip_rate_mm_year": 14.0,
        "fault_type": "Thrust (Naik)",
        "source": "PuSGeN / Badan Geologi",
        "description": "Zona sesar naik utara Pulau Sumbawa dan Teluk Saleh.",
        "coordinates": [
            [116.70, -8.05],
            [117.50, -8.10],
            [118.30, -8.15],
            [119.10, -8.15]
        ]
    },
    {
        "name": "Sesar Naik Busur Belakang Flores-Alor (Flores Thrust)",
        "island": "Bali-Nusa Tenggara",
        "slip_rate_mm_year": 15.0,
        "fault_type": "Thrust (Naik)",
        "source": "PuSGeN / Badan Geologi",
        "description": "Lanjutan zona tunjaman balik utara Flores, Lembata hingga Kepulauan Alor.",
        "coordinates": [
            [119.10, -8.15],
            [120.20, -8.10],
            [121.50, -8.10],
            [122.80, -8.10],
            [124.00, -8.15],
            [125.10, -8.20]
        ]
    },

    # ── PAPUA & MALUKU ────────────────────────────────────────────────────────
    {
        "name": "Sesar Sorong",
        "island": "Papua / Maluku",
        "slip_rate_mm_year": 28.0,
        "fault_type": "Strike-Slip (Sinistral)",
        "source": "PuSGeN / Badan Geologi",
        "description": "Megashear batas lempeng utama Pasifik-Australia membentang dari Sorong ke barat menuju Maluku Utara.",
        "coordinates": [
            [132.20, -0.75],
            [131.25, -0.85],
            [130.00, -1.10],
            [128.50, -1.45],
            [127.00, -1.65],
            [125.50, -1.80]
        ]
    },
    {
        "name": "Sesar Yapen",
        "island": "Papua",
        "slip_rate_mm_year": 22.0,
        "fault_type": "Strike-Slip (Sinistral)",
        "source": "PuSGeN / Badan Geologi",
        "description": "Patahan geser aktif di utara Papua sepanjang Pulau Yapen dan Teluk Cendrawasih.",
        "coordinates": [
            [134.50, -1.65],
            [135.40, -1.72],
            [136.30, -1.78],
            [137.20, -1.85],
            [138.10, -1.95]
        ]
    },
    {
        "name": "Sesar Tarera-Aiduna",
        "island": "Papua",
        "slip_rate_mm_year": 18.0,
        "fault_type": "Strike-Slip (Sinistral)",
        "source": "PuSGeN / Badan Geologi",
        "description": "Sesar aktif berarah barat-timur di leher burung Papua membatasi Pegunungan Tengah dengan Laut Arafura.",
        "coordinates": [
            [133.30, -3.95],
            [134.20, -3.90],
            [135.10, -3.85],
            [136.00, -3.78],
            [136.90, -3.72]
        ]
    },
    {
        "name": "Sesar Ransiki",
        "island": "Papua",
        "slip_rate_mm_year": 11.0,
        "fault_type": "Strike-Slip (Sinistral)",
        "source": "PuSGeN / Badan Geologi",
        "description": "Patahan aktif di timur Semenanjung Kepala Burung dari Manokwari ke selatan Teluk Bintuni.",
        "coordinates": [
            [134.05, -0.80],
            [134.15, -1.25],
            [134.25, -1.70],
            [134.35, -2.15]
        ]
    },

    # ── KALIMANTAN ────────────────────────────────────────────────────────────
    {
        "name": "Sesar Meratus",
        "island": "Kalimantan",
        "slip_rate_mm_year": 0.5,
        "fault_type": "Thrust / Reverse",
        "source": "PuSGeN / Badan Geologi",
        "description": "Zona sesar naik Pegunungan Meratus di Kalimantan Selatan.",
        "coordinates": [
            [115.00, -2.55],
            [115.20, -3.10],
            [115.40, -3.65],
            [115.55, -4.00]
        ]
    },
    {
        "name": "Sesar Mangkalihat",
        "island": "Kalimantan",
        "slip_rate_mm_year": 1.5,
        "fault_type": "Strike-Slip (Sinistral)",
        "source": "PuSGeN / Badan Geologi",
        "description": "Sesar geser Semenanjung Mangkalihat, Kalimantan Timur / utara Selat Makassar.",
        "coordinates": [
            [117.15, 1.15],
            [117.75, 1.00],
            [118.35, 0.90],
            [118.95, 0.80]
        ]
    }
]

features = []
for idx, f in enumerate(faults, start=1):
    feat = {
        "type": "Feature",
        "id": f"fault-{idx:03d}",
        "geometry": {
            "type": "LineString",
            "coordinates": f["coordinates"]
        },
        "properties": {
            "id": f"fault-{idx:03d}",
            "name": f["name"],
            "island": f["island"],
            "slip_rate_mm_year": f["slip_rate_mm_year"],
            "fault_type": f["fault_type"],
            "source": f["source"],
            "description": f["description"]
        }
    }
    features.append(feat)

fc = {
    "type": "FeatureCollection",
    "metadata": {
        "title": "Peta Sesar Aktif Indonesia (PuSGeN / Badan Geologi)",
        "source": "Pusat Studi Gempa Nasional (PuSGeN) 2017 & Badan Geologi Kementerian ESDM",
        "total_fault_lines": len(features)
    },
    "features": features
}

p1 = Path("data/fault_lines.geojson")
p2 = Path("frontend/public/data/fault_lines.geojson")

p1.parent.mkdir(parents=True, exist_ok=True)
with p1.open("w", encoding="utf-8") as f:
    json.dump(fc, f, indent=2, ensure_ascii=False)
print(f"Wrote {len(features)} fault lines to {p1}")

p2.parent.mkdir(parents=True, exist_ok=True)
with p2.open("w", encoding="utf-8") as f:
    json.dump(fc, f, indent=2, ensure_ascii=False)
print(f"Mirrored {len(features)} fault lines to {p2}")
