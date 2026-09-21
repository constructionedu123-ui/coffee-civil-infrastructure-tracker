import { ProjectFeature } from '../types/project';
import { normalizeCapexTrillion } from './islandAggregator';

export interface HeatmapThreshold {
  label: string;
  range: string;
  min: number;
  max: number;
  color: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
}

export const HEATMAP_THRESHOLDS: HeatmapThreshold[] = [
  {
    label: '< 25T',
    range: '< Rp 25 T',
    min: 0,
    max: 25,
    color: '#334155', // Slate
    borderColor: '#475569',
    badgeBg: 'bg-slate-800',
    badgeText: 'text-slate-300',
  },
  {
    label: '25-75T',
    range: 'Rp 25 - 75 T',
    min: 25,
    max: 75,
    color: '#0284C7', // Sky / Cyan
    borderColor: '#0369A1',
    badgeBg: 'bg-sky-950',
    badgeText: 'text-sky-400',
  },
  {
    label: '75-150T',
    range: 'Rp 75 - 150 T',
    min: 75,
    max: 150,
    color: '#D97706', // Amber
    borderColor: '#B45309',
    badgeBg: 'bg-amber-950',
    badgeText: 'text-amber-400',
  },
  {
    label: '> 150T',
    range: '> Rp 150 T',
    min: 150,
    max: Infinity,
    color: '#E11D48', // Rose / Crimson
    borderColor: '#BE123C',
    badgeBg: 'bg-rose-950',
    badgeText: 'text-rose-400',
  },
];

export function getProvincialThreshold(capexTrillion: number): HeatmapThreshold {
  if (capexTrillion >= 150) return HEATMAP_THRESHOLDS[3];
  if (capexTrillion >= 75) return HEATMAP_THRESHOLDS[2];
  if (capexTrillion >= 25) return HEATMAP_THRESHOLDS[1];
  return HEATMAP_THRESHOLDS[0];
}

export function getProvincialColor(capexTrillion: number): string {
  return getProvincialThreshold(capexTrillion).color;
}

export interface ProvinceBoundaryConfig {
  slug: string;
  provinceName: string;
  aliases: string[];
}

