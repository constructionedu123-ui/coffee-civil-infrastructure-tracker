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
      <div className="bg-[#111827] border border-neutral-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Module 3: Koreksi Kadar Air Lapangan & Skala Batching Truk Mixer
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Field Moisture & Absorption Correction • Penyesuaian Pengurangan Air Truk Mixer & Berat Timbang Agregat Basah
          </p>
        </div>

        {/* Batch Volume Multiplier Quick Selector */}
        <div className="flex items-center flex-wrap gap-2">
          <span className="text-[11px] text-neutral-400 font-medium">Kapasitas Batch:</span>
          {volumePresets.map((preset) => (
            <button
              key={preset.val}
              onClick={() => onChangeMoisture({ ...moistureInputs, batchVolumeM3: preset.val })}
              className={`px-3 py-1 text-xs font-semibold rounded-lg border transition ${
                moistureInputs.batchVolumeM3 === preset.val
                  ? 'bg-amber-500 text-neutral-950 border-amber-400 font-bold shadow'
                  : 'bg-neutral-900 text-neutral-300 border-neutral-700 hover:text-white'
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
        <div className="lg:col-span-5 bg-[#111827] border border-neutral-800 rounded-xl p-5 space-y-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-neutral-800 pb-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>Kadar Air & Penyerapan Agregat Lapangan</span>
          </h3>

          {/* Sand (Pasir) Moisture Controls */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-xs text-amber-300 flex items-center gap-1.5">
                <span>Agregat Halus (Pasir)</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                Air Bebas:{' '}
                <strong
                  className={
                    batchingOutputs.sandFreeMoisturePercent >= 0
                      ? 'text-amber-400'
                      : 'text-blue-400'
                  }
                >
                  {batchingOutputs.sandFreeMoisturePercent > 0 ? '+' : ''}
                  {batchingOutputs.sandFreeMoisturePercent.toFixed(2)}%
                </strong>
              </span>
            </div>

            {/* Slider 1: Field Moisture w (%) */}
            <div>
              <div className="flex justify-between text-xs text-neutral-300 mb-1">
                <span>Kadar Air Lapangan (w):</span>
                <span className="font-mono font-bold text-amber-400">
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
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <div className="flex justify-between text-[10px] text-neutral-400 mt-0.5">
                <span>0.0% (Kering Oven)</span>
                <span>5.0% (Lembab Normal)</span>
                <span>10.0% (Sangat Basah/Hujan)</span>
              </div>
            </div>

            {/* Slider 2: Absorption a (%) */}
            <div className="pt-2 border-t border-neutral-800/80">
              <div className="flex justify-between text-xs text-neutral-300 mb-1">
                <span>Penyerapan Air / Absorpsi (a):</span>
                <span className="font-mono font-bold text-neutral-200">
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
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-400"
              />
              <div className="flex justify-between text-[10px] text-neutral-400 mt-0.5">
                <span>0.5% (Pasir Kuarsa)</span>
                <span>1.5% (Standar SNI)</span>
                <span>3.5% (Pasir Berpori)</span>
              </div>
            </div>
          </div>

          {/* Gravel (Kerikil) Moisture Controls */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-xs text-emerald-300 flex items-center gap-1.5">
                <span>Agregat Kasar (Kerikil/Split)</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                Air Bebas:{' '}
                <strong
                  className={
                    batchingOutputs.gravelFreeMoisturePercent >= 0
                      ? 'text-emerald-400'
                      : 'text-blue-400'
                  }
                >
                  {batchingOutputs.gravelFreeMoisturePercent > 0 ? '+' : ''}
                  {batchingOutputs.gravelFreeMoisturePercent.toFixed(2)}%
                </strong>
              </span>
            </div>

            {/* Slider 3: Field Moisture w (%) */}
            <div>
              <div className="flex justify-between text-xs text-neutral-300 mb-1">
                <span>Kadar Air Lapangan (w):</span>
                <span className="font-mono font-bold text-emerald-400">
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
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <div className="flex justify-between text-[10px] text-neutral-400 mt-0.5">
                <span>0.0% (Kering)</span>
                <span>2.0% (Agak Lembab)</span>
                <span>6.0% (Basah Terendam)</span>
              </div>
            </div>

            {/* Slider 4: Absorption a (%) */}
            <div className="pt-2 border-t border-neutral-800/80">
              <div className="flex justify-between text-xs text-neutral-300 mb-1">
                <span>Penyerapan Air / Absorpsi (a):</span>
                <span className="font-mono font-bold text-neutral-200">
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
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-400"
              />
              <div className="flex justify-between text-[10px] text-neutral-400 mt-0.5">
                <span>0.5% (Batu Andesit/Basalt)</span>
                <span>1.0% (Standar SNI)</span>
                <span>2.5% (Batu Kapur)</span>
              </div>
            </div>
          </div>

          {/* Custom Batch Volume Stepper */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-neutral-200">Custom Volume Batching:</div>
              <div className="text-[11px] text-neutral-400">Tentukan volume mixer (m³)</div>
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
                className="w-20 bg-neutral-950 border border-neutral-700 rounded px-2 py-1 text-right text-sm font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500"
              />
              <span className="text-xs font-mono text-neutral-400">m³</span>
            </div>
          </div>
        </div>

        {/* Right Column: Water Correction Callout & Batch Loading Ticket (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Real-time Water Deduction Callout Card */}
          <div
            className={`border rounded-xl p-5 relative overflow-hidden transition ${
              isDeductingWater
                ? 'bg-amber-950/30 border-amber-500/50'
                : 'bg-blue-950/30 border-blue-500/50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-neutral-300">
                  Instruksi Lapangan Operator Batching Plant
                </span>
                <h4 className="text-base sm:text-lg font-bold text-white mt-1.5 flex items-center gap-2">
                  {isDeductingWater ? (
                    <>
                      <TrendingDown className="w-5 h-5 text-amber-400" />
                      <span>Koreksi Air: PENGURANGAN AIR MIXER</span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-5 h-5 text-blue-400" />
                      <span>Koreksi Air: PENAMBAHAN AIR MIXER</span>
                    </>
                  )}
                </h4>
                <p className="text-xs text-neutral-400 mt-1 max-w-xl">
                  {isDeductingWater ? (
                    <>
                      Agregat mengandung kelembaban permukaan lebih tinggi dari absorpsi (Air Bebas
                      Positif). Volume air dispenser mixer{' '}
                      <strong className="text-amber-300">HARUS DIKURANGI</strong> agar slump dan
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
              <div className="text-right">
                <div className="text-xs text-neutral-400">Koreksi per m³:</div>
                <div
                  className={`text-2xl sm:text-3xl font-mono font-extrabold ${
                    isDeductingWater ? 'text-amber-400' : 'text-blue-400'
                  }`}
                >
                  {batchingOutputs.waterAdjustmentKgPerM3 > 0 ? '+' : ''}
                  {batchingOutputs.waterAdjustmentKgPerM3.toFixed(1)}{' '}
                  <span className="text-xs font-normal">Liter/m³</span>
                </div>
              </div>
            </div>

            {/* Scale for Full Truck */}
            <div className="mt-4 pt-4 border-t border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900/80 p-3.5 rounded-lg">
              <div className="flex items-center gap-2.5">
                <Truck className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">
                    Total Koreksi untuk Truk Mixer ({moistureInputs.batchVolumeM3} m³):
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    Koreksi debit air nozzle dispenser mixer
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xl sm:text-2xl font-mono font-extrabold text-amber-300">
                  {batchingOutputs.totalActualWaterCorrectionKg > 0 ? '+' : ''}
                  {batchingOutputs.totalActualWaterCorrectionKg.toFixed(1)}{' '}
                  <span className="text-xs font-normal text-neutral-400">Liter</span>
                </div>
                <div className="text-[10px] text-neutral-400">
                  Air Teoritis {moistureInputs.batchVolumeM3} m³:{' '}
                  <span className="font-mono">
                    {(mixOutputs.waterKg * moistureInputs.batchVolumeM3).toFixed(0)} L
                  </span>{' '}
                  → Aktual:{' '}
                  <span className="font-mono font-bold text-white">
                    {batchingOutputs.totalActualWaterKg.toFixed(0)} L
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Official Batch Loading Ticket Table */}
          <div className="bg-[#111827] border border-neutral-800 rounded-xl p-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>Surat Jalan & Tiket Timbang Batching Plant ({moistureInputs.batchVolumeM3} m³)</span>
              </h3>
              <span className="text-[11px] font-mono text-neutral-400">
                Kondisi Lapangan Basah (Moist)
              </span>
            </div>

            <div className="overflow-x-auto mt-3">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400 font-sans font-semibold">
                    <th className="py-2 pr-2">Material</th>
                    <th className="py-2 px-2 text-right">Teoritis SSD (1 m³)</th>
                    <th className="py-2 px-2 text-right text-amber-400">Aktual Lapangan (1 m³)</th>
                    <th className="py-2 pl-2 text-right text-emerald-400 font-bold font-mono">
                      Total Truk ({moistureInputs.batchVolumeM3} m³)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {/* Water */}
                  <tr className="hover:bg-neutral-800/30">
                    <td className="py-2.5 pr-2 font-sans text-neutral-200 flex items-center gap-1.5">
                      <Droplet className="w-3.5 h-3.5 text-blue-400" />
                      <span>Air Bersih (Water)</span>
                    </td>
                    <td className="py-2.5 px-2 text-right text-neutral-400">
                      {mixOutputs.waterKg.toFixed(1)} L
                    </td>
                    <td className="py-2.5 px-2 text-right text-blue-400 font-bold">
                      {batchingOutputs.actualWaterKgPerM3.toFixed(1)} L
                    </td>
                    <td className="py-2.5 pl-2 text-right text-emerald-400 font-bold text-sm">
                      {batchingOutputs.totalActualWaterKg.toFixed(1)} Liter
                    </td>
                  </tr>

                  {/* Cement */}
                  <tr className="hover:bg-neutral-800/30">
                    <td className="py-2.5 pr-2 font-sans text-neutral-200 flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded bg-neutral-700 inline-block" />
                      <span>Semen Portland (Cement)</span>
                    </td>
                    <td className="py-2.5 px-2 text-right text-neutral-400">
                      {mixOutputs.cementKg.toFixed(1)} kg
                    </td>
                    <td className="py-2.5 px-2 text-right text-neutral-200">
                      {batchingOutputs.actualCementKgPerM3.toFixed(1)} kg
                    </td>
                    <td className="py-2.5 pl-2 text-right text-emerald-400 font-bold text-sm">
                      {batchingOutputs.totalActualCementKg.toFixed(1)} kg
                    </td>
                  </tr>

                  {/* Sand (Wet) */}
                  <tr className="hover:bg-neutral-800/30">
                    <td className="py-2.5 pr-2 font-sans text-neutral-200 flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded bg-amber-600 inline-block" />
                      <span>Pasir Basah (Sand)</span>
                    </td>
                    <td className="py-2.5 px-2 text-right text-neutral-400">
                      {mixOutputs.fineAggregateKg.toFixed(1)} kg
                    </td>
                    <td className="py-2.5 px-2 text-right text-amber-400 font-semibold">
                      {batchingOutputs.actualSandKgPerM3.toFixed(1)} kg
                    </td>
                    <td className="py-2.5 pl-2 text-right text-emerald-400 font-bold text-sm">
                      {batchingOutputs.totalActualSandKg.toFixed(1)} kg
                    </td>
                  </tr>

                  {/* Gravel (Wet) */}
                  <tr className="hover:bg-neutral-800/30">
                    <td className="py-2.5 pr-2 font-sans text-neutral-200 flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded bg-emerald-600 inline-block" />
                      <span>Kerikil / Split Basah</span>
                    </td>
                    <td className="py-2.5 px-2 text-right text-neutral-400">
                      {mixOutputs.coarseAggregateKg.toFixed(1)} kg
                    </td>
                    <td className="py-2.5 px-2 text-right text-emerald-300 font-semibold">
                      {batchingOutputs.actualGravelKgPerM3.toFixed(1)} kg
                    </td>
                    <td className="py-2.5 pl-2 text-right text-emerald-400 font-bold text-sm">
                      {batchingOutputs.totalActualGravelKg.toFixed(1)} kg
                    </td>
                  </tr>

                  {/* Total Batch Weight */}
                  <tr className="bg-neutral-900 font-bold">
                    <td className="py-2.5 pr-2 font-sans text-white">Total Muatan Truk:</td>
                    <td className="py-2.5 px-2 text-right text-neutral-400">
                      {(
                        (mixOutputs.waterKg +
                          mixOutputs.cementKg +
                          mixOutputs.fineAggregateKg +
                          mixOutputs.coarseAggregateKg) *
                        1
                      ).toFixed(0)}{' '}
                      kg
                    </td>
                    <td className="py-2.5 px-2 text-right text-neutral-200">
                      {(
                        batchingOutputs.actualWaterKgPerM3 +
                        batchingOutputs.actualCementKgPerM3 +
                        batchingOutputs.actualSandKgPerM3 +
                        batchingOutputs.actualGravelKgPerM3
                      ).toFixed(0)}{' '}
                      kg
                    </td>
                    <td className="py-2.5 pl-2 text-right text-emerald-300 text-sm">
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

            <div className="mt-3 pt-2 text-[11px] text-neutral-400 flex items-center justify-between border-t border-neutral-800">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  Semen Portland tidak menyerap kelembaban agregat, sehingga berat semen tetap konstan.
                </span>
              </div>
              <span className="font-mono text-neutral-400">Coffee Civil Lab Tool</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
