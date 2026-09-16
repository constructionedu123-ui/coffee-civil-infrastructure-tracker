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

  // Fineness Modulus status check
  const fmStatus = useMemo(() => {
    const isOptimal = finenessModulus >= 2.3 && finenessModulus <= 3.1;
    let label = 'Memenuhi Spesifikasi (2.3 - 3.1)';
    let colorClass = 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40';
    if (finenessModulus < 2.3) {
      label = 'Terlalu Halus (FM < 2.3) - Butuh Lebih Banyak Semen';
      colorClass = 'text-amber-400 bg-amber-950/60 border-amber-500/40';
    } else if (finenessModulus > 3.1) {
      label = 'Terlalu Kasar (FM > 3.1) - Berisiko Segregasi / Workability Rendah';
      colorClass = 'text-rose-400 bg-rose-950/60 border-rose-500/40';
    }
    return { isOptimal, label, colorClass };
  }, [finenessModulus]);

  // Chart data preparation
  // Sort by openingMicrons ascending so X-axis renders correctly from fine (150) to coarse (37500)
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
    <div className="space-y-6">
      {/* Top Banner / Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111827] border border-neutral-800 rounded-xl p-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Module 1: Analisis Ayakan Agregat & Kurva Gradasi Semi-Log
            </h2>
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="text-neutral-400 hover:text-white p-1"
              title="Info & Panduan Standar SNI"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            ASTM C136 / ASTM C33 / SNI 03-1968-1990 • Modulus Kehalusan (FM) & Batas Amplop Gradasi
          </p>
        </div>

        {/* Action Preset Chips */}
        <div className="flex items-center flex-wrap gap-2">
          <span className="text-[11px] text-neutral-400 font-medium">Presets:</span>
          <button
            onClick={() => handleLoadPreset('natural_sand_zona2')}
            className="px-2.5 py-1 text-xs font-semibold rounded bg-neutral-800 hover:bg-neutral-700 text-blue-300 border border-neutral-700 transition"
          >
            Pasir Zona 2 (SNI)
          </button>
          <button
            onClick={() => handleLoadPreset('coarse_sand_zona1')}
            className="px-2.5 py-1 text-xs font-semibold rounded bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-neutral-700 transition"
          >
            Pasir Kasar
          </button>
          <button
            onClick={() => handleLoadPreset('fine_sand_zona3')}
            className="px-2.5 py-1 text-xs font-semibold rounded bg-neutral-800 hover:bg-neutral-700 text-purple-300 border border-neutral-700 transition"
          >
            Pasir Halus
          </button>
          <button
            onClick={() => handleLoadPreset('coarse_aggregate_20mm')}
            className="px-2.5 py-1 text-xs font-semibold rounded bg-neutral-800 hover:bg-neutral-700 text-emerald-300 border border-neutral-700 transition"
          >
            Kerikil 20mm
          </button>
        </div>
      </div>

      {/* Guide Card (Collapsible) */}
      {showGuide && (
        <div className="p-4 bg-neutral-900/90 border border-blue-900/50 rounded-xl text-xs text-neutral-300 space-y-2">
          <div className="font-semibold text-blue-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" /> Panduan Laboratorium Uji Agregat SNI & ASTM:
          </div>
          <p>
            1. <strong>Fineness Modulus (FM)</strong> dihitung dari penjumlahan % tertahan kumulatif
            pada ayakan standar (150 µm s.d 37.5 mm) dibagi 100. Nilai ideal pasir beton adalah{' '}
            <strong>2.30 - 3.10</strong>.
          </p>
          <p>
            2. <strong>Amplop Batas Gradasi (Grading Envelope)</strong>: Sumbu X adalah bukaan ayakan
            dalam skala logaritmik (µm), sumbu Y adalah % lolos kumulatif. Titik yang melanggar batas
            amplop akan otomatis disorot merah.
          </p>
          <p>
            3. Anda dapat mengisi <strong>Berat Tertahan (Gram)</strong> saat praktikum lab, atau
            beralih ke mode <strong>Direct % Lolos</strong> jika memasukkan data sertifikat supplier
            quarry.
          </p>
        </div>
      )}

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Fineness Modulus KPI */}
        <div className="bg-[#111827] border border-neutral-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              Fineness Modulus (FM)
            </div>
            <div className="text-2xl font-extrabold text-white font-mono mt-1">
              {finenessModulus.toFixed(2)}
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">Standar ASTM C33: 2.30 – 3.10</div>
          </div>
          <div
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold max-w-[170px] text-right ${fmStatus.colorClass}`}
          >
            {fmStatus.label}
          </div>
        </div>

        {/* Envelope Compliance KPI */}
        <div className="bg-[#111827] border border-neutral-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold">
              Kesesuaian Amplop Gradasi
            </div>
            <div className="text-sm font-bold text-white mt-1.5 truncate max-w-[190px]">
              {selectedZone.name}
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              {envelopeCompliance.violations.length === 0
                ? 'Semua titik ayakan dalam batas'
                : `${envelopeCompliance.violations.length} titik ayakan di luar toleransi`}
            </div>
          </div>
          <div>
            {envelopeCompliance.isCompliant ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>LOLOS (PASS)</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-400 text-xs font-bold animate-pulse">
                <AlertTriangle className="w-4 h-4" />
                <span>VIOLATION</span>
              </div>
            )}
          </div>
        </div>

        {/* Total Sample Weight KPI */}
        <div className="bg-[#111827] border border-neutral-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold">
              Total Massa Sampel Ayakan
            </div>
            <div className="text-2xl font-extrabold text-white font-mono mt-1">
              {totalWeight.toLocaleString('id-ID')} <span className="text-sm font-normal text-neutral-400">gram</span>
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              {sieves.length} fraksi saringan teruji
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs px-2.5 py-1 rounded bg-neutral-800 text-neutral-300 font-mono">
              Pan: {sieves.find((s) => s.id === 'sieve-pan')?.retainedWeightGrams || 0}g
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Semi-Log Chart & Data Input Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Top: Interactive Semi-Log Chart (7 cols) */}
        <div className="lg:col-span-7 bg-[#111827] border border-neutral-800 rounded-xl p-4 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-neutral-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Kurva Distribusi Butiran Agregat (Semi-Log)</span>
              </h3>
              <p className="text-[11px] text-neutral-400">
                Ukuran Lubang Ayakan (µm, skala log) vs % Lolos Kumulatif (%)
              </p>
            </div>

            {/* Grading Zone Selector */}
            <div className="flex items-center gap-2">
              <label htmlFor="grading-zone-select" className="text-[11px] text-neutral-400 whitespace-nowrap">Batas Spesifikasi:</label>
              <select
                id="grading-zone-select"
                value={selectedZone.id}
                onChange={(e) => {
                  const z = GRADING_ZONES.find((item) => item.id === e.target.value);
                  if (z) onSelectZone(z);
                }}
                className="bg-neutral-900 border border-neutral-700 text-xs text-neutral-200 rounded px-2.5 py-1 focus:outline-none focus:border-blue-500"
              >
                {GRADING_ZONES.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Chart Area */}
          <div className="w-full h-80 sm:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 15, right: 25, left: 0, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={true} />
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
                  stroke="#94a3b8"
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
                  stroke="#94a3b8"
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
                        <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-xs shadow-xl space-y-1">
                          <div className="font-bold text-white">{data.name}</div>
                          <div className="text-neutral-400">
                            Bukaan: <span className="font-mono text-neutral-200">{data.mm} mm ({data.microns} µm)</span>
                          </div>
                          <div className="text-neutral-300 flex items-center gap-1.5">
                            % Lolos Aktual: <strong className="text-blue-400 font-mono">{data.passing}%</strong>
                          </div>
                          {data.lowerLimit !== null && data.upperLimit !== null && (
                            <div className="text-neutral-400 border-t border-neutral-800 pt-1 mt-1">
                              Batas Standar: <span className="font-mono text-amber-400">{data.lowerLimit}% - {data.upperLimit}%</span>
                            </div>
                          )}
                          {data.isViolation && (
                            <div className="text-rose-400 font-bold text-[11px] pt-1">
                              ⚠️ Diluar batas toleransi amplop!
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
                  stroke="#eab308"
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
                  stroke="#eab308"
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
                          r={6}
                          fill="#f43f5e"
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
                        r={4}
                        fill="#38bdf8"
                        stroke="#0f172a"
                        strokeWidth={1.5}
                      />
                    );
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Chart Legend & Explanation */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-400 mt-2 pt-3 border-t border-neutral-800">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-blue-400 inline-block" />
                <span className="text-neutral-200">Gradasi Sampel</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-b border-dashed border-amber-400 inline-block" />
                <span className="text-neutral-300">Batas Toleransi (Min/Max)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                <span className="text-rose-300 font-medium">Titik Melanggar</span>
              </div>
            </div>
            <div className="text-[11px] text-neutral-400 italic">
              {selectedZone.description}
            </div>
          </div>
        </div>

        {/* Right / Bottom: Sieve Input & Calculations Table (5 cols) */}
        <div className="lg:col-span-5 bg-[#111827] border border-neutral-800 rounded-xl p-4 flex flex-col">
          {/* Table Header & Input Mode Switcher */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-neutral-800">
            <div>
              <h3 className="text-sm font-bold text-white">Tabel Saringan Agregat</h3>
              <p className="text-[11px] text-neutral-400">Input massa tertahan atau % lolos</p>
            </div>

            <div className="flex items-center bg-neutral-900 border border-neutral-700 rounded-lg p-0.5">
              <button
                onClick={() => setInputMode('weight')}
                className={`px-2 py-1 text-xs font-semibold rounded transition ${
                  inputMode === 'weight'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Massa (Gram)
              </button>
              <button
                onClick={() => setInputMode('passing')}
                className={`px-2 py-1 text-xs font-semibold rounded transition ${
                  inputMode === 'passing'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-neutral-400 hover:text-white'
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
                <tr className="border-b border-neutral-800 text-neutral-400 font-medium">
                  <th className="py-2 pr-2">Ayakan</th>
                  <th className="py-2 px-1 text-center">Bukaan</th>
                  {inputMode === 'weight' ? (
                    <th className="py-2 px-1 text-right">Tertahan (g)</th>
                  ) : (
                    <th className="py-2 px-1 text-right">% Lolos</th>
                  )}
                  <th className="py-2 px-1 text-right">% Tertahan</th>
                  <th className="py-2 px-1 text-right">% Lolos</th>
                  <th className="py-2 pl-2 text-center">Spek</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-mono">
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
                      className={`hover:bg-neutral-800/40 transition ${
                        isViolation ? 'bg-rose-950/20' : ''
                      }`}
                    >
                      <td className="py-2 pr-2 font-sans font-medium text-neutral-200">
                        {s.name}
                      </td>
                      <td className="py-2 px-1 text-center text-neutral-400 text-[11px]">
                        {s.openingMm > 0 ? `${s.openingMm} mm` : '-'}
                      </td>

                      {/* Dynamic Editable Cell */}
                      {inputMode === 'weight' ? (
                        <td className="py-1 px-1 text-right">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={s.retainedWeightGrams}
                            onChange={(e) =>
                              handleWeightChange(s.id, parseFloat(e.target.value) || 0)
                            }
                            className="w-20 bg-neutral-900 border border-neutral-700 rounded px-1.5 py-0.5 text-right text-neutral-100 focus:outline-none focus:border-blue-500 font-mono"
                          />
                        </td>
                      ) : (
                        <td className="py-1 px-1 text-right">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={s.cumulativePercentPassing}
                            onChange={(e) =>
                              handlePassingChange(s.id, parseFloat(e.target.value) || 0)
                            }
                            className="w-16 bg-neutral-900 border border-neutral-700 rounded px-1.5 py-0.5 text-right text-neutral-100 focus:outline-none focus:border-blue-500 font-mono"
                          />
                        </td>
                      )}

                      <td className="py-2 px-1 text-right text-neutral-400 text-[11px]">
                        {s.cumulativePercentRetained?.toFixed(1) ?? '0.0'}%
                      </td>
                      <td
                        className={`py-2 px-1 text-right font-bold text-[11px] ${
                          isViolation ? 'text-rose-400' : 'text-blue-400'
                        }`}
                      >
                        {s.cumulativePercentPassing.toFixed(1)}%
                      </td>

                      <td className="py-2 pl-2 text-center text-[10px]">
                        {hasLimit ? (
                          isViolation ? (
                            <span className="text-rose-400 font-bold bg-rose-950/60 px-1 py-0.5 rounded">
                              {limits.min}-{limits.max}
                            </span>
                          ) : (
                            <span className="text-emerald-400 bg-emerald-950/40 px-1 py-0.5 rounded">
                              OK
                            </span>
                          )
                        ) : (
                          <span className="text-neutral-500">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Quick Reset / Summary Info */}
          <div className="mt-3 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs">
            <div className="text-neutral-400">
              Total Sampel:{' '}
              <strong className="text-white font-mono">{totalWeight} g</strong>
            </div>
            <button
              onClick={() => handleLoadPreset('natural_sand_zona2')}
              className="flex items-center gap-1 text-neutral-400 hover:text-white transition"
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
