/**
 * Regional Rainfall & Climate Dataset for Indonesian Construction Sites
 * Data source: Badan Meteorologi, Klimatologi, dan Geofisika (BMKG) Climate Normals
 */

export type RainfallSeverity = 'low' | 'moderate' | 'high' | 'very_high';

export interface RainfallMitigationItem {
  icon: string;
  title: string;
  desc: string;
}

export interface RainfallAnalysis {
  provinceName: string;
  annualMm: number;
  annualRangeText: string;
  severity: RainfallSeverity;
  badgeLabel: string;
  badgeColorClass: string;
  badgeBgClass: string;
  peakSeasonMonths: string;
  climateZone: string;
  summaryGuidance: string;
  mitigations: RainfallMitigationItem[];
}

interface RegionalClimateEntry {
  provinces: string[];
  regencyKeywords?: string[];
  annualMm: number;
  annualRangeText: string;
  peakSeasonMonths: string;
  climateZone: string;
  notes?: string;
}

const REGIONAL_CLIMATE_TABLE: RegionalClimateEntry[] = [
  // Special Microclimate: Bogor & surrounding volcanic slopes
  {
    provinces: ['Jawa Barat'],
    regencyKeywords: ['bogor', 'kota bogor', 'kabupaten bogor', 'depok'],
    annualMm: 4100,
    annualRangeText: '3,800 – 4,500 mm/tahun',
    peakSeasonMonths: 'Desember – Februari & April',
    climateZone: 'Tropis Basah Sangat Tinggi (Orographic Rain Belt)',
    notes: 'Wilayah dengan intensitas petir dan frekuensi hujan tertinggi di Pulau Jawa (Kota Hujan).',
  },
  // Special Microclimate: Palu Valley (Rain shadow valley)
  {
    provinces: ['Sulawesi Tengah'],
    regencyKeywords: ['palu', 'kota palu', 'donggala', 'sigi'],
    annualMm: 950,
    annualRangeText: '800 – 1,100 mm/tahun',
    peakSeasonMonths: 'Desember – Februari (Hujan Singkat)',
    climateZone: 'Semiarid / Lembah Bayangan Hujan (Rain Shadow)',
    notes: 'Lembah Palu dikelilingi pegunungan tinggi sehingga memiliki curah hujan terendah di Indonesia.',
  },
  // Special Microclimate: IKN Nusantara & Sepaku
  {
    provinces: ['Kalimantan Timur'],
    regencyKeywords: ['ikn', 'sepaku', 'penajam', 'balikpapan', 'samarinda'],
    annualMm: 2800,
    annualRangeText: '2,500 – 3,200 mm/tahun',
    peakSeasonMonths: 'Hujan Merata Sepanjang Tahun (Puncak: Nov – Jan & Mar – Mei)',
    climateZone: 'Hutan Hujan Tropis Ekuatorial Basah',
    notes: 'Kondisi tanah lempung ekspansif/shale Formasi Balikpapan rentan kehilangan daya dukung saat jenuh air.',
  },
  // Jawa Barat & Banten
  {
    provinces: ['Jawa Barat', 'Banten'],
    annualMm: 3300,
    annualRangeText: '3,000 – 4,200 mm/tahun',
    peakSeasonMonths: 'Desember – Februari',
    climateZone: 'Monsun Tropis Sangat Basah',
  },
  // DKI Jakarta
  {
    provinces: ['DKI Jakarta'],
    annualMm: 2150,
    annualRangeText: '1,800 – 2,400 mm/tahun',
    peakSeasonMonths: 'Januari – Februari',
    climateZone: 'Monsun Tropis Dataran Rendah Pesisir',
  },
  // Jawa Tengah, Jawa Timur, D.I. Yogyakarta
  {
    provinces: ['Jawa Tengah', 'Jawa Timur', 'DI Yogyakarta', 'D.I. Yogyakarta'],
    annualMm: 2200,
    annualRangeText: '1,800 – 2,500 mm/tahun',
    peakSeasonMonths: 'Desember – Februari',
    climateZone: 'Monsun Tropis Sedang',
  },
  // Aceh, Sumut, Sumbar
  {
    provinces: ['Aceh', 'Sumatera Utara', 'Sumatera Barat'],
    annualMm: 3100,
    annualRangeText: '2,600 – 3,600 mm/tahun',
    peakSeasonMonths: 'Oktober – Desember',
    climateZone: 'Ekuatorial Basah Pesisir Barat Bukit Barisan',
  },
  // Riau, Jambi, Sumsel, Kep. Bangka Belitung, Bengkulu, Lampung
  {
    provinces: ['Riau', 'Jambi', 'Sumatera Selatan', 'Kepulauan Bangka Belitung', 'Bengkulu', 'Lampung'],
    annualMm: 2550,
    annualRangeText: '2,200 – 2,850 mm/tahun',
    peakSeasonMonths: 'November – Januari',
    climateZone: 'Ekuatorial Sedang–Tinggi',
  },
  // Kalimantan Timur, Kalbar, Kalteng, Kalsel, Kaltara
  {
    provinces: ['Kalimantan Timur', 'Kalimantan Barat', 'Kalimantan Tengah', 'Kalimantan Selatan', 'Kalimantan Utara'],
    annualMm: 2850,
    annualRangeText: '2,400 – 3,200 mm/tahun',
    peakSeasonMonths: 'Hujan Merata (Puncak: Nov – Jan & Mar – Mei)',
    climateZone: 'Hutan Hujan Tropis Ekuatorial',
  },
  // Sulawesi Selatan & Tenggara
  {
    provinces: ['Sulawesi Selatan', 'Sulawesi Tenggara', 'Sulawesi Barat'],
    annualMm: 2600,
    annualRangeText: '2,200 – 3,000 mm/tahun',
    peakSeasonMonths: 'Desember – Maret',
    climateZone: 'Monsun Ekuatorial Basah',
  },
  // Sulawesi Utara, Gorontalo, Sulteng (general)
  {
    provinces: ['Sulawesi Utara', 'Gorontalo', 'Sulawesi Tengah'],
    annualMm: 2300,
    annualRangeText: '1,900 – 2,600 mm/tahun',
    peakSeasonMonths: 'November – Februari',
    climateZone: 'Monsun Tropis Sedang',
  },
  // NTT & NTB
  {
    provinces: ['Nusa Tenggara Timur', 'Nusa Tenggara Barat'],
    annualMm: 1350,
    annualRangeText: '1,000 – 1,600 mm/tahun',
    peakSeasonMonths: 'Desember – Februari (Kemarau Panjang 7–9 Bulan)',
    climateZone: 'Savana Tropis Kering / Monsun Pendek',
  },
  // Papua & Maluku
  {
    provinces: [
      'Papua',
      'Papua Barat',
      'Papua Pegunungan',
      'Papua Selatan',
      'Papua Tengah',
      'Papua Barat Daya',
      'Maluku',
      'Maluku Utara',
    ],
    annualMm: 3400,
    annualRangeText: '2,800 – 4,200 mm/tahun',
    peakSeasonMonths: 'Desember – Maret & Juli',
    climateZone: 'Tropis Super Basah Pegunungan & Kepulauan',
  },
];

