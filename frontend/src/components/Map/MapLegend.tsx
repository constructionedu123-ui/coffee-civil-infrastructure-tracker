import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ProjectCategory } from '../../types/project';
import { CATEGORY_CONFIG } from '../../constants/categories';

interface MapLegendProps {
  showBatchingPlants?: boolean;
  showSupplyBuffers?: boolean;
  showFaultLines?: boolean;
  showQuarries?: boolean;
  showSteelMills?: boolean;
  showCementPlants?: boolean;
  showFacadePlants?: boolean;
  showMaritimeRoutes?: boolean;
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
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const categories: ProjectCategory[] = ['Transport', 'Energy', 'Water', 'Housing', 'IKN', 'Commercial & Private'];

  return (
    <div className="absolute right-4 bottom-6 z-20 bg-neutral-900/95 border border-neutral-800 rounded-lg shadow-lg overflow-hidden text-xs w-60">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between text-neutral-300 hover:text-white bg-neutral-800/80 transition-colors"
      >
        <span className="font-semibold uppercase text-[10px] tracking-wider text-neutral-400">
          Map Legend
        </span>
        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
      </button>

      {isExpanded && (
        <div className="p-3 space-y-2 border-t border-neutral-800 max-h-[70vh] overflow-y-auto">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-semibold text-neutral-400 block mb-1">
              PSN Sectors
            </span>
            {categories.map((cat) => {
              const cfg = CATEGORY_CONFIG[cat];
              return (
                <div key={cat} className="flex items-center gap-2 text-neutral-300">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/60"
                    style={{ backgroundColor: cfg.color }}
                  />
                  <span className="truncate text-[11px]">{cfg.label}</span>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-neutral-800 space-y-1.5">
            <span className="text-[10px] uppercase font-semibold text-neutral-400 block">
              Marker Indicators
            </span>
            <div className="flex items-center gap-2 text-neutral-400 text-[11px]">
              <div className="w-3 h-3 rounded-full bg-neutral-700 border border-white flex items-center justify-center shrink-0">
                <div className="w-1 h-1 rounded-full bg-white" />
              </div>
              <span>National Corridor Scope</span>
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
              <>
                <div className="flex items-center gap-2 text-neutral-400 text-[10px]">
                  <div className="w-3 h-3 rounded-full border border-emerald-500 bg-emerald-500/20 shrink-0" />
                  <span>15 km Optimal (90-min limit)</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-400 text-[10px]">
                  <div className="w-3 h-3 rounded-full border border-amber-500 bg-amber-500/20 shrink-0" />
                  <span>30 km Max Retarded Limit</span>
                </div>
              </>
            )}

            {showFaultLines && (
              <div className="flex items-center gap-2 text-neutral-300 text-[11px] pt-1 border-t border-neutral-800/60">
                <div className="w-4 h-1 rounded bg-rose-500 shadow-[0_0_6px_#ef4444] shrink-0" />
                <span>Sesar Aktif (PuSGeN)</span>
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
                  <span>Pelabuhan / Terminal Logistik</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
