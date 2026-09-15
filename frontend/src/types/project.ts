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
  contractor: string | null;
  province: string | null;
  regency: string | null;
  geocode_method: GeocodeMethod;
  source_url: string;
  source_name: 'KPPIP' | 'BPJT';
  scraped_at: string;
}


export interface ProjectFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
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
