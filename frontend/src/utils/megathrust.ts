import {
  MegathrustFeature,
  MegathrustProperties,
  NearestMegathrustResult,
} from '../types/megathrust';

/**
 * Calculates the shortest distance in km from a coordinate [pLat, pLon]
 * to a line segment between [lonA, latA] and [lonB, latB]
 * using equirectangular projection centered at P.
 */
export function distanceToSegmentKm(
  pLat: number,
  pLon: number,
  latA: number,
  lonA: number,
  latB: number,
  lonB: number
): number {
  const midLatRad = (pLat * Math.PI) / 180;
  const kx = Math.cos(midLatRad) * 111.32;
  const ky = 110.574;

  const ax = (lonA - pLon) * kx;
  const ay = (latA - pLat) * ky;

  const bx = (lonB - pLon) * kx;
  const by = (latB - pLat) * ky;

  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    return Math.sqrt(ax * ax + ay * ay);
  }

  let t = -(ax * dx + ay * dy) / lenSq;
  if (t < 0) t = 0;
  else if (t > 1) t = 1;

  const closeX = ax + t * dx;
  const closeY = ay + t * dy;

  return Math.sqrt(closeX * closeX + closeY * closeY);
}

/**
 * Point-in-polygon ray casting check.
 * Coordinates are [lon, lat].
 */
export function isPointInPolygon(
  lat: number,
  lon: number,
  ring: [number, number][]
): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];

    const intersect =
      yi > lat !== yj > lat &&
      lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Minimum distance in km from [lat, lon] to any edge or interior of a megathrust polygon
 */
export function distanceToMegathrustKm(
  lat: number,
  lon: number,
  feature: MegathrustFeature
): number {
  const geom = feature.geometry;
  if (!geom || !geom.coordinates) return Infinity;

  // If Polygon, coordinates is [ [ [lon, lat], ... ] ]
  let rings: [number, number][][] = [];
  if (geom.type === 'Polygon') {
    rings = geom.coordinates as [number, number][][];
  } else if (geom.type === 'LineString') {
    rings = [geom.coordinates as [number, number][]];
  }

  if (rings.length === 0 || rings[0].length === 0) return Infinity;

  // Check if inside exterior ring
  if (geom.type === 'Polygon' && isPointInPolygon(lat, lon, rings[0])) {
    return 0;
  }

  let minDist = Infinity;
  for (const ring of rings) {
    for (let i = 0; i < ring.length - 1; i++) {
      const [lonA, latA] = ring[i];
      const [lonB, latB] = ring[i + 1];
      const d = distanceToSegmentKm(lat, lon, latA, lonA, latB, lonB);
      if (d < minDist) {
        minDist = d;
      }
    }
  }

  return minDist;
}

/**
 * Finds the nearest megathrust subduction segment to given coordinates
 */
export function findNearestMegathrustZone(
  lat: number,
  lon: number,
  zones: MegathrustFeature[]
): NearestMegathrustResult | null {
  if (!zones || zones.length === 0) return null;

  let closestZone: MegathrustFeature | null = null;
  let minDistance = Infinity;

  for (const zone of zones) {
    const d = distanceToMegathrustKm(lat, lon, zone);
    if (d < minDistance) {
      minDistance = d;
      closestZone = zone;
    }
  }

  if (!closestZone) return null;

  const distanceKm = Math.round(minDistance * 10) / 10;

  if (distanceKm < 100) {
    return {
      zone: closestZone,
      distanceKm,
      isTsunamiThreat: true,
      alertLevel: 'extreme',
      badgeClass: 'bg-red-500/25 text-red-300 border-red-500/60 shadow-[0_0_12px_rgba(239,68,68,0.3)]',
      alertText:
        '🔴 Zona Bahaya Kritis Megathrust (< 100 km) — Risiko Sangat Tinggi Deformasi Gempa Mw 8.5+ & Hempasan Tsunami Pesisir (SNI 1726 Kategori Desain E/F)',
    };
  } else if (distanceKm < 200) {
    return {
      zone: closestZone,
      distanceKm,
      isTsunamiThreat: true,
      alertLevel: 'high',
      badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.2)]',
      alertText:
        '🟠 Zona Pengaruh Megathrust & Bahaya Tsunami Pesisir (100–200 km) — Shelter Evakuasi Vertikal & Proteksi Seawall Diperlukan',
    };
  } else if (distanceKm < 350) {
    return {
      zone: closestZone,
      distanceKm,
      isTsunamiThreat: false,
      alertLevel: 'moderate',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      alertText:
        '🟡 Zona Penjalaran Gelombang Seismik (200–350 km) — Potensi Resonansi Struktur Tinggi & Amplifikasi Tanah Lunak',
    };
  } else {
    return {
      zone: closestZone,
      distanceKm,
      isTsunamiThreat: false,
      alertLevel: 'safe',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      alertText: '🟢 Jarak Aman Relatif dari Megathrust Subduksi Utama (> 350 km)',
    };
  }
}

/**
 * Returns color style based on segment properties
 */
export function getMegathrustSegmentStyle(properties: MegathrustProperties) {
  if (properties.is_seismic_gap || properties.threat_level === 'extreme') {
    return {
      color: '#DC2626',
      fillColor: '#EF4444',
      glowShadow: 'rgba(239, 68, 68, 0.7)',
      badgeBg: 'bg-red-600',
      tagText: 'SEISMIC GAP KRITIS',
    };
  }
  return {
    color: '#EA580C',
    fillColor: '#F97316',
    glowShadow: 'rgba(249, 115, 22, 0.6)',
    badgeBg: 'bg-orange-600',
    tagText: 'SUBDUKSI AKTIF',
  };
}
