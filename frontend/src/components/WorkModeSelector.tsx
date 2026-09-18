import React from 'react';
import { WorkModeId, WorkModeConfig, WORK_MODES } from '../types/workModes';

interface WorkModeSelectorProps {
  activeModeId: WorkModeId;
  onSelectMode: (mode: WorkModeConfig) => void;
}

export const WorkModeSelector: React.FC<WorkModeSelectorProps> = ({
  activeModeId,
  onSelectMode,
}) => {
  const activeMode = WORK_MODES.find((m) => m.id === activeModeId) || WORK_MODES[0];

  return (
    <div className="flex items-center gap-1.5 shrink-0 select-none">
      <span className="text-neutral-400 text-[10px] uppercase font-bold tracking-wider hidden sm:inline">
        Mode:
      </span>
      <select
        value={activeModeId}
        onChange={(e) => {
          const selected = WORK_MODES.find((m) => m.id === e.target.value);
          if (selected) onSelectMode(selected);
        }}
        className={`border rounded px-2.5 py-1 text-xs focus:outline-none transition-colors font-semibold cursor-pointer ${
          activeMode.id === 'contractor'
            ? 'text-emerald-300 border-emerald-500/70 bg-emerald-950/40'
            : activeMode.id === 'geotech'
            ? 'text-rose-300 border-rose-500/70 bg-rose-950/40'
            : activeMode.id === 'logistics'
            ? 'text-cyan-300 border-cyan-500/70 bg-cyan-950/40'
            : activeMode.id === 'ikn'
            ? 'text-amber-300 border-amber-500/70 bg-amber-950/40'
            : 'bg-neutral-900 text-neutral-200 border-neutral-700 hover:border-neutral-500'
        }`}
        title="Pilih Kurasi Mode Kerja (Layer, Filter & Basemap)"
      >
        <option value="standard" className="bg-[#0f141c] text-neutral-100">🌐 Standar (Semua)</option>
        <option value="contractor" className="bg-[#0f141c] text-emerald-300 font-semibold">👷 Kontraktor & Vendor</option>
        <option value="geotech" className="bg-[#0f141c] text-rose-300 font-semibold">⚡ Geoteknik & Gempa</option>
        <option value="logistics" className="bg-[#0f141c] text-cyan-300 font-semibold">🚢 Logistik & Tol Laut</option>
        <option value="ikn" className="bg-[#0f141c] text-amber-300 font-semibold">🏛️ Fokus IKN Nusantara</option>
      </select>
    </div>
  );
};
