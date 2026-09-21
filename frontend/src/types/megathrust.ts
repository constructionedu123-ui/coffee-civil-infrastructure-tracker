export type MegathrustThreatLevel = 'extreme' | 'high' | 'moderate';

export interface MegathrustProperties {
  id: string;
  name: string;
  segment_zone: string;
  mw_max: number;
  slip_rate_cm_year: number;
  seismic_gap_status: string;
  is_seismic_gap: boolean;
  tsunami_potential: string;
  threat_level: MegathrustThreatLevel;
  historical_events: string;
  recurrence_period: string;
  structural_recommendation: string;
  center_coords: [number, number]; // [lat, lon]
}

export interface MegathrustFeature {
  type: "Feature";
  id: string;
  geometry: {
    type: "Polygon" | "LineString";
    coordinates: any;
  };
  properties: MegathrustProperties;
}

export interface MegathrustFeatureCollection {
  type: "FeatureCollection";
  metadata: {
    title: string;
    source: string;
    version: string;
    total_segments: number;
  };
  features: MegathrustFeature[];
}

export interface NearestMegathrustResult {
  zone: MegathrustFeature;
  distanceKm: number;
  isTsunamiThreat: boolean; // distanceKm < 200 km
  alertLevel: 'extreme' | 'high' | 'moderate' | 'safe';
  badgeClass: string;
  alertText: string;
}
