import { ProjectProperties, ProjectFeature } from '../types/project';

/**
 * Phase 10: Contractor Normalization & Matching Engine
 * Standardized Indonesian SOE (BUMN Karya), Concessionaire & Private Contractor entities.
 */

export const MAJOR_CONTRACTORS = [
  'Hutama Karya',
  'Wijaya Karya (WIKA)',
  'Adhi Karya',
  'PT PP',
  'Waskita Karya',
  'Brantas Abipraya',
  'Nindya Karya',
  'Jasa Marga',
  'Astra Infra',
  'KSO / Konsorsium',
  'Swasta / Lainnya',
] as const;

export type StandardizedContractor = typeof MAJOR_CONTRACTORS[number];

export interface ContractorRule {
  entity: StandardizedContractor;
  regex: RegExp;
}

const CONTRACTOR_RULES: ContractorRule[] = [
  {
    entity: 'Wijaya Karya (WIKA)',
    regex: /\b(wika|wijaya\s+karya)\b/i,
  },
  {
    entity: 'Hutama Karya',
    regex: /\b(hutama\s+karya|hutama|hk)\b/i,
  },
  {
    entity: 'Adhi Karya',
    regex: /\b(adhi\s+karya|adhi)\b/i,
  },
  {
    entity: 'PT PP',
    regex: /\b(pt\s+pp|pt\.\s*pp|pembangunan\s+perumahan|\bpp\b)\b/i,
  },
  {
    entity: 'Waskita Karya',
    regex: /\b(waskita\s+karya|waskita|wskt)\b/i,
  },
  {
    entity: 'Brantas Abipraya',
    regex: /\b(brantas\s+abipraya|brantas|abipraya)\b/i,
  },
  {
    entity: 'Nindya Karya',
    regex: /\b(nindya\s+karya|nindya)\b/i,
  },
  {
    entity: 'Jasa Marga',
    regex: /\b(jasa\s+marga|jasamarga)\b/i,
  },
  {
    entity: 'Astra Infra',
    regex: /\b(astra\s+infra|astra|lintas\s+marga\s+sedaya|marga\s+mandalasakti|trans\s+bumi\s+serbaraja)\b/i,
  },
];

const KSO_REGEX = /\b(kso|konsorsium|joint\s+operation|\bjo\b|joint\s+venture|\bjv\b|\/|\-|\&|\btrans\s+marga\b)\b/i;

/**
 * Normalizes messy contractor string into an array of standardized parent entities.
 * Detects Joint Operations / KSO (e.g. "WIKA - ADHI KSO" tags both WIKA and ADHI plus "KSO / Konsorsium").
 */
export function normalizeContractorText(text: string | null | undefined): StandardizedContractor[] {
  if (!text || !text.trim()) {
    return ['Swasta / Lainnya'];
  }

  const raw = text.trim();
  const matchedEntities = new Set<StandardizedContractor>();

  for (const rule of CONTRACTOR_RULES) {
    if (rule.regex.test(raw)) {
      matchedEntities.add(rule.entity);
    }
  }

  const hasKsoKeyword = KSO_REGEX.test(raw);
  const isMultiEntity = matchedEntities.size > 1;

  if (hasKsoKeyword || isMultiEntity) {
    matchedEntities.add('KSO / Konsorsium');
  }

  if (matchedEntities.size === 0) {
    return ['Swasta / Lainnya'];
  }

  return Array.from(matchedEntities);
}

/**
 * Extracts all matching standardized contractors for a project,
 * checking props.contractor, project_name, pjpk, and funding_scheme.
 */
export function getProjectContractors(props: ProjectProperties): StandardizedContractor[] {
  const combined = [
    props.contractor || '',
    props.project_name || '',
    props.pjpk || '',
    props.funding_scheme || '',
  ].join(' ');

  const result = normalizeContractorText(combined);
  return result.length > 0 ? result : ['Swasta / Lainnya'];
}

/**
 * Returns the primary contractor name for display and single-value badges.
 * Prioritizes named BUMNs over the generic "KSO / Konsorsium" tag.
 */
export function getPrimaryContractor(props: ProjectProperties): string {
  const contractors = getProjectContractors(props);
  const specific = contractors.filter((c) => c !== 'KSO / Konsorsium');
  if (specific.length > 0) {
    return specific[0];
  }
  return contractors[0] || 'BUMN Karya / Swasta';
}

/**
 * Checks whether a project matches the user's selected contractor filter.
 */
export function projectMatchesContractor(
  props: ProjectProperties,
  selectedContractor: string | null | undefined
): boolean {
  if (!selectedContractor || selectedContractor === 'All' || selectedContractor.startsWith('Semua')) {
    return true;
  }

  const projectContractors = getProjectContractors(props);
  return projectContractors.includes(selectedContractor as StandardizedContractor);
}

/**
 * Aggregates all project features to produce sorted contractor statistics
 * (project volume and total CAPEX) for dropdowns and leaderboard.
 */
export function getContractorStats(
  projects: ProjectFeature[]
): { name: StandardizedContractor; count: number; capex: number }[] {
  const statsMap = new Map<StandardizedContractor, { count: number; capex: number }>();

  // Initialize all major contractors
  MAJOR_CONTRACTORS.forEach((c) => {
    statsMap.set(c, { count: 0, capex: 0 });
  });

  projects.forEach((feat) => {
    const matched = getProjectContractors(feat.properties);
    const capex = feat.properties.budget_idr || 0;

    matched.forEach((c) => {
      const current = statsMap.get(c) || { count: 0, capex: 0 };
      current.count += 1;
      current.capex += capex;
      statsMap.set(c, current);
    });
  });

  const list = Array.from(statsMap.entries())
    .map(([name, stats]) => ({
      name,
      count: stats.count,
      capex: stats.capex,
    }))
    .filter((item) => item.count > 0);

  // Sort descending by count, then by capex
  list.sort((a, b) => {
    // Keep 'Swasta / Lainnya' near the end if counts are similar
    if (a.name === 'Swasta / Lainnya') return 1;
    if (b.name === 'Swasta / Lainnya') return -1;
    return b.count - a.count || b.capex - a.capex;
  });

  return list;
}
