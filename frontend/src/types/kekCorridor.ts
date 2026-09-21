export type KekCategory =
  | 'Nikel & Baterai EV'
  | 'Tembaga & Smelter Logam'
  | 'Manufaktur Hijau & EV'
  | 'Petrokimia & Oleokimia'
  | 'Kesehatan / Pemerintahan';

export interface KekCorridorProperties {
  id: string;
  name: string;
  province: string;
  regency: string;
  category: KekCategory;
  status: 'KEK' | 'PSN' | 'Kawasan Industri Strategis';
  area_ha: number;
  investment_est: string;
  core_commodities: string;
  anchor_tenants: string[];
  connected_infrastructure: string;
  center_coords: [number, number]; // [lat, lon]
  description: string;
}

export interface KekCorridorFeature {
  type: 'Feature';
  geometry: {
    type: 'Polygon';
    coordinates: [number, number][][]; // [lon, lat][][]
  };
  properties: KekCorridorProperties;
}

export interface KekCorridorFeatureCollection {
  type: 'FeatureCollection';
  features: KekCorridorFeature[];
}
