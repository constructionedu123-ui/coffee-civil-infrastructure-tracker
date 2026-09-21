/**
 * Geotechnical Soil Profile & Foundation Engineering Database
 * Standard: SNI 1726 (Tata Cara Perencanaan Ketahanan Gempa untuk Struktur Gedung)
 * & Peta Geologi Lembar Indonesia (Pusat Survei Geologi / ESDM)
 */

export type SniSiteClass = 'SE' | 'SD' | 'SC' | 'SB';
export type LiquefactionRisk = 'Tinggi' | 'Sedang' | 'Rendah';

export interface GeotechProfileAnalysis {
  regionName: string;
  provinceName: string;
  soilClassification: string;
  sniSiteClass: SniSiteClass;
  sniSiteClassLabel: string;
  siteClassColorClass: string;
  siteClassBgClass: string;
  hardSoilDepth: string;
  liquefactionRisk: LiquefactionRisk;
  liquefactionColorClass: string;
  geologicalFormation: string;
  keyGeotechHazards: string[];
  recommendedFoundation: string;
  groundImprovement: string;
  engineeringAdvice: string;
}

interface RegionalGeotechEntry {
  provinces: string[];
  regencyKeywords?: string[];
  regionName: string;
  soilClassification: string;
  sniSiteClass: SniSiteClass;
  hardSoilDepth: string;
  liquefactionRisk: LiquefactionRisk;
  geologicalFormation: string;
  keyGeotechHazards: string[];
  recommendedFoundation: string;
  groundImprovement: string;
  engineeringAdvice: string;
}

