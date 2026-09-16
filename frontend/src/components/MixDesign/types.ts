// Data contracts and types for Concrete Mix Design & Sieve Analysis Simulator

export interface SieveItem {
  id: string;
  name: string; // e.g. "37.5 mm (1.5\")", "4.75 mm (No. 4)"
  openingMm: number;
  openingMicrons: number;
  retainedWeightGrams: number;
  individualPercentRetained?: number;
  cumulativePercentRetained?: number;
  cumulativePercentPassing: number; // 0 - 100
  isStandardFM: boolean; // Included in ASTM/SNI Fineness Modulus calculation
  category: 'coarse' | 'fine' | 'pan';
}

export interface EnvelopeLimit {
  min: number;
  max: number;
}

export interface GradingZone {
  id: string;
  name: string;
  description: string;
  type: 'fine' | 'coarse';
  limits: Record<string, EnvelopeLimit>; // Sieve id -> min/max
}

export type SieveInputMode = 'weight' | 'passing';

export interface MixDesignInputs {
  targetStrengthType: 'fc' | 'K';
  targetStrengthMPa: number; // f'c in MPa (cylinder)
  kValue: number; // K value (cube)
  slumpRange: string; // "3-5", "8-10", "10-12", "15-18"
  coarseAggregateMaxSizeMm: 19 | 25;
  specificGravityCement: number; // Default: 3.15
  specificGravitySand: number; // Default: 2.60
  specificGravityGravel: number; // Default: 2.65
  finenessModulusSand: number; // From Sieve module or manual (e.g. 2.80)
  dryRoddedUnitWeightGravel: number; // kg/m³, default 1600
  entrappedAirPercent: number; // default 1.5% or 2.0%
}

export interface MixDesignOutputs {
  waterKg: number;
  cementKg: number;
  coarseAggregateKg: number;
  fineAggregateKg: number;
  waterCementRatio: number;
  totalVolume: number;
  volumes: {
    waterM3: number;
    cementM3: number;
    airM3: number;
    coarseAggregateM3: number;
    fineAggregateM3: number;
  };
  mixRatio: {
    cement: number;
    sand: number;
    gravel: number;
    waterRatio: number;
  };
  marginOfSafetyMPa: number;
  targetRequiredStrengthMPa: number;
}

export interface MoistureInputs {
  sandMoisturePercent: number; // Field moisture w (%)
  sandAbsorptionPercent: number; // Absorption a (%)
  gravelMoisturePercent: number; // Field moisture w (%)
  gravelAbsorptionPercent: number; // Absorption a (%)
  batchVolumeM3: number; // Multiplier (1, 3, 6, 7, etc.)
}

export interface MoistureCorrectionOutputs {
  sandFreeMoisturePercent: number; // w - a
  gravelFreeMoisturePercent: number; // w - a
  waterAdjustmentKgPerM3: number; // Negative means DEDUCT water, Positive means ADD water
  actualWaterKgPerM3: number;
  actualSandKgPerM3: number;
  actualGravelKgPerM3: number;
  actualCementKgPerM3: number;
  // Scaled by batch volume
  batchVolumeM3: number;
  totalActualWaterKg: number;
  totalActualCementKg: number;
  totalActualSandKg: number;
  totalActualGravelKg: number;
  totalActualWaterCorrectionKg: number;
}
