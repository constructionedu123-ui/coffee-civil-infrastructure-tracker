import L from 'leaflet';

/**
 * Calculates total geodesic distance (in meters) along an array of [lat, lng] coordinates.
 */
export function calculatePolylineDistance(coords: [number, number][]): number {
  if (coords.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = L.latLng(coords[i][0], coords[i][1]);
    const p2 = L.latLng(coords[i + 1][0], coords[i + 1][1]);
    total += p1.distanceTo(p2);
  }
  return total;
}

/**
 * Calculates geodesic area (in square meters) of a spherical polygon defined by [lat, lng] coordinates.
 * Uses the spherical excess trapezoidal integral on the WGS84 sphere (R = 6,378,137m).
 */
export function calculateSphericalPolygonArea(coords: [number, number][]): number {
  if (coords.length < 3) return 0;
  const R = 6378137.0; // Earth radius in meters
  let total = 0;
  const n = coords.length;

  for (let i = 0; i < n; i++) {
    const prevPt = coords[(i - 1 + n) % n];
    const nextPt = coords[(i + 1) % n];
    const currPt = coords[i];

    const dLng = ((nextPt[1] - prevPt[1]) * Math.PI) / 180;
    const sinLat = Math.sin((currPt[0] * Math.PI) / 180);
    total += dLng * sinLat;
  }

  return Math.abs((total * R * R) / 2.0);
}

/**
 * Formats distance in meters or kilometers according to Indonesian civil engineering conventions.
 * e.g., '850 m' (< 1000m) or '4,25 km' (>= 1000m).
 */
export function formatDistance(meters: number): string {
  if (meters <= 0) return '0 m';
  if (meters < 1000) {
    return `${Math.round(meters).toLocaleString('id-ID')} m`;
  }
  const km = meters / 1000;
  return `${km.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} km`;
}

/**
 * Formats polygon area into Hectares (primary) and square meters (secondary).
 * e.g. '14,5 Ha' and '(145.000 m²)'.
 */
export function formatArea(m2: number): { primary: string; secondary: string } {
  if (m2 <= 0) {
    return {
      primary: '0 Ha',
      secondary: '(0 m²)',
    };
  }

  const ha = m2 / 10000;
  const haFormatted = ha >= 100
    ? ha.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    : ha >= 1
    ? ha.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : ha.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 3 });

  const m2Formatted = `(${Math.round(m2).toLocaleString('id-ID')} m²)`;

  return {
    primary: `${haFormatted} Ha`,
    secondary: m2Formatted,
  };
}
