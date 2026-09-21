/**
 * Regional Construction Cost Benchmark Engine (BPS IKK & AHSP PUPR)
 * Data Source: Badan Pusat Statistik (BPS) Indeks Kemahalan Konstruksi (IKK)
 * & Kementerian Pekerjaan Umum (PUPR) Analisis Harga Satuan Pekerjaan (AHSP)
 */

export interface MaterialCostBenchmark {
  beton_k300_m3: number;     // Ready-mix K-300 (Rp/m³)
  besi_beton_kg: number;     // Besi beton ulir BJTS (Rp/kg)
  semen_50kg_sak: number;    // Semen Portland 50kg (Rp/sak)
  pasir_m3: number;          // Pasir pasang/beton (Rp/m³)
  batu_split_m3: number;     // Batu pecah 1-2 / crushed stone (Rp/m³)
}

export interface LaborDailyBenchmark {
  pekerja: number;           // Upah harian pekerja kasar 7 jam (Rp/hari)
  tukang: number;            // Upah harian tukang batu/besi (Rp/hari)
  mandor: number;            // Upah harian mandor lapangan (Rp/hari)
}

export interface CompositeAhspBenchmark {
  struktur_beton_lengkap_m3: number; // Beton K-300 + 120kg besi BJTS + bekisting 2x pakai + upah
  galian_tanah_m3: number;           // Galian tanah keras / berbatu excavator + disposal
  tiang_pancang_m: number;           // Pengadaan & pemancangan tiang pancang spun pile / m'
}

export interface RegionalCostAnalysis {
  regionName: string;
  provinceName: string;
  ikkIndex: number;
  diffPercent: number;
  diffText: string;
  badgeLabel: string;
  badgeColorClass: string;
  badgeBgClass: string;
  severity: 'low' | 'standard' | 'high' | 'very_high';
  materials: MaterialCostBenchmark;
  laborDaily: LaborDailyBenchmark;
  compositeAhsp: CompositeAhspBenchmark;
  logisticsNote: string;
}

interface RegionalCostEntry {
  provinces: string[];
  regencyKeywords?: string[];
  regionName: string;
  ikkIndex: number;
  materials: MaterialCostBenchmark;
  laborDaily: LaborDailyBenchmark;
  compositeAhsp: CompositeAhspBenchmark;
  logisticsNote: string;
}

const JAWA_BASELINE_IKK = 96.0;

