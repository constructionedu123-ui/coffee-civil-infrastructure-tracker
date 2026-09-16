import { SieveItem, MixDesignInputs, MixDesignOutputs, MoistureInputs, MoistureCorrectionOutputs, GradingZone } from './types';

export function exportJMFToCSV(
  sieves: SieveItem[],
  finenessModulus: number,
  zone: GradingZone,
  inputs: MixDesignInputs,
  outputs: MixDesignOutputs,
  moisture: MoistureInputs,
  batching: MoistureCorrectionOutputs
) {
  const lines: string[] = [];

  // Header section
  lines.push('COFFEE CIVIL - CONCRETE JOB MIX FORMULA & SIEVE ANALYSIS REPORT');
  lines.push(`Generated on,${new Date().toISOString()}`);
  lines.push(`Standard,SNI 7656:2012 / ACI 211.1 & ASTM C136`);
  lines.push('');

  // 1. Target Parameters
  lines.push('--- TARGET PARAMETERS ---');
  lines.push(`Target Strength f\'c (MPa),${inputs.targetStrengthMPa}`);
  lines.push(`Equivalent Cube K-Value,K-${inputs.kValue}`);
  lines.push(`Target Slump Range (cm),${inputs.slumpRange}`);
  lines.push(`Coarse Aggregate Max Size (mm),${inputs.coarseAggregateMaxSizeMm}`);
  lines.push(`Fineness Modulus Sand (FM),${finenessModulus.toFixed(2)}`);
  lines.push(`Water-Cement Ratio (w/c),${outputs.waterCementRatio.toFixed(3)}`);
  lines.push(`Margin of Safety (MPa),${outputs.marginOfSafetyMPa.toFixed(1)}`);
  lines.push(`Required Compressive Strength f\'cr (MPa),${outputs.targetRequiredStrengthMPa.toFixed(1)}`);
  lines.push('');

  // 2. Specific Gravities
  lines.push('--- MATERIAL SPECIFIC GRAVITIES (BERAT JENIS) ---');
  lines.push(`Cement (g/cm3),${inputs.specificGravityCement}`);
  lines.push(`Fine Aggregate / Sand (g/cm3),${inputs.specificGravitySand}`);
  lines.push(`Coarse Aggregate / Gravel (g/cm3),${inputs.specificGravityGravel}`);
  lines.push('');

  // 3. Sieve Analysis Results
  lines.push(`--- AGGREGATE SIEVE ANALYSIS (${zone.name}) ---`);
  lines.push('Sieve Size,Opening (mm),Retained Weight (g),Individual Retained (%),Cumulative Retained (%),Cumulative Passing (%),Min Spec (%),Max Spec (%),Compliance');
  sieves.forEach((s) => {
    const limits = zone.limits[s.id];
    const minSpec = limits ? limits.min : '-';
    const maxSpec = limits ? limits.max : '-';
    let status = 'OK';
    if (limits) {
      if (s.cumulativePercentPassing < limits.min || s.cumulativePercentPassing > limits.max) {
        status = 'VIOLATION';
      }
    }
    lines.push(
      `"${s.name}",${s.openingMm},${s.retainedWeightGrams},${(s.individualPercentRetained ?? 0).toFixed(2)},${(s.cumulativePercentRetained ?? 0).toFixed(2)},${s.cumulativePercentPassing.toFixed(2)},${minSpec},${maxSpec},${status}`
    );
  });
  lines.push(`Fineness Modulus (FM),,,,,${finenessModulus.toFixed(2)},,,${finenessModulus >= 2.3 && finenessModulus <= 3.1 ? 'PASS' : 'OUT OF RANGE'}`);
  lines.push('');

  // 4. Mix Design Proportions (1 m3 Theoretical SSD)
  lines.push('--- THEORETICAL 1 M3 SSD MIX PROPORTIONS ---');
  lines.push('Material,Weight (kg/m3),Absolute Volume (m3),Weight Ratio');
  lines.push(`Water,${outputs.waterKg.toFixed(1)},${outputs.volumes.waterM3.toFixed(3)},${outputs.mixRatio.waterRatio.toFixed(2)}`);
  lines.push(`Cement,${outputs.cementKg.toFixed(1)},${outputs.volumes.cementM3.toFixed(3)},1.00`);
  lines.push(`Fine Aggregate (Sand SSD),${outputs.fineAggregateKg.toFixed(1)},${outputs.volumes.fineAggregateM3.toFixed(3)},${outputs.mixRatio.sand.toFixed(2)}`);
  lines.push(`Coarse Aggregate (Gravel SSD),${outputs.coarseAggregateKg.toFixed(1)},${outputs.volumes.coarseAggregateM3.toFixed(3)},${outputs.mixRatio.gravel.toFixed(2)}`);
  lines.push(`Entrapped Air,-,${outputs.volumes.airM3.toFixed(3)},-`);
  lines.push(`Total Concrete Yield,${(outputs.waterKg + outputs.cementKg + outputs.fineAggregateKg + outputs.coarseAggregateKg).toFixed(1)},${outputs.totalVolume.toFixed(3)},-`);
  lines.push('');

  // 5. Field Moisture Correction & Truck Batching
  lines.push('--- FIELD MOISTURE CORRECTION & BATCH TICKET ---');
  lines.push(`Batch Volume Multiplier,${batching.batchVolumeM3} m3`);
  lines.push(`Sand Moisture (%),${moisture.sandMoisturePercent}% (Absorption: ${moisture.sandAbsorptionPercent}%) -> Free Water: ${batching.sandFreeMoisturePercent.toFixed(2)}%`);
  lines.push(`Gravel Moisture (%),${moisture.gravelMoisturePercent}% (Absorption: ${moisture.gravelAbsorptionPercent}%) -> Free Water: ${batching.gravelFreeMoisturePercent.toFixed(2)}%`);
  lines.push(`Water Correction per m3,${batching.waterAdjustmentKgPerM3 > 0 ? '+' : ''}${batching.waterAdjustmentKgPerM3.toFixed(1)} L/m3`);
  lines.push(`Total Water Adjustment for Truck,${batching.totalActualWaterCorrectionKg > 0 ? '+' : ''}${batching.totalActualWaterCorrectionKg.toFixed(1)} Liters`);
  lines.push('');
  lines.push('Material,Theoretical 1m3 (kg),Actual Batching 1m3 (kg),Total Truck Batch (' + batching.batchVolumeM3 + ' m3) (kg)');
  lines.push(`Water (Liters),${outputs.waterKg.toFixed(1)},${batching.actualWaterKgPerM3.toFixed(1)},${batching.totalActualWaterKg.toFixed(1)}`);
  lines.push(`Cement,${outputs.cementKg.toFixed(1)},${batching.actualCementKgPerM3.toFixed(1)},${batching.totalActualCementKg.toFixed(1)}`);
  lines.push(`Fine Aggregate (Sand Wet),${outputs.fineAggregateKg.toFixed(1)},${batching.actualSandKgPerM3.toFixed(1)},${batching.totalActualSandKg.toFixed(1)}`);
  lines.push(`Coarse Aggregate (Gravel Wet),${outputs.coarseAggregateKg.toFixed(1)},${batching.actualGravelKgPerM3.toFixed(1)},${batching.totalActualGravelKg.toFixed(1)}`);

  const csvContent = 'data:text/csv;charset=utf-8,' + lines.map((e) => e).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `JMF_Report_${inputs.targetStrengthMPa}MPa_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function printJMFReport() {
  window.print();
}
