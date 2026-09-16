import { SieveItem, GradingZone } from './types';

// Standard ASTM / SNI Sieves definition
export const STANDARD_SIEVES: SieveItem[] = [
  {
    id: 'sieve-37_5',
    name: '37.5 mm (1.5")',
    openingMm: 37.5,
    openingMicrons: 37500,
    retainedWeightGrams: 0,
    cumulativePercentPassing: 100,
    isStandardFM: true,
    category: 'coarse',
  },
  {
    id: 'sieve-19_0',
    name: '19.0 mm (3/4")',
    openingMm: 19.0,
    openingMicrons: 19000,
    retainedWeightGrams: 0,
    cumulativePercentPassing: 100,
    isStandardFM: true,
    category: 'coarse',
  },
  {
    id: 'sieve-9_5',
    name: '9.5 mm (3/8")',
    openingMm: 9.5,
    openingMicrons: 9500,
    retainedWeightGrams: 0,
    cumulativePercentPassing: 100,
    isStandardFM: true,
    category: 'coarse',
  },
  {
    id: 'sieve-4_75',
    name: '4.75 mm (No. 4)',
    openingMm: 4.75,
    openingMicrons: 4750,
    retainedWeightGrams: 15,
    cumulativePercentPassing: 97,
    isStandardFM: true,
    category: 'coarse',
  },
  {
    id: 'sieve-2_36',
    name: '2.36 mm (No. 8)',
    openingMm: 2.36,
    openingMicrons: 2360,
    retainedWeightGrams: 60,
    cumulativePercentPassing: 85,
    isStandardFM: true,
    category: 'fine',
  },
  {
    id: 'sieve-1_18',
    name: '1.18 mm (No. 16)',
    openingMm: 1.18,
    openingMicrons: 1180,
    retainedWeightGrams: 110,
    cumulativePercentPassing: 63,
    isStandardFM: true,
    category: 'fine',
  },
  {
    id: 'sieve-0_600',
    name: '600 µm (No. 30)',
    openingMm: 0.60,
    openingMicrons: 600,
    retainedWeightGrams: 125,
    cumulativePercentPassing: 38,
    isStandardFM: true,
    category: 'fine',
  },
  {
    id: 'sieve-0_300',
    name: '300 µm (No. 50)',
    openingMm: 0.30,
    openingMicrons: 300,
    retainedWeightGrams: 100,
    cumulativePercentPassing: 18,
    isStandardFM: true,
    category: 'fine',
  },
  {
    id: 'sieve-0_150',
    name: '150 µm (No. 100)',
    openingMm: 0.15,
    openingMicrons: 150,
    retainedWeightGrams: 65,
    cumulativePercentPassing: 5,
    isStandardFM: true,
    category: 'fine',
  },
  {
    id: 'sieve-pan',
    name: 'Pan (< 150 µm)',
    openingMm: 0.0,
    openingMicrons: 75,
    retainedWeightGrams: 25,
    cumulativePercentPassing: 0,
    isStandardFM: false,
    category: 'pan',
  },
];

// Presets for quick lab demonstrations
export const SIEVE_PRESETS: Record<string, { name: string; weights: Record<string, number> }> = {
  natural_sand_zona2: {
    name: 'Pasir Alami Zona 2 (Compliant SNI)',
    weights: {
      'sieve-37_5': 0,
      'sieve-19_0': 0,
      'sieve-9_5': 0,
      'sieve-4_75': 15, // 97% passing
      'sieve-2_36': 65, // 84% passing
      'sieve-1_18': 110, // 62% passing
      'sieve-0_600': 125, // 37% passing
      'sieve-0_300': 105, // 16% passing
      'sieve-0_150': 55,  // 5% passing
      'sieve-pan': 25,
    },
  },
  coarse_sand_zona1: {
    name: 'Pasir Kasar Zona 1 (High FM)',
    weights: {
      'sieve-37_5': 0,
      'sieve-19_0': 0,
      'sieve-9_5': 0,
      'sieve-4_75': 45,
      'sieve-2_36': 120,
      'sieve-1_18': 130,
      'sieve-0_600': 110,
      'sieve-0_300': 60,
      'sieve-0_150': 25,
      'sieve-pan': 10,
    },
  },
  fine_sand_zona3: {
    name: 'Pasir Agak Halus Zona 3',
    weights: {
      'sieve-37_5': 0,
      'sieve-19_0': 0,
      'sieve-9_5': 0,
      'sieve-4_75': 5,
      'sieve-2_36': 30,
      'sieve-1_18': 75,
      'sieve-0_600': 120,
      'sieve-0_300': 140,
      'sieve-0_150': 90,
      'sieve-pan': 40,
    },
  },
  coarse_aggregate_20mm: {
    name: 'Kerikil / Split 20 mm (ASTM C33 Size 57)',
    weights: {
      'sieve-37_5': 0,
      'sieve-19_0': 150,
      'sieve-9_5': 900,
      'sieve-4_75': 800,
      'sieve-2_36': 120,
      'sieve-1_18': 20,
      'sieve-0_600': 5,
      'sieve-0_300': 3,
      'sieve-0_150': 2,
      'sieve-pan': 0,
    },
  },
};