const REGIONAL_COST_TABLE: RegionalCostEntry[] = [
  // 1. IKN Nusantara & Balikpapan / Kutai Kartanegara (Kalimantan Timur)
  {
    provinces: ['Kalimantan Timur'],
    regencyKeywords: ['ikn', 'sepaku', 'penajam', 'balikpapan', 'samarinda', 'kutai kartanegara'],
    regionName: 'IKN Nusantara & Kalimantan Timur',
    ikkIndex: 124.6,
    materials: {
      beton_k300_m3: 1360000,
      besi_beton_kg: 17900,
      semen_50kg_sak: 88000,
      pasir_m3: 360000,
      batu_split_m3: 410000,
    },
    laborDaily: {
      pekerja: 165000,
      tukang: 210000,
      mandor: 260000,
    },
    compositeAhsp: {
      struktur_beton_lengkap_m3: 6920000,
      galian_tanah_m3: 125000,
      tiang_pancang_m: 680000,
    },
    logisticsNote: 'Material batu split & pasir disuplai via tongkang dari Palu; semen curah & baja precast dikapalkan dari Tanjung Perak Surabaya.',
  },

  // 2. DKI Jakarta (Metropolitan Hub)
  {
    provinces: ['DKI Jakarta', 'Jakarta'],
    regionName: 'DKI Jakarta (Jabodetabek Inti)',
    ikkIndex: 101.5,
    materials: {
      beton_k300_m3: 1020000,
      besi_beton_kg: 14800,
      semen_50kg_sak: 69000,
      pasir_m3: 260000,
      batu_split_m3: 290000,
    },
    laborDaily: {
      pekerja: 135000,
      tukang: 175000,
      mandor: 215000,
    },
    compositeAhsp: {
      struktur_beton_lengkap_m3: 5450000,
      galian_tanah_m3: 88000,
      tiang_pancang_m: 460000,
    },
    logisticsNote: 'Akses logistik darat prima didukung jaringan batching plant padat di lingkar Jabodetabek & produsen baja Cilegon.',
  },

  // 3. Jawa Barat & Banten
  {
    provinces: ['Jawa Barat', 'Banten'],
    regionName: 'Jawa Barat & Banten',
    ikkIndex: 97.2,
    materials: {
      beton_k300_m3: 980000,
      besi_beton_kg: 14200,
      semen_50kg_sak: 66000,
      pasir_m3: 230000,
      batu_split_m3: 250000,
    },
    laborDaily: {
      pekerja: 120000,
      tukang: 160000,
      mandor: 195000,
    },
    compositeAhsp: {
      struktur_beton_lengkap_m3: 5180000,
      galian_tanah_m3: 82000,
      tiang_pancang_m: 440000,
    },
    logisticsNote: 'Dekat dengan pabrik semen terpadu (Indocement Citeureup) dan kawasan industri baja Cilegon (Krakatau Steel).',
  },

  // 4. Jawa Tengah & D.I. Yogyakarta
  {
    provinces: ['Jawa Tengah', 'DI Yogyakarta', 'D.I. Yogyakarta'],
    regionName: 'Jawa Tengah & D.I. Yogyakarta',
    ikkIndex: 92.4,
    materials: {
      beton_k300_m3: 940000,
      besi_beton_kg: 13900,
      semen_50kg_sak: 63000,
      pasir_m3: 210000,
      batu_split_m3: 240000,
    },
    laborDaily: {
      pekerja: 105000,
      tukang: 145000,
      mandor: 180000,
    },
    compositeAhsp: {
      struktur_beton_lengkap_m3: 4890000,
      galian_tanah_m3: 76000,
      tiang_pancang_m: 420000,
    },
    logisticsNote: 'Salah satu indeks biaya terendah nasional didukung pabrik semen Rembang & Cilacap serta ketersediaan tenaga kerja terampil melimpah.',
  },

  // 5. Jawa Timur
  {
    provinces: ['Jawa Timur'],
    regionName: 'Jawa Timur',
    ikkIndex: 95.8,
    materials: {
      beton_k300_m3: 960000,
      besi_beton_kg: 14000,
      semen_50kg_sak: 64000,
      pasir_m3: 220000,
      batu_split_m3: 245000,
    },
    laborDaily: {
      pekerja: 115000,
      tukang: 155000,
      mandor: 190000,
    },
    compositeAhsp: {
      struktur_beton_lengkap_m3: 5080000,
      galian_tanah_m3: 80000,
      tiang_pancang_m: 430000,
    },
    logisticsNote: 'Sentra industri semen terbesar (SIG Tuban & Gresik) dan pelabuhan konsolidasi kargo material Tanjung Perak.',
  },

  // 6. Bali & Nusa Tenggara Barat (Lombok/Sumbawa)
  {
    provinces: ['Bali', 'Nusa Tenggara Barat'],
    regionName: 'Bali & Nusa Tenggara Barat',
    ikkIndex: 106.8,
    materials: {
      beton_k300_m3: 1120000,
      besi_beton_kg: 15600,
      semen_50kg_sak: 74000,
      pasir_m3: 280000,
      batu_split_m3: 310000,
    },
    laborDaily: {
      pekerja: 130000,
      tukang: 170000,
      mandor: 205000,
    },
    compositeAhsp: {
      struktur_beton_lengkap_m3: 5680000,
      galian_tanah_m3: 95000,
      tiang_pancang_m: 520000,
    },
    logisticsNote: 'Biaya logistik penyeberangan feri Selat Bali/Lombok; agregat lokal tersedia dari Karangasem & Lombok Barat.',
  },

  // 7. Sumatera Utara & Aceh
  {
    provinces: ['Sumatera Utara', 'Aceh'],
    regionName: 'Sumatera Bagian Utara',
    ikkIndex: 109.8,
    materials: {
      beton_k300_m3: 1150000,
      besi_beton_kg: 15800,
      semen_50kg_sak: 76000,
      pasir_m3: 290000,
      batu_split_m3: 320000,
    },
    laborDaily: {
      pekerja: 135000,
      tukang: 175000,
      mandor: 215000,
    },
    compositeAhsp: {
      struktur_beton_lengkap_m3: 5820000,
      galian_tanah_m3: 98000,
      tiang_pancang_m: 540000,
    },
    logisticsNote: 'Didukung pabrik Semen Padang & Semen Andalas (Lhoknga), namun biaya distribusi darat Trans-Sumatera berpengaruh signifikan.',
  },

  // 8. Sumatera Tengah & Selatan (Sumbar, Riau, Jambi, Sumsel, Lampung, Bengkulu, Babel)
  {
    provinces: [
      'Sumatera Barat',
      'Riau',
      'Jambi',
      'Sumatera Selatan',
      'Lampung',
      'Bengkulu',
      'Kepulauan Bangka Belitung',
    ],
    regionName: 'Sumatera Tengah & Selatan',
    ikkIndex: 107.5,
    materials: {
      beton_k300_m3: 1140000,
      besi_beton_kg: 15500,
      semen_50kg_sak: 73000,
      pasir_m3: 275000,
      batu_split_m3: 310000,
    },
    laborDaily: {
      pekerja: 130000,
      tukang: 170000,
      mandor: 210000,
    },
    compositeAhsp: {
      struktur_beton_lengkap_m3: 5750000,
      galian_tanah_m3: 94000,
      tiang_pancang_m: 530000,
    },
    logisticsNote: 'Konektivitas Jalan Tol Trans Sumatera (JTTS) memangkas ongkos logistik semen Indarung & Baturaja ke tapak proyek.',
  },

  // 9. Kepulauan Riau (Batam, Bintan, Karimun, Natuna)
  {
    provinces: ['Kepulauan Riau'],
    regionName: 'Kepulauan Riau (FTZ Batam & Kepulauan)',
    ikkIndex: 116.5,
    materials: {
      beton_k300_m3: 1240000,
      besi_beton_kg: 16800,
      semen_50kg_sak: 82000,
      pasir_m3: 320000,
      batu_split_m3: 350000,
    },
    laborDaily: {
      pekerja: 145000,
      tukang: 185000,
      mandor: 230000,
    },
    compositeAhsp: {
      struktur_beton_lengkap_m3: 6240000,
      galian_tanah_m3: 110000,
      tiang_pancang_m: 590000,
    },
    logisticsNote: 'Karakter maritim kepulauan; semen curah & baja impor/antar pulau membutuhkan handling pelabuhan khusus.',
  },

  // 10. Kalimantan Lainnya (Kalsel, Kalbar, Kalteng, Kaltara)
  {
    provinces: ['Kalimantan Barat', 'Kalimantan Selatan', 'Kalimantan Tengah', 'Kalimantan Utara'],
    regionName: 'Kalimantan (Barat, Selatan, Tengah, Utara)',
    ikkIndex: 118.2,
    materials: {
      beton_k300_m3: 1280000,
      besi_beton_kg: 17200,
      semen_50kg_sak: 84000,
      pasir_m3: 330000,
      batu_split_m3: 370000,
    },
    laborDaily: {
      pekerja: 150000,
      tukang: 190000,
      mandor: 240000,
    },
    compositeAhsp: {
      struktur_beton_lengkap_m3: 6450000,
      galian_tanah_m3: 115000,
      tiang_pancang_m: 630000,
    },
    logisticsNote: 'Didukung pasokan Semen Conch Kalsel; ketergantungan pada transportasi tongkang sungai untuk material curah.',
  },

  // 11. Sulawesi Selatan (Makassar Hub)
  {
    provinces: ['Sulawesi Selatan'],
    regionName: 'Sulawesi Selatan (Kawasan Makassar & Pangkep)',
    ikkIndex: 108.4,
    materials: {
      beton_k300_m3: 1130000,
      besi_beton_kg: 15600,
      semen_50kg_sak: 71000,
      pasir_m3: 260000,
      batu_split_m3: 280000,
    },
    laborDaily: {
      pekerja: 130000,
      tukang: 170000,
      mandor: 210000,
    },
    compositeAhsp: {
      struktur_beton_lengkap_m3: 5690000,
      galian_tanah_m3: 92000,
      tiang_pancang_m: 520000,
    },
    logisticsNote: 'Sentra semen kawasan timur (Semen Tonasa Pangkep & Bosowa Maros); hub ekspor material ke Maluku dan Papua.',
  },

  // 12. Sulawesi Tengah (Palu & Morowali)
  {
    provinces: ['Sulawesi Tengah'],
    regionName: 'Sulawesi Tengah (Teluk Palu & Morowali)',
    ikkIndex: 114.2,
    materials: {
      beton_k300_m3: 1210000,
      besi_beton_kg: 16500,
      semen_50kg_sak: 79000,
      pasir_m3: 240000,
      batu_split_m3: 250000,
    },
    laborDaily: {
      pekerja: 140000,
      tukang: 180000,
      mandor: 225000,
    },
    compositeAhsp: {
      struktur_beton_lengkap_m3: 6050000,
      galian_tanah_m3: 105000,
      tiang_pancang_m: 570000,
    },
    logisticsNote: 'Lumbung quarry batu pecah & pasir mutu tinggi Watusampu (pemasok utama IKN), namun kawasan industri smelter memicu tekanan harga upah.',
  },

  // 13. Sulawesi Lainnya (Sulut, Sultra, Sulbar, Gorontalo)
  {
    provinces: ['Sulawesi Utara', 'Sulawesi Tenggara', 'Sulawesi Barat', 'Gorontalo'],
    regionName: 'Sulawesi Bagian Utara & Tenggara',
    ikkIndex: 116.8,
    materials: {
      beton_k300_m3: 1250000,
      besi_beton_kg: 16900,
      semen_50kg_sak: 82000,
      pasir_m3: 310000,
      batu_split_m3: 340000,
    },
    laborDaily: {
      pekerja: 145000,
      tukang: 185000,
      mandor: 230000,
    },
    compositeAhsp: {
      struktur_beton_lengkap_m3: 6280000,
      galian_tanah_m3: 110000,
      tiang_pancang_m: 600000,
    },
    logisticsNote: 'Ketergantungan pasokan semen antarpulau dari Pangkep/Kalsel dan logistik maritim Pelabuhan Bitung & Kendari.',
  },

  // 14. Nusa Tenggara Timur (Kupang, Flores, Sumba)
  {
    provinces: ['Nusa Tenggara Timur'],
    regionName: 'Nusa Tenggara Timur (Kepulauan NTT)',
    ikkIndex: 128.4,
    materials: {
      beton_k300_m3: 1420000,
      besi_beton_kg: 18500,
      semen_50kg_sak: 92000,
      pasir_m3: 380000,
      batu_split_m3: 420000,
    },
    laborDaily: {
      pekerja: 155000,
      tukang: 195000,
      mandor: 245000,
    },
    compositeAhsp: {
      struktur_beton_lengkap_m3: 7180000,
      galian_tanah_m3: 130000,
      tiang_pancang_m: 710000,
    },
    logisticsNote: 'Tingginya ongkos freight kapal kontainer dari Pelabuhan Tanjung Perak Surabaya; batu kali dan agregat lokal terbatas di pulau karang.',
  },

  // 15. Maluku & Maluku Utara (Ambon, Ternate, Halmahera)
  {
    provinces: ['Maluku', 'Maluku Utara'],
    regionName: 'Kepulauan Maluku & Maluku Utara',
    ikkIndex: 136.5,
    materials: {
      beton_k300_m3: 1550000,
      besi_beton_kg: 19800,
      semen_50kg_sak: 98000,
      pasir_m3: 420000,
      batu_split_m3: 460000,
    },
    laborDaily: {
      pekerja: 165000,
      tukang: 210000,
      mandor: 260000,
    },
    compositeAhsp: {
      struktur_beton_lengkap_m3: 7850000,
      galian_tanah_m3: 145000,
      tiang_pancang_m: 780000,
    },
    logisticsNote: 'Distribusi kepulauan terpencil dengan gelombang musiman; seluruh baja tulangan dan semen bergantung pasokan laut dari Makassar/Surabaya.',
  },

  // 16. Papua & Papua Barat (Pesisir: Jayapura, Sorong, Manokwari, Merauke)
  {
    provinces: ['Papua', 'Papua Barat', 'Papua Barat Daya', 'Papua Selatan'],
    regionName: 'Papua Pesisir & Papua Barat',
    ikkIndex: 165.2,
    materials: {
      beton_k300_m3: 1980000,
      besi_beton_kg: 23500,
      semen_50kg_sak: 135000,
      pasir_m3: 580000,
      batu_split_m3: 640000,
    },
    laborDaily: {
      pekerja: 210000,
      tukang: 260000,
      mandor: 320000,
    },
    compositeAhsp: {
      struktur_beton_lengkap_m3: 10250000,
      galian_tanah_m3: 185000,
      tiang_pancang_m: 1050000,
    },
    logisticsNote: 'Didukung pabrik Semen Conch Manokwari, namun biaya angkutan laut jarak jauh dan minimnya alat berat lokal mendongkrak AHSP.',
  },

  // 17. Papua Pegunungan & Papua Tengah (Pedalaman / Wamena / Jayawijaya)
  {
    provinces: ['Papua Pegunungan', 'Papua Tengah'],
    regencyKeywords: ['wamena', 'jayawijaya', 'nabire', 'timika', 'paniai', 'puncak', 'nduga', 'yahukimo', 'tolikara'],
    regionName: 'Papua Pegunungan & Pedalaman',
    ikkIndex: 238.4,
    materials: {
      beton_k300_m3: 3200000,
      besi_beton_kg: 34000,
      semen_50kg_sak: 240000,
      pasir_m3: 950000,
      batu_split_m3: 1100000,
    },
    laborDaily: {
      pekerja: 275000,
      tukang: 350000,
      mandor: 450000,
    },
    compositeAhsp: {
      struktur_beton_lengkap_m3: 15800000,
      galian_tanah_m3: 260000,
      tiang_pancang_m: 1650000,
    },
    logisticsNote: 'IKK tertinggi di Indonesia; material semen dan besi diangkut menggunakan pesawat kargo perintis Hercules/Cessna Caravan dari Timika atau Jayapura.',
  },
];

