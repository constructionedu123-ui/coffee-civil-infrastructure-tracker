import { ProjectFeature, ProjectProperties } from '../types/project';

export type MacroRegionName =
  | 'Jawa'
  | 'Sumatera'
  | 'Kalimantan (inc. IKN)'
  | 'Sulawesi'
  | 'Bali & Nusa Tenggara'
  | 'Maluku & Papua';

export interface MacroRegionConfig {
  id: string;
  name: MacroRegionName;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  provinces: string[];
  keywordsRegex: RegExp;
  center: [number, number]; // [lat, lon]
  zoom: number;
}

export const MACRO_REGIONS: MacroRegionConfig[] = [
  {
    id: 'jawa',
    name: 'Jawa',
    color: '#3B82F6', // Slate Blue
    badgeBg: 'bg-blue-950/40',
    badgeBorder: 'border-blue-700/60',
    badgeText: 'text-blue-400',
    provinces: [
      'DKI Jakarta',
      'Jawa Barat',
      'Jawa Tengah',
      'Jawa Timur',
      'Banten',
      'DI Yogyakarta',
      'D.I. Yogyakarta',
    ],
    keywordsRegex:
      /jakarta|jawa|banten|yogyakarta|yogyakata|cirebon|karawang|bandung|semarang|surabaya|kudus|pekalongan|malabar|jlegwinangun/i,
    center: [-7.4, 110.0],
    zoom: 6.8,
  },
  {
    id: 'sumatera',
    name: 'Sumatera',
    color: '#10B981', // Emerald
    badgeBg: 'bg-emerald-950/40',
    badgeBorder: 'border-emerald-700/60',
    badgeText: 'text-emerald-400',
    provinces: [
      'Aceh',
      'Sumatera Utara',
      'Sumatera Barat',
      'Riau',
      'Kepulauan Riau',
      'Jambi',
      'Sumatera Selatan',
      'Kepulauan Bangka Belitung',
      'Bangka Belitung',
      'Bengkulu',
      'Lampung',
    ],
    keywordsRegex:
      /aceh|sumatera|sumatra|riau|jambi|bengkulu|lampung|bangka|belitung|dumai|padang|sawahlunto|krui|bengkunat|way jambu|lemong|ulok mukti|penyak/i,
    center: [0.5, 101.5],
    zoom: 6.0,
  },
  {
    id: 'kalimantan',
    name: 'Kalimantan (inc. IKN)',
    color: '#F59E0B', // Amber
    badgeBg: 'bg-amber-950/40',
    badgeBorder: 'border-amber-700/60',
    badgeText: 'text-amber-400',
    provinces: [
      'Kalimantan Timur',
      'Kalimantan Selatan',
      'Kalimantan Barat',
      'Kalimantan Tengah',
      'Kalimantan Utara',
      'IKN',
      'Ibu Kota Negara Nusantara',
    ],
    keywordsRegex:
      /kalimantan|kalimatan|ikn|nusantara|banjarmasin|kapuas|sepaku|balikpapan|paser|samarinda/i,
    center: [-0.2, 114.5],
    zoom: 6.0,
  },
  {
    id: 'sulawesi',
    name: 'Sulawesi',
    color: '#8B5CF6', // Purple
    badgeBg: 'bg-purple-950/40',
    badgeBorder: 'border-purple-700/60',
    badgeText: 'text-purple-400',
    provinces: [
      'Sulawesi Selatan',
      'Sulawesi Tengah',
      'Sulawesi Tenggara',
      'Sulawesi Utara',
      'Gorontalo',
      'Sulawesi Barat',
    ],
    keywordsRegex:
      /sulawesi|gorontalo|makassar|palu|muna|buton|wakatobi|konawe|sigi|pangkep|datokarama|manado|kendari/i,
    center: [-1.8, 121.0],
    zoom: 6.0,
  },
  {
    id: 'bali_nusra',
    name: 'Bali & Nusa Tenggara',
    color: '#06B6D4', // Cyan
    badgeBg: 'bg-cyan-950/40',
    badgeBorder: 'border-cyan-700/60',
    badgeText: 'text-cyan-400',
    provinces: [
      'Bali',
      'Nusa Tenggara Barat',
      'NTB',
      'Nusa Tenggara Timur',
      'NTT',
    ],
    keywordsRegex:
      /bali|nusa tenggara|ntb|ntt|lombok|sumbawa|flores|timor|kupang|mataram|denpasar/i,
    center: [-8.6, 119.5],
    zoom: 6.5,
  },
  {
    id: 'maluku_papua',
    name: 'Maluku & Papua',
    color: '#F43F5E', // Rose
    badgeBg: 'bg-rose-950/40',
    badgeBorder: 'border-rose-700/60',
    badgeText: 'text-rose-400',
    provinces: [
      'Maluku',
      'Maluku Utara',
      'Papua',
      'Papua Barat',
      'Papua Tengah',
      'Papua Pegunungan',
      'Papua Selatan',
      'Papua Barat Daya',
    ],
    keywordsRegex:
      /maluku|papua|ambon|jayapura|sorong|merauke|fatamit|mala|ternate|timika|wamena|manokwari/i,
    center: [-3.8, 134.0],
    zoom: 5.5,
  },
];

