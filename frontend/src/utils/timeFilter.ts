import { ProjectFeature, ProjectProperties } from '../types/project';

export type TimeFrameFilter =
  | 'all'
  | 'active_now'
  | 'last_5_years'
  | 'rpjmn_2020_2024'
  | 'legacy_2015_2019';

export interface TimeFrameOption {
  id: TimeFrameFilter;
  label: string;
  shortLabel: string;
  badge: string;
  icon: string;
  description: string;
}

export const TIMEFRAME_OPTIONS: TimeFrameOption[] = [
  {
    id: 'all',
    label: 'Semua Tahun (Kumulatif)',
    shortLabel: 'Semua Tahun',
    badge: 'Kumulatif',
    icon: '🌐',
    description: 'Rekam jejak seluruh proyek historis dan aktif sejak 2015',
  },
  {
    id: 'active_now',
    label: '⚡ Proyek Aktif Saja (Sedang Berjalan & Tender)',
    shortLabel: '⚡ Proyek Aktif',
    badge: 'On-Going',
    icon: '⚡',
    description: 'Hanya proyek yang sedang konstruksi, tender, atau persiapan',
  },
  {
    id: 'last_5_years',
    label: '⏳ 5 Tahun Terakhir (2021 – 2026)',
    shortLabel: '2021 – 2026',
    badge: 'Modern',
    icon: '⏳',
    description: 'Proyek periode modern 5 tahun ke belakang (2021 – 2026)',
  },
  {
    id: 'rpjmn_2020_2024',
    label: '🏛️ Era RPJMN 2020 – 2024',
    shortLabel: 'RPJMN 2020–2024',
    badge: 'RPJMN IV',
    icon: '🏛️',
    description: 'Proyek Strategis Nasional koridor RPJMN IV (2020 – 2024)',
  },
  {
    id: 'legacy_2015_2019',
    label: '📜 Era Awal (2015 – 2019)',
    shortLabel: '2015 – 2019',
    badge: 'Legacy',
    icon: '📜',
    description: 'Proyek infrastruktur fase awal periode 2015 – 2019',
  },
];

/**
 * Extracts numeric fiscal/budget/completion year from project properties
 */
export function parseProjectYear(props: Partial<ProjectProperties> | any): number | null {
  if (!props) return null;

  // 1. Direct fiscal_year field
  if (props.fiscal_year && typeof props.fiscal_year === 'string' && props.fiscal_year !== 'NULL' && props.fiscal_year !== 'null') {
    const y = parseInt(props.fiscal_year.trim(), 10);
    if (!isNaN(y) && y >= 2000 && y <= 2035) return y;
  }
  if (typeof props.fiscal_year === 'number' && props.fiscal_year >= 2000 && props.fiscal_year <= 2035) {
    return props.fiscal_year;
  }

  // 2. completion_year if present
  if (props.completion_year) {
    const y = parseInt(String(props.completion_year).trim(), 10);
    if (!isNaN(y) && y >= 2000 && y <= 2035) return y;
  }

  // 3. Year regex in project_name e.g. "Pembangunan Bendungan 2022"
  const nameMatch = (props.project_name || '').match(/\b(20[12]\d)\b/);
  if (nameMatch) {
    return parseInt(nameMatch[1], 10);
  }

  // 4. Milestone dates or updated_at / created_at fallback
  if (props.created_at && typeof props.created_at === 'string') {
    const m = props.created_at.match(/^(20[12]\d)/);
    if (m) return parseInt(m[1], 10);
  }

  return null;
}

/**
 * Determines whether a project is actively under construction, in tender, or planning
 */
