import React from 'react';
import {
  Calculator,
  Droplets,
  Layers,
  Scale,
  Info,
  CheckCircle2,
  Box,
} from 'lucide-react';
import { MixDesignInputs, MixDesignOutputs } from './types';
import { K_VALUE_PRESETS, convertKtoFc, convertFctoK } from './constants';

interface JobMixFormulaModuleProps {
  inputs: MixDesignInputs;
  onChangeInputs: (inputs: MixDesignInputs) => void;
  outputs: MixDesignOutputs;
  finenessModulus: number;
}

export const JobMixFormulaModule: React.FC<JobMixFormulaModuleProps> = ({
  inputs,
  onChangeInputs,
  outputs,
  finenessModulus,
}) => {
  // Handle f'c change
  const handleFcChange = (fc: number) => {
    const validFc = Math.max(10, Math.min(60, fc));
    const k = convertFctoK(validFc);
    onChangeInputs({
      ...inputs,
      targetStrengthType: 'fc',
      targetStrengthMPa: validFc,
      kValue: k,
    });
  };

  // Handle K-value change
  const handleKChange = (k: number) => {
    const validK = Math.max(100, Math.min(700, k));
    const fc = convertKtoFc(validK);
    onChangeInputs({
      ...inputs,
      targetStrengthType: 'K',
      kValue: validK,
      targetStrengthMPa: fc,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#111827] border border-neutral-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Module 2: Job Mix Formula (JMF) Proportioning Calculator
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Standar Nasional Indonesia SNI 7656:2012 / ACI 211.1 • Metode Volume Absolut (1 m³ Beton Segar)
          </p>
        </div>

        {/* Sync with Module 1 FM status */}
        <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-700 px-3 py-1.5 rounded-lg text-xs">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-neutral-400">FM Pasir dari Ayakan:</span>
          <strong className="text-blue-300 font-mono">{finenessModulus.toFixed(2)}</strong>
        </div>
      </div>

      {/* Input Parameters Form & Outputs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Mix Design Inputs (5 cols) */}
        <div className="lg:col-span-5 bg-[#111827] border border-neutral-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-neutral-800 pb-2">
            <Scale className="w-4 h-4 text-emerald-400" />
            <span>Parameter Desain Campuran</span>
          </h3>

          {/* Target Strength: Dual Mode (f'c cylinder vs K cube) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="target-strength-fc" className="text-xs font-semibold text-neutral-200">
                Kuat Tekan Rencana (Target Strength):
              </label>
              <div className="text-[11px] text-neutral-400">Umur 28 Hari</div>
            </div>

            {/* Direct f'c vs K Mode Switcher */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-2.5">
                <div className="text-[10px] uppercase font-bold text-neutral-400">
                  Silinder f'c (MPa)
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <input
                    id="target-strength-fc"
                    type="number"
                    min="10"
                    max="60"
                    step="0.5"
                    value={inputs.targetStrengthMPa}
                    onChange={(e) => handleFcChange(parseFloat(e.target.value) || 20)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded px-2 py-1 text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-xs text-neutral-400">MPa</span>
                </div>
              </div>

              <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-2.5">
                <div className="text-[10px] uppercase font-bold text-neutral-400">
                  Kubus K (kg/cm²)
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <input
                    type="number"
                    min="100"
                    max="650"
                    step="5"
                    value={inputs.kValue}
                    onChange={(e) => handleKChange(parseFloat(e.target.value) || 250)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded px-2 py-1 text-sm font-mono font-bold text-blue-400 focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-xs text-neutral-400">kg/cm²</span>
                </div>
              </div>
            </div>

            {/* Quick K Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {K_VALUE_PRESETS.map((preset) => (
                <button
                  key={preset.k}
                  onClick={() => handleKChange(preset.k)}
                  className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded transition ${
                    Math.abs(inputs.kValue - preset.k) < 8
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                  title={preset.label}
                >
                  K-{preset.k}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-neutral-400 italic">
              Konversi SNI: f'c ≈ K × 0.083 × 0.981 (Silinder Ø15x30cm vs Kubus 15x15x15cm)
            </p>
          </div>

          {/* Slump Range Selector */}
          <div className="space-y-1.5 pt-2 border-t border-neutral-800">
            <div className="flex items-center justify-between">
              <label htmlFor="slump-range-select" className="text-xs font-semibold text-neutral-200">
                Nilai Slump Rencana:
              </label>
              <span className="text-[11px] text-neutral-400">SNI 7656 Tabel 1</span>
            </div>
            <select
              id="slump-range-select"
              value={inputs.slumpRange}
              onChange={(e) => onChangeInputs({ ...inputs, slumpRange: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="3-5">3 - 5 cm (Pondasi Dangkal, Perkerasan Jalan Kaku)</option>
              <option value="8-10">8 - 10 cm (Balok, Kolom, Pelat Lantai Standar - Rekomendasi)</option>
              <option value="10-12">10 - 12 cm (Konstruksi Bertulang Rapat, Pengecoran Pompa)</option>
              <option value="15-18">15 - 18 cm (Bored Pile / Tremie / Flowable Concrete)</option>
            </select>
          </div>

          {/* Coarse Aggregate Max Size */}
          <div className="space-y-1.5 pt-2 border-t border-neutral-800">
            <label className="text-xs font-semibold text-neutral-200 block">
              Ukuran Butir Agregat Kasar Maksimum (MSA):
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onChangeInputs({ ...inputs, coarseAggregateMaxSizeMm: 19 })}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition text-center ${
                  inputs.coarseAggregateMaxSizeMm === 19
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-bold'
                    : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-white'
                }`}
              >
                19 mm (3/4") - Balok/Pelat
              </button>
              <button
                type="button"
                onClick={() => onChangeInputs({ ...inputs, coarseAggregateMaxSizeMm: 25 })}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition text-center ${
                  inputs.coarseAggregateMaxSizeMm === 25
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-bold'
                    : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-white'
                }`}
              >
                25 mm (1") - Pondasi Masif
              </button>
            </div>
          </div>

          {/* Material Specific Gravities (Berat Jenis SSD) */}
          <div className="space-y-2 pt-2 border-t border-neutral-800">
            <div className="text-xs font-semibold text-neutral-200">
              Berat Jenis Relatif Material (Specific Gravity SSD):
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-neutral-400 block mb-0.5">Semen (PCC/OPC)</label>
                <input
                  type="number"
                  step="0.01"
                  min="2.8"
                  max="3.3"
                  value={inputs.specificGravityCement}
                  onChange={(e) =>
                    onChangeInputs({
                      ...inputs,
                      specificGravityCement: parseFloat(e.target.value) || 3.15,
                    })
                  }
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100 font-mono text-center focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 block mb-0.5">Pasir (Sand)</label>
                <input
                  type="number"
                  step="0.01"
                  min="2.3"
                  max="2.9"
                  value={inputs.specificGravitySand}
                  onChange={(e) =>
                    onChangeInputs({
                      ...inputs,
                      specificGravitySand: parseFloat(e.target.value) || 2.6,
                    })
                  }
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100 font-mono text-center focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 block mb-0.5">Kerikil (Gravel)</label>
                <input
                  type="number"
                  step="0.01"
                  min="2.3"
                  max="2.9"
                  value={inputs.specificGravityGravel}
                  onChange={(e) =>
                    onChangeInputs({
                      ...inputs,
                      specificGravityGravel: parseFloat(e.target.value) || 2.65,
                    })
                  }
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100 font-mono text-center focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Mix Proportions Output & Volume Yield (7 cols) */}
        <div className="lg:col-span-7 bg-[#111827] border border-neutral-800 rounded-xl p-5 flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Droplets className="w-4 h-4 text-blue-400" />
                <span>Proporsi Campuran Teoritis (Per 1 m³ Beton SSD)</span>
              </h3>
              <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                1.000 m³ Yield
              </span>
            </div>

            {/* Key Calculated Indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
              <div className="bg-neutral-900/80 border border-neutral-800 rounded-lg p-3">
                <div className="text-[10px] uppercase tracking-wider text-neutral-400">
                  Faktor Air Semen (w/c)
                </div>
                <div className="text-xl font-mono font-extrabold text-blue-400 mt-1">
                  {outputs.waterCementRatio.toFixed(3)}
                </div>
                <div className="text-[10px] text-neutral-400">Berdasarkan f'cr</div>
              </div>

              <div className="bg-neutral-900/80 border border-neutral-800 rounded-lg p-3">
                <div className="text-[10px] uppercase tracking-wider text-neutral-400">
                  Target f'cr Rencana
                </div>
                <div className="text-xl font-mono font-extrabold text-white mt-1">
                  {outputs.targetRequiredStrengthMPa.toFixed(1)} <span className="text-xs font-normal">MPa</span>
                </div>
                <div className="text-[10px] text-neutral-400">
                  Margin: +{outputs.marginOfSafetyMPa.toFixed(1)} MPa
                </div>
              </div>

              <div className="bg-neutral-900/80 border border-neutral-800 rounded-lg p-3">
                <div className="text-[10px] uppercase tracking-wider text-neutral-400">
                  Rasio Campuran (Berat)
                </div>
                <div className="text-sm font-mono font-bold text-amber-300 mt-1.5">
                  1 : {outputs.mixRatio.sand.toFixed(2)} : {outputs.mixRatio.gravel.toFixed(2)}
                </div>
                <div className="text-[10px] text-neutral-400">
                  Semen : Pasir : Kerikil
                </div>
              </div>

              <div className="bg-neutral-900/80 border border-neutral-800 rounded-lg p-3">
                <div className="text-[10px] uppercase tracking-wider text-neutral-400">
                  Kerapatan Beton Segar
                </div>
                <div className="text-xl font-mono font-extrabold text-emerald-400 mt-1">
                  {(
                    outputs.waterKg +
                    outputs.cementKg +
                    outputs.fineAggregateKg +
                    outputs.coarseAggregateKg
                  ).toFixed(0)}{' '}
                  <span className="text-xs font-normal">kg/m³</span>
                </div>
                <div className="text-[10px] text-neutral-400">Unit Weight</div>
              </div>
            </div>

            {/* Ingredient Quantities Cards (1 m³) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {/* Air / Water */}
              <div className="bg-[#0b0f17] border border-blue-900/40 rounded-xl p-3.5 relative overflow-hidden">
                <div className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5" /> Air Bersih (Water)
                </div>
                <div className="text-2xl font-mono font-extrabold text-white mt-2">
                  {outputs.waterKg.toFixed(1)}{' '}
                  <span className="text-xs font-normal text-neutral-400">kg (L)</span>
                </div>
                <div className="text-[10px] text-neutral-400 mt-1 font-mono">
                  Vol: {outputs.volumes.waterM3.toFixed(3)} m³
                </div>
              </div>

              {/* Semen / Cement */}
              <div className="bg-[#0b0f17] border border-neutral-700 rounded-xl p-3.5 relative overflow-hidden">
                <div className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                  <Box className="w-3.5 h-3.5 text-neutral-400" /> Semen (Cement)
                </div>
                <div className="text-2xl font-mono font-extrabold text-white mt-2">
                  {outputs.cementKg.toFixed(1)}{' '}
                  <span className="text-xs font-normal text-neutral-400">kg</span>
                </div>
                <div className="text-[10px] text-neutral-400 mt-1 font-mono">
                  Vol: {outputs.volumes.cementM3.toFixed(3)} m³ (~{(outputs.cementKg / 50).toFixed(1)} zak 50kg)
                </div>
              </div>

              {/* Pasir / Fine Aggregate */}
              <div className="bg-[#0b0f17] border border-amber-900/40 rounded-xl p-3.5 relative overflow-hidden">
                <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400" /> Pasir SSD (Sand)
                </div>
                <div className="text-2xl font-mono font-extrabold text-white mt-2">
                  {outputs.fineAggregateKg.toFixed(1)}{' '}
                  <span className="text-xs font-normal text-neutral-400">kg</span>
                </div>
                <div className="text-[10px] text-neutral-400 mt-1 font-mono">
                  Vol: {outputs.volumes.fineAggregateM3.toFixed(3)} m³
                </div>
              </div>

              {/* Kerikil / Coarse Aggregate */}
              <div className="bg-[#0b0f17] border border-emerald-900/40 rounded-xl p-3.5 relative overflow-hidden">
                <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-emerald-400" /> Kerikil SSD (Split)
                </div>
                <div className="text-2xl font-mono font-extrabold text-white mt-2">
                  {outputs.coarseAggregateKg.toFixed(1)}{' '}
                  <span className="text-xs font-normal text-neutral-400">kg</span>
                </div>
                <div className="text-[10px] text-neutral-400 mt-1 font-mono">
                  Vol: {outputs.volumes.coarseAggregateM3.toFixed(3)} m³
                </div>
              </div>
            </div>

            {/* Absolute Volume Breakdown Visualizer */}
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-300 font-semibold flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-400" />
                  Distribusi Volume Absolut Total:
                </span>
                <span className="font-mono text-emerald-400 font-bold">
                  {outputs.totalVolume.toFixed(3)} m³ (100.0%)
                </span>
              </div>

              {/* Multi-segmented progress bar */}
              <div className="w-full h-5 bg-neutral-900 rounded-lg overflow-hidden flex border border-neutral-800">
                {/* Cement */}
                <div
                  style={{ width: `${(outputs.volumes.cementM3 / outputs.totalVolume) * 100}%` }}
                  className="bg-neutral-600 hover:opacity-90 transition relative group"
                  title={`Semen: ${outputs.volumes.cementM3.toFixed(3)} m³ (${(
                    (outputs.volumes.cementM3 / outputs.totalVolume) *
                    100
                  ).toFixed(1)}%)`}
                />
                {/* Water */}
                <div
                  style={{ width: `${(outputs.volumes.waterM3 / outputs.totalVolume) * 100}%` }}
                  className="bg-blue-500 hover:opacity-90 transition relative group"
                  title={`Air: ${outputs.volumes.waterM3.toFixed(3)} m³ (${(
                    (outputs.volumes.waterM3 / outputs.totalVolume) *
                    100
                  ).toFixed(1)}%)`}
                />
                {/* Entrapped Air */}
                <div
                  style={{ width: `${(outputs.volumes.airM3 / outputs.totalVolume) * 100}%` }}
                  className="bg-sky-300/40 hover:opacity-90 transition relative group"
                  title={`Udara Terperangkap: ${outputs.volumes.airM3.toFixed(3)} m³ (${(
                    (outputs.volumes.airM3 / outputs.totalVolume) *
                    100
                  ).toFixed(1)}%)`}
                />
                {/* Sand */}
                <div
                  style={{ width: `${(outputs.volumes.fineAggregateM3 / outputs.totalVolume) * 100}%` }}
                  className="bg-amber-600 hover:opacity-90 transition relative group"
                  title={`Pasir: ${outputs.volumes.fineAggregateM3.toFixed(3)} m³ (${(
                    (outputs.volumes.fineAggregateM3 / outputs.totalVolume) *
                    100
                  ).toFixed(1)}%)`}
                />
                {/* Gravel */}
                <div
                  style={{ width: `${(outputs.volumes.coarseAggregateM3 / outputs.totalVolume) * 100}%` }}
                  className="bg-emerald-600 hover:opacity-90 transition relative group"
                  title={`Kerikil: ${outputs.volumes.coarseAggregateM3.toFixed(3)} m³ (${(
                    (outputs.volumes.coarseAggregateM3 / outputs.totalVolume) *
                    100
                  ).toFixed(1)}%)`}
                />
              </div>

              {/* Legend bar */}
              <div className="flex flex-wrap items-center justify-between text-[11px] text-neutral-400 pt-1 font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-neutral-600 rounded-sm" /> Semen (
                  {((outputs.volumes.cementM3 / outputs.totalVolume) * 100).toFixed(1)}%)
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-sm" /> Air (
                  {((outputs.volumes.waterM3 / outputs.totalVolume) * 100).toFixed(1)}%)
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-sky-300/40 rounded-sm" /> Udara (
                  {((outputs.volumes.airM3 / outputs.totalVolume) * 100).toFixed(1)}%)
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-amber-600 rounded-sm" /> Pasir (
                  {((outputs.volumes.fineAggregateM3 / outputs.totalVolume) * 100).toFixed(1)}%)
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-emerald-600 rounded-sm" /> Kerikil (
                  {((outputs.volumes.coarseAggregateM3 / outputs.totalVolume) * 100).toFixed(1)}%)
                </div>
              </div>
            </div>
          </div>

          <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-3 text-xs text-neutral-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Proporsi campuran SSD siap diaplikasikan untuk koreksi kadar air lapangan pada Module 3.
              </span>
            </div>
            <span className="text-[11px] text-neutral-400">SNI 7656:2012</span>
          </div>
        </div>
      </div>
    </div>
  );
};