/**
 * Normalizes project budget into Trillion IDR.
 * Handles cases where budget was recorded in raw Rupiah (> 1,000,000) instead of Trillions.
 */
export function normalizeCapexTrillion(budget: number | null | undefined): number {
  if (typeof budget !== 'number' || isNaN(budget) || budget <= 0) return 0;
  // If stored in raw Rupiah, convert to Trillion (divide by 10^12)
  if (budget > 1_000_000) {
    return budget / 1_000_000_000_000;
  }
  return budget;
}

/**
 * Classifies a project into one of the 6 Indonesian macro-regions.
 */
export function getMacroRegionForProject(
  item: ProjectFeature | ProjectProperties | { province?: string | null; regency?: string | null; project_name?: string | null; geometry?: any }
): MacroRegionName {
  let props: Partial<ProjectProperties>;
  let geometry: any = null;

  if ('properties' in item) {
    props = item.properties;
    geometry = item.geometry;
  } else {
    props = item as Partial<ProjectProperties>;
    geometry = (item as any).geometry;
  }

  const p = (props.province || '').toLowerCase();
  const r = (props.regency || '').toLowerCase();
  const n = (props.project_name || '').toLowerCase();
  const combined = `${p} ${r} ${n}`;

  // 1. Direct regex/keyword match across province, regency, and project name
  for (const region of MACRO_REGIONS) {
    if (region.keywordsRegex.test(combined)) {
      return region.name;
    }
  }

  // 2. Geographic coordinates bounding box fallback for point geometries
  if (geometry && geometry.type === 'Point' && Array.isArray(geometry.coordinates)) {
    const [lon, lat] = geometry.coordinates;
    if (lon >= 95 && lon <= 106 && lat >= -6 && lat <= 6) return 'Sumatera';
    if (lon >= 105 && lon <= 115 && lat >= -9 && lat <= -5.5) return 'Jawa';
    if (lon >= 108.5 && lon <= 119.5 && lat >= -4.5 && lat <= 4.5) return 'Kalimantan (inc. IKN)';
    if (lon >= 118.5 && lon <= 125.5 && lat >= -6 && lat <= 2.5) return 'Sulawesi';
    if (lon >= 114.3 && lon <= 125.5 && lat >= -11.5 && lat <= -7.5) return 'Bali & Nusa Tenggara';
    if (lon >= 125.5 && lon <= 141.5 && lat >= -10 && lat <= 3.0) return 'Maluku & Papua';
  }

  // Fallback to Jawa if completely unknown
  return 'Jawa';
}

export interface MacroRegionStat {
  id: string;
  name: MacroRegionName;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  count: number;
  capexTrillion: number;
  percentageCapex: number;
  percentageCount: number;
  center: [number, number];
  zoom: number;
}