/**
 * Evaluates the hydrometeorological profile and engineering mitigation requirements
 * based on province, regency, and project details.
 */
export function getProjectRainfallAnalysis(
  province?: string | null,
  regency?: string | null,
  projectName?: string | null
): RainfallAnalysis {
  const normProvince = (province || '').trim().toLowerCase();
  const normRegency = (regency || '').trim().toLowerCase();
  const normName = (projectName || '').trim().toLowerCase();

  let matchedEntry: RegionalClimateEntry | null = null;

  // 1. Check specific microclimate regency keywords first (Bogor, Palu, IKN/Sepaku)
  for (const entry of REGIONAL_CLIMATE_TABLE) {
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
    for (const entry of REGIONAL_CLIMATE_TABLE) {
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

  // 3. National fallback default (~2,400 mm/year)
  const entry = matchedEntry || {
    provinces: ['Indonesia'],
    annualMm: 2400,
    annualRangeText: '2,000 – 2,800 mm/tahun',
    peakSeasonMonths: 'November – Februari',
    climateZone: 'Monsun Tropis Indonesia',
  };

  const annualMm = entry.annualMm;

  // Severity categorization per requirement:
  // Green (< 1,500 mm): "Curah Hujan Rendah"
  // Blue (1,500–2,500 mm): "Curah Hujan Sedang"
  // Amber (2,500–3,500 mm): "Curah Hujan Tinggi"
  // Red (> 3,500 mm): "Curah Hujan Sangat Tinggi"
  let severity: RainfallSeverity;
  let badgeLabel: string;
  let badgeColorClass: string;
  let badgeBgClass: string;
  let summaryGuidance: string;
  let mitigations: RainfallMitigationItem[];

  if (annualMm < 1500) {
    severity = 'low';
    badgeLabel = 'Curah Hujan Rendah';
    badgeColorClass = 'text-emerald-300 border-emerald-500/60 bg-emerald-950/40';
    badgeBgClass = 'bg-emerald-500';
    summaryGuidance =
      'Kondisi tapak kering dengan penguapan tinggi. Risiko genangan rendah, namun membutuhkan proteksi retak susut beton dan kontrol debu.';
    mitigations = [
      {
        icon: '💨',
        title: 'Dust Suppression & Kontrol Debu Akses',
        desc: 'Jadwalkan penyiraman air (water truck) berkala pada jalan akses tanah dan stockpile agregat untuk memenuhi baku mutu AMDAL/RKL-RPL.',
      },
      {
        icon: '💧',
        title: 'Manajemen Air Curing & Anti-Retak Plastis',
        desc: 'Sediakan tandon air cadangan khusus curing beton. Aplikasikan curing compound atau penutup goni basah segera setelah finishing guna mencegah plastic shrinkage cracking.',
      },
      {
        icon: '🚜',
        title: 'Kontrol Kadar Air Optimum (OMC) Subgrade',
        desc: 'Penguapan cepat menyebabkan tanah timbunan di bawah OMC. Tambahkan sprinkling air pada lintasan compactor saat pekerjaan subgrade jalan.',
      },
    ];
  } else if (annualMm <= 2500) {
    severity = 'moderate';
    badgeLabel = 'Curah Hujan Sedang';
    badgeColorClass = 'text-sky-300 border-sky-500/60 bg-sky-950/40';
    badgeBgClass = 'bg-sky-500';
    summaryGuidance =
      'Karakteristik monsun tropis reguler. Pekerjaan tanah optimal pada April–Oktober, dengan mitigasi genangan terfokus pada bulan puncak musim hujan.';
    mitigations = [
      {
        icon: '🌊',
        title: 'Drainase Perimeter & Sump Pit Primer',
        desc: 'Buat saluran keliling (cut-off drain) tapak dengan kemiringan min. 1.5% dan sediakan pompa dewatering submersible 25–50 m³/jam untuk titik galian fondasi.',
      },
      {
        icon: '🏗️',
        title: 'Proteksi Gudang Semen & Stockpile Agregat',
        desc: 'Penyimpanan semen sak wajib di atas palet kayu min. 15 cm dari lantai dengan terpal kedap air. Lindungi gradasi pasir dengan penutup terpal saat hujan lebat.',
      },
      {
        icon: '📅',
        title: 'Sinkronisasi Jadwal Earthwork Kritis',
        desc: 'Selesaikan pekerjaan galian tanah dalam, bored pile, dan timbunan subgrade utama sebelum memasuki puncak musim hujan (Des – Feb).',
      },
    ];
  } else if (annualMm <= 3500) {
    severity = 'high';
    badgeLabel = 'Curah Hujan Tinggi';
    badgeColorClass = 'text-amber-300 border-amber-500/60 bg-amber-950/40';
    badgeBgClass = 'bg-amber-500';
    summaryGuidance =
      'Paparan presipitasi lebat berkala. Membutuhkan kapasitas pompa dewatering kontinyu, proteksi longsor lereng galian, dan tenda pengecoran beton.';
    mitigations = [
      {
        icon: '⚡',
        title: 'Kapasitas Pompa Dewatering Siaga & Genset Cadangan',
        desc: 'Siagakan pompa lumpur/submersible ganda (kapasitas min. 75–120 m³/jam) dengan genset silent backup di area galian basement/pier fondasi untuk mencegah flooding.',
      },
      {
        icon: '⛰️',
        title: 'Stabilisasi Lereng Galian & Terpal Geotekstil',
        desc: 'Tutup lereng tanah galian terbuka dengan terpal tebal / woven geotextile dan pasang terasering sementara untuk mencegah erosi alur dan kelongsoran dinding galian.',
      },
      {
        icon: '⛺',
        title: 'Shelter Proteksi Pengecoran Mass Concrete',
        desc: 'Siapkan rangka tenda kanopi hujan (rain shelter canopy) di atas area pengecoran pelat/balok struktur guna menjaga rasio air-semen (w/c ratio) tidak rusak akibat air hujan.',
      },
      {
        icon: '🚧',
        title: 'Sediment Trap & Kolam Olakan Lingkungan',
        desc: 'Wajib membuat kolam pengendap sedimen (sediment basin) bertingkat sebelum air limpasan dialirkan ke badan sungai atau saluran kota di luar proyek.',
      },
    ];
  } else {
    severity = 'very_high';
    badgeLabel = 'Curah Hujan Sangat Tinggi';
    badgeColorClass = 'text-rose-300 border-rose-500/60 bg-rose-950/40';
    badgeBgClass = 'bg-rose-500';
    summaryGuidance =
      'Zona hidrologi ekstrem dengan presipitasi tahunan > 3,500 mm. Diperlukan sistem pengendalian air tanah aktif (wellpoint/deep well), shoring kokoh, dan antisipasi flash flood.';
    mitigations = [
      {
        icon: '🚨',
        title: 'Dewatering Sistem Wellpoint & Pompa Sentrifugal Otomatis',
        desc: 'Terapkan dewatering aktif (wellpoint / deep well) terintegrasi sensor otomatis pelampung dengan redundansi pompa 100% untuk galian basah bertekanan air pori tinggi.',
      },
      {
        icon: '🛡️',
        title: 'Perkuatan Shoring / Sheet Pile & Shotcrete Lereng',
        desc: 'Dinding galian curam wajib diperkuat dengan sheet pile baja ber-strutting atau soil nailing dengan lapisan shotcrete kawat anyam (wiremesh) anti-longsor.',
      },
      {
        icon: '🌧️',
        title: 'Protokol Stop Pengecoran & Admixture Anti-Washout',
        desc: 'Gunakan admixture water-reducing retarder / anti-washout saat penuangan beton basah, dan terapkan SOP penghentian pengecoran bila intensitas hujan melampaui 20 mm/jam.',
      },
      {
        icon: '🚜',
        title: 'Perkuatan Akses Hauling Road (Geogrid + Agregat Kasar)',
        desc: 'Lapis jalan kerja alat berat dengan geogrid biaxial dan batu belah/agregat kelas B tebal 30 cm untuk mencegah truk mixer dan crane amblas di tanah lembek jenuh air.',
      },
    ];
  }

  return {
    provinceName: province || 'Nasional',
    annualMm,
    annualRangeText: entry.annualRangeText,
    severity,
    badgeLabel,
    badgeColorClass,
    badgeBgClass,
    peakSeasonMonths: entry.peakSeasonMonths,
    climateZone: entry.climateZone,
    summaryGuidance,
    mitigations,
  };
}