const REGIONAL_GEOTECH_TABLE: RegionalGeotechEntry[] = [
  // 1. Pantura Jawa / Endapan Aluvial & Delta Pantai
  {
    provinces: ['DKI Jakarta', 'Jakarta', 'Banten', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur'],
    regencyKeywords: [
      'pantura',
      'jakarta utara',
      'tanjung priok',
      'muara baru',
      'pluit',
      'ancol',
      'bekasi',
      'karawang',
      'subang',
      'indramayu',
      'cirebon',
      'brebes',
      'tegal',
      'pekalongan',
      'semarang',
      'demak',
      'kudus',
      'pati',
      'surabaya',
      'sidoarjo',
      'gresik',
      'lamongan',
      'pasuruan',
    ],
    regionName: 'Dataran Aluvium Pantai & Delta Pantura Jawa',
    soilClassification: 'Tanah Lunak Aluvial & Lempung Pantai (Marine Clay)',
    sniSiteClass: 'SE',
    hardSoilDepth: '28 – 42 meter',
    liquefactionRisk: 'Sedang',
    geologicalFormation: 'Endapan Aluvium Pantai & Delta Kuarter (Holosen)',
    keyGeotechHazards: [
      'Potensi penurunan konsolidasi tanah lunak (settlement) jangka panjang yang sangat besar.',
      'Daya dukung lateral tiang (lateral soil resistance) sangat rendah pada kedalaman 0–18 meter.',
      'Penurunan muka tanah regional (land subsidence) aktif akibat ekstraksi air tanah intensif.',
      'Paparan air asin payau yang agresif memicu korosi ion klorida pada tulangan pondasi.',
    ],
    recommendedFoundation:
      'Pondasi Tiang Pancang Spun Pile Ø500–600 atau Bored Pile Dalam (> 30 m) bertumpu pada lapisan pasir keras/konglomerat Formasi Damar/Pucangan.',
    groundImprovement:
      'Percepatan konsolidasi tanah dasar dengan PVD (Prefabricated Vertical Drain) + Vacuum Preloading untuk timbunan jalan; semen tahan sulfat Tipe V.',
    engineeringAdvice:
      'Wajib uji Cone Penetration Test (CPTu) dengan disipasi pori dan evaluasi efek negative skin friction (dragload) akibat penurunan tanah.',
  },

  // 2. IKN Nusantara & Kalimantan Timur (Clay Shale / Formasi Balikpapan)
  {
    provinces: ['Kalimantan Timur'],
    regencyKeywords: ['ikn', 'sepaku', 'penajam', 'balikpapan', 'samarinda', 'kutai kartanegara', 'samboja'],
    regionName: 'IKN Nusantara & Kalimantan Timur',
    soilClassification: 'Clay Shale / Batulempung Ekspansif (Formasi Balikpapan / Kampungbaru)',
    sniSiteClass: 'SD',
    hardSoilDepth: '14 – 24 meter',
    liquefactionRisk: 'Rendah',
    geologicalFormation: 'Formasi Balikpapan & Formasi Kampungbaru (Miosen Akhir – Pliosen)',
    keyGeotechHazards: [
      'Fenomena slaking ekstrem: clay shale yang tampak keras saat digali akan melunak drastis menjadi lumpur saat terpapar udara dan air.',
      'Potensi swelling (kembang-susut) tinggi yang menimbulkan daya angkat pada pelat lantai dan perkerasan kaku.',
      'Bidang gelincir lereng alami (residual shear strength rendah) pada perbukitan formasi sedimen tersier.',
    ],
    recommendedFoundation:
      'Pondasi Bored Pile dengan selubung (casing) permanen atau tiang pancang baja yang dipancang menembus lapisan unweathered bedrock.',
    groundImprovement:
      'Proteksi galian terbuka seketika dengan shotcrete bertulang wiremesh (< 2 jam); perkuatan lereng bertingkat menggunakan soil nailing dan sub-surface horizontal drains.',
    engineeringAdvice:
      'Jangan biarkan dasar galian terendam air hujan. Segera cor lean concrete (lantai kerja) setebal min. 10 cm begitu elevasi rencana tercapai.',
  },

  // 3. Lahan Gambut & Rawa Aluvial (Riau, Jambi, Sumsel, Kalteng, Kalbar, Kalsel)
  {
    provinces: [
      'Riau',
      'Jambi',
      'Sumatera Selatan',
      'Kalimantan Tengah',
      'Kalimantan Barat',
      'Kalimantan Selatan',
      'Kepulauan Bangka Belitung',
    ],
    regencyKeywords: [
      'gambut',
      'rawa',
      'palembang',
      'banyuasin',
      'ogan ilir',
      'siak',
      'dumai',
      'bengkalis',
      'pelalawan',
      'sampit',
      'palangkaraya',
      'pontianak',
      'kubu raya',
      'banjarmasin',
      'barito',
    ],
    regionName: 'Dataran Gambut & Rawa Aluvial Organik',
    soilClassification: 'Lahan Gambut Tebal (Peat Soil) & Endapan Rawa Organik Aluvial',
    sniSiteClass: 'SE',
    hardSoilDepth: '28 – 45 meter',
    liquefactionRisk: 'Rendah',
    geologicalFormation: 'Endapan Organik Gambut & Alluvium Rawa Dataran Rendah',
    keyGeotechHazards: [
      'Kompresibilitas sangat tinggi dengan penurunan sekunder (creep settlement) yang berlangsung bertahun-tahun.',
      'Kondisi air tanah sangat asam (pH 3.0 – 4.5) yang korosif agresif terhadap baja dan pasta semen.',
      'Daya dukung tanah dasar sangat rendah (CBR < 1%) rentan terhadap keruntuhan geser bearing capacity.',
    ],
    recommendedFoundation:
      'Pondasi Tiang Pancang Dalam menembus lapisan gambut dan lempung lunak hingga dasar tanah keras; alternatif Slab-on-Pile untuk timbunan jalan raya.',
    groundImprovement:
      'Konstruksi cerucuk matras bambu 3 lapis + geotekstil woven komposit untuk struktur beban ringan; penggunaan semen pozzolan/fly-ash tahan asam.',
    engineeringAdvice:
      'Pertahankan muka air tanah alami di sekitar tapak agar gambut tidak mengering, teroksidasi, dan menyusut permanen.',
  },

  // 4. Jalur Busur Vulkanik & Pegunungan Jawa (Bogor, Bandung, Malang, Sleman, Merapi)
  {
    provinces: ['Jawa Barat', 'Jawa Tengah', 'DI Yogyakarta', 'D.I. Yogyakarta', 'Jawa Timur'],
    regencyKeywords: [
      'bogor',
      'bandung',
      'garut',
      'sukabumi',
      'cianjur',
      'sumedang',
      'tasikmalaya',
      'malang',
      'batu',
      'magelang',
      'sleman',
      'gunungkidul',
      'boyolali',
      'salatiga',
      'wonosobo',
    ],
    regionName: 'Jalur Busur Vulkanik & Kaki Gunungapi Jawa',
    soilClassification: 'Tuff Vulkanik, Breksi Laharik & Lempung Pasiran (Volcanic Soil)',
    sniSiteClass: 'SD',
    hardSoilDepth: '8 – 18 meter',
    liquefactionRisk: 'Rendah',
    geologicalFormation: 'Batuan Gunungapi Kuarter Muda (Breksi, Aglomerat, Tuff & Lahar)',
    keyGeotechHazards: [
      'Risiko gerakan tanah dan longsoran lereng terjal (slope failure / debris slide) saat curah hujan tinggi.',
      'Keberadaan batu bongkah lahar (boulder) terpendam yang berpotensi menghalangi penetrasi tiang pancang standar.',
      'Lapisan lempung vulkanik residual yang rentan mengalami penurunan kekuatan saat jenuh air.',
    ],
    recommendedFoundation:
      'Pondasi Telapak / Raft Foundation pada lapisan tuff padat dangkal, atau Bored Pile bila beban kolom tinggi dan terdapat lapisan boulder.',
    groundImprovement:
      'Perkuatan dinding lereng dengan retaining wall cantilever, bronjong (gabion) di kaki lereng, serta sistem drainase terasering lereng.',
    engineeringAdvice:
      'Lakukan geolistrik resistivitas 2D sebelum pemancangan tiang untuk memetakan sebaran batuan bongkah (boulder) laharik.',
  },

  // 5. Lembah Palu & Zona Sesar Palu-Koro (Sulawesi Tengah)
  {
    provinces: ['Sulawesi Tengah'],
    regencyKeywords: ['palu', 'sigi', 'donggala', 'petobo', 'balaroa', 'jono oge', 'poso'],
    regionName: 'Lembah Palu & Zona Patahan Aktif Palu-Koro',
    soilClassification: 'Alluvium Pasiran Lepas & Kerikil Lembah Tektonik (Zona Sesar Aktif)',
    sniSiteClass: 'SD',
    hardSoilDepth: '12 – 22 meter',
    liquefactionRisk: 'Tinggi',
    geologicalFormation: 'Alluvium Lembah Sungai Tektonik Kuarter & Koluvium Kaki Perbukitan',
    keyGeotechHazards: [
      'Kerentanan likuifaksi masif (flow liquefaction) sangat tinggi pada lapisan pasir jenuh air saat gempa bumi berkekuatan Mw > 6.0.',
      'Pergeseran lateral tanah (lateral spreading) dan potensi sesar permukaan (surface rupture).',
      'Lapisan pasir halus-sedang dengan nilai tahanan konus (qc) dan N-SPT < 10 pada kedalaman 0–12 meter.',
    ],
    recommendedFoundation:
      'Pondasi Tiang Pancang Precast dengan sambungan daktal khusus yang dipancang menembus lapisan dense gravel / bedrock (kedalaman > 18 m).',
    groundImprovement:
      'Kompaksi getar (Vibro-flotation / Stone Columns) untuk memadatkan formasi pasir lepas; hindari sama sekali pondasi dangkal di zona merah likuifaksi.',
    engineeringAdvice:
      'Wajib melakukan uji Cyclic Triaxial / DSS (Direct Simple Shear) untuk memverifikasi rasio tegangan siklik (CSR vs CRR) terhadap gempa rencana.',
  },

  // 6. Formasi Karst / Batugamping (Tuban, Gunungkidul, Maros, NTT)
  {
    provinces: ['Nusa Tenggara Timur', 'Sulawesi Selatan', 'Jawa Timur', 'DI Yogyakarta'],
    regencyKeywords: [
      'karst',
      'tuban',
      'maros',
      'pangkep',
      'gunungkidul',
      'wonosari',
      'kupang',
      'sumba',
      'timor',
      'flores',
      'madura',
      'rote',
    ],
    regionName: 'Perbukitan Karst & Batugamping Terumbu',
    soilClassification: 'Formasi Karst, Batugamping Terumbu & Tanah Residu Terra Rossa',
    sniSiteClass: 'SC',
    hardSoilDepth: '3 – 8 meter',
    liquefactionRisk: 'Rendah',
    geologicalFormation: 'Batugamping Terumbu & Kalsit Formasi Wonosari / Tonasa / Paciran (Miosen)',
    keyGeotechHazards: [
      'Rongga bawah tanah tersembunyi (karst cavities / sinkholes) yang rentan runtuh tiba-tiba di bawah beban fondasi.',
      'Profil batuan dasar (rockhead) sangat tidak merata dengan tonjolan tajam (pinnacles).',
      'Daya serap air tinggi melalui rekahan (fissures) yang mempercepat pelarutan batuan karbonat.',
    ],
    recommendedFoundation:
      'Pondasi Telapak Lebar (Mat/Raft Foundation) pada batuan gamping masif, atau Micropile dengan casing bertulang yang diinjeksi semen (grouting).',
    groundImprovement:
      'Cavity filling via permeation grouting bertekanan untuk menutup rongga karst di bawah tapak pondasi bangunan.',
    engineeringAdvice:
      'Wajib survei geofisika Micro-Gravity atau Ground Penetrating Radar (GPR) grid rapat untuk mendeteksi gua dan rongga karst tak terlihat.',
  },

  // 7. Pegunungan Papua & Pesisir (Papua, Papua Pegunungan, Papua Tengah)
  {
    provinces: ['Papua', 'Papua Pegunungan', 'Papua Tengah', 'Papua Barat', 'Papua Barat Daya', 'Papua Selatan'],
    regencyKeywords: ['wamena', 'timika', 'mimika', 'jayapura', 'nabire', 'jayawijaya', 'puncak', 'paniai', 'merauke'],
    regionName: 'Papua Pegunungan & Dataran Aluvial Pesisir',
    soilClassification: 'Endapan Glasial/Aluvial Kerikilan & Batuan Metamorf Terlipat',
    sniSiteClass: 'SC',
    hardSoilDepth: '4 – 14 meter',
    liquefactionRisk: 'Sedang',
    geologicalFormation: 'Endapan Koluvium Glasial Kuarter & Kompleks Batuan Metamorfik',
    keyGeotechHazards: [
      'Kandungan batu bongkah (boulder) keras berukuran besar yang menyulitkan penetrasi tiang pancang.',
      'Kondisi topografi lereng terjal rawan longsoran batu (rockfall) saat gempa dan hujan lebat.',
      'Pada kawasan pesisir rawa selatan (Timika/Merauke/Asmat): endapan lumpur lunak sangat tebal.',
    ],
    recommendedFoundation:
      'Pondasi Telapak pada batuan kompeten pegunungan; Tiang Pancang Baja Pipa / H-Beam berat di area rawa pesisir.',
    groundImprovement:
      'Jaring kawat baja proteksi tebing (rockfall drapery mesh) dan stabilisasi timbunan dengan geogrid uniaxial.',
    engineeringAdvice:
      'Perhatikan pengaruh perbedaan elevasi ekstrem terhadap tekanan tanah lateral dan stabilitas global lereng (global slope stability).',
  },

  // 8. Sumatera Bagian Utara & Barat (Aceh, Sumut, Sumbar)
  {
    provinces: ['Aceh', 'Sumatera Utara', 'Sumatera Barat'],
    regionName: 'Lajur Pegunungan Bukit Barisan & Pesisir Barat Sumatera',
    soilClassification: 'Lempung Pasiran Residual & Endapan Pantai Pasiran (Zona Subduksi Megathrust)',
    sniSiteClass: 'SD',
    hardSoilDepth: '12 – 22 meter',
    liquefactionRisk: 'Sedang',
    geologicalFormation: 'Sedimen Tersier Terlipat & Vulkanik Bukit Barisan',
    keyGeotechHazards: [
      'Guncangan seismik tinggi akibat interaksi Megathrust Sumatera dan Sesar Besar Sumatera (Great Sumatran Fault).',
      'Risiko likuifaksi lokal pada pasir pantai jenuh air dangkal.',
      'Ketebalan tanah lapuk (residual soil) di lereng Bukit Barisan yang rentan rayapan (creep).',
    ],
    recommendedFoundation:
      'Pondasi Tiang Pancang Spun Pile / Bored Pile bertulang gempa daktal penuh dengan kedalaman mencapai lapisan batuan induk.',
    groundImprovement:
      'Pemasangan retaining wall tie-back ground anchor di area lereng berbukit dan cerucuk stabilitas galian.',
    engineeringAdvice:
      'Analisis interaksi tanah-struktur (Soil-Structure Interaction / SSI) wajib memperhitungkan spektrum percepatan gempa MCEr SNI 1726.',
  },

  // 9. Sulawesi Bagian Selatan & Tenggara (Makassar, Kendari, Sulut)
  {
    provinces: ['Sulawesi Selatan', 'Sulawesi Tenggara', 'Sulawesi Utara', 'Sulawesi Barat', 'Gorontalo'],
    regionName: 'Kawasan Pesisir & Perbukitan Sulawesi',
    soilClassification: 'Lempung Berlanau Plastisitas Sedang-Tinggi & Pasir Endapan Sungai',
    sniSiteClass: 'SD',
    hardSoilDepth: '12 – 20 meter',
    liquefactionRisk: 'Rendah',
    geologicalFormation: 'Sedimen Molasa Sulawesi & Batuan Sedimen Miosen Formasi Camba',
    keyGeotechHazards: [
      'Tekanan swelling lempung ekspansif pada musim kemarau berganti hujan.',
      'Daya dukung tanah dasar bervariasi antara dataran aluvium sungai dan perbukitan sedimen.',
    ],
    recommendedFoundation:
      'Pondasi Tiang Pancang Precast K-500 untuk bangunan bertingkat, pondasi telapak setempat dengan tie-beam kaku untuk bangunan menengah.',
    groundImprovement:
      'Pemadatan tanah dasar bertahap (subgrade stabilization) menggunakan kapur/semen pada tanah lempung ekspansif.',
    engineeringAdvice:
      'Pastikan kedalaman muka air tanah diperiksa pada akhir musim hujan untuk mengantisipasi gaya angkat hidrostatik (uplift pressure).',
  },
];

/**
 * Resolves the geotechnical soil profile, SNI 1726 site class, and foundation recommendations
 * based on province, regency, and project name.
 */
export function getProjectGeotechProfile(
  province?: string | null,
  regency?: string | null,
  projectName?: string | null
): GeotechProfileAnalysis {
  const normProvince = (province || '').trim().toLowerCase();
  const normRegency = (regency || '').trim().toLowerCase();
  const normName = (projectName || '').trim().toLowerCase();

  let matchedEntry: RegionalGeotechEntry | null = null;

  // 1. Check specific regency keywords first (Pantura, IKN/Sepaku, Palu, Gambut, Karst, etc.)
  for (const entry of REGIONAL_GEOTECH_TABLE) {
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
    for (const entry of REGIONAL_GEOTECH_TABLE) {
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

  // 3. National baseline default (SD - Tanah Sedang)
  const entry: RegionalGeotechEntry = matchedEntry || {
    provinces: ['Indonesia'],
    regionName: 'Karakteristik Tanah Rata-Rata Nasional',
    soilClassification: 'Lempung Berpasir & Aluvium Sedimen Tersier (Tanah Sedang)',
    sniSiteClass: 'SD',
    hardSoilDepth: '14 – 24 meter',
    liquefactionRisk: 'Rendah',
    geologicalFormation: 'Endapan Aluvium Kuarter & Tanah Pelapukan Batuan Tersier',
    keyGeotechHazards: [
      'Variasi kapasitas daya dukung tanah antara musim kemarau dan hujan akibat fluktuasi muka air tanah.',
      'Potensi differential settlement bila bangunan melintasi bidang diskontinuitas tanah yang berbeda.',
    ],
    recommendedFoundation:
      'Pondasi Tiang Pancang Spun Pile / Bored Pile untuk struktur bertingkat; Pondasi Telapak Setempat / Strauss Pile untuk konstruksi beban ringan.',
    groundImprovement:
      'Pemadatan subgrade tanah dasar secara bertahap menggunakan vibratory roller kapasitas min. 10 ton.',
    engineeringAdvice:
      'Lakukan pengujian tanah mendalam (min. 2 titik CPTu sondir 2.5 ton & 1 titik bor mesin SPT) sebelum finalisasi detail engineering design.',
  };

  // Color-coding for SNI 1726 Site Class:
  // SE (Tanah Lunak): Red/Rose
  // SD (Tanah Sedang): Amber/Yellow
  // SC (Tanah Keras): Emerald/Green
  // SB (Batuan): Sky/Blue
  let siteClassColorClass: string;
  let siteClassBgClass: string;
  let sniSiteClassLabel: string;

  switch (entry.sniSiteClass) {
    case 'SE':
      sniSiteClassLabel = 'SE (Tanah Lunak)';
      siteClassColorClass = 'text-rose-300 border-rose-500/60 bg-rose-950/40';
      siteClassBgClass = 'bg-rose-500';
      break;
    case 'SD':
      sniSiteClassLabel = 'SD (Tanah Sedang)';
      siteClassColorClass = 'text-amber-300 border-amber-500/60 bg-amber-950/40';
      siteClassBgClass = 'bg-amber-500';
      break;
    case 'SC':
      sniSiteClassLabel = 'SC (Tanah Keras / Batuan Lunak)';
      siteClassColorClass = 'text-emerald-300 border-emerald-500/60 bg-emerald-950/40';
      siteClassBgClass = 'bg-emerald-500';
      break;
    case 'SB':
      sniSiteClassLabel = 'SB (Batuan)';
      siteClassColorClass = 'text-sky-300 border-sky-500/60 bg-sky-950/40';
      siteClassBgClass = 'bg-sky-500';
      break;
  }

  // Color-coding for Liquefaction Risk:
  let liquefactionColorClass: string;
  switch (entry.liquefactionRisk) {
    case 'Tinggi':
      liquefactionColorClass = 'text-rose-400 border-rose-500/50 bg-rose-950/50';
      break;
    case 'Sedang':
      liquefactionColorClass = 'text-amber-400 border-amber-500/50 bg-amber-950/50';
      break;
    case 'Rendah':
      liquefactionColorClass = 'text-emerald-400 border-emerald-500/50 bg-emerald-950/50';
      break;
  }

  return {
    regionName: entry.regionName,
    provinceName: province || 'Nasional',
    soilClassification: entry.soilClassification,
    sniSiteClass: entry.sniSiteClass,
    sniSiteClassLabel,
    siteClassColorClass,
    siteClassBgClass,
    hardSoilDepth: entry.hardSoilDepth,
    liquefactionRisk: entry.liquefactionRisk,
    liquefactionColorClass,
    geologicalFormation: entry.geologicalFormation,
    keyGeotechHazards: entry.keyGeotechHazards,
    recommendedFoundation: entry.recommendedFoundation,
    groundImprovement: entry.groundImprovement,
    engineeringAdvice: entry.engineeringAdvice,
  };
}
