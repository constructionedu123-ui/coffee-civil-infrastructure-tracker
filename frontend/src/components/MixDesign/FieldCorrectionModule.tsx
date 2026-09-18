import React from 'react';
import {
  Truck,
  Droplet,
  Sliders,
  AlertCircle,
  FileCheck,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  MixDesignInputs,
  MixDesignOutputs,
  MoistureInputs,
  MoistureCorrectionOutputs,
} from './types';

interface FieldCorrectionModuleProps {
  mixInputs: MixDesignInputs;
  mixOutputs: MixDesignOutputs;
  moistureInputs: MoistureInputs;
  onChangeMoisture: (inputs: MoistureInputs) => void;
  batchingOutputs: MoistureCorrectionOutputs;
}

export const FieldCorrectionModule: React.FC<FieldCorrectionModuleProps> = ({
  mixOutputs,
  moistureInputs,
  onChangeMoisture,
  batchingOutputs,
}) => {
  const volumePresets = [
    { label: '1 m³ Lab Trial', val: 1 },
    { label: '3 m³ Mini Mixer', val: 3 },
    { label: '6 m³ Standar Truck', val: 6 },
    { label: '7 m³ TM Truck (Molen)', val: 7 },
  ];

  const isDeductingWater = batchingOutputs.waterAdjustmentKgPerM3 < 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80 print:border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-950/60 border border-amber-800/60 flex items-center justify-center text-amber-400 print:bg-amber-50 print:border-amber-200/60 print:text-amber-700">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 print:text-slate-900 tracking-tight">
                Module 3: Koreksi Kadar Air Lapangan & Skala Batching Truk Mixer
              </h2>
              <p className="text-xs text-slate-400 print:text-slate-500">
                Field Moisture & Absorption Correction • Penyesuaian Pengurangan Air Truk Mixer & Berat Timbang Agregat Basah
              </p>
            </div>
          </div>
        </div>

        {/* Batch Volume Multiplier Quick Selector */}
        <div className="flex items-center flex-wrap gap-2">
          <span className="text-[11px] font-semibold text-slate-400 print:text-slate-500 uppercase tracking-wider print:hidden">Kapasitas Batch:</span>
          <span className="hidden print:inline-block text-xs font-bold text-slate-800 border border-slate-700 px-2 py-0.5 rounded">
            Volume Batch Terpilih: {moistureInputs.batchVolumeM3} m³
          </span>
          {volumePresets.map((preset) => (
            <button
              key={preset.val}
              onClick={() => onChangeMoisture({ ...moistureInputs, batchVolumeM3: preset.val })}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition print:hidden ${
                moistureInputs.batchVolumeM3 === preset.val
                  ? 'bg-slate-100 text-slate-900 border-slate-100 shadow-md font-bold'
                  : 'bg-[#0c121a] text-slate-300 border-slate-700 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Moisture & Absorption Sliders (5 cols) */}
        <div className="lg:col-span-5 bg-[#131b26] rounded-xl border border-slate-800/80 p-5 space-y-5 shadow-2xl print:bg-white print:border-slate-200">
          <h3 className="text-sm font-bold text-slate-100 print:text-slate-900 flex items-center gap-2 border-b border-slate-800/80 print:border-slate-100 pb-3">
            <Sliders className="w-4 h-4 text-amber-400 print:text-amber-600" />
            <span>Kadar Air & Penyerapan Agregat Lapangan</span>
          </h3>

          {/* Sand (Pasir) Moisture Controls */}
          <div className="bg-[#0c121a] border border-slate-700/60 rounded-xl p-4 space-y-3 print:bg-slate-50 print:border-slate-200">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-xs text-slate-200 print:text-slate-900 flex items-center gap-1.5">
                <span>Agregat Halus (Pasir)</span>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#131b26] border border-slate-700 text-slate-300 print:bg-white print:border-slate-200 print:text-slate-700">
                Air Bebas:{' '}
                <strong
                  className={
                    batchingOutputs.sandFreeMoisturePercent >= 0
                      ? 'text-amber-400 print:text-amber-700'
                      : 'text-sky-400 print:text-sky-700'
                  }
                >
                  {batchingOutputs.sandFreeMoisturePercent > 0 ? '+' : ''}
                  {batchingOutputs.sandFreeMoisturePercent.toFixed(2)}%
                </strong>
              </span>
            </div>

            {/* Slider 1: Field Moisture w (%) */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 print:text-slate-700 mb-1">
                <span>Kadar Air Lapangan (w):</span>
                <span className="font-mono font-bold text-white print:text-slate-900">
                  {moistureInputs.sandMoisturePercent.toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="10.0"
                step="0.1"
                value={moistureInputs.sandMoisturePercent}
                onChange={(e) =>
                  onChangeMoisture({
                    ...moistureInputs,
                    sandMoisturePercent: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400 print:bg-slate-200 print:accent-slate-900 print:hidden"
              />
              <div className="flex justify-between text-[10px] text-slate-500 print:text-slate-400 mt-0.5 font-medium print:hidden">
                <span>0.0% (Kering Oven)</span>
                <span>5.0% (Lembab Normal)</span>
                <span>10.0% (Sangat Basah)</span>
              </div>
            </div>

            {/* Slider 2: Absorption a (%) */}
            <div className="pt-2 border-t border-slate-800/80 print:border-slate-200/80">
              <div className="flex justify-between text-xs text-slate-300 print:text-slate-700 mb-1">
                <span>Penyerapan Air / Absorpsi (a):</span>
                <span className="font-mono font-bold text-white print:text-slate-900">
                  {moistureInputs.sandAbsorptionPercent.toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="4.0"
                step="0.1"
                value={moistureInputs.sandAbsorptionPercent}
                onChange={(e) =>
                  onChangeMoisture({
                    ...moistureInputs,
                    sandAbsorptionPercent: parseFloat(e.target.value) || 0.5,
                  })
                }
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400 print:bg-slate-200 print:accent-sky-600 print:hidden"
              />
              <div className="flex justify-between text-[10px] text-slate-500 print:text-slate-400 mt-0.5 font-medium print:hidden">
                <span>0.5% (Pasir Kuarsa)</span>
                <span>1.5% (Standar SNI)</span>
                <span>3.5% (Pasir Berpori)</span>
              </div>
            </div>
          </div>

          {/* Gravel (Kerikil) Moisture Controls */}
          <div className="bg-[#0c121a] border border-slate-700/60 rounded-xl p-4 space-y-3 print:bg-slate-50 print:border-slate-200">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-xs text-slate-200 print:text-slate-900 flex items-center gap-1.5">
                <span>Agregat Kasar (Kerikil/Split)</span>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#131b26] border border-slate-700 text-slate-300 print:bg-white print:border-slate-200 print:text-slate-700">
                Air Bebas:{' '}
                <strong
                  className={
                    batchingOutputs.gravelFreeMoisturePercent >= 0
                      ? 'text-emerald-400 print:text-emerald-700'
                      : 'text-sky-400 print:text-sky-700'
                  }
                >
                  {batchingOutputs.gravelFreeMoisturePercent > 0 ? '+' : ''}
                  {batchingOutputs.gravelFreeMoisturePercent.toFixed(2)}%
                </strong>
              </span>
            </div>

            {/* Slider 3: Field Moisture w (%) */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 print:text-slate-700 mb-1">
                <span>Kadar Air Lapangan (w):</span>
                <span className="font-mono font-bold text-white print:text-slate-900">
                  {moistureInputs.gravelMoisturePercent.toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="6.0"
                step="0.1"
                value={moistureInputs.gravelMoisturePercent}
                onChange={(e) =>
                  onChangeMoisture({
                    ...moistureInputs,
                    gravelMoisturePercent: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400 print:bg-slate-200 print:accent-slate-900 print:hidden"
              />
              <div className="flex justify-between text-[10px] text-slate-500 print:text-slate-400 mt-0.5 font-medium print:hidden">
                <span>0.0% (Kering)</span>
                <span>2.0% (Agak Lembab)</span>
                <span>6.0% (Basah Terendam)</span>
              </div>
            </div>

            {/* Slider 4: Absorption a (%) */}
            <div className="pt-2 border-t border-slate-800/80 print:border-slate-200/80">
              <div className="flex justify-between text-xs text-slate-300 print:text-slate-700 mb-1">
                <span>Penyerapan Air / Absorpsi (a):</span>
                <span className="font-mono font-bold text-white print:text-slate-900">
                  {moistureInputs.gravelAbsorptionPercent.toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="3.0"
                step="0.1"
                value={moistureInputs.gravelAbsorptionPercent}
                onChange={(e) =>
                  onChangeMoisture({
                    ...moistureInputs,
                    gravelAbsorptionPercent: parseFloat(e.target.value) || 0.5,
                  })
                }
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400 print:bg-slate-200 print:accent-sky-600 print:hidden"
              />
              <div className="flex justify-between text-[10px] text-slate-500 print:text-slate-400 mt-0.5 font-medium print:hidden">
                <span>0.5% (Batu Andesit)</span>
                <span>1.0% (Standar SNI)</span>
                <span>2.5% (Batu Kapur)</span>
              </div>
            </div>
          </div>

          {/* Custom Batch Volume Stepper */}
          <div className="bg-[#0c121a] border border-slate-700/60 rounded-xl p-3.5 flex items-center justify-between print:bg-slate-50 print:border-slate-200">
            <div>
              <div className="text-xs font-semibold text-slate-200 print:text-slate-900">Custom Volume Batching:</div>
              <div className="text-[11px] text-slate-400 print:text-slate-500">Tentukan volume mixer (m³)</div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0.1"
                max="20"
                step="0.5"
                value={moistureInputs.batchVolumeM3}
                onChange={(e) =>
                  onChangeMoisture({
                    ...moistureInputs,
                    batchVolumeM3: Math.max(0.1, parseFloat(e.target.value) || 1),
                  })
                }
                className="w-20 bg-[#131b26] border border-slate-600 rounded-lg px-2.5 py-1 text-right text-sm font-mono font-bold text-white focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 shadow-xs print:bg-white print:border-slate-300 print:text-slate-900"
              />
              <span className="text-xs font-mono font-semibold text-slate-400 print:text-slate-500">m³</span>
            </div>
          </div>
        </div>

        {/* Right Column: Water Correction Callout & Batch Loading Ticket (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Real-time Water Deduction Callout Card */}
          <div
            className={`border rounded-xl p-5 shadow-2xl transition ${
              isDeductingWater
                ? 'bg-amber-950/40 border-amber-800/60 text-amber-200 print:bg-amber-50/80 print:border-amber-200/80 print:text-amber-900'
                : 'bg-sky-950/40 border-sky-800/60 text-sky-200 print:bg-sky-50/80 print:border-sky-200/80 print:text-sky-900'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#131b26] border border-slate-700 text-slate-300 print:bg-white print:border-slate-200 print:text-slate-700 shadow-xs inline-block">
                  Instruksi Lapangan Operator Batching Plant
                </span>
                <h4 className="text-base sm:text-lg font-bold text-slate-100 print:text-slate-900 mt-2 flex items-center gap-2 break-words whitespace-normal leading-tight">
                  {isDeductingWater ? (
                    <>
                      <TrendingDown className="w-5 h-5 text-amber-400 print:text-amber-600 shrink-0" />
                      <span>Koreksi Air: PENGURANGAN AIR MIXER</span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-5 h-5 text-sky-400 print:text-sky-600 shrink-0" />
                      <span>Koreksi Air: PENAMBAHAN AIR MIXER</span>
                    </>
                  )}
                </h4>
                <p className="text-xs text-slate-300 print:text-slate-600 mt-1 max-w-xl leading-relaxed break-words whitespace-normal">
                  {isDeductingWater ? (
                    <>
                      Agregat mengandung kelembaban permukaan lebih tinggi dari absorpsi (Air Bebas
                      Positif). Volume air dispenser mixer{' '}
                      <strong className="text-amber-400 font-semibold print:text-amber-900">HARUS DIKURANGI</strong> agar slump dan
                      faktor air semen (w/c) tidak jebol.
                    </>
                  ) : (
                    <>
                      Agregat kering menyerap air (Air Bebas Negatif). Tambahkan air agar semen
                      terhidrasi sempurna.
                    </>
                  )}
                </p>
              </div>

              {/* Deduction Large Badge */}
              <div className="shrink-0 text-left sm:text-right">
                <div className="text-xs text-slate-400 print:text-slate-500 font-medium">Koreksi per m³:</div>
                <div
                  className={`text-2xl sm:text-3xl font-mono font-extrabold ${
                    isDeductingWater ? 'text-amber-400 print:text-amber-700' : 'text-sky-400 print:text-sky-700'
                  }`}
                >
                  {batchingOutputs.waterAdjustmentKgPerM3 > 0 ? '+' : ''}
                  {batchingOutputs.waterAdjustmentKgPerM3.toFixed(1)}{' '}
                  <span className="text-xs font-normal text-slate-400 print:text-slate-500">L/m³</span>
                </div>
              </div>
            </div>

            {/* Scale for Full Truck */}
            <div className="mt-4 pt-4 border-t border-slate-800/80 print:border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0c121a] border border-slate-800 p-3.5 rounded-xl print:bg-white print:border-none shadow-xs">
              <div className="flex items-center gap-2.5">
                <Truck className="w-5 h-5 text-amber-400 print:text-amber-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-200 print:text-slate-900">
                    Total Koreksi untuk Truk Mixer ({moistureInputs.batchVolumeM3} m³):
                  </div>
                  <div className="text-[11px] text-slate-400 print:text-slate-500">
                    Koreksi debit air nozzle dispenser mixer
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xl sm:text-2xl font-mono font-extrabold text-amber-400 print:text-amber-700">
                  {batchingOutputs.totalActualWaterCorrectionKg > 0 ? '+' : ''}
                  {batchingOutputs.totalActualWaterCorrectionKg.toFixed(1)}{' '}
                  <span className="text-xs font-normal text-slate-400 print:text-slate-500">Liter</span>
                </div>
                <div className="text-[10px] text-slate-400 print:text-slate-500 font-medium">
                  Air Teoritis {moistureInputs.batchVolumeM3} m³:{' '}
                  <span className="font-mono text-slate-300 print:text-slate-700">
                    {(mixOutputs.waterKg * moistureInputs.batchVolumeM3).toFixed(0)} L
                  </span>{' '}
                  → Aktual:{' '}
                  <span className="font-mono font-bold text-white print:text-slate-900">
                    {batchingOutputs.totalActualWaterKg.toFixed(0)} L
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Official Batch Loading Ticket Table */}
          <div className="bg-[#131b26] border border-slate-800/80 rounded-xl p-5 shadow-2xl print:bg-white print:border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 print:border-slate-100">
              <h3 className="text-sm font-bold text-slate-100 print:text-slate-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400 print:text-emerald-600" />
                <span>Surat Jalan & Tiket Timbang Batching Plant ({moistureInputs.batchVolumeM3} m³)</span>
              </h3>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#0c121a] text-slate-300 border border-slate-700 print:bg-slate-100 print:text-slate-600 print:border-none">
                Kondisi Lapangan Basah
              </span>
            </div>

            <div className="overflow-x-auto mt-3">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 print:border-slate-100 print:text-slate-500 font-sans font-semibold">
                    <th className="py-2.5 pr-2">Material</th>
                    <th className="py-2.5 px-2 text-right">Teoritis SSD (1 m³)</th>
                    <th className="py-2.5 px-2 text-right text-slate-300 print:text-slate-700">Aktual Lapangan (1 m³)</th>
                    <th className="py-2.5 pl-2 text-right text-emerald-400 print:text-emerald-700 font-bold font-mono">
                      Total Truk ({moistureInputs.batchVolumeM3} m³)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300 print:divide-slate-100 print:text-slate-800">
                  {/* Water */}
                  <tr className="hover:bg-slate-800/30 print:hover:bg-slate-50/80">
                    <td className="py-2.5 pr-2 font-sans text-slate-200 print:text-slate-900 flex items-center gap-1.5 font-medium">
                      <Droplet className="w-3.5 h-3.5 text-sky-400 print:text-sky-600" />
                      <span>Air Bersih (Water)</span>
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-400 print:text-slate-500">
                      {mixOutputs.waterKg.toFixed(1)} L
                    </td>
                    <td className="py-2.5 px-2 text-right text-sky-400 print:text-sky-700 font-bold">
                      {batchingOutputs.actualWaterKgPerM3.toFixed(1)} L
                    </td>
                    <td className="py-2.5 pl-2 text-right text-emerald-400 print:text-emerald-700 font-bold text-sm">
                      {batchingOutputs.totalActualWaterKg.toFixed(1)} Liter
                    </td>
                  </tr>

                  {/* Cement */}
                  <tr className="hover:bg-slate-800/30 print:hover:bg-slate-50/80">
                    <td className="py-2.5 pr-2 font-sans text-slate-200 print:text-slate-900 flex items-center gap-1.5 font-medium">
                      <span className="w-3.5 h-3.5 rounded-md bg-slate-500 print:bg-slate-300 inline-block" />
                      <span>Semen Portland (Cement)</span>
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-400 print:text-slate-500">
                      {mixOutputs.cementKg.toFixed(1)} kg
                    </td>
                    <td className="py-2.5 px-2 text-right text-white print:text-slate-900 font-semibold">
                      {batchingOutputs.actualCementKgPerM3.toFixed(1)} kg
                    </td>
                    <td className="py-2.5 pl-2 text-right text-emerald-400 print:text-emerald-700 font-bold text-sm">
                      {batchingOutputs.totalActualCementKg.toFixed(1)} kg
                    </td>
                  </tr>

                  {/* Sand (Wet) */}
                  <tr className="hover:bg-slate-800/30 print:hover:bg-slate-50/80">
                    <td className="py-2.5 pr-2 font-sans text-slate-200 print:text-slate-900 flex items-center gap-1.5 font-medium">
                      <span className="w-3.5 h-3.5 rounded-md bg-amber-400 inline-block" />
                      <span>Pasir Basah (Sand)</span>
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-400 print:text-slate-500">
                      {mixOutputs.fineAggregateKg.toFixed(1)} kg
                    </td>
                    <td className="py-2.5 px-2 text-right text-amber-400 print:text-amber-800 font-semibold">
                      {batchingOutputs.actualSandKgPerM3.toFixed(1)} kg
                    </td>
                    <td className="py-2.5 pl-2 text-right text-emerald-400 print:text-emerald-700 font-bold text-sm">
                      {batchingOutputs.totalActualSandKg.toFixed(1)} kg
                    </td>
                  </tr>

                  {/* Gravel (Wet) */}
                  <tr className="hover:bg-slate-800/30 print:hover:bg-slate-50/80">
                    <td className="py-2.5 pr-2 font-sans text-slate-200 print:text-slate-900 flex items-center gap-1.5 font-medium">
                      <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 inline-block" />
                      <span>Kerikil / Split Basah</span>
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-400 print:text-slate-500">
                      {mixOutputs.coarseAggregateKg.toFixed(1)} kg
                    </td>
                    <td className="py-2.5 px-2 text-right text-emerald-400 print:text-emerald-800 font-semibold">
                      {batchingOutputs.actualGravelKgPerM3.toFixed(1)} kg
                    </td>
                    <td className="py-2.5 pl-2 text-right text-emerald-400 print:text-emerald-700 font-bold text-sm">
                      {batchingOutputs.totalActualGravelKg.toFixed(1)} kg
                    </td>
                  </tr>

                  {/* Total Batch Weight */}
                  <tr className="bg-[#0c121a] font-bold border-t border-slate-700/80 print:bg-slate-50/80 print:border-slate-200">
                    <td className="py-2.5 pr-2 font-sans text-white print:text-slate-900">Total Muatan Truk:</td>
                    <td className="py-2.5 px-2 text-right text-slate-400 print:text-slate-500">
                      {(
                        (mixOutputs.waterKg +
                          mixOutputs.cementKg +
                          mixOutputs.fineAggregateKg +
                          mixOutputs.coarseAggregateKg) *
                        1
                      ).toFixed(0)}{' '}
                      kg
                    </td>
                    <td className="py-2.5 px-2 text-right text-white print:text-slate-900">
                      {(
                        batchingOutputs.actualWaterKgPerM3 +
                        batchingOutputs.actualCementKgPerM3 +
                        batchingOutputs.actualSandKgPerM3 +
                        batchingOutputs.actualGravelKgPerM3
                      ).toFixed(0)}{' '}
                      kg
                    </td>
                    <td className="py-2.5 pl-2 text-right text-emerald-400 print:text-emerald-800 text-sm font-extrabold">
                      {(
                        (batchingOutputs.actualWaterKgPerM3 +
                          batchingOutputs.actualCementKgPerM3 +
                          batchingOutputs.actualSandKgPerM3 +
                          batchingOutputs.actualGravelKgPerM3) *
                        moistureInputs.batchVolumeM3
                      ).toFixed(0)}{' '}
                      kg (~
                      {(
                        ((batchingOutputs.actualWaterKgPerM3 +
                          batchingOutputs.actualCementKgPerM3 +
                          batchingOutputs.actualSandKgPerM3 +
                          batchingOutputs.actualGravelKgPerM3) *
                          moistureInputs.batchVolumeM3) /
                        1000
                      ).toFixed(2)}{' '}
                      Ton)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-3 pt-3 text-[11px] text-slate-400 print:text-slate-500 flex items-center justify-between border-t border-slate-800/80 print:border-slate-100">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  Semen Portland tidak menyerap kelembaban agregat, sehingga berat semen tetap konstan.
                </span>
              </div>
              <span className="font-mono text-slate-500">Coffee Civil Lab Tool</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