export const PROVINCE_BOUNDARIES: ProvinceBoundaryConfig[] = [
  { slug: 'special-region-of-aceh', provinceName: 'Aceh', aliases: ['aceh', 'banda aceh'] },
  { slug: 'north-sumatera', provinceName: 'Sumatera Utara', aliases: ['sumatera utara', 'sumatra utara', 'sumut', 'medan'] },
  { slug: 'west-sumatera', provinceName: 'Sumatera Barat', aliases: ['sumatera barat', 'sumbar', 'padang', 'sawahlunto'] },
  { slug: 'riau', provinceName: 'Riau', aliases: ['riau', 'pekanbaru', 'dumai'] },
  { slug: 'riau-islands', provinceName: 'Kepulauan Riau', aliases: ['kepulauan riau', 'kepri', 'batam', 'bintan', 'tanjung pinang'] },
  { slug: 'jambi', provinceName: 'Jambi', aliases: ['jambi'] },
  { slug: 'south-sumatera', provinceName: 'Sumatera Selatan', aliases: ['sumatera selatan', 'sumsel', 'palembang'] },
  { slug: 'bangka-belitung-islands', provinceName: 'Bangka Belitung', aliases: ['bangka', 'belitung', 'babel', 'penyak'] },
  { slug: 'bengkulu', provinceName: 'Bengkulu', aliases: ['bengkulu', 'curup'] },
  { slug: 'lampung', provinceName: 'Lampung', aliases: ['lampung', 'krui', 'bengkunat', 'way jambu'] },
  { slug: 'banten', provinceName: 'Banten', aliases: ['banten', 'tangerang', 'serang', 'cilegon', 'lebak', 'ciujung'] },
  { slug: 'jakarta-special-capital-region', provinceName: 'DKI Jakarta', aliases: ['jakarta', 'dki'] },
  { slug: 'west-java', provinceName: 'Jawa Barat', aliases: ['jawa barat', 'jabar', 'bandung', 'bekasi', 'bogor', 'karawang', 'cirebon', 'depok', 'sukabumi'] },
  { slug: 'central-java', provinceName: 'Jawa Tengah', aliases: ['jawa tengah', 'jateng', 'semarang', 'solo', 'surakarta', 'kudus', 'pekalongan', 'rowobungkul', 'jlegwinangun'] },
  { slug: 'special-region-of-yogyakarta', provinceName: 'DI Yogyakarta', aliases: ['yogyakarta', 'jogja', 'diy', 'sleman', 'bantul', 'gunungkidul', 'kulon progo'] },
  { slug: 'east-java', provinceName: 'Jawa Timur', aliases: ['jawa timur', 'jatim', 'surabaya', 'malang', 'gresik', 'sidoarjo', 'banyuwangi'] },
  { slug: 'bali', provinceName: 'Bali', aliases: ['bali', 'denpasar', 'badung', 'sanur'] },
  { slug: 'west-nusa-tenggara', provinceName: 'Nusa Tenggara Barat', aliases: ['nusa tenggara barat', 'ntb', 'lombok', 'mataram', 'sumbawa', 'bima'] },
  { slug: 'east-nusa-tenggara', provinceName: 'Nusa Tenggara Timur', aliases: ['nusa tenggara timur', 'ntt', 'kupang', 'flores', 'timor', 'labuan bajo', 'sumba'] },
  { slug: 'west-kalimantan', provinceName: 'Kalimantan Barat', aliases: ['kalimantan barat', 'kalbar', 'pontianak', 'kapuas', 'singkawang'] },
  { slug: 'central-kalimantan', provinceName: 'Kalimantan Tengah', aliases: ['kalimantan tengah', 'kalteng', 'palangka raya', 'palangkaraya', 'sampit'] },
  { slug: 'south-kalimantan', provinceName: 'Kalimantan Selatan', aliases: ['kalimantan selatan', 'kalsel', 'banjarmasin', 'banjarbaru'] },
  { slug: 'east-kalimantan', provinceName: 'Kalimantan Timur & IKN', aliases: ['kalimantan timur', 'kaltim', 'kalimantan utara', 'kaltara', 'ikn', 'nusantara', 'sepaku', 'balikpapan', 'samarinda', 'penajam'] },
  { slug: 'north-sulawesi', provinceName: 'Sulawesi Utara', aliases: ['sulawesi utara', 'sulut', 'manado', 'bitung', 'likupang'] },
  { slug: 'gorontalo', provinceName: 'Gorontalo', aliases: ['gorontalo'] },
  { slug: 'central-sulawesi', provinceName: 'Sulawesi Tengah', aliases: ['sulawesi tengah', 'sulteng', 'palu', 'sigi', 'poso', 'morowali', 'donggala'] },
  { slug: 'south-sulawesi', provinceName: 'Sulawesi Selatan', aliases: ['sulawesi selatan', 'sulsel', 'makassar', 'pangkep', 'gowa', 'parepare', 'maros'] },
  { slug: 'southeast-sulawesi', provinceName: 'Sulawesi Tenggara', aliases: ['sulawesi tenggara', 'sultra', 'kendari', 'muna', 'buton', 'wakatobi', 'konawe', 'kolaka'] },
  { slug: 'west-sulawesi', provinceName: 'Sulawesi Barat', aliases: ['sulawesi barat', 'sulbar', 'mamuju'] },
  { slug: 'maluku', provinceName: 'Maluku', aliases: ['maluku', 'ambon', 'maluku barat daya', 'tual'] },
  { slug: 'north-maluku', provinceName: 'Maluku Utara', aliases: ['maluku utara', 'malut', 'ternate', 'tidore', 'fatamit', 'halmahera'] },
  { slug: 'special-region-of-west-papua', provinceName: 'Papua Barat & Daya', aliases: ['papua barat', 'papua barat daya', 'manokwari', 'sorong', 'raja ampat', 'fakfak'] },
  { slug: 'special-region-of-papua', provinceName: 'Papua & Wilayah Adat', aliases: ['papua', 'papua tengah', 'papua pegunungan', 'papua selatan', 'jayapura', 'timika', 'merauke', 'wamena', 'nabire'] },
];

