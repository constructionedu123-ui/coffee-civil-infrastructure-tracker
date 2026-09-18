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
    <div className="space-y-6 text-slate-100 print:space-y-2">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80 print:pb-1.5 print:border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-emerald-400 shadow-inner print:bg-emerald-50 print:border-emerald-200 print:text-emerald-700">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 tracking-tight print:text-slate-900 print:text-xs">
                Module 2: Job Mix Formula (JMF) Proportioning Calculator
              </h2>
              <p className="text-xs text-slate-400 print:text-slate-500 print:text-[10px]">
                Standar SNI 7656:2012 / ACI 211.1 • Metode Volume Absolut (1 m³ Beton Segar SSD)
              </p>
            </div>
          </div>
        </div>

        {/* Sync with Module 1 FM status */}
        <div className="flex items-center gap-2 bg-[#0c121a] border border-slate-700/80 px-3.5 py-1.5 rounded-xl text-xs shadow-sm print:bg-slate-50 print:border-slate-300 print:px-2 print:py-0.5 print:text-[10px]">
          <Layers className="w-3.5 h-3.5 text-sky-400 print:text-sky-700" />
          <span className="text-slate-400 font-medium print:text-slate-600">FM Pasir:</span>
          <strong className="text-white font-mono font-bold print:text-slate-900">{finenessModulus.toFixed(2)}</strong>
        </div>
      </div>

      {/* Input Parameters Form & Outputs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:gap-3">
        {/* Left Column: Mix Design Inputs (5 cols) */}
        <div className="lg:col-span-5 bg-[#0c121a] rounded-xl border border-slate-700/60 p-5 space-y-4 shadow-lg print:col-span-5 print:bg-white print:border print:border-slate-300 print:p-2.5 print:space-y-1.5 print:shadow-none">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800/80 pb-3 print:pb-1 print:border-slate-200 print:text-xs print:text-slate-900">
            <Scale className="w-4 h-4 text-emerald-400 print:text-emerald-700" />
            <span>Parameter Desain Campuran</span>
          </h3>

          {/* Target Strength: Dual Mode (f'c cylinder vs K cube) */}
          <div className="space-y-2 print:space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="target-strength-fc" className="text-xs font-semibold text-slate-300 print:text-slate-700 print:text-[10px]">
                Kuat Tekan Rencana (Target Strength):
              </label>
              <div className="text-[11px] text-slate-400 print:text-slate-500 print:text-[9px]">Umur 28 Hari</div>
            </div>

            {/* Direct f'c vs K Mode Switcher */}
            <div className="grid grid-cols-2 gap-3 print:gap-1.5">
              <div className="bg-[#131b26] border border-slate-700/80 rounded-xl p-3 print:bg-slate-50 print:border print:border-slate-200 print:p-1.5">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 print:text-slate-600 print:text-[9px]">
                  Silinder f'c (MPa)
                </div>
                <div className="flex items-baseline gap-1 mt-1.5 print:mt-0.5">
                  <input
                    id="target-strength-fc"
                    type="number"
                    min="10"
                    max="60"
                    step="0.5"
                    value={inputs.targetStrengthMPa}
                    onChange={(e) => handleFcChange(parseFloat(e.target.value) || 20)}
                    className="w-full bg-[#0c121a] border border-slate-700 rounded-lg px-2.5 py-1 text-sm font-mono font-bold text-white focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 shadow-inner print:bg-white print:border-slate-300 print:text-slate-900 print:py-0.5 print:text-xs"
                  />
                  <span className="text-xs font-semibold text-slate-400 print:text-slate-600 print:text-[10px]">MPa</span>
                </div>
              </div>

              <div className="bg-[#131b26] border border-slate-700/80 rounded-xl p-3 print:bg-slate-50 print:border print:border-slate-200 print:p-1.5">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 print:text-slate-600 print:text-[9px]">
                  Kubus K (kg/cm²)
                </div>
                <div className="flex items-baseline gap-1 mt-1.5 print:mt-0.5">
                  <input
                    type="number"
                    min="100"
                    max="650"
                    step="5"
                    value={inputs.kValue}
                    onChange={(e) => handleKChange(parseFloat(e.target.value) || 250)}
                    className="w-full bg-[#0c121a] border border-slate-700 rounded-lg px-2.5 py-1 text-sm font-mono font-bold text-white focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 shadow-inner print:bg-white print:border-slate-300 print:text-slate-900 print:py-0.5 print:text-xs"
                  />
                  <span className="text-xs font-semibold text-slate-400 print:text-slate-600 print:text-[10px]">kg/cm²</span>
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
                      ? 'bg-slate-100 text-slate-900 shadow-sm'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700'
                  }`}
                  title={preset.label}
                >
                  K-{preset.k}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 italic print:text-[9px] print:text-slate-500">
              Konversi SNI: f'c ≈ K × 0.083 × 0.981 (Silinder Ø15x30cm vs Kubus 15x15x15cm)
            </p>
          </div>

          {/* Slump Range Selector */}
          <div className="space-y-1.5 pt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <label htmlFor="slump-range-select" className="text-xs font-semibold text-slate-300">
                Nilai Slump Rencana:
              </label>
              <span className="text-[11px] text-slate-400">SNI 7656 Tabel 1</span>
            </div>
            <select
              id="slump-range-select"
              value={inputs.slumpRange}
              onChange={(e) => onChangeInputs({ ...inputs, slumpRange: e.target.value })}
              className="w-full bg-[#131b26] border border-slate-700 rounded-lg p-2 text-xs text-slate-200 font-medium focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 shadow-inner"
            >
              <option value="3-5" className="bg-[#131b26] text-slate-200">3 - 5 cm (Pondasi Dangkal, Perkerasan Jalan Kaku)</option>
              <option value="8-10" className="bg-[#131b26] text-slate-200">8 - 10 cm (Balok, Kolom, Pelat Lantai Standar - Rekomendasi)</option>
              <option value="10-12" className="bg-[#131b26] text-slate-200">10 - 12 cm (Konstruksi Bertulang Rapat, Pengecoran Pompa)</option>
              <option value="15-18" className="bg-[#131b26] text-slate-200">15 - 18 cm (Bored Pile / Tremie / Flowable Concrete)</option>
            </select>
          </div>

          {/* Coarse Aggregate Max Size */}
          <div className="space-y-1.5 pt-3 border-t border-slate-800/80">
            <label className="text-xs font-semibold text-slate-300 block">
              Ukuran Butir Agregat Kasar Maksimum (MSA):
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onChangeInputs({ ...inputs, coarseAggregateMaxSizeMm: 19 })}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition text-center break-words whitespace-normal leading-snug ${
                  inputs.coarseAggregateMaxSizeMm === 19
                    ? 'bg-slate-100 border-slate-100 text-slate-900 shadow-sm'
                    : 'bg-[#131b26] border-slate-700 text-slate-300 hover:bg-slate-800/80'
                }`}
              >
                19 mm (3/4") - Balok/Pelat
              </button>
              <button
                type="button"
                onClick={() => onChangeInputs({ ...inputs, coarseAggregateMaxSizeMm: 25 })}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition text-center break-words whitespace-normal leading-snug ${
                  inputs.coarseAggregateMaxSizeMm === 25
                    ? 'bg-slate-100 border-slate-100 text-slate-900 shadow-sm'
                    : 'bg-[#131b26] border-slate-700 text-slate-300 hover:bg-slate-800/80'
                }`}
              >
                25 mm (1") - Pondasi Masif
              </button>
            </div>
          </div>

          {/* Material Specific Gravities (Berat Jenis SSD) */}
          <div className="space-y-2 pt-3 border-t border-slate-800/80">
            <div className="text-xs font-semibold text-slate-300">
              Berat Jenis Relatif Material (Specific Gravity SSD):
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 font-medium block mb-0.5">Semen</label>
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
                  className="w-full bg-[#131b26] border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono text-center focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 shadow-inner"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-medium block mb-0.5">Pasir</label>
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
                  className="w-full bg-[#131b26] border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono text-center focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 shadow-inner"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-medium block mb-0.5">Kerikil</label>
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
                  className="w-full bg-[#131b26] border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono text-center focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 shadow-inner"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Mix Proportions Output & Volume Yield (7 cols) */}
        <div className="lg:col-span-7 bg-[#0c121a] rounded-xl border border-slate-700/60 p-5 flex flex-col justify-between space-y-5 shadow-lg print:col-span-7 print:bg-white print:border print:border-slate-300 print:p-2.5 print:space-y-2 print:shadow-none">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 print:pb-1 print:border-slate-200">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 print:text-xs print:text-slate-900">
                <Droplets className="w-4 h-4 text-sky-400 print:text-sky-700" />
                <span>Proporsi Campuran Teoritis (Per 1 m³ Beton SSD)</span>
              </h3>
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/60 print:bg-white print:border print:border-emerald-700 print:text-emerald-800 print:text-[10px]">
                1.000 m³ Yield
              </span>
            </div>

            {/* Key Calculated Indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 print:grid-cols-4 print:gap-1.5 print:mt-1.5">
              <div className="bg-[#131b26] border border-slate-700/80 rounded-xl p-3 shadow-inner flex flex-col justify-between print:bg-slate-50 print:border print:border-slate-200 print:p-1.5 print:shadow-none">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold break-words whitespace-normal leading-tight pb-0.5 print:text-slate-600 print:text-[9px]">
                  Faktor Air Semen (w/c)
                </div>
                <div>
                  <div className="text-xl font-mono font-extrabold text-sky-400 mt-1 print:text-sky-800 print:text-base">
                    {outputs.waterCementRatio.toFixed(3)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 break-words whitespace-normal print:text-slate-500 print:text-[9px]">Berdasarkan f'cr</div>
                </div>
              </div>

              <div className="bg-[#131b26] border border-slate-700/80 rounded-xl p-3 shadow-inner flex flex-col justify-between print:bg-slate-50 print:border print:border-slate-200 print:p-1.5 print:shadow-none">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold break-words whitespace-normal leading-tight pb-0.5 print:text-slate-600 print:text-[9px]">
                  Target f'cr Rencana
                </div>
                <div>
                  <div className="text-xl font-mono font-extrabold text-white mt-1 print:text-slate-900 print:text-base">
                    {outputs.targetRequiredStrengthMPa.toFixed(1)} <span className="text-xs font-normal text-slate-400 print:text-slate-600 print:text-[10px]">MPa</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 break-words whitespace-normal print:text-slate-500 print:text-[9px]">
                    Margin: +{outputs.marginOfSafetyMPa.toFixed(1)} MPa
                  </div>
                </div>
              </div>

              <div className="bg-[#131b26] border border-slate-700/80 rounded-xl p-3 shadow-inner flex flex-col justify-between print:bg-slate-50 print:border print:border-slate-200 print:p-1.5 print:shadow-none">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold break-words whitespace-normal leading-tight pb-0.5 print:text-slate-600 print:text-[9px]">
                  Rasio Campuran
                </div>
                <div>
                  <div className="text-xs font-mono font-bold text-white mt-1.5 break-words whitespace-normal print:text-slate-900 print:text-[10px]">
                    1 : {outputs.mixRatio.sand.toFixed(2)} : {outputs.mixRatio.gravel.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 break-words whitespace-normal print:text-slate-500 print:text-[9px]">
                    Semen : Pasir : Kerikil
                  </div>
                </div>
              </div>

              <div className="bg-[#131b26] border border-slate-700/80 rounded-xl p-3 shadow-inner flex flex-col justify-between print:bg-slate-50 print:border print:border-slate-200 print:p-1.5 print:shadow-none">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold break-words whitespace-normal leading-tight pb-0.5 print:text-slate-600 print:text-[9px]">
                  Kerapatan Segar
                </div>
                <div>
                  <div className="text-xl font-mono font-extrabold text-emerald-400 mt-1 print:text-emerald-800 print:text-base">
                    {(
                      outputs.waterKg +
                      outputs.cementKg +
                      outputs.fineAggregateKg +
                      outputs.coarseAggregateKg
                    ).toFixed(0)}{' '}
                    <span className="text-xs font-normal text-slate-400 print:text-slate-600 print:text-[10px]">kg/m³</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 break-words whitespace-normal print:text-slate-500 print:text-[9px]">Unit Weight</div>
                </div>
              </div>
            </div>

            {/* Ingredient Quantities Cards (1 m³) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 print:grid-cols-4 print:gap-1.5 print:mt-1.5">
              {/* Air / Water */}
              <div className="bg-[#131b26] border border-sky-800/60 rounded-xl p-4 shadow-sm print:bg-slate-50 print:border print:border-sky-300 print:p-1.5 print:shadow-none">
                <div className="text-xs font-semibold text-sky-400 flex items-center justify-between print:text-sky-800 print:text-[10px]">
                  <span className="flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5 text-sky-400 print:text-sky-700" /> Air</span>
                  <span className="bg-sky-950/60 text-sky-400 border border-sky-800/60 text-[10px] px-1.5 py-0.5 rounded-md font-mono print:bg-white print:border-sky-300 print:text-sky-800 print:text-[9px]">Water</span>
                </div>
                <div className="text-2xl font-mono font-extrabold text-white mt-2 print:text-slate-900 print:text-base print:mt-1">
                  {outputs.waterKg.toFixed(1)}{' '}
                  <span className="text-xs font-normal text-slate-400 print:text-slate-600 print:text-[10px]">L</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono print:text-slate-500 print:text-[9px]">
                  Vol: {outputs.volumes.waterM3.toFixed(3)} m³
                </div>
              </div>

              {/* Semen / Cement */}
              <div className="bg-[#131b26] border border-slate-700 rounded-xl p-4 shadow-sm print:bg-slate-50 print:border print:border-slate-300 print:p-1.5 print:shadow-none">
                <div className="text-xs font-semibold text-slate-200 flex items-center justify-between print:text-slate-800 print:text-[10px]">
                  <span className="flex items-center gap-1.5"><Box className="w-3.5 h-3.5 text-slate-400 print:text-slate-600" /> Semen</span>
                  <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] px-1.5 py-0.5 rounded-md font-mono print:bg-white print:border-slate-300 print:text-slate-800 print:text-[9px]">Cement</span>
                </div>
                <div className="text-2xl font-mono font-extrabold text-white mt-2 print:text-slate-900 print:text-base print:mt-1">
                  {outputs.cementKg.toFixed(1)}{' '}
                  <span className="text-xs font-normal text-slate-400 print:text-slate-600 print:text-[10px]">kg</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono print:text-slate-500 print:text-[9px]">
                  ~{(outputs.cementKg / 50).toFixed(1)} zak 50kg
                </div>
              </div>

              {/* Pasir / Fine Aggregate */}
              <div className="bg-[#131b26] border border-amber-800/60 rounded-xl p-4 shadow-sm print:bg-slate-50 print:border print:border-amber-300 print:p-1.5 print:shadow-none">
                <div className="text-xs font-semibold text-amber-400 flex items-center justify-between print:text-amber-800 print:text-[10px]">
                  <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-amber-400 print:text-amber-700" /> Pasir</span>
                  <span className="bg-amber-950/60 text-amber-400 border border-amber-800/60 text-[10px] px-1.5 py-0.5 rounded-md font-mono print:bg-white print:border-amber-300 print:text-amber-800 print:text-[9px]">Sand</span>
                </div>
                <div className="text-2xl font-mono font-extrabold text-white mt-2 print:text-slate-900 print:text-base print:mt-1">
                  {outputs.fineAggregateKg.toFixed(1)}{' '}
                  <span className="text-xs font-normal text-slate-400 print:text-slate-600 print:text-[10px]">kg</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono print:text-slate-500 print:text-[9px]">
                  Vol: {outputs.volumes.fineAggregateM3.toFixed(3)} m³
                </div>
              </div>

              {/* Kerikil / Coarse Aggregate */}
              <div className="bg-[#131b26] border border-emerald-800/60 rounded-xl p-4 shadow-sm print:bg-slate-50 print:border print:border-emerald-300 print:p-1.5 print:shadow-none">
                <div className="text-xs font-semibold text-emerald-400 flex items-center justify-between print:text-emerald-800 print:text-[10px]">
                  <span className="flex items-center gap-1.5"><Scale className="w-3.5 h-3.5 text-emerald-400 print:text-emerald-700" /> Kerikil</span>
                  <span className="bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 text-[10px] px-1.5 py-0.5 rounded-md font-mono print:bg-white print:border-emerald-300 print:text-emerald-800 print:text-[9px]">Split</span>
                </div>
                <div className="text-2xl font-mono font-extrabold text-white mt-2 print:text-slate-900 print:text-base print:mt-1">
                  {outputs.coarseAggregateKg.toFixed(1)}{' '}
                  <span className="text-xs font-normal text-slate-400 print:text-slate-600 print:text-[10px]">kg</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono print:text-slate-500 print:text-[9px]">
                  Vol: {outputs.volumes.coarseAggregateM3.toFixed(3)} m³
                </div>
              </div>
            </div>

            {/* Absolute Volume Breakdown Visualizer */}
            <div className="mt-5 space-y-2 print:mt-1.5 print:space-y-1">
              <div className="flex items-center justify-between text-xs print:text-[10px]">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5 print:text-slate-800">
                  <Info className="w-3.5 h-3.5 text-sky-400 print:text-sky-700" />
                  Distribusi Volume Absolut Total:
                </span>
                <span className="font-mono text-emerald-400 font-bold print:text-emerald-800">
                  {outputs.totalVolume.toFixed(3)} m³ (100.0%)
                </span>
              </div>

              {/* Multi-segmented modern pastel progress bar */}
              <div className="w-full h-5 bg-slate-900 rounded-lg overflow-hidden flex border border-slate-700/80 print:h-3.5 print:border-slate-400">
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
              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1 font-mono print:text-[9px] print:text-slate-600 print:pt-0.5">
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

          <div className="bg-[#131b26] border border-slate-700/80 rounded-xl p-3 text-xs text-slate-300 flex items-center justify-between print:bg-slate-50 print:border print:border-slate-300 print:p-1.5 print:text-[10px] print:text-slate-700">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 print:text-emerald-700" />
              <span>
                Proporsi campuran SSD siap diaplikasikan untuk koreksi kadar air lapangan pada Module 3.
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium print:text-slate-600">SNI 7656:2012</span>
          </div>
        </div>
      </div>
    </div>
  );
};
