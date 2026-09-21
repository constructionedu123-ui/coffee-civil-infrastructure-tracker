import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ProjectCategory } from '../../types/project';
import { CATEGORY_CONFIG } from '../../constants/categories';

export interface MapLegendProps {
  showBatchingPlants?: boolean;
  showSupplyBuffers?: boolean;
  showFaultLines?: boolean;
  showQuarries?: boolean;
  showSteelMills?: boolean;
  showCementPlants?: boolean;
  showFacadePlants?: boolean;
  showMaritimeRoutes?: boolean;
  showRainRadar?: boolean;
  weatherMode?: 'radar' | 'satellite';
}

export const MapLegend: React.FC<MapLegendProps> = ({
  showBatchingPlants = false,
  showSupplyBuffers = false,
  showFaultLines = false,
  showQuarries = false,
  showSteelMills = false,
  showCementPlants = false,
  showFacadePlants = false,
  showMaritimeRoutes = false,
  showRainRadar = false,
  weatherMode = 'radar',
}) => {
  // Default state: Open on desktop (width >= 768px), collapsed on mobile
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });

  const categories: ProjectCategory[] = [
    'Transport',
    'Energy',
    'Water',
    'Housing',
    'IKN',
    'Commercial & Private',
  ];

  // If collapsed, display a sleek floating pill button
  if (!isExpanded) {
    return (
      <div
        className="absolute bottom-6 right-6 z-[1000] opacity-100 visible pointer-events-auto select-none"
        onDoubleClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0f141c]/95 backdrop-blur-md border border-neutral-800 hover:border-neutral-700 shadow-2xl text-xs font-semibold text-neutral-200 hover:text-white transition-all active:scale-95 group"
          title="Buka Legenda Peta"
        >
          <span className="text-sm">ℹ️</span>
          <span>Legenda Peta</span>
          <ChevronUp className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white transition-transform" />
        </button>
      </div>
    );
  }

  // Expanded complete legend card
  return (
    <div
      className="absolute bottom-6 right-6 z-[1000] opacity-100 visible pointer-events-auto select-none"
      onDoubleClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      <div className="bg-[#0f141c]/95 backdrop-blur-md border border-neutral-800 shadow-2xl rounded-xl p-3 text-xs w-64 max-h-[75vh] flex flex-col transition-all">
        {/* Header with collapsible toggle */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">ℹ️</span>
            <span className="font-bold text-[11px] uppercase tracking-wider text-neutral-200">
              Legenda Peta
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="p-1 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            title="Kecilkan Legenda"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scrollable Legend Content */}
        <div className="mt-2 space-y-2.5 overflow-y-auto pr-1 max-h-[60vh]">
          {/* PSN Sectors */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
              Sektor Proyek
            </span>
            <div className="space-y-1">
              {categories.map((cat) => {
                const cfg = CATEGORY_CONFIG[cat];
                return (
                  <div key={cat} className="flex items-center gap-2 text-neutral-300">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/60 shadow-sm"
                      style={{ backgroundColor: cfg.color }}
                    />
                    <span className="truncate text-[11px]">{cfg.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Marker Indicators & Active Layers */}
          <div className="pt-2 border-t border-neutral-800/80 space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
              Indikator & Layer Aktif
            </span>

            {/* National corridor pin */}
            <div className="flex items-center gap-2 text-neutral-300 text-[11px]">
              <div className="w-3 h-3 rounded-full bg-neutral-700 border border-white flex items-center justify-center shrink-0">
                <div className="w-1 h-1 rounded-full bg-white" />
              </div>
              <span className="text-neutral-400">Koridor Multi-Wilayah (PSN)</span>
            </div>

            {/* Material Supply Chain Hubs */}
            {showQuarries && (
              <div className="flex items-center gap-2 text-neutral-300 text-[11px] pt-1 border-t border-neutral-800/60">
                <div className="w-3.5 h-3.5 rounded bg-neutral-900 border border-amber-500 flex items-center justify-center text-[9px] shrink-0">
                  ⛰️
                </div>
                <span>Quarry Pasir & Agregat</span>
              </div>
            )}

            {showSteelMills && (
              <div className="flex items-center gap-2 text-neutral-300 text-[11px] pt-1 border-t border-neutral-800/60">
                <div className="w-3.5 h-3.5 rounded bg-neutral-900 border border-cyan-500 flex items-center justify-center text-[9px] shrink-0">
                  🔩
                </div>
                <span>Pabrik Baja Konstruksi</span>
              </div>
            )}

            {showCementPlants && (
              <div className="flex items-center gap-2 text-neutral-300 text-[11px] pt-1 border-t border-neutral-800/60">
                <div className="w-3.5 h-3.5 rounded bg-neutral-900 border border-rose-500 flex items-center justify-center text-[9px] shrink-0">
                  🧱
                </div>
                <span>Pabrik Semen Terpadu</span>
              </div>
            )}

            {showFacadePlants && (
              <div className="flex items-center gap-2 text-neutral-300 text-[11px] pt-1 border-t border-neutral-800/60">
                <div className="w-3.5 h-3.5 rounded bg-neutral-900 border border-emerald-500 flex items-center justify-center text-[9px] shrink-0">
                  🪟
                </div>
                <span>Fasad & Kaca Arsitektur</span>
              </div>
            )}

            {showBatchingPlants && (
              <div className="flex items-center gap-2 text-neutral-300 text-[11px] pt-1 border-t border-neutral-800/60">
                <div className="w-3.5 h-3.5 rounded bg-neutral-900 border border-amber-500 flex items-center justify-center text-[9px] shrink-0">
                  🏗️
                </div>
                <span>Batching Plant / Precast</span>
              </div>
            )}

            {showSupplyBuffers && (
              <div className="space-y-1 pl-1 pt-0.5">
                <div className="flex items-center gap-2 text-neutral-300 text-[10.5px]">
                  <div className="w-2.5 h-2.5 rounded-full border border-emerald-500 bg-emerald-500/25 shrink-0" />
                  <span>15 km Optimal (90-mnt ASTM C94)</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-300 text-[10.5px]">
                  <div className="w-2.5 h-2.5 rounded-full border border-amber-500 bg-amber-500/25 shrink-0" />
                  <span>30 km Batas Maks (Admixture Retarder)</span>
                </div>
              </div>
            )}

            {showFaultLines && (
              <div className="flex items-center gap-2 text-neutral-300 text-[11px] pt-1 border-t border-neutral-800/60">
                <div className="w-4 h-1 rounded bg-rose-500 shadow-[0_0_6px_#ef4444] shrink-0" />
                <span>Sesar Aktif (PuSGeN 2017/2024)</span>
              </div>
            )}

            {showMaritimeRoutes && (
              <>
                <div className="flex items-center gap-2 text-neutral-300 text-[11px] pt-1 border-t border-neutral-800/60">
                  <div className="w-4 h-0.5 border-t-2 border-dashed border-cyan-400 shrink-0 shadow-[0_0_6px_#06b6d4]" />
                  <span>Tol Laut Material (Rute Kapal)</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-300 text-[11px]">
                  <div className="w-3.5 h-3.5 rounded-full bg-cyan-950 border border-cyan-400 flex items-center justify-center text-[9px] shrink-0 text-cyan-200">
                    ⚓
                  </div>
                  <span>Pelabuhan / Terminal Curah</span>
                </div>
              </>
            )}

            {showRainRadar && (
              <div className="flex items-center gap-2 text-neutral-300 text-[11px] pt-1 border-t border-neutral-800/60">
                <span className="text-sm shrink-0">{weatherMode === 'radar' ? '🌧️' : '☁️'}</span>
                <span>{weatherMode === 'radar' ? 'Radar Hujan Live (RainViewer)' : 'Awan Satelit IR (RainViewer)'}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
