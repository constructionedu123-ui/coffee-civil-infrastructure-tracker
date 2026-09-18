import { ProjectCategory, ProjectStatus } from './project';
import { MaterialHubFilterState } from '../components/FilterBar';

export type WorkModeId = 'standard' | 'contractor' | 'geotech' | 'logistics' | 'ikn';

export interface WorkModeConfig {
  id: WorkModeId;
  name: string;
  shortName: string;
  icon: string;
  badgeClass: string;
  activeBorderClass: string;
  description: string;
  toastMessage: string;
  settings: {
    categories?: ProjectCategory[];
    status?: ProjectStatus | 'All' | 'active_construction_and_tender';
    region?: string | 'All';
    contractor?: string | null;
    basemap?: 'dark' | 'satellite';
    showBatchingPlants?: boolean;
    showSupplyBuffers?: boolean;
    showFaultLines?: boolean;
    showMaritimeRoutes?: boolean;
    materialFilters?: MaterialHubFilterState;
    camera?: {
      center: [number, number];
      zoom: number;
    };
  };
}

export const WORK_MODES: WorkModeConfig[] = [
  {
    id: 'standard',
    name: 'Semua / Standar',
    shortName: 'Standar',
    icon: '🌐',
    badgeClass: 'bg-neutral-800 text-neutral-200 border-neutral-700',
    activeBorderClass: 'border-neutral-600 text-neutral-100',
    description: 'Tampilan standar seluruh proyek, data seismik, dan layer referensi',
    toastMessage: 'Mode Standar Aktif: Menampilkan seluruh proyek infrastruktur dan layer referensi.',
    settings: {
      categories: ['Transport', 'Energy', 'Water', 'Housing', 'IKN', 'Commercial & Private'],
      status: 'All',
      region: 'All',
      contractor: null,
      basemap: 'satellite',
      showBatchingPlants: true,
      showSupplyBuffers: false,
      showFaultLines: true,
      showMaritimeRoutes: true,
      materialFilters: {
        quarry: true,
        steel: true,
        cement: true,
        facade: true,
        batching: true,
      },
    },
  },
  {
    id: 'contractor',
    name: 'Kontraktor & Vendor',
    shortName: 'Kontraktor',
    icon: '👷',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
    activeBorderClass: 'border-emerald-500/70 text-emerald-300 bg-emerald-950/40',
    description: 'Fokus proyek aktif konstruksi, lelang tender baru, dan radius suplai beton',
    toastMessage: 'Mode Kontraktor Aktif: Menampilkan proyek aktif, tender, dan jangkauan suplai beton.',
    settings: {
      categories: ['Transport', 'Energy', 'Water', 'Housing', 'IKN', 'Commercial & Private'],
      status: 'active_construction_and_tender',
      region: 'All',
      contractor: null,
      basemap: 'satellite',
      showBatchingPlants: true,
      showSupplyBuffers: true,
      showFaultLines: false,
      showMaritimeRoutes: false,
      materialFilters: {
        quarry: true,
        steel: true,
        cement: true,
        facade: true,
        batching: true,
      },
    },
  },
  {
    id: 'geotech',
    name: 'Geoteknik & Gempa',
    shortName: 'Geoteknik',
    icon: '⚡',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
    activeBorderClass: 'border-rose-500/70 text-rose-300 bg-rose-950/40',
    description: 'Analisis sesar gempa aktif PuSGeN, struktur bendungan, jembatan & jalan tol',
    toastMessage: 'Mode Geoteknik Aktif: Menampilkan sesar gempa aktif PuSGeN dan struktur utama.',
    settings: {
      categories: ['Water', 'Transport'],
      status: 'All',
      region: 'All',
      contractor: null,
      basemap: 'dark',
      showFaultLines: true,
      showSupplyBuffers: false,
      showMaritimeRoutes: false,
      showBatchingPlants: false,
      materialFilters: {
        quarry: false,
        steel: false,
        cement: false,
        facade: false,
        batching: false,
      },
    },
  },
  {
    id: 'logistics',
    name: 'Logistik & Tol Laut',
    shortName: 'Logistik',
    icon: '🚢',
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50',
    activeBorderClass: 'border-cyan-500/70 text-cyan-300 bg-cyan-950/40',
    description: 'Jalur Tol Laut pelayaran material curah, tambang split/pasir, semen, dan baja',
    toastMessage: 'Mode Logistik Aktif: Menampilkan jalur suplai maritim antarpulau dan sentra material.',
    settings: {
      categories: ['Transport', 'Energy', 'Water', 'Housing', 'IKN', 'Commercial & Private'],
      status: 'All',
      region: 'All',
      contractor: null,
      basemap: 'satellite',
      showMaritimeRoutes: true,
      showFaultLines: false,
      showSupplyBuffers: false,
      showBatchingPlants: false,
      materialFilters: {
        quarry: true,
        steel: true,
        cement: true,
        facade: true,
        batching: false,
      },
    },
  },
  {
    id: 'ikn',
    name: 'Fokus IKN Nusantara',
    shortName: 'IKN Hub',
    icon: '🏛️',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
    activeBorderClass: 'border-amber-500/70 text-amber-300 bg-amber-950/40',
    description: 'Klaster pembangunan Ibu Kota Nusantara dan jalur tongkang Palu - IKN',
    toastMessage: 'Mode IKN Aktif: Menampilkan klaster pembangunan Ibu Kota Nusantara.',
    settings: {
      categories: ['IKN', 'Transport', 'Water', 'Housing', 'Commercial & Private'],
      status: 'All',
      region: 'All',
      contractor: null,
      basemap: 'satellite',
      showMaritimeRoutes: true,
      showBatchingPlants: true,
      showSupplyBuffers: true,
      showFaultLines: false,
      materialFilters: {
        quarry: true,
        steel: true,
        cement: true,
        facade: true,
        batching: true,
      },
      camera: {
        center: [-0.97, 116.70],
        zoom: 11,
      },
    },
  },
];
