export type BatchingPlantOperator =
  | "WIKA Beton"
  | "Pionirbeton"
  | "SCG Jayamix"
  | "Semen Indonesia Beton"
  | "Waskita Beton Precast"
  | "Adhi Beton"
  | string;

export interface BatchingPlantProperties {
  id: string;
  name: string;
  operator: BatchingPlantOperator;
  type: string;
  city: string;
  province: string;
  capacity_m3_per_hour: number;
}

export interface BatchingPlantFeature {
  type: "Feature";
  id: string;
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [lon, lat]
  };
  properties: BatchingPlantProperties;
}

export interface BatchingPlantFeatureCollection {
  type: "FeatureCollection";
  metadata: {
    total_features: number;
    category: string;
    source: string;
  };
  features: BatchingPlantFeature[];
}
