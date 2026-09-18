import React, { useState, useMemo } from 'react';
import {
  Layers,
  Calculator,
  Truck,
  LayoutDashboard,
} from 'lucide-react';
import {
  SieveItem,
  GradingZone,
  MixDesignInputs,
  MixDesignOutputs,
  MoistureInputs,
  MoistureCorrectionOutputs,
} from './types';
import {
  STANDARD_SIEVES,
  GRADING_ZONES,
  SIEVE_PRESETS,
  WATER_REQUIREMENT_TABLE,
  calculateWaterCementRatio,
  getCoarseAggregateVolumeFactor,
  getRequiredStrength,
} from './constants';
import { SieveAnalysisModule } from './SieveAnalysisModule';
import { JobMixFormulaModule } from './JobMixFormulaModule';
import { FieldCorrectionModule } from './FieldCorrectionModule';
import { exportJMFToCSV, printJMFReport } from './exportUtils';
import { MixDesignHeader } from './MixDesignHeader';

export const MixDesignSimulator: React.FC = () => {
  // Active Tab state inside simulator: 'all' | 'sieve' | 'jmf' | 'moisture'
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'sieve' | 'jmf' | 'moisture'>('all');

  // --- 1. Sieve Analysis State ---
  const initialSieves = useMemo(() => {
    const preset = SIEVE_PRESETS.natural_sand_zona2;
    const initial = STANDARD_SIEVES.map((s) => ({
      ...s,
      retainedWeightGrams: preset.weights[s.id] ?? 0,
    }));
    const total = initial.reduce((a, b) => a + b.retainedWeightGrams, 0);
    let cumulativeRetained = 0;
    return initial.map((s) => {
      const indRet = total > 0 ? (s.retainedWeightGrams / total) * 100 : 0;
      cumulativeRetained += indRet;
      return {
        ...s,
        individualPercentRetained: Number(indRet.toFixed(2)),
        cumulativePercentRetained: Number(cumulativeRetained.toFixed(2)),
        cumulativePercentPassing: Number(Math.max(0, 100 - cumulativeRetained).toFixed(2)),
      };
    });
  }, []);

  const [sieves, setSieves] = useState<SieveItem[]>(initialSieves);
  const [selectedZone, setSelectedZone] = useState<GradingZone>(GRADING_ZONES[0]); // SNI Zona 2

  // Compute Fineness Modulus (FM) automatically
  // FM = Sum of cumulative % retained on standard sieves (150µm, 300µm, 600µm, 1.18mm, 2.36mm, 4.75mm, 9.5mm, 19mm, 37.5mm) / 100
  const finenessModulus = useMemo(() => {
    const standardFMIds = [
      'sieve-0_150',
      'sieve-0_300',
      'sieve-0_600',
      'sieve-1_18',
      'sieve-2_36',
      'sieve-4_75',
      'sieve-9_5',
      'sieve-19_0',
      'sieve-37_5',
    ];
    let sumCumulativeRetained = 0;
    sieves.forEach((s) => {
      if (standardFMIds.includes(s.id)) {
        sumCumulativeRetained += s.cumulativePercentRetained ?? 0;
      }
    });
    return Number((sumCumulativeRetained / 100).toFixed(2));
  }, [sieves]);

  // --- 2. Job Mix Formula Inputs State ---
  const [mixInputs, setMixInputs] = useState<MixDesignInputs>({
    targetStrengthType: 'fc',
    targetStrengthMPa: 25,
    kValue: 300,
    slumpRange: '8-10',
    coarseAggregateMaxSizeMm: 19,
    specificGravityCement: 3.15,
    specificGravitySand: 2.6,
    specificGravityGravel: 2.65,
    finenessModulusSand: 2.8,
    dryRoddedUnitWeightGravel: 1600,
    entrappedAirPercent: 0.02,
  });

  // Calculate ACI 211 / SNI 7656 Outputs
  const mixOutputs = useMemo<MixDesignOutputs>(() => {
    const { fcr, margin } = getRequiredStrength(mixInputs.targetStrengthMPa);
    const wc = calculateWaterCementRatio(fcr);

    // Water requirement from Table 2
    const waterTableEntry = WATER_REQUIREMENT_TABLE[mixInputs.slumpRange] || WATER_REQUIREMENT_TABLE['8-10'];
    const waterKg = waterTableEntry[mixInputs.coarseAggregateMaxSizeMm] || 205;
    const airVolume = waterTableEntry.entrappedAir;

    // Cement content
    const cementKg = Number((waterKg / wc).toFixed(1));

    // Coarse Aggregate from Table 6.3.6 (using dynamic FM from sieve analysis or clamped)
    const effectiveFM = finenessModulus > 1.5 && finenessModulus < 4.0 ? finenessModulus : mixInputs.finenessModulusSand;
    const coarseFactor = getCoarseAggregateVolumeFactor(mixInputs.coarseAggregateMaxSizeMm, effectiveFM);
    const coarseAggregateKg = Number((coarseFactor * mixInputs.dryRoddedUnitWeightGravel).toFixed(1));

    // Absolute Volume Method (1 m³)
    const waterM3 = waterKg / 1000;
    const cementM3 = cementKg / (mixInputs.specificGravityCement * 1000);
    const coarseAggregateM3 = coarseAggregateKg / (mixInputs.specificGravityGravel * 1000);
    const airM3 = airVolume;

    // Remaining volume for Sand
    const fineAggregateM3 = Math.max(0, 1.0 - (waterM3 + cementM3 + coarseAggregateM3 + airM3));
    const fineAggregateKg = Number((fineAggregateM3 * mixInputs.specificGravitySand * 1000).toFixed(1));

    const totalVolume = Number((waterM3 + cementM3 + coarseAggregateM3 + airM3 + fineAggregateM3).toFixed(3));

    return {
      waterKg,
      cementKg,
      coarseAggregateKg,
      fineAggregateKg,
      waterCementRatio: wc,
      totalVolume,
      volumes: {
        waterM3: Number(waterM3.toFixed(3)),
        cementM3: Number(cementM3.toFixed(3)),
        airM3: Number(airM3.toFixed(3)),
        coarseAggregateM3: Number(coarseAggregateM3.toFixed(3)),
        fineAggregateM3: Number(fineAggregateM3.toFixed(3)),
      },
      mixRatio: {
        cement: 1.0,
        sand: Number((fineAggregateKg / cementKg).toFixed(2)),
        gravel: Number((coarseAggregateKg / cementKg).toFixed(2)),
        waterRatio: Number((waterKg / cementKg).toFixed(2)),
      },
      marginOfSafetyMPa: margin,
      targetRequiredStrengthMPa: fcr,
    };
  }, [mixInputs, finenessModulus]);

  // --- 3. Moisture Inputs State ---
  const [moistureInputs, setMoistureInputs] = useState<MoistureInputs>({
    sandMoisturePercent: 4.5,
    sandAbsorptionPercent: 1.5,
    gravelMoisturePercent: 1.8,
    gravelAbsorptionPercent: 0.8,
    batchVolumeM3: 7, // 7 m³ standard TM Truck
  });

  // Calculate Batching & Moisture Correction Outputs
  const batchingOutputs = useMemo<MoistureCorrectionOutputs>(() => {
    const sandFree = moistureInputs.sandMoisturePercent - moistureInputs.sandAbsorptionPercent;
    const gravelFree = moistureInputs.gravelMoisturePercent - moistureInputs.gravelAbsorptionPercent;

    // Water brought by aggregate per 1 m³ (kg or Liters)
    const waterFromSand = (mixOutputs.fineAggregateKg * sandFree) / 100;
    const waterFromGravel = (mixOutputs.coarseAggregateKg * gravelFree) / 100;
    const totalFreeWaterKg = waterFromSand + waterFromGravel;

    // Water adjustment per m³: Deduct positive free water
    const waterAdjustmentKgPerM3 = Number((-totalFreeWaterKg).toFixed(1));
    const actualWaterKgPerM3 = Number(Math.max(0, mixOutputs.waterKg + waterAdjustmentKgPerM3).toFixed(1));

    // Wet aggregate batching weights per m³
    const actualSandKgPerM3 = Number(
      (mixOutputs.fineAggregateKg * (1 + moistureInputs.sandMoisturePercent / 100)).toFixed(1)
    );
    const actualGravelKgPerM3 = Number(
      (mixOutputs.coarseAggregateKg * (1 + moistureInputs.gravelMoisturePercent / 100)).toFixed(1)
    );
    const actualCementKgPerM3 = mixOutputs.cementKg;

    // Scaled for full truck batch volume
    const vol = moistureInputs.batchVolumeM3;
    const totalActualWaterKg = Number((actualWaterKgPerM3 * vol).toFixed(1));
    const totalActualCementKg = Number((actualCementKgPerM3 * vol).toFixed(1));
    const totalActualSandKg = Number((actualSandKgPerM3 * vol).toFixed(1));
    const totalActualGravelKg = Number((actualGravelKgPerM3 * vol).toFixed(1));
    const totalActualWaterCorrectionKg = Number((waterAdjustmentKgPerM3 * vol).toFixed(1));

    return {
      sandFreeMoisturePercent: Number(sandFree.toFixed(2)),
      gravelFreeMoisturePercent: Number(gravelFree.toFixed(2)),
      waterAdjustmentKgPerM3,
      actualWaterKgPerM3,
      actualSandKgPerM3,
      actualGravelKgPerM3,
      actualCementKgPerM3,
      batchVolumeM3: vol,
      totalActualWaterKg,
      totalActualCementKg,
      totalActualSandKg,
      totalActualGravelKg,
      totalActualWaterCorrectionKg,
    };
  }, [mixOutputs, moistureInputs]);

  // Handle Reset to Standard Default
  const handleResetAll = () => {
    setSieves(initialSieves);
    setSelectedZone(GRADING_ZONES[0]);
    setMixInputs({
      targetStrengthType: 'fc',
      targetStrengthMPa: 25,
      kValue: 300,
      slumpRange: '8-10',
      coarseAggregateMaxSizeMm: 19,
      specificGravityCement: 3.15,
      specificGravitySand: 2.6,
      specificGravityGravel: 2.65,
      finenessModulusSand: 2.8,
      dryRoddedUnitWeightGravel: 1600,
      entrappedAirPercent: 0.02,
    });
    setMoistureInputs({
      sandMoisturePercent: 4.5,
      sandAbsorptionPercent: 1.5,
      gravelMoisturePercent: 1.8,
      gravelAbsorptionPercent: 0.8,
      batchVolumeM3: 7,
    });
  };

  return (
    <div className="simulator-container w-full h-full flex flex-col bg-[#0b0f17] text-slate-100 font-['Plus_Jakarta_Sans',sans-serif] overflow-hidden print:w-auto print:h-auto print:min-h-0 print:overflow-visible print:bg-white">
      {/* Isolated Standalone Header */}
      <MixDesignHeader
        onExportCSV={() =>
          exportJMFToCSV(
            sieves,
            finenessModulus,
            selectedZone,
            mixInputs,
            mixOutputs,
            moistureInputs,
            batchingOutputs
          )
        }
        onPrintPDF={printJMFReport}
        onReset={handleResetAll}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 print:p-0 print:overflow-visible print:h-auto print:block">
        <div className="max-w-7xl mx-auto space-y-6 print:max-w-none print:w-full print:space-y-6">

        {/* Sub-navigation tabs (Dark Engineering Style, hidden in print) */}
        <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-800 rounded-xl p-1 w-fit shadow-lg print:hidden">
          <button
            onClick={() => setActiveSubTab('all')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeSubTab === 'all'
                ? 'bg-slate-800 text-white shadow-md border border-slate-700/80'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-slate-200" />
            <span>Dashboard Terpadu</span>
          </button>

          <button
            onClick={() => setActiveSubTab('sieve')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeSubTab === 'sieve'
                ? 'bg-slate-800 text-white shadow-md border border-slate-700/80'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>1. Analisis Ayakan & FM</span>
          </button>

          <button
            onClick={() => setActiveSubTab('jmf')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeSubTab === 'jmf'
                ? 'bg-slate-800 text-white shadow-md border border-slate-700/80'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Calculator className="w-3.5 h-3.5 text-emerald-400" />
            <span>2. JMF Proportioning (SNI/ACI)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('moisture')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeSubTab === 'moisture'
                ? 'bg-slate-800 text-white shadow-md border border-slate-700/80'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-amber-400" />
            <span>3. Koreksi Kadar Air & Truk</span>
          </button>
        </div>

        {/* Module Content: Interactive Tab View on Screen, Clean 2-Page Pagination in Print / PDF */}
        <div className="space-y-6 print:space-y-3.5">
          {/* Module 1: Sieve Analysis & Grading Curve (Page 1) */}
          <section
            className={`bg-[#131b26] rounded-2xl border border-slate-800/80 shadow-2xl p-6 print:bg-white print:p-3 print:shadow-none print:border print:border-slate-300 print:rounded-xl print-avoid-break ${
              activeSubTab === 'all' || activeSubTab === 'sieve' ? 'block' : 'hidden print:block'
            }`}
          >
            <SieveAnalysisModule
              sieves={sieves}
              onChangeSieves={setSieves}
              selectedZone={selectedZone}
              onSelectZone={setSelectedZone}
              finenessModulus={finenessModulus}
            />
          </section>

          {/* Module 2: Job Mix Formula Proportioning (Page 1 - Follows Module 1) */}
          <section
            className={`bg-[#131b26] rounded-2xl border border-slate-800/80 shadow-2xl p-6 print:bg-white print:p-3 print:shadow-none print:border print:border-slate-300 print:rounded-xl print-avoid-break ${
              activeSubTab === 'all' || activeSubTab === 'jmf' ? 'block' : 'hidden print:block'
            }`}
          >
            <JobMixFormulaModule
              inputs={mixInputs}
              onChangeInputs={setMixInputs}
              outputs={mixOutputs}
              finenessModulus={finenessModulus}
            />
          </section>

          {/* Module 3: Field Moisture Correction & Truck Batching (Page 2 - Page Break Before) */}
          <section
            className={`bg-[#131b26] rounded-2xl border border-slate-800/80 shadow-2xl p-6 print:bg-white print:p-3.5 print:shadow-none print:border print:border-slate-300 print:rounded-xl print-page-break print-avoid-break ${
              activeSubTab === 'all' || activeSubTab === 'moisture' ? 'block' : 'hidden print:block'
            }`}
          >
            <FieldCorrectionModule
              mixInputs={mixInputs}
              mixOutputs={mixOutputs}
              moistureInputs={moistureInputs}
              onChangeMoisture={setMoistureInputs}
              batchingOutputs={batchingOutputs}
            />
          </section>

          {/* Engineering Sign-Off Box (Page 2 Bottom) */}
          <section
            className={`bg-[#131b26] rounded-2xl border border-slate-800/80 shadow-2xl p-6 print:bg-white print:p-3 print:shadow-none print:border print:border-slate-300 print:rounded-xl print-avoid-break ${
              activeSubTab === 'all' || activeSubTab === 'moisture' ? 'block' : 'hidden print:block'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 border-b border-slate-800/80 print:border-slate-200 gap-2 mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 print:text-slate-900 tracking-tight">
                  Lembar Pengesahan & Izin Pengecoran Lapangan (Engineering Sign-Off)
                </h3>
                <p className="text-xs text-slate-400 print:text-slate-500">
                  Verifikasi Hasil Uji Campuran Laboratorium Beton & Persetujuan Job Mix Formula (JMF)
                </p>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#0c121a] text-slate-300 border border-slate-700 print:bg-slate-100 print:text-slate-700 print:border-slate-300 font-semibold self-start sm:self-auto">
                SNI 7656:2012 / ASTM C39 / C136
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Prepared by: QC Inspector */}
              <div className="bg-[#0c121a] border border-slate-700/60 rounded-xl p-3 flex flex-col justify-between print:bg-white print:border print:border-slate-300 print:p-2">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 print:text-slate-500">
                    Dibuat Oleh (Prepared by):
                  </div>
                  <div className="text-xs font-bold text-slate-200 print:text-slate-900 mt-0.5">
                    QC Inspector / Teknisi Lab Beton
                  </div>
                </div>
                <div className="my-3 border-b border-dashed border-slate-700 print:border-slate-300 h-9 flex items-center justify-center text-[10px] text-slate-600 print:text-slate-400 italic">
                  (Tanda Tangan & Cap)
                </div>
                <div className="space-y-1 text-[11px] text-slate-400 print:text-slate-600 font-mono">
                  <div className="flex justify-between">
                    <span>Nama:</span>
                    <span className="border-b border-slate-700 print:border-slate-300 flex-1 ml-2 text-right">........................</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tanggal:</span>
                    <span className="border-b border-slate-700 print:border-slate-300 flex-1 ml-2 text-right">........................</span>
                  </div>
                </div>
              </div>

              {/* Checked by: Site Engineer */}
              <div className="bg-[#0c121a] border border-slate-700/60 rounded-xl p-3 flex flex-col justify-between print:bg-white print:border print:border-slate-300 print:p-2">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 print:text-slate-500">
                    Diperiksa Oleh (Checked by):
                  </div>
                  <div className="text-xs font-bold text-slate-200 print:text-slate-900 mt-0.5">
                    Site Engineer / QA-QC Manager
                  </div>
                </div>
                <div className="my-3 border-b border-dashed border-slate-700 print:border-slate-300 h-9 flex items-center justify-center text-[10px] text-slate-600 print:text-slate-400 italic">
                  (Tanda Tangan & Cap)
                </div>
                <div className="space-y-1 text-[11px] text-slate-400 print:text-slate-600 font-mono">
                  <div className="flex justify-between">
                    <span>Nama:</span>
                    <span className="border-b border-slate-700 print:border-slate-300 flex-1 ml-2 text-right">........................</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tanggal:</span>
                    <span className="border-b border-slate-700 print:border-slate-300 flex-1 ml-2 text-right">........................</span>
                  </div>
                </div>
              </div>

              {/* Approved by: Supervision Consultant */}
              <div className="bg-[#0c121a] border border-slate-700/60 rounded-xl p-3 flex flex-col justify-between print:bg-white print:border print:border-slate-300 print:p-2">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 print:text-slate-500">
                    Disetujui Oleh (Approved by):
                  </div>
                  <div className="text-xs font-bold text-slate-200 print:text-slate-900 mt-0.5">
                    Supervision Consultant / Pengawas
                  </div>
                </div>
                <div className="my-3 border-b border-dashed border-slate-700 print:border-slate-300 h-9 flex items-center justify-center text-[10px] text-slate-600 print:text-slate-400 italic">
                  (Tanda Tangan & Cap)
                </div>
                <div className="space-y-1 text-[11px] text-slate-400 print:text-slate-600 font-mono">
                  <div className="flex justify-between">
                    <span>Nama:</span>
                    <span className="border-b border-slate-700 print:border-slate-300 flex-1 ml-2 text-right">........................</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tanggal:</span>
                    <span className="border-b border-slate-700 print:border-slate-300 flex-1 ml-2 text-right">........................</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer info banner */}
        <footer className="pt-4 border-t border-slate-800 text-center text-xs text-slate-500 print:mt-3 print:pt-2 print:border-t print:border-slate-300 print:text-[9px]">
          <p>
            Coffee Civil Engineering Lab Suite • SNI 7656:2012 (Tata cara pemilihan proporsi campuran
            beton normal) • ASTM C136 / C33 • Quality Control Teknisi Beton, Site Engineer & Konsultan Pengawas.
          </p>
        </footer>
      </div>
    </div>
  </div>
  );
};
