export interface ShippingRouteProperties {
  id: string;
  name: string;
  corridor: string;
  origin: string;
  destination: string;
  cargo: string;
  vessel_type: string;
  transit_time: string;
  frequency: string;
  primary_material: string;
  color?: string;
  description: string;
}

export interface ShippingRouteFeature {
  type: 'Feature';
  geometry: {
    type: 'LineString';
    coordinates: [number, number][]; // [lon, lat][]
  };
  properties: ShippingRouteProperties;
}

export interface ShippingRouteFeatureCollection {
  type: 'FeatureCollection';
  features: ShippingRouteFeature[];
}

export interface PortHubProperties {
  id: string;
  name: string;
  city: string;
  port_type: string;
  cargo_focus: string;
  status: string;
  key_routes: string[];
}

export interface PortHubFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lon, lat]
  };
  properties: PortHubProperties;
}

export interface PortHubFeatureCollection {
  type: 'FeatureCollection';
  features: PortHubFeature[];
}
