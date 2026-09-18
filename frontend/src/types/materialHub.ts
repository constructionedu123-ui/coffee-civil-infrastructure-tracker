export type MaterialHubType =
  | 'Quarry (Pasir & Agregat)'
  | 'Baja Konstruksi (Steel Mills)'
  | 'Pabrik Semen Terpadu'
  | 'Fasad & Kaca (Architectural Facade)';

export interface MaterialHubProperties {
  id: string;
  name: string;
  operator: string;
  hub_type: MaterialHubType;
  capacity_output: string;
  key_supplied_markets: string;
  city: string;
  province: string;
  special_feature?: string;
}

export interface MaterialHubFeature {
  type: 'Feature';
  id: string;
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lon, lat]
  };
  properties: MaterialHubProperties;
}

export interface MaterialHubFeatureCollection {
  type: 'FeatureCollection';
  metadata: {
    total_features: number;
    category: string;
    source: string;
  };
  features: MaterialHubFeature[];
}