export function isProjectActiveNow(props: Partial<ProjectProperties> | any): boolean {
  if (!props) return false;
  const status = (props.status || '').toLowerCase().trim();

  // Explicit active statuses
  if (
    status === 'construction' ||
    status === 'under construction' ||
    status === 'tender & transaksi' ||
    status === 'planning' ||
    status === 'planning & prep' ||
    status === 'persiapan'
  ) {
    return true;
  }

  // Check progress indicator
  if (typeof props.progress === 'number' && props.progress > 0 && props.progress < 100) {
    return status !== 'completed' && status !== 'operational';
  }

  return false;
}

/**
 * Returns era classification and active tag for a project
 */
export function getProjectEra(props: Partial<ProjectProperties> | any): {
  era: '2015-2020 (Legacy)' | '2021-2026 (Modern)' | 'Other';
  is_active_now: boolean;
  year: number | null;
} {
  const year = parseProjectYear(props);
  const activeNow = isProjectActiveNow(props);
  const status = (props?.status || '').toLowerCase();
  const isCompletedOrOp = status === 'completed' || status === 'operational';

  let era: '2015-2020 (Legacy)' | '2021-2026 (Modern)' | 'Other' = '2021-2026 (Modern)';

  if (isCompletedOrOp && year && year < 2021) {
    era = '2015-2020 (Legacy)';
  } else if ((year && year >= 2021 && year <= 2026) || activeNow) {
    era = '2021-2026 (Modern)';
  } else if (year && year < 2021) {
    era = '2015-2020 (Legacy)';
  }

  return {
    era,
    is_active_now: activeNow,
    year,
  };
}

/**
 * Filters project collection by selected time frame
 */
export function filterProjectsByTimeFrame(
  projects: ProjectFeature[],
  filter: TimeFrameFilter
): ProjectFeature[] {
  if (!projects || projects.length === 0) return [];
  if (filter === 'all') return projects;

  return projects.filter((project) => {
    const props = project.properties;
    const year = parseProjectYear(props);
    const active = isProjectActiveNow(props);
    const isCompleted =
      props.status === 'Completed' || props.status === 'Operational';

    switch (filter) {
      case 'active_now':
        // Excludes all completed and operational legacy projects
        return active;

      case 'last_5_years':
        // Finished or active between 2021–2026
        if (year && year >= 2021 && year <= 2026) return true;
        if (active && (!year || year >= 2021)) return true;
        // If year is null, modern active projects match
        return false;

      case 'rpjmn_2020_2024':
        // RPJMN 2020-2024 cycle
        if (year && year >= 2020 && year <= 2024) return true;
        // PSN projects active or planned in this cycle without explicit year
        if (!year && (props.source_name === 'KPPIP' || active)) return true;
        return false;

      case 'legacy_2015_2019':
        // Early era: 2015 - 2019 (or earlier legacy completed)
        if (year && year <= 2019) return true;
        if (isCompleted && year && year < 2020) return true;
        return false;

      default:
        return true;
    }
  });
}

/**
 * Generates an informative sub-heading context text based on active time frame
 */
export function getTimeFrameContextText(
  filter: TimeFrameFilter,
  count: number,
  capexTrillion: number
): string {
  const capexStr = `Rp ${capexTrillion.toLocaleString('id-ID', { maximumFractionDigits: 1 })} Triliun`;
  const countStr = `${count.toLocaleString('id-ID')} Proyek`;

  switch (filter) {
    case 'active_now':
      return `Menampilkan anggaran aktif konstruksi & tender yang sedang berjalan saat ini (${capexStr} dari ${countStr})`;
    case 'last_5_years':
      return `Menampilkan belanja infrastruktur era modern 5 tahun terakhir (2021 – 2026: ${capexStr})`;
    case 'rpjmn_2020_2024':
      return `Menampilkan proyek strategis nasional periode RPJMN 2020 – 2024 (${capexStr})`;
    case 'legacy_2015_2019':
      return `Menampilkan rekam jejak infrastruktur fase awal 2015 – 2019 (${countStr})`;
    case 'all':
    default:
      return `Menampilkan akumulasi total anggaran infrastruktur nasional (Kumulatif: ${capexStr})`;
  }
}