/**
 * Resolves the regional cost benchmark and AHSP analysis based on project location.
 */
export function getProjectRegionalCost(
  province?: string | null,
  regency?: string | null,
  projectName?: string | null
): RegionalCostAnalysis {
  const normProvince = (province || '').trim().toLowerCase();
  const normRegency = (regency || '').trim().toLowerCase();
  const normName = (projectName || '').trim().toLowerCase();

  let matchedEntry: RegionalCostEntry | null = null;

  // 1. Check specific regency keywords first (IKN/Sepaku, Papua Pegunungan/Wamena)
  for (const entry of REGIONAL_COST_TABLE) {
    if (entry.regencyKeywords) {
      const matchesKeyword = entry.regencyKeywords.some(
        (kw) => normRegency.includes(kw) || normName.includes(kw)
      );
      if (matchesKeyword) {
        matchedEntry = entry;
        break;
      }
    }
  }

  // 2. Fall back to province matching
  if (!matchedEntry && normProvince) {
    for (const entry of REGIONAL_COST_TABLE) {
      const matchesProv = entry.provinces.some((p) => {
        const pLower = p.toLowerCase();
        return normProvince.includes(pLower) || pLower.includes(normProvince);
      });
      if (matchesProv && !entry.regencyKeywords) {
        matchedEntry = entry;
        break;
      }
    }
  }

  // 3. National baseline default (IKK 100.0)
  const entry: RegionalCostEntry = matchedEntry || {
    provinces: ['Indonesia'],
    regionName: 'Rata-Rata Baseline Nasional',
    ikkIndex: 100.0,
    materials: {
      beton_k300_m3: 1080000,
      besi_beton_kg: 15200,
      semen_50kg_sak: 72000,
      pasir_m3: 260000,
      batu_split_m3: 290000,
    },
    laborDaily: {
      pekerja: 130000,
      tukang: 170000,
      mandor: 210000,
    },
    compositeAhsp: {
      struktur_beton_lengkap_m3: 5500000,
      galian_tanah_m3: 90000,
      tiang_pancang_m: 500000,
    },
    logisticsNote: 'Baseline indeks harga konstruksi rata-rata nasional per pedoman AHSP Kementerian PUPR.',
  };

  const diffPercent = Math.round(((entry.ikkIndex - JAWA_BASELINE_IKK) / JAWA_BASELINE_IKK) * 100);
  const diffSign = diffPercent > 0 ? `+${diffPercent}%` : `${diffPercent}%`;
  const diffText = `${diffSign} vs Baseline Jawa`;

  // Categorize badge color per requirement:
  // Green (< 100): "Biaya Rendah / Efisien"
  // Blue (100–115): "Biaya Standar"
  // Amber (115–135): "Biaya Sedang-Tinggi"
  // Red (> 135): "Kemahalan Sangat Tinggi"
  let severity: 'low' | 'standard' | 'high' | 'very_high';
  let badgeLabel: string;
  let badgeColorClass: string;
  let badgeBgClass: string;

  if (entry.ikkIndex < 100) {
    severity = 'low';
    badgeLabel = 'Biaya Rendah (Efisien)';
    badgeColorClass = 'text-emerald-300 border-emerald-500/60 bg-emerald-950/40';
    badgeBgClass = 'bg-emerald-500';
  } else if (entry.ikkIndex <= 115) {
    severity = 'standard';
    badgeLabel = 'Biaya Standar Nasional';
    badgeColorClass = 'text-sky-300 border-sky-500/60 bg-sky-950/40';
    badgeBgClass = 'bg-sky-500';
  } else if (entry.ikkIndex <= 135) {
    severity = 'high';
    badgeLabel = 'Biaya Sedang-Tinggi';
    badgeColorClass = 'text-amber-300 border-amber-500/60 bg-amber-950/40';
    badgeBgClass = 'bg-amber-500';
  } else {
    severity = 'very_high';
    badgeLabel = 'Kemahalan Tinggi (Remote/Papua)';
    badgeColorClass = 'text-rose-300 border-rose-500/60 bg-rose-950/40';
    badgeBgClass = 'bg-rose-500';
  }

  return {
    regionName: entry.regionName,
    provinceName: province || 'Nasional',
    ikkIndex: entry.ikkIndex,
    diffPercent,
    diffText,
    badgeLabel,
    badgeColorClass,
    badgeBgClass,
    severity,
    materials: entry.materials,
    laborDaily: entry.laborDaily,
    compositeAhsp: entry.compositeAhsp,
    logisticsNote: entry.logisticsNote,
  };
}