export interface ProvincialAggregate {
  slug: string;
  provinceName: string;
  totalCapexTrillion: number;
  projectCount: number;
  topSector: string;
  topSectorCount: number;
  sectorCounts: Record<string, number>;
  color: string;
  thresholdLabel: string;
}

/**
 * Aggregates CAPEX, project density, and leading sectors for all provinces.
 */
export function aggregateProvincialData(
  projects: ProjectFeature[]
): Record<string, ProvincialAggregate> {
  const result: Record<string, ProvincialAggregate> = {};

  for (const cfg of PROVINCE_BOUNDARIES) {
    result[cfg.slug] = {
      slug: cfg.slug,
      provinceName: cfg.provinceName,
      totalCapexTrillion: 0,
      projectCount: 0,
      topSector: 'Umum',
      topSectorCount: 0,
      sectorCounts: {},
      color: '#334155',
      thresholdLabel: '< 25T',
    };
  }

  for (const project of projects) {
    const props = project.properties;
    const combined = `${props.province || ''} ${props.regency || ''} ${props.project_name || ''}`.toLowerCase();
    const capex = normalizeCapexTrillion(props.budget_idr);
    const category = props.category || 'Infrastruktur';

    let matchedSlug: string | null = null;
    for (const cfg of PROVINCE_BOUNDARIES) {
      if (cfg.aliases.some((alias) => combined.includes(alias))) {
        matchedSlug = cfg.slug;
        break;
      }
    }

    // Fallback: If not matched by keywords, test geometry coordinates
    if (!matchedSlug && project.geometry && project.geometry.type === 'Point' && Array.isArray(project.geometry.coordinates)) {
      const [lon, lat] = project.geometry.coordinates;
      if (lon >= 106.6 && lon <= 107.0 && lat >= -6.4 && lat <= -6.0) matchedSlug = 'jakarta-special-capital-region';
      else if (lon >= 106.0 && lon <= 108.8 && lat >= -7.8 && lat <= -5.9) matchedSlug = 'west-java';
      else if (lon >= 115.0 && lon <= 117.5 && lat >= -1.5 && lat <= 2.5) matchedSlug = 'east-kalimantan';
      else if (lon >= 119.0 && lon <= 121.5 && lat >= -5.8 && lat <= -2.0) matchedSlug = 'south-sulawesi';
    }

    if (matchedSlug && result[matchedSlug]) {
      const agg = result[matchedSlug];
      agg.projectCount += 1;
      agg.totalCapexTrillion += capex;
      agg.sectorCounts[category] = (agg.sectorCounts[category] || 0) + 1;
    }
  }

  // Calculate top sectors and color thresholds
  for (const slug of Object.keys(result)) {
    const agg = result[slug];
    agg.totalCapexTrillion = Number(agg.totalCapexTrillion.toFixed(2));

    let topCat = 'Transport';
    let maxCount = 0;
    for (const [cat, cnt] of Object.entries(agg.sectorCounts)) {
      if (cnt > maxCount) {
        maxCount = cnt;
        topCat = cat;
      }
    }
    agg.topSector = agg.projectCount > 0 ? topCat : 'Belum Ada';
    agg.topSectorCount = maxCount;

    const threshold = getProvincialThreshold(agg.totalCapexTrillion);
    agg.color = threshold.color;
    agg.thresholdLabel = threshold.label;
  }

  return result;
}

/**
 * Resolves a GeoJSON feature from boundaries to its corresponding ProvincialAggregate.
 */
export function getProvinceStatForFeature(
  feature: any,
  aggregates: Record<string, ProvincialAggregate>
): ProvincialAggregate | null {
  if (!feature || !feature.properties) return null;
  const p = feature.properties;

  if (p.slug && aggregates[p.slug]) {
    return aggregates[p.slug];
  }

  const name = (p.provinsi || p.state || p.ADM1_EN || '').toLowerCase();
  for (const [slug, agg] of Object.entries(aggregates)) {
    const cfg = PROVINCE_BOUNDARIES.find((b) => b.slug === slug);
    if (cfg && cfg.aliases.some((alias) => name.includes(alias))) {
      return agg;
    }
  }

  return null;
}
