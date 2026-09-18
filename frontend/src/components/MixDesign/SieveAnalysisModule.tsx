import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import { SieveItem, SieveInputMode, GradingZone } from './types';
import { GRADING_ZONES, SIEVE_PRESETS } from './constants';

interface SieveAnalysisModuleProps {
  sieves: SieveItem[];
  onChangeSieves: (sieves: SieveItem[]) => void;
  selectedZone: GradingZone;
  onSelectZone: (zone: GradingZone) => void;
  finenessModulus: number;
}

export const SieveAnalysisModule: React.FC<SieveAnalysisModuleProps> = ({
  sieves,
  onChangeSieves,
  selectedZone,
  onSelectZone,
  finenessModulus,
}) => {
  const [inputMode, setInputMode] = useState<SieveInputMode>('weight');
  const [showGuide, setShowGuide] = useState(false);

  // Total weight of sample in grams
  const totalWeight = useMemo(() => {
    return sieves.reduce((acc, curr) => acc + (curr.retainedWeightGrams || 0), 0);
  }, [sieves]);

  // Handle retained weight update
  const handleWeightChange = (sieveId: string, val: number) => {
    const validVal = Math.max(0, isNaN(val) ? 0 : val);
    const updated = sieves.map((s) => {
      if (s.id === sieveId) {
        return { ...s, retainedWeightGrams: validVal };
      }
      return s;
    });

    // Recalculate percentages
    const newTotal = updated.reduce((acc, curr) => acc + curr.retainedWeightGrams, 0);
    let cumulativeRetained = 0;

    const recalculated = updated.map((s) => {
      const indRetained = newTotal > 0 ? (s.retainedWeightGrams / newTotal) * 100 : 0;
      cumulativeRetained += indRetained;
      const passing = Math.max(0, Math.min(100, 100 - cumulativeRetained));
      return {
        ...s,
        individualPercentRetained: Number(indRetained.toFixed(2)),
        cumulativePercentRetained: Number(cumulativeRetained.toFixed(2)),
        cumulativePercentPassing: Number(passing.toFixed(2)),
      };
    });

    onChangeSieves(recalculated);
  };

  // Handle direct % passing change
  const handlePassingChange = (sieveId: string, val: number) => {
    const validVal = Math.max(0, Math.min(100, isNaN(val) ? 0 : val));
    const updated = sieves.map((s) => {
      if (s.id === sieveId) {
        return {
          ...s,
          cumulativePercentPassing: validVal,
          cumulativePercentRetained: Number((100 - validVal).toFixed(2)),
        };
      }
      return s;
    });
    onChangeSieves(updated);
  };

  // Load a preset
  const handleLoadPreset = (presetKey: string) => {
    const preset = SIEVE_PRESETS[presetKey];
    if (!preset) return;

    const updated = sieves.map((s) => {
      const wt = preset.weights[s.id] ?? 0;
      return { ...s, retainedWeightGrams: wt };
    });

    const newTotal = updated.reduce((acc, curr) => acc + curr.retainedWeightGrams, 0);
    let cumulativeRetained = 0;

    const recalculated = updated.map((s) => {
      const indRetained = newTotal > 0 ? (s.retainedWeightGrams / newTotal) * 100 : 0;
      cumulativeRetained += indRetained;
      const passing = Math.max(0, Math.min(100, 100 - cumulativeRetained));
      return {
        ...s,
        individualPercentRetained: Number(indRetained.toFixed(2)),
        cumulativePercentRetained: Number(cumulativeRetained.toFixed(2)),
        cumulativePercentPassing: Number(passing.toFixed(2)),
      };
    });

    onChangeSieves(recalculated);
  };

  // Check compliance against selected zone envelope
  const envelopeCompliance = useMemo(() => {
    const violations: { sieve: SieveItem; min: number; max: number; current: number }[] = [];
    sieves.forEach((s) => {
      if (s.id === 'sieve-pan') return;
      const limits = selectedZone.limits[s.id];
      if (limits) {
        if (s.cumulativePercentPassing < limits.min || s.cumulativePercentPassing > limits.max) {
          violations.push({
            sieve: s,
            min: limits.min,
            max: limits.max,
            current: s.cumulativePercentPassing,
          });
        }
      }
    });
    return {
      isCompliant: violations.length === 0,
      violations,
    };
  }, [sieves, selectedZone]);

  // Fineness Modulus status check (Dark Engineering Badge Style)
  const fmStatus = useMemo(() => {
    const isOptimal = finenessModulus >= 2.3 && finenessModulus <= 3.1;
    let label = 'Memenuhi Spesifikasi (2.3 - 3.1)';
    let colorClass = 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 print:bg-white print:text-emerald-700 print:border-emerald-600';
    if (finenessModulus < 2.3) {
      label = 'Terlalu Halus (FM < 2.3)';
      colorClass = 'text-amber-400 bg-amber-950/60 border border-amber-800/60 print:bg-white print:text-amber-700 print:border-amber-600';
    } else if (finenessModulus > 3.1) {
      label = 'Terlalu Kasar (FM > 3.1)';
      colorClass = 'text-rose-400 bg-rose-950/60 border border-rose-800/60 print:bg-white print:text-rose-700 print:border-rose-600';
    }
    return { isOptimal, label, colorClass };
  }, [finenessModulus]);

  // Chart data preparation
  const chartData = useMemo(() => {
    const nonPanSieves = sieves.filter((s) => s.id !== 'sieve-pan');
    return nonPanSieves
      .slice()
      .sort((a, b) => a.openingMicrons - b.openingMicrons)
      .map((s) => {
        const limits = selectedZone.limits[s.id];
        const lowerLimit = limits ? limits.min : null;
        const upperLimit = limits ? limits.max : null;
        const isViolation =
          limits &&
          (s.cumulativePercentPassing < limits.min || s.cumulativePercentPassing > limits.max);

        return {
          id: s.id,
          name: s.name,
          microns: s.openingMicrons,
          mm: s.openingMm,
          passing: s.cumulativePercentPassing,
          lowerLimit,
          upperLimit,
          isViolation,
        };
      });
  }, [sieves, selectedZone]);

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Banner / Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-sky-400 shadow-inner">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-2">
                <span>Module 1: Analisis Ayakan Agregat & Kurva Gradasi</span>
                <button
                  onClick={() => setShowGuide(!showGuide)}
                  className="text-slate-400 hover:text-slate-200 p-0.5 print:hidden"
                  title="Info Standar SNI"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </h2>
              <p className="text-xs text-slate-400">
                ASTM C136 / ASTM C33 / SNI 03-1968-1990 • Modulus Kehalusan (FM) & Batas Amplop Butiran
              </p>
            </div>
          </div>
        </div>

        {/* Action Preset Chips */}
        <div className="flex items-center flex-wrap gap-2 print:hidden">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Presets:</span>
          <button
            onClick={() => handleLoadPreset('natural_sand_zona2')}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 shadow-sm transition active:scale-[0.98]"
          >
            Pasir Zona 2 (SNI)
          </button>
          <button
            onClick={() => handleLoadPreset('coarse_sand_zona1')}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 shadow-sm transition active:scale-[0.98]"
          >
            Pasir Kasar
          </button>
          <button
            onClick={() => handleLoadPreset('fine_sand_zona3')}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 shadow-sm transition active:scale-[0.98]"
          >
            Pasir Halus
          </button>
          <button
            onClick={() => handleLoadPreset('coarse_aggregate_20mm')}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 shadow-sm transition active:scale-[0.98]"
          >
            Kerikil 20mm
          </button>
        </div>
      </div>

      {/* Guide Card (Collapsible) */}
      {showGuide && (
        <div className="p-4 bg-[#0c121a] border border-slate-800 rounded-xl text-xs text-slate-300 space-y-2 print:hidden">
          <div className="font-semibold text-sky-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-sky-400" /> Panduan Laboratorium Uji Agregat SNI & ASTM:
          </div>
          <p>
            1. <strong>Fineness Modulus (FM)</strong> dihitung dari penjumlahan % tertahan kumulatif
            pada ayakan standar (150 µm s.d 37.5 mm) dibagi 100. Nilai ideal pasir beton adalah{' '}
            <strong className="text-white">2.30 - 3.10</strong>.
          </p>
          <p>
            2. <strong>Amplop Batas Gradasi (Grading Envelope)</strong>: Sumbu X adalah bukaan ayakan
            dalam skala logaritmik (µm), sumbu Y adalah % lolos kumulatif. Titik yang melanggar batas
            amplop akan otomatis disorot merah.
          </p>
        </div>
      )}

      {/* KPI Stats Bar (Dark Engineering Metric Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-2 print:my-1.5">
        {/* Fineness Modulus KPI */}
        <div className="bg-[#0c121a] rounded-xl border border-slate-700/60 p-4 hover:border-slate-600 transition shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:bg-white print:border print:border-slate-300 print:p-2 print:shadow-none">
          <div className="flex-1 min-w-0 pb-1">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5 break-words whitespace-normal leading-tight print:text-slate-600 print:text-[10px]">
              <TrendingUp className="w-3.5 h-3.5 text-sky-400 shrink-0 print:text-sky-700" />
              <span>Fineness Modulus (FM)</span>
            </div>
            <div className="text-3xl font-extrabold text-white font-mono mt-1 leading-none print:text-slate-900 print:text-xl">
              {finenessModulus.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1.5 break-words whitespace-normal pb-0.5 print:text-slate-500 print:text-[9px]">Target Standar: 2.30 – 3.10</div>
          </div>
          <div className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 text-center break-words whitespace-normal max-w-full ${fmStatus.colorClass}`}>
            {fmStatus.label}
          </div>
        </div>

        {/* Envelope Compliance KPI */}
        <div className="bg-[#0c121a] rounded-xl border border-slate-700/60 p-4 hover:border-slate-600 transition shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:bg-white print:border print:border-slate-300 print:p-2 print:shadow-none">
          <div className="flex-1 min-w-0 pb-1">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold break-words whitespace-normal leading-tight print:text-slate-600 print:text-[10px]">
              Kesesuaian Amplop Gradasi
            </div>
            <div className="text-sm font-bold text-slate-100 mt-1 break-words whitespace-normal leading-snug print:text-slate-900 print:text-xs">
              {selectedZone.name}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 break-words whitespace-normal pb-0.5 print:text-slate-500 print:text-[9px]">
              {envelopeCompliance.violations.length === 0
                ? 'Semua titik ayakan dalam batas'
                : `${envelopeCompliance.violations.length} titik ayakan di luar toleransi`}
            </div>
          </div>
          <div className="shrink-0">
            {envelopeCompliance.isCompliant ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 text-xs font-semibold whitespace-normal text-center print:bg-white print:border print:border-emerald-700 print:text-emerald-800 print:text-[10px] print:px-2 print:py-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 print:text-emerald-700" />
                <span>LOLOS (PASS)</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-800/60 text-rose-400 text-xs font-semibold whitespace-normal text-center print:bg-white print:border print:border-rose-700 print:text-rose-800 print:text-[10px] print:px-2 print:py-0.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 print:text-rose-700" />
                <span>VIOLATION</span>
              </div>
            )}
          </div>
        </div>

        {/* Total Sample Weight KPI */}
        <div className="bg-[#0c121a] rounded-xl border border-slate-700/60 p-4 hover:border-slate-600 transition shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:bg-white print:border print:border-slate-300 print:p-2 print:shadow-none">
          <div className="flex-1 min-w-0 pb-1">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold break-words whitespace-normal leading-tight print:text-slate-600 print:text-[10px]">
              Total Massa Sampel
            </div>
            <div className="text-3xl font-extrabold text-white font-mono mt-1 leading-none print:text-slate-900 print:text-xl">
              {totalWeight.toLocaleString('id-ID')} <span className="text-sm font-normal text-slate-400 print:text-slate-600 print:text-xs">gram</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1.5 break-words whitespace-normal pb-0.5 print:text-slate-500 print:text-[9px]">
              {sieves.length} fraksi saringan teruji
            </div>
          </div>
          <div className="shrink-0">
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800/80 text-slate-300 font-mono border border-slate-700 print:bg-slate-50 print:text-slate-700 print:border-slate-300 print:text-[10px] print:px-2 print:py-0.5">
              Pan: {sieves.find((s) => s.id === 'sieve-pan')?.retainedWeightGrams || 0}g
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Semi-Log Chart & Data Input Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 print:gap-3 print:pt-1">
        {/* Left: Semi-Log Gradation Curve (7 cols) */}
        <div className="lg:col-span-7 bg-[#0c121a] rounded-xl border border-slate-700/60 p-5 flex flex-col shadow-lg print:col-span-7 print:bg-white print:border print:border-slate-300 print:p-2.5 print:shadow-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80 print:mb-1.5 print:pb-1 print:border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-100 print:text-slate-900 print:text-xs">
                Kurva Distribusi Butiran Agregat (Semi-Log)
              </h3>
              <p className="text-xs text-slate-400 print:text-slate-500 print:text-[10px]">
                Ukuran Lubang Ayakan (µm, skala log) vs % Lolos Kumulatif (%)
              </p>
            </div>

            {/* Grading Zone Selector */}
            <div className="flex items-center gap-2">
              <label htmlFor="grading-zone-select" className="text-xs text-slate-400 font-medium whitespace-nowrap print:text-slate-600 print:text-[10px]">
                Amplop:
              </label>
              <span className="hidden print:inline-block text-[10px] font-bold text-slate-900 border border-slate-300 px-2 py-0.5 rounded bg-slate-50">
                {selectedZone.name}
              </span>
              <select
                id="grading-zone-select"
                value={selectedZone.id}
                onChange={(e) => {
                  const z = GRADING_ZONES.find((item) => item.id === e.target.value);
                  if (z) onSelectZone(z);
                }}
                className="bg-[#131b26] border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 shadow-sm font-medium print:hidden"
              >
                {GRADING_ZONES.map((zone) => (
                  <option key={zone.id} value={zone.id} className="bg-[#131b26] text-slate-200">
                    {zone.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Chart Canvas */}
          <div className="w-full h-80 sm:h-96 print:h-44">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 15, right: 25, left: 0, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={true} />
                <XAxis
                  dataKey="microns"
                  type="number"
                  scale="log"
                  domain={[100, 45000]}
                  ticks={[150, 300, 600, 1180, 2360, 4750, 9500, 19000, 37500]}
                  tickFormatter={(val) => {
                    if (val >= 1000) return `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 2)} mm`;
                    return `${val} µm`;
                  }}
                  stroke="#64748b"
                  fontSize={10}
                  label={{
                    value: 'Ukuran Lubang Ayakan (µm / mm) →',
                    position: 'insideBottom',
                    offset: -12,
                    fill: '#94a3b8',
                    fontSize: 11,
                  }}
                />
                <YAxis
                  type="number"
                  domain={[0, 100]}
                  ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
                  stroke="#64748b"
                  fontSize={10}
                  label={{
                    value: '% Lolos Kumulatif (%)',
                    angle: -90,
                    position: 'insideLeft',
                    offset: 15,
                    fill: '#94a3b8',
                    fontSize: 11,
                  }}
                />

                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#0f172a] border border-slate-700 rounded-xl p-3 text-xs shadow-xl space-y-1 text-slate-200">
                          <div className="font-bold text-white">{data.name}</div>
                          <div className="text-slate-400">
                            Bukaan: <span className="font-mono text-slate-200">{data.mm} mm ({data.microns} µm)</span>
                          </div>
                          <div className="text-slate-300 flex items-center gap-1.5">
                            % Lolos Aktual: <strong className="text-sky-400 font-mono">{data.passing}%</strong>
                          </div>
                          {data.lowerLimit !== null && data.upperLimit !== null && (
                            <div className="text-slate-400 border-t border-slate-800 pt-1 mt-1">
                              Batas Standar: <span className="font-mono text-slate-300">{data.lowerLimit}% - {data.upperLimit}%</span>
                            </div>
                          )}
                          {data.isViolation && (
                            <div className="text-rose-400 font-semibold text-[11px] pt-1 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Di luar batas amplop!</span>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                {/* Lower Boundary Limit Line */}
                <Line
                  type="monotone"
                  dataKey="lowerLimit"
                  name="Batas Bawah (Min)"
                  stroke="#64748b"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={false}
                />

                {/* Upper Boundary Limit Line */}
                <Line
                  type="monotone"
                  dataKey="upperLimit"
                  name="Batas Atas (Max)"
                  stroke="#64748b"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={false}
                />

                {/* Actual Sample Gradation Curve */}
                <Line
                  type="monotone"
                  dataKey="passing"
                  name="Gradasi Sampel"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (payload.isViolation) {
                      return (
                        <circle
                          key={payload.id}
                          cx={cx}
                          cy={cy}
                          r={5.5}
                          fill="#ef4444"
                          stroke="#ffffff"
                          strokeWidth={2}
                        />
                      );
                    }
                    return (
                      <circle
                        key={payload.id}
                        cx={cx}
                        cy={cy}
                        r={4.5}
                        fill="#38bdf8"
                        stroke="#0c121a"
                        strokeWidth={2}
                      />
                    );
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Chart Legend & Explanation */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 mt-2 pt-3 border-t border-slate-800/80 print:mt-1 print:pt-1 print:border-slate-200 print:text-[9px]">
            <div className="flex items-center gap-4 print:gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-sky-400 print:bg-sky-600 inline-block" />
                <span className="text-slate-200 print:text-slate-800 font-medium">Gradasi Sampel</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-b border-dashed border-slate-500 inline-block" />
                <span className="text-slate-400 print:text-slate-600">Batas Toleransi</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                <span className="text-rose-400 print:text-rose-700 font-medium">Melanggar</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 print:text-slate-600 italic print:text-[9px]">
              {selectedZone.description}
            </div>
          </div>
        </div>

        {/* Right: Sieve Input & Calculations Table (5 cols) */}
        <div className="lg:col-span-5 bg-[#0c121a] rounded-xl border border-slate-700/60 p-5 flex flex-col shadow-lg print:col-span-5 print:bg-white print:border print:border-slate-300 print:p-2.5 print:shadow-none">
          {/* Table Header & Input Mode Switcher */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800/80 print:pb-1 print:mb-1 print:border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-100 print:text-slate-900 print:text-xs">Tabel Saringan Agregat</h3>
              <p className="text-xs text-slate-400 print:text-slate-500 print:text-[10px]">Input massa tertahan atau % lolos</p>
            </div>

            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 shadow-inner print:hidden">
              <button
                onClick={() => setInputMode('weight')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                  inputMode === 'weight'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Massa (Gram)
              </button>
              <button
                onClick={() => setInputMode('passing')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                  inputMode === 'passing'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Direct % Lolos
              </button>
            </div>
          </div>

          {/* Sieve Rows Table */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold print:text-[9px] print:text-slate-600 print:border-slate-200">
                  <th className="py-2 pr-2 print:py-1">Ayakan</th>
                  <th className="py-2 px-1 text-center print:py-1">Bukaan</th>
                  {inputMode === 'weight' ? (
                    <th className="py-2 px-1 text-right print:py-1">Tertahan (g)</th>
                  ) : (
                    <th className="py-2 px-1 text-right print:py-1">% Lolos</th>
                  )}
                  <th className="py-2 px-1 text-right print:py-1">% Tertahan</th>
                  <th className="py-2 px-1 text-right print:py-1">% Lolos</th>
                  <th className="py-2 pl-2 text-center print:py-1">Spek</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono print:divide-slate-200">
                {sieves.map((s) => {
                  const limits = selectedZone.limits[s.id];
                  const hasLimit = !!limits;
                  const isViolation =
                    hasLimit &&
                    (s.cumulativePercentPassing < limits.min ||
                      s.cumulativePercentPassing > limits.max);

                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-slate-800/40 transition ${
                        isViolation ? 'bg-rose-950/25 print:bg-rose-50' : ''
                      }`}
                    >
                      <td className="py-2 pr-2 font-sans font-medium text-slate-200 print:py-0.5 print:text-[10px] print:text-slate-900">
                        {s.name}
                      </td>
                      <td className="py-2 px-1 text-center text-slate-400 text-[11px] print:py-0.5 print:text-[10px] print:text-slate-600">
                        {s.openingMm > 0 ? `${s.openingMm} mm` : '-'}
                      </td>

                      {/* Dynamic Editable Cell */}
                      {inputMode === 'weight' ? (
                        <td className="py-1 px-1 text-right print:py-0.5">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={s.retainedWeightGrams}
                            onChange={(e) =>
                              handleWeightChange(s.id, parseFloat(e.target.value) || 0)
                            }
                            className="w-20 bg-[#131b26] border border-slate-700 rounded-md px-1.5 py-0.5 text-right text-white focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 font-mono shadow-sm print:border-none print:shadow-none print:p-0 print:text-right print:bg-transparent print:text-slate-900 print:text-[10px] print:w-12"
                          />
                        </td>
                      ) : (
                        <td className="py-1 px-1 text-right print:py-0.5">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={s.cumulativePercentPassing}
                            onChange={(e) =>
                              handlePassingChange(s.id, parseFloat(e.target.value) || 0)
                            }
                            className="w-16 bg-[#131b26] border border-slate-700 rounded-md px-1.5 py-0.5 text-right text-white focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 font-mono shadow-sm print:border-none print:shadow-none print:p-0 print:text-right print:bg-transparent print:text-slate-900 print:text-[10px] print:w-12"
                          />
                        </td>
                      )}

                      <td className="py-2 px-1 text-right text-slate-400 text-[11px] print:py-0.5 print:text-[10px] print:text-slate-700">
                        {s.cumulativePercentRetained?.toFixed(1) ?? '0.0'}%
                      </td>
                      <td
                        className={`py-2 px-1 text-right font-bold text-[11px] print:py-0.5 print:text-[10px] ${
                          isViolation ? 'text-rose-400 print:text-rose-700' : 'text-sky-400 print:text-sky-700'
                        }`}
                      >
                        {s.cumulativePercentPassing.toFixed(1)}%
                      </td>

                      <td className="py-2 pl-2 text-center text-[10px] print:py-0.5 print:text-[9px]">
                        {hasLimit ? (
                          isViolation ? (
                            <span className="text-rose-400 font-bold bg-rose-950/60 border border-rose-800/60 px-1.5 py-0.5 rounded-full print:bg-white print:border print:border-rose-700 print:text-rose-800 print:px-1">
                              {limits.min}-{limits.max}
                            </span>
                          ) : (
                            <span className="text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded-full font-medium print:bg-white print:border print:border-emerald-700 print:text-emerald-800 print:px-1">
                              OK
                            </span>
                          )
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Quick Reset / Summary Info */}
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs print:mt-1.5 print:pt-1 print:border-slate-200 print:text-[10px]">
            <div className="text-slate-400 print:text-slate-700">
              Total Sampel:{' '}
              <strong className="text-white font-mono print:text-slate-900">{totalWeight} g</strong>
            </div>
            <button
              onClick={() => handleLoadPreset('natural_sand_zona2')}
              className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition text-xs font-medium print:hidden"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset ke Zona 2</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
