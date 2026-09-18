import { BatchingPlantFeature } from "../types/batchingPlant";
import { MaterialHubFeature, MaterialHubType } from "../types/materialHub";

export interface ConcreteSupplyStatus {
  tier: "optimal" | "retarded" | "desert";
  label: string;
  badgeClass: string;
  dotClass: string;
  icon: string;
  technicalGuidance: string;
}

/**
 * Calculates great-circle distance between two decimal degree points in kilometers
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Categorizes supply radius based on standard civil engineering limits (ASTM C94 / SNI)
 */
export function getConcreteSupplyStatus(distanceKm: number): ConcreteSupplyStatus {
  if (distanceKm < 15) {
    return {
      tier: "optimal",
      label: "Commercial Ready-Mix Optimal",
      badgeClass: "bg-emerald-950/60 text-emerald-300 border-emerald-700/60",
      dotClass: "bg-emerald-400",
      icon: "🟢",
      technicalGuidance:
        "Within standard ASTM C94 / SNI 90-minute transit time limit for normal unretarded concrete mixes.",
    };
  } else if (distanceKm <= 30) {
    return {
      tier: "retarded",
      label: "Retarding Admixture Required",
      badgeClass: "bg-amber-950/60 text-amber-300 border-amber-700/60",
      dotClass: "bg-amber-400",
      icon: "🟡",
      technicalGuidance:
        "Extended haul distance (45–75 min transit). Requires ASTM C494 Type B/D retarding admixtures or hydration stabilizers to avoid cold joints.",
    };
  } else {
    return {
      tier: "desert",
      label: "Supply Desert (On-Site Batching Plant Recommended)",
      badgeClass: "bg-rose-950/60 text-rose-300 border-rose-700/60",
      dotClass: "bg-rose-400",
      icon: "🔴",
      technicalGuidance:
        "Commercial ready-mix unviable due to transit times exceeding initial set in tropical ambient temperatures. Dedicated on-site mobile batching plant or dry-batching recommended.",
    };
  }
}

export interface NearestBatchingPlantResult {
  plant: BatchingPlantFeature;
  distanceKm: number;
  status: ConcreteSupplyStatus;
}

/**
 * Finds the nearest commercial batching plants to given coordinates
 */
export function findNearestBatchingPlants(
  lat: number,
  lon: number,
  plants: BatchingPlantFeature[],
  limit: number = 3
): NearestBatchingPlantResult[] {
  if (!plants || plants.length === 0) return [];

  const withDistances = plants.map((plant) => {
    const [pLon, pLat] = plant.geometry.coordinates;
    const distanceKm = calculateHaversineDistanceKm(lat, lon, pLat, pLon);
    return {
      plant,
      distanceKm,
      status: getConcreteSupplyStatus(distanceKm),
    };
  });

  withDistances.sort((a, b) => a.distanceKm - b.distanceKm);
  return withDistances.slice(0, limit);
}

export interface NearestMaterialHubResult {
  hub: MaterialHubFeature;
  distanceKm: number;
}

/**
 * Finds the nearest material supply hubs of a given type (or any type) to given coordinates
 */
export function findNearestMaterialHubs(
  lat: number,
  lon: number,
  hubs: MaterialHubFeature[],
  typeFilter?: MaterialHubType,
  limit: number = 2
): NearestMaterialHubResult[] {
  if (!hubs || hubs.length === 0) return [];

  const filtered = typeFilter
    ? hubs.filter((h) => h.properties.hub_type === typeFilter)
    : hubs;

  const withDistances = filtered.map((hub) => {
    const [hLon, hLat] = hub.geometry.coordinates;
    const distanceKm = calculateHaversineDistanceKm(lat, lon, hLat, hLon);
    return {
      hub,
      distanceKm,
    };
  });

  withDistances.sort((a, b) => a.distanceKm - b.distanceKm);
  return withDistances.slice(0, limit);
}