// Official Grading Zones (SNI 03-2834-2000 & ASTM C33)
export const GRADING_ZONES: GradingZone[] = [
  {
    id: 'sni_zona_2',
    name: 'SNI Zona 2 (Pasir Agak Kasar)',
    description: 'Batas gradasi standar ideal untuk beton struktural normal (SNI 03-2834)',
    type: 'fine',
    limits: {
      'sieve-9_5': { min: 100, max: 100 },
      'sieve-4_75': { min: 90, max: 100 },
      'sieve-2_36': { min: 75, max: 100 },
      'sieve-1_18': { min: 55, max: 90 },
      'sieve-0_600': { min: 35, max: 59 },
      'sieve-0_300': { min: 8, max: 30 },
      'sieve-0_150': { min: 0, max: 10 },
      'sieve-pan': { min: 0, max: 0 },
    },
  },
  {
    id: 'sni_zona_1',
    name: 'SNI Zona 1 (Pasir Kasar)',
    description: 'Gradasi pasir berbutir kasar untuk beton mutu tinggi (SNI 03-2834)',
    type: 'fine',
    limits: {
      'sieve-9_5': { min: 100, max: 100 },
      'sieve-4_75': { min: 90, max: 100 },
      'sieve-2_36': { min: 60, max: 95 },
      'sieve-1_18': { min: 30, max: 70 },
      'sieve-0_600': { min: 15, max: 34 },
      'sieve-0_300': { min: 5, max: 20 },
      'sieve-0_150': { min: 0, max: 10 },
      'sieve-pan': { min: 0, max: 0 },
    },
  },
  {
    id: 'sni_zona_3',
    name: 'SNI Zona 3 (Pasir Agak Halus)',
    description: 'Gradasi pasir berbutir agak halus (SNI 03-2834)',
    type: 'fine',
    limits: {
      'sieve-9_5': { min: 100, max: 100 },
      'sieve-4_75': { min: 90, max: 100 },
      'sieve-2_36': { min: 85, max: 100 },
      'sieve-1_18': { min: 75, max: 100 },
      'sieve-0_600': { min: 60, max: 79 },
      'sieve-0_300': { min: 12, max: 40 },
      'sieve-0_150': { min: 0, max: 10 },
      'sieve-pan': { min: 0, max: 0 },
    },
  },
  {
    id: 'sni_zona_4',
    name: 'SNI Zona 4 (Pasir Halus)',
    description: 'Gradasi pasir berbutir halus (SNI 03-2834)',
    type: 'fine',
    limits: {
      'sieve-9_5': { min: 100, max: 100 },
      'sieve-4_75': { min: 95, max: 100 },
      'sieve-2_36': { min: 95, max: 100 },
      'sieve-1_18': { min: 90, max: 100 },
      'sieve-0_600': { min: 80, max: 100 },
      'sieve-0_300': { min: 15, max: 50 },
      'sieve-0_150': { min: 0, max: 15 },
      'sieve-pan': { min: 0, max: 0 },
    },
  },
  {
    id: 'astm_c33_fine',
    name: 'ASTM C33 Fine Aggregate',
    description: 'Standard specification for concrete fine aggregates (ASTM C33 Table 1)',
    type: 'fine',
    limits: {
      'sieve-9_5': { min: 100, max: 100 },
      'sieve-4_75': { min: 95, max: 100 },
      'sieve-2_36': { min: 80, max: 100 },
      'sieve-1_18': { min: 50, max: 85 },
      'sieve-0_600': { min: 25, max: 60 },
      'sieve-0_300': { min: 5, max: 30 },
      'sieve-0_150': { min: 0, max: 10 },
      'sieve-pan': { min: 0, max: 0 },
    },
  },
  {
    id: 'astm_c33_coarse_57',
    name: 'ASTM C33 Size 57 (4.75mm - 25mm Coarse)',
    description: 'Standard specification for coarse aggregates (ASTM C33 Size 57)',
    type: 'coarse',
    limits: {
      'sieve-37_5': { min: 100, max: 100 },
      'sieve-19_0': { min: 95, max: 100 },
      'sieve-9_5': { min: 25, max: 60 },
      'sieve-4_75': { min: 0, max: 10 },
      'sieve-2_36': { min: 0, max: 5 },
      'sieve-1_18': { min: 0, max: 0 },
      'sieve-0_600': { min: 0, max: 0 },
      'sieve-0_300': { min: 0, max: 0 },
      'sieve-0_150': { min: 0, max: 0 },
      'sieve-pan': { min: 0, max: 0 },
    },
  },
];

