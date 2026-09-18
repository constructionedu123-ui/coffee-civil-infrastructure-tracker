import { FaultLineFeature, NearestFaultResult } from "../types/faultLine";

/**
 * Calculates the shortest distance in km from a given coordinate [lat, lon]
 * to a 2D line segment between A [lonA, latA] and B [lonB, latB]
 * using equirectangular projection centered at point P.
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

  // Projection scalar t of P(0,0) onto segment AB
  let t = -(ax * dx + ay * dy) / lenSq;
  if (t < 0) t = 0;
  else if (t > 1) t = 1;

  const closeX = ax + t * dx;
  const closeY = ay + t * dy;

  return Math.sqrt(closeX * closeX + closeY * closeY);
}

/**
 * Calculates the minimum distance from [lat, lon] to any segment of a fault line
 */
export function distanceToFaultKm(
  lat: number,
  lon: number,
  fault: FaultLineFeature
): number {
  const coords = fault.geometry.coordinates;
  if (!coords || coords.length === 0) return Infinity;
  if (coords.length === 1) {
    const [fLon, fLat] = coords[0];
    const midLatRad = (lat * Math.PI) / 180;
    const dx = (fLon - lon) * Math.cos(midLatRad) * 111.32;
    const dy = (fLat - lat) * 110.574;
    return Math.sqrt(dx * dx + dy * dy);
  }

  let minDist = Infinity;
  for (let i = 0; i < coords.length - 1; i++) {
    const [lonA, latA] = coords[i];
    const [lonB, latB] = coords[i + 1];
    const d = distanceToSegmentKm(lat, lon, latA, lonA, latB, lonB);
    if (d < minDist) {
      minDist = d;
    }
  }

  return minDist;
}

/**
 * Finds the nearest active fault line to given coordinates and evaluates seismic alert level
 */
export function findNearestFaultLine(
  lat: number,
  lon: number,
  faultLines: FaultLineFeature[]
): NearestFaultResult | null {
  if (!faultLines || faultLines.length === 0) return null;

  let closestFault: FaultLineFeature | null = null;
  let minDistance = Infinity;

  for (const fault of faultLines) {
    const d = distanceToFaultKm(lat, lon, fault);
    if (d < minDistance) {
      minDistance = d;
      closestFault = fault;
    }
  }

  if (!closestFault) return null;

  const distanceKm = Math.round(minDistance * 10) / 10;

  if (distanceKm < 10) {
    return {
      fault: closestFault,
      distanceKm,
      alertLevel: "high",
      alertText:
        "🔴 High Seismic Proximity (< 10 km) — High Ductility & Peak Acceleration Design Required (SNI 1726)",
      alertColor: "#EF4444",
      badgeClass: "bg-red-500/20 text-red-300 border-red-500/40",
    };
  } else if (distanceKm <= 30) {
    return {
      fault: closestFault,
      distanceKm,
      alertLevel: "moderate",
      alertText: "🟡 Moderate Proximity (10–30 km)",
      alertColor: "#F59E0B",
      badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    };
  } else {
    return {
      fault: closestFault,
      distanceKm,
      alertLevel: "distant",
      alertText: "🟢 Distant from Major Mapped Active Faults (> 30 km)",
      alertColor: "#10B981",
      badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    };
  }
}
