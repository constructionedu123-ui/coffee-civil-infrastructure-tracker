import React, { useMemo, useState } from 'react';
import { ProjectFeature } from '../types/project';
import {
  aggregateByIsland,
  MacroRegionStat,
} from '../utils/islandAggregator';
import { Scale, Globe2, X } from 'lucide-react';
import { formatBudget } from '../utils/formatters';

export const ISLAND_MACRO_VIEWS: Record<
  string,
  { center: [number, number]; zoom: number; bounds?: [[number, number], [number, number]] }
> = {
  "Jawa": {
    center: [-7.4, 110.0],
    zoom: 6.8,
    bounds: [[-8.9, 105.0], [-5.8, 114.6]],
  },
  "Sumatera": {
    center: [0.5, 101.5],
    zoom: 6.0,
    bounds: [[-6.0, 95.0], [6.0, 106.5]],
  },
  "Kalimantan (inc. IKN)": {
    center: [-0.2, 114.5],
    zoom: 6.0,
    bounds: [[-4.5, 108.5], [4.5, 119.2]],
  },
  "Sulawesi": {
    center: [-1.8, 121.0],
    zoom: 6.0,
    bounds: [[-6.0, 118.5], [2.2, 125.5]],
  },
  "Bali & Nusa Tenggara": {
    center: [-8.6, 119.5],
    zoom: 6.5,
    bounds: [[-11.2, 114.2], [-7.8, 125.2]],
  },
  "Maluku & Papua": {
    center: [-3.8, 134.0],
    zoom: 5.5,
    bounds: [[-9.5, 125.5], [2.0, 141.2]],
  },
};

interface RegionalEquityBarProps {
  projects: ProjectFeature[];
  selectedRegion: string | 'All';
  onSelectRegion: (region: string | 'All') => void;
  onZoomToRegion?: (
    center: [number, number],
    zoom: number,
    bounds?: [[number, number], [number, number]]
  ) => void;
}