// Common Indonesian K-Value options and their equivalent cylinder f'c in MPa
// Standard SNI conversion: f'c (MPa) ≈ K * 0.083 * 0.981 ≈ K * 0.081423
export const K_VALUE_PRESETS = [
  { k: 175, fc: 14.25, label: 'K-175 (14.3 MPa - Non-struktural)' },
  { k: 225, fc: 18.32, label: 'K-225 (18.3 MPa - Plat/Balok Rumah)' },
  { k: 250, fc: 20.36, label: 'K-250 (20.4 MPa - Standar Bangunan)' },
  { k: 300, fc: 24.43, label: 'K-300 (24.4 MPa - Kolom & Jembatan)' },
  { k: 350, fc: 28.50, label: 'K-350 (28.5 MPa - Rigid Pavement)' },
  { k: 400, fc: 32.57, label: 'K-400 (32.6 MPa - Girder Precast)' },
  { k: 500, fc: 40.71, label: 'K-500 (40.7 MPa - High Strength)' },
];

export function convertKtoFc(k: number): number {
  return Number((k * 0.083 * 0.981).toFixed(2));
}

export function convertFctoK(fc: number): number {
  return Math.round(fc / (0.083 * 0.981));
}

// ACI 211.1 / SNI 7656:2012 Table 2: Water requirement (kg/m³) for non-air-entrained concrete
// based on slump and MSA (Max Size Aggregate)
export const WATER_REQUIREMENT_TABLE: Record<string, { 19: number; 25: number; entrappedAir: number }> = {
  '3-5': { 19: 190, 25: 179, entrappedAir: 0.02 },
  '8-10': { 19: 205, 25: 193, entrappedAir: 0.02 },
  '10-12': { 19: 216, 25: 202, entrappedAir: 0.015 },
  '15-18': { 19: 228, 25: 212, entrappedAir: 0.015 },
};

// ACI 211.1 Table 6.3.4(a): Water-cement ratio vs 28-day compressive strength (non-air-entrained)
// Interpolated curve:
export function calculateWaterCementRatio(fcrMPa: number): number {
  // Typical data points [fcr, w/c]:
  // 45 MPa -> 0.38
  // 40 MPa -> 0.42
  // 35 MPa -> 0.47
  // 30 MPa -> 0.54
  // 25 MPa -> 0.61
  // 20 MPa -> 0.69
  // 15 MPa -> 0.79
  if (fcrMPa >= 45) return 0.38;
  if (fcrMPa <= 15) return 0.79;

  const points = [
    { fc: 45, wc: 0.38 },
    { fc: 40, wc: 0.42 },
    { fc: 35, wc: 0.47 },
    { fc: 30, wc: 0.54 },
    { fc: 25, wc: 0.61 },
    { fc: 20, wc: 0.69 },
    { fc: 15, wc: 0.79 },
  ];

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    if (fcrMPa <= p1.fc && fcrMPa >= p2.fc) {
      const ratio = (fcrMPa - p2.fc) / (p1.fc - p2.fc);
      const wc = p2.wc + ratio * (p1.wc - p2.wc);
      return Number(wc.toFixed(3));
    }
  }

  return 0.50;
}

// ACI 211.1 Table 6.3.6: Dry-rodded volume of coarse aggregate per unit volume of concrete
// vs Fineness Modulus of fine aggregate (FM: 2.40, 2.60, 2.80, 3.00)
export function getCoarseAggregateVolumeFactor(msaMm: 19 | 25, fmSand: number): number {
  const clampedFM = Math.max(2.4, Math.min(3.0, fmSand));

  // Table values for 19mm: FM 2.40 -> 0.66, FM 2.60 -> 0.64, FM 2.80 -> 0.62, FM 3.00 -> 0.60
  // Table values for 25mm: FM 2.40 -> 0.71, FM 2.60 -> 0.69, FM 2.80 -> 0.67, FM 3.00 -> 0.65
  const base19 = 0.66 - ((clampedFM - 2.4) / 0.2) * 0.02;
  const base25 = 0.71 - ((clampedFM - 2.4) / 0.2) * 0.02;

  const factor = msaMm === 19 ? base19 : base25;
  return Number(factor.toFixed(3));
}

// Safety margin according to SNI 7656 / ACI (when standard deviation unknown)
export function getRequiredStrength(fcMPa: number): { fcr: number; margin: number } {
  let margin = 7.0;
  if (fcMPa < 21) {
    margin = 7.0;
  } else if (fcMPa <= 35) {
    margin = 8.3;
  } else {
    margin = 1.1 * fcMPa + 5.0 - fcMPa; // approx 8.5 - 10.0 MPa
  }
  const fcr = Number((fcMPa + margin).toFixed(2));
  return { fcr, margin };
}
