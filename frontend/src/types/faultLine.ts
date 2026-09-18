export interface FaultLineProperties {
  id: string;
  name: string;
  island: string;
  slip_rate_mm_year: number;
  fault_type: string;
  source: string;
  description?: string;
}

export interface FaultLineFeature {
  type: "Feature";
  id: string;
  geometry: {
    type: "LineString";
    coordinates: [number, number][]; // Array of [lon, lat]
  };
  properties: FaultLineProperties;
}

export interface FaultLineFeatureCollection {
  type: "FeatureCollection";
  metadata: {
    title: string;
    source: string;
    total_fault_lines: number;
  };
  features: FaultLineFeature[];
}

export interface NearestFaultResult {
  fault: FaultLineFeature;
  distanceKm: number;
  alertLevel: "high" | "moderate" | "distant";
  alertText: string;
  alertColor: string;
  badgeClass: string;
}
