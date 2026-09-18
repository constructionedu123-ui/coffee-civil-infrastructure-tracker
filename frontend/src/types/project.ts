export type ProjectCategory = 'Transport' | 'Energy' | 'Water' | 'Housing' | 'IKN';

export type ProjectStatus = 'Planning' | 'Construction' | 'Operational' | 'Completed' | 'Unknown';

export type GeocodeMethod =
  | 'exact_kabupaten'
  | 'province_fallback'
  | 'hardcoded'
  | 'national_fallback'
  | 'unresolved';

export interface ProjectProperties {
  project_id: string;
  project_name: string;
  category: ProjectCategory;
  status: ProjectStatus;
  budget_idr: number | null;
  budget_raw: string | null;
  funding_scheme?: string | null;
  pjpk?: string | null;
  unor?: string | null;
  balai?: string | null;
  fiscal_year?: string | null;
  progress?: number | null;
  bim_viewer_url?: string | null;
  bim_uuid?: string | null;
  contractor: string | null;
  province: string | null;
  regency: string | null;
  geocode_method: GeocodeMethod;
  source_url: string;
  source_name: 'KPPIP' | 'BPJT' | 'Kementerian PU (BIM)' | string;
  scraped_at: string;
}


export interface ProjectFeature {
  type: 'Feature';
  geometry:
    | { type: 'Point'; coordinates: [number, number] }
    | { type: 'LineString'; coordinates: [number, number][] }
    | { type: 'MultiLineString'; coordinates: [number, number][][] };
  properties: ProjectProperties;
}

export interface ProjectFeatureCollection {
  type: 'FeatureCollection';
  metadata: {
    total_features: number;
    unresolved_count: number;
    source: string;
  };
  features: ProjectFeature[];
}

export interface FilterState {
  searchQuery: string;
  selectedCategories: ProjectCategory[];
  selectedStatus: ProjectStatus | 'All';
  selectedRegion: string | 'All';
}

/**
 * Safely extracts a representative [lon, lat] coordinate pair from any supported GeoJSON geometry
 */
export function getProjectCoordinates(geometry: ProjectFeature['geometry']): [number, number] {
  if (geometry.type === 'Point') {
    return geometry.coordinates;
  }
  if (geometry.type === 'LineString') {
    return geometry.coordinates[0] || [0, 0];
  }
  if (geometry.type === 'MultiLineString') {
    return geometry.coordinates[0]?.[0] || [0, 0];
  }
  return [0, 0];
}