export const RegionalEquityBar: React.FC<RegionalEquityBarProps> = ({
  projects,
  selectedRegion,
  onSelectRegion,
  onZoomToRegion,
}) => {
  const [hoveredRegion, setHoveredRegion] = useState<MacroRegionStat | null>(null);

  const stats = useMemo(() => {
    return aggregateByIsland(projects);
  }, [projects]);

  const handleRegionClick = (r: MacroRegionStat) => {
    if (selectedRegion === r.name) {
      onSelectRegion('All');
      if (onZoomToRegion) {
        onZoomToRegion([-0.7893, 113.9213], 5);
      }
    } else {
      onSelectRegion(r.name);
      if (onZoomToRegion) {
        const macro = ISLAND_MACRO_VIEWS[r.name];
        if (macro) {
          onZoomToRegion(macro.center, macro.zoom, macro.bounds);
        } else {
          onZoomToRegion(r.center, r.zoom);
        }
      }
    }
  };

  const isLuarJawaDominant = stats.outerJavaCapexPercentage >= stats.javaCapexPercentage;

  return (
    <div className="bg-[#0b0f17] border-b border-neutral-800/90 px-4 sm:px-6 py-2 text-xs select-none">
      {/* Top Row: Label & Dynamic Indonesia-Sentris Balance Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-neutral-900 border border-neutral-800 text-blue-400">
            <Scale className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-300">
              Pemerataan Infrastruktur Nasional
            </span>
            <span className="hidden sm:inline-block text-[10px] text-neutral-500">
              (Macro Regional Equity)
            </span>
          </div>
        </div>

        {/* Dynamic Indonesia-Sentris Ratio Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-900/90 border border-neutral-700/80 text-[11px] font-semibold">
            <span
              className={`inline-flex items-center gap-1 ${
                isLuarJawaDominant ? 'text-emerald-400' : 'text-blue-400'
              }`}
            >
              <Globe2 className="w-3 h-3" />
              <span>{stats.outerJavaCapexPercentage}% Luar Jawa</span>
              <span className="text-[10px] text-emerald-500/90 font-normal">
                (Indonesia-Sentris)
              </span>
            </span>
            <span className="text-neutral-500">vs</span>
            <span className="text-blue-400">{stats.javaCapexPercentage}% Jawa</span>
          </div>

          {selectedRegion !== 'All' && (
            <button
              onClick={() => {
                onSelectRegion('All');
                if (onZoomToRegion) {
                  onZoomToRegion([-0.7893, 113.9213], 5);
                }
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 text-[10px] font-medium transition-colors"
              title="Reset to all regions"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Wilayah</span>
            </button>
          )}
        </div>
      </div>

      {/* Multi-Segmented Horizontal Equity Bar */}
      <div className="relative group/bar py-0.5">
        <div className="w-full h-3 sm:h-3.5 bg-neutral-900/90 rounded-full overflow-hidden flex shadow-inner border border-neutral-800/80 p-0.5 gap-0.5">
          {stats.regions.map((r) => {
            const isSelected = selectedRegion === r.name;
            const isAnySelected = selectedRegion !== 'All';
            const widthPct = Math.max(r.percentageCapex, 1.8); // Ensure minimum visible slice

            return (
              <div
                key={r.id}
                onClick={() => handleRegionClick(r)}
                onMouseEnter={() => setHoveredRegion(r)}
                onMouseLeave={() => setHoveredRegion(null)}
                style={{
                  width: `${widthPct}%`,
                  backgroundColor: r.color,
                }}
                className={`h-full rounded-sm cursor-pointer transition-all duration-200 relative ${
                  isSelected
                    ? 'ring-2 ring-white ring-offset-1 ring-offset-neutral-950 brightness-110 z-10'
                    : isAnySelected
                    ? 'opacity-35 hover:opacity-100 hover:brightness-110'
                    : 'hover:brightness-125 hover:scale-y-110'
                }`}
                title={`${r.name}: Rp ${r.capexTrillion.toLocaleString('id-ID')} T (${r.percentageCapex}%) • ${r.count} Proyek`}
              />
            );
          })}
        </div>

        {/* Hover / Active Tooltip Pill */}
        {hoveredRegion && (
          <div className="absolute left-1/2 -translate-x-1/2 -top-8 z-30 pointer-events-none bg-neutral-900/95 border border-neutral-700/80 text-white text-[11px] font-medium px-2.5 py-1 rounded-md shadow-xl backdrop-blur-sm whitespace-nowrap flex items-center gap-2 animate-in fade-in zoom-in-95 duration-100">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: hoveredRegion.color }}
            />
            <span className="font-bold text-neutral-100">{hoveredRegion.name}:</span>
            <span className="font-mono text-neutral-200">
              {formatBudget(hoveredRegion.capexTrillion)} ({hoveredRegion.percentageCapex}%)
            </span>
            <span className="text-neutral-400">•</span>
            <span className="text-neutral-300 font-mono">{hoveredRegion.count} Proyek</span>
            <span className="text-[10px] text-blue-400 uppercase tracking-wider">
              [Klik untuk filter & zoom]
            </span>
          </div>
        )}
      </div>

      {/* Bottom Island Region Chips & Quick Switchers */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pt-1.5 scrollbar-none">
        <span className="text-[10px] uppercase font-bold text-neutral-500 shrink-0 hidden md:inline">
          Wilayah:
        </span>

        {stats.regions.map((r) => {
          const isSelected = selectedRegion === r.name;
          return (
            <button
              key={r.id}
              onClick={() => handleRegionClick(r)}
              onMouseEnter={() => setHoveredRegion(r)}
              onMouseLeave={() => setHoveredRegion(null)}
              className={`px-2 py-0.5 rounded text-[11px] transition-all flex items-center gap-1.5 shrink-0 border ${
                isSelected
                  ? 'bg-neutral-800 text-white border-neutral-500 font-semibold shadow-sm'
                  : 'bg-neutral-900/50 hover:bg-neutral-800/80 text-neutral-400 hover:text-neutral-200 border-neutral-800/80 hover:border-neutral-700'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: r.color }}
              />
              <span className="truncate max-w-[130px] sm:max-w-none">{r.name}</span>
              <span className="font-mono text-[10px] tabular-nums text-neutral-400">
                {r.percentageCapex}%
              </span>
              <span className="text-[10px] text-neutral-500 hidden lg:inline">
                ({r.count})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
