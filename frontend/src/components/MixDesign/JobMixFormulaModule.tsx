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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-700">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Module 2: Job Mix Formula (JMF) Proportioning Calculator
              </h2>
              <p className="text-xs text-slate-500">
                Standar SNI 7656:2012 / ACI 211.1 • Metode Volume Absolut (1 m³ Beton Segar SSD)
              </p>
            </div>
          </div>
        </div>

        {/* Sync with Module 1 FM status */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl text-xs shadow-2xs">
          <Layers className="w-3.5 h-3.5 text-sky-600" />
          <span className="text-slate-500 font-medium">FM Pasir dari Ayakan:</span>
          <strong className="text-slate-900 font-mono font-bold">{finenessModulus.toFixed(2)}</strong>
        </div>
      </div>

      {/* Input Parameters Form & Outputs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Mix Design Inputs (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Scale className="w-4 h-4 text-emerald-600" />
            <span>Parameter Desain Campuran</span>
          </h3>

          {/* Target Strength: Dual Mode (f'c cylinder vs K cube) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="target-strength-fc" className="text-xs font-semibold text-slate-700">
                Kuat Tekan Rencana (Target Strength):
              </label>
              <div className="text-[11px] text-slate-500">Umur 28 Hari</div>
            </div>

            {/* Direct f'c vs K Mode Switcher */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                  Silinder f'c (MPa)
                </div>
                <div className="flex items-baseline gap-1 mt-1.5">
                  <input
                    id="target-strength-fc"
                    type="number"
                    min="10"
                    max="60"
                    step="0.5"
                    value={inputs.targetStrengthMPa}
                    onChange={(e) => handleFcChange(parseFloat(e.target.value) || 20)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shadow-2xs"
                  />
                  <span className="text-xs font-semibold text-slate-500">MPa</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                  Kubus K (kg/cm²)
                </div>
                <div className="flex items-baseline gap-1 mt-1.5">
                  <input
                    type="number"
                    min="100"
                    max="650"
                    step="5"
                    value={inputs.kValue}
                    onChange={(e) => handleKChange(parseFloat(e.target.value) || 250)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shadow-2xs"
                  />
                  <span className="text-xs font-semibold text-slate-500">kg/cm²</span>
                </div>
              </div>
            </div>

            {/* Quick K Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1 print:hidden">
              {K_VALUE_PRESETS.map((preset) => (
                <button
                  key={preset.k}
                  onClick={() => handleKChange(preset.k)}
                  className={`text-[11px] font-mono font-semibold px-2.5 py-1 rounded-lg transition ${
                    Math.abs(inputs.kValue - preset.k) < 8
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  title={preset.label}
                >
                  K-{preset.k}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 italic">
              Konversi SNI: f'c ≈ K × 0.083 × 0.981 (Silinder Ø15x30cm vs Kubus 15x15x15cm)
            </p>
          </div>

          {/* Slump Range Selector */}
          <div className="space-y-1.5 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label htmlFor="slump-range-select" className="text-xs font-semibold text-slate-700">
                Nilai Slump Rencana:
              </label>
              <span className="text-[11px] text-slate-500">SNI 7656 Tabel 1</span>
            </div>
            <select
              id="slump-range-select"
              value={inputs.slumpRange}
              onChange={(e) => onChangeInputs({ ...inputs, slumpRange: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shadow-2xs"
            >
              <option value="3-5">3 - 5 cm (Pondasi Dangkal, Perkerasan Jalan Kaku)</option>
              <option value="8-10">8 - 10 cm (Balok, Kolom, Pelat Lantai Standar - Rekomendasi)</option>
              <option value="10-12">10 - 12 cm (Konstruksi Bertulang Rapat, Pengecoran Pompa)</option>
              <option value="15-18">15 - 18 cm (Bored Pile / Tremie / Flowable Concrete)</option>
            </select>
          </div>

          {/* Coarse Aggregate Max Size */}
          <div className="space-y-1.5 pt-3 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-700 block">
              Ukuran Butir Agregat Kasar Maksimum (MSA):
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onChangeInputs({ ...inputs, coarseAggregateMaxSizeMm: 19 })}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition text-center break-words whitespace-normal leading-snug ${
                  inputs.coarseAggregateMaxSizeMm === 19
                    ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                19 mm (3/4") - Balok/Pelat
              </button>
              <button
                type="button"
                onClick={() => onChangeInputs({ ...inputs, coarseAggregateMaxSizeMm: 25 })}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition text-center break-words whitespace-normal leading-snug ${
                  inputs.coarseAggregateMaxSizeMm === 25
                    ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                25 mm (1") - Pondasi Masif
              </button>
            </div>
          </div>

          {/* Material Specific Gravities (Berat Jenis SSD) */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-700">
              Berat Jenis Relatif Material (Specific Gravity SSD):
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 font-medium block mb-0.5">Semen</label>
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
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900 font-mono text-center focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shadow-2xs"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-medium block mb-0.5">Pasir</label>
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
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900 font-mono text-center focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shadow-2xs"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-medium block mb-0.5">Kerikil</label>
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
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900 font-mono text-center focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shadow-2xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Mix Proportions Output & Volume Yield (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between space-y-5 shadow-xs">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Droplets className="w-4 h-4 text-sky-600" />
                <span>Proporsi Campuran Teoritis (Per 1 m³ Beton SSD)</span>
              </h3>
              <span className="text-xs font-mono text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80">
                1.000 m³ Yield
              </span>
            </div>

            {/* Key Calculated Indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 shadow-2xs flex flex-col justify-between">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold break-words whitespace-normal leading-tight pb-0.5">
                  Faktor Air Semen (w/c)
                </div>
                <div>
                  <div className="text-xl font-mono font-extrabold text-sky-700 mt-1">
                    {outputs.waterCementRatio.toFixed(3)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 break-words whitespace-normal">Berdasarkan f'cr</div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 shadow-2xs flex flex-col justify-between">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold break-words whitespace-normal leading-tight pb-0.5">
                  Target f'cr Rencana
                </div>
                <div>
                  <div className="text-xl font-mono font-extrabold text-slate-900 mt-1">
                    {outputs.targetRequiredStrengthMPa.toFixed(1)} <span className="text-xs font-normal text-slate-500">MPa</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 break-words whitespace-normal">
                    Margin: +{outputs.marginOfSafetyMPa.toFixed(1)} MPa
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 shadow-2xs flex flex-col justify-between">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold break-words whitespace-normal leading-tight pb-0.5">
                  Rasio Campuran
                </div>
                <div>
                  <div className="text-xs font-mono font-bold text-slate-900 mt-1.5 break-words whitespace-normal">
                    1 : {outputs.mixRatio.sand.toFixed(2)} : {outputs.mixRatio.gravel.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 break-words whitespace-normal">
                    Semen : Pasir : Kerikil
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 shadow-2xs flex flex-col justify-between">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold break-words whitespace-normal leading-tight pb-0.5">
                  Kerapatan Segar
                </div>
                <div>
                  <div className="text-xl font-mono font-extrabold text-emerald-700 mt-1">
                    {(
                      outputs.waterKg +
                      outputs.cementKg +
                      outputs.fineAggregateKg +
                      outputs.coarseAggregateKg
                    ).toFixed(0)}{' '}
                    <span className="text-xs font-normal text-slate-500">kg/m³</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 break-words whitespace-normal">Unit Weight</div>
                </div>
              </div>
            </div>

            {/* Ingredient Quantities Cards (1 m³) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {/* Air / Water */}
              <div className="bg-white border border-sky-200/80 rounded-xl p-4 shadow-xs">
                <div className="text-xs font-semibold text-sky-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5 text-sky-600" /> Air</span>
                  <span className="bg-sky-50 text-sky-700 border border-sky-200/80 text-[10px] px-1.5 py-0.5 rounded-md font-mono">Water</span>
                </div>
                <div className="text-2xl font-mono font-extrabold text-slate-900 mt-2">
                  {outputs.waterKg.toFixed(1)}{' '}
                  <span className="text-xs font-normal text-slate-500">L</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-mono">
                  Vol: {outputs.volumes.waterM3.toFixed(3)} m³
                </div>
              </div>

              {/* Semen / Cement */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <div className="text-xs font-semibold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Box className="w-3.5 h-3.5 text-slate-600" /> Semen</span>
                  <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px] px-1.5 py-0.5 rounded-md font-mono">Cement</span>
                </div>
                <div className="text-2xl font-mono font-extrabold text-slate-900 mt-2">
                  {outputs.cementKg.toFixed(1)}{' '}
                  <span className="text-xs font-normal text-slate-500">kg</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-mono">
                  ~{(outputs.cementKg / 50).toFixed(1)} zak 50kg
                </div>
              </div>

              {/* Pasir / Fine Aggregate */}
              <div className="bg-white border border-amber-200/80 rounded-xl p-4 shadow-xs">
                <div className="text-xs font-semibold text-amber-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-amber-600" /> Pasir</span>
                  <span className="bg-amber-50 text-amber-700 border border-amber-200/80 text-[10px] px-1.5 py-0.5 rounded-md font-mono">Sand</span>
                </div>
                <div className="text-2xl font-mono font-extrabold text-slate-900 mt-2">
                  {outputs.fineAggregateKg.toFixed(1)}{' '}
                  <span className="text-xs font-normal text-slate-500">kg</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-mono">
                  Vol: {outputs.volumes.fineAggregateM3.toFixed(3)} m³
                </div>
              </div>

              {/* Kerikil / Coarse Aggregate */}
              <div className="bg-white border border-emerald-200/80 rounded-xl p-4 shadow-xs">
                <div className="text-xs font-semibold text-emerald-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Scale className="w-3.5 h-3.5 text-emerald-600" /> Kerikil</span>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] px-1.5 py-0.5 rounded-md font-mono">Split</span>
                </div>
                <div className="text-2xl font-mono font-extrabold text-slate-900 mt-2">
                  {outputs.coarseAggregateKg.toFixed(1)}{' '}
                  <span className="text-xs font-normal text-slate-500">kg</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-mono">
                  Vol: {outputs.volumes.coarseAggregateM3.toFixed(3)} m³
                </div>
              </div>
            </div>

            {/* Absolute Volume Breakdown Visualizer */}
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-700 font-semibold flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-sky-600" />
                  Distribusi Volume Absolut Total:
                </span>
                <span className="font-mono text-emerald-700 font-bold">
                  {outputs.totalVolume.toFixed(3)} m³ (100.0%)
                </span>
              </div>

              {/* Multi-segmented modern pastel progress bar */}
              <div className="w-full h-5 bg-slate-100 rounded-lg overflow-hidden flex border border-slate-200/80">
                {/* Cement */}
                <div
                  style={{ width: `${(outputs.volumes.cementM3 / outputs.totalVolume) * 100}%` }}
                  className="bg-slate-400 hover:opacity-90 transition relative group"
                  title={`Semen: ${outputs.volumes.cementM3.toFixed(3)} m³ (${(
                    (outputs.volumes.cementM3 / outputs.totalVolume) *
                    100
                  ).toFixed(1)}%)`}
                />
                {/* Water */}
                <div
                  style={{ width: `${(outputs.volumes.waterM3 / outputs.totalVolume) * 100}%` }}
                  className="bg-sky-400 hover:opacity-90 transition relative group"
                  title={`Air: ${outputs.volumes.waterM3.toFixed(3)} m³ (${(
                    (outputs.volumes.waterM3 / outputs.totalVolume) *
                    100
                  ).toFixed(1)}%)`}
                />
                {/* Entrapped Air */}
                <div
                  style={{ width: `${(outputs.volumes.airM3 / outputs.totalVolume) * 100}%` }}
                  className="bg-sky-200 hover:opacity-90 transition relative group"
                  title={`Udara Terperangkap: ${outputs.volumes.airM3.toFixed(3)} m³ (${(
                    (outputs.volumes.airM3 / outputs.totalVolume) *
                    100
                  ).toFixed(1)}%)`}
                />
                {/* Sand */}
                <div
                  style={{ width: `${(outputs.volumes.fineAggregateM3 / outputs.totalVolume) * 100}%` }}
                  className="bg-amber-400 hover:opacity-90 transition relative group"
                  title={`Pasir: ${outputs.volumes.fineAggregateM3.toFixed(3)} m³ (${(
                    (outputs.volumes.fineAggregateM3 / outputs.totalVolume) *
                    100
                  ).toFixed(1)}%)`}
                />
                {/* Gravel */}
                <div
                  style={{ width: `${(outputs.volumes.coarseAggregateM3 / outputs.totalVolume) * 100}%` }}
                  className="bg-emerald-400 hover:opacity-90 transition relative group"
                  title={`Kerikil: ${outputs.volumes.coarseAggregateM3.toFixed(3)} m³ (${(
                    (outputs.volumes.coarseAggregateM3 / outputs.totalVolume) *
                    100
                  ).toFixed(1)}%)`}
                />
              </div>

              {/* Legend bar */}
              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-600 pt-1 font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-slate-400 rounded-sm" /> Semen (
                  {((outputs.volumes.cementM3 / outputs.totalVolume) * 100).toFixed(1)}%)
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-sky-400 rounded-sm" /> Air (
                  {((outputs.volumes.waterM3 / outputs.totalVolume) * 100).toFixed(1)}%)
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-sky-200 rounded-sm" /> Udara (
                  {((outputs.volumes.airM3 / outputs.totalVolume) * 100).toFixed(1)}%)
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-amber-400 rounded-sm" /> Pasir (
                  {((outputs.volumes.fineAggregateM3 / outputs.totalVolume) * 100).toFixed(1)}%)
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-emerald-400 rounded-sm" /> Kerikil (
                  {((outputs.volumes.coarseAggregateM3 / outputs.totalVolume) * 100).toFixed(1)}%)
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Proporsi campuran SSD siap diaplikasikan untuk koreksi kadar air lapangan pada Module 3.
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">SNI 7656:2012</span>
          </div>
        </div>
      </div>
    </div>
  );
};