export interface IslandAggregatorResult {
  regions: MacroRegionStat[];
  totalProjects: number;
  totalCapexTrillion: number;
  disclosedCapexCount: number;
  javaCapexTrillion: number;
  outerJavaCapexTrillion: number;
  javaCapexPercentage: number;
  outerJavaCapexPercentage: number;
  javaProjectCount: number;
  outerJavaProjectCount: number;
  javaProjectPercentage: number;
  outerJavaProjectPercentage: number;
}

/**
 * Aggregates CAPEX and project counts across the 6 Indonesian macro-regions.
 */
export function aggregateByIsland(projects: ProjectFeature[]): IslandAggregatorResult {
  const statsMap: Record<MacroRegionName, { count: number; capexTrillion: number }> = {
    'Jawa': { count: 0, capexTrillion: 0 },
    'Sumatera': { count: 0, capexTrillion: 0 },
    'Kalimantan (inc. IKN)': { count: 0, capexTrillion: 0 },
    'Sulawesi': { count: 0, capexTrillion: 0 },
    'Bali & Nusa Tenggara': { count: 0, capexTrillion: 0 },
    'Maluku & Papua': { count: 0, capexTrillion: 0 },
  };

  let totalCapex = 0;
  let disclosedCount = 0;

  for (const project of projects) {
    const regionName = getMacroRegionForProject(project);
    const capex = normalizeCapexTrillion(project.properties.budget_idr);

    if (statsMap[regionName]) {
      statsMap[regionName].count += 1;
      statsMap[regionName].capexTrillion += capex;
    }

    if (capex > 0) {
      disclosedCount += 1;
    }
    totalCapex += capex;
  }

  const totalProjects = projects.length;

  const regions: MacroRegionStat[] = MACRO_REGIONS.map((cfg) => {
    const stat = statsMap[cfg.name];
    const pctCapex = totalCapex > 0 ? (stat.capexTrillion / totalCapex) * 100 : 0;
    const pctCount = totalProjects > 0 ? (stat.count / totalProjects) * 100 : 0;

    return {
      id: cfg.id,
      name: cfg.name,
      color: cfg.color,
      badgeBg: cfg.badgeBg,
      badgeBorder: cfg.badgeBorder,
      badgeText: cfg.badgeText,
      count: stat.count,
      capexTrillion: Number(stat.capexTrillion.toFixed(2)),
      percentageCapex: Number(pctCapex.toFixed(1)),
      percentageCount: Number(pctCount.toFixed(1)),
      center: cfg.center,
      zoom: cfg.zoom,
    };
  });

  const javaStat = statsMap['Jawa'];
  const javaCapex = javaStat.capexTrillion;
  const outerCapex = Math.max(0, totalCapex - javaCapex);

  const javaCapexPct = totalCapex > 0 ? Number(((javaCapex / totalCapex) * 100).toFixed(1)) : 0;
  const outerCapexPct = totalCapex > 0 ? Number(((outerCapex / totalCapex) * 100).toFixed(1)) : 0;

  const javaCount = javaStat.count;
  const outerCount = Math.max(0, totalProjects - javaCount);

  const javaCountPct = totalProjects > 0 ? Number(((javaCount / totalProjects) * 100).toFixed(1)) : 0;
  const outerCountPct = totalProjects > 0 ? Number(((outerCount / totalProjects) * 100).toFixed(1)) : 0;

  return {
    regions,
    totalProjects,
    totalCapexTrillion: Number(totalCapex.toFixed(2)),
    disclosedCapexCount: disclosedCount,
    javaCapexTrillion: Number(javaCapex.toFixed(2)),
    outerJavaCapexTrillion: Number(outerCapex.toFixed(2)),
    javaCapexPercentage: javaCapexPct,
    outerJavaCapexPercentage: outerCapexPct,
    javaProjectCount: javaCount,
    outerJavaProjectCount: outerCount,
    javaProjectPercentage: javaCountPct,
    outerJavaProjectPercentage: outerCountPct,
  };
}
