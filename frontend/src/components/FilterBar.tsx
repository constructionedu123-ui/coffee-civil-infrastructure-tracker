import React from "react";
import { ProjectCategory, ProjectStatus, ProjectFeature } from "../types/project";
import { CATEGORY_CONFIG, STATUS_CONFIG } from "../constants/categories";
import { INDONESIA_REGIONS } from "../utils/geo";

interface FilterBarProps {
  selectedCategories: ProjectCategory[];
  onToggleCategory: (category: ProjectCategory) => void;
  selectedStatus: ProjectStatus | "All";
  onSelectStatus: (status: ProjectStatus | "All") => void;
  selectedRegion: string | "All";
  onSelectRegion: (region: string | "All") => void;
  allProjects: ProjectFeature[];
  selectedContractor?: string | null;
  onClearContractor?: () => void;
  onFocusIKN?: () => void;
  basemap?: 'dark' | 'satellite';
  onBasemapChange?: (basemap: 'dark' | 'satellite') => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedCategories,
  onToggleCategory,
  selectedStatus,
  onSelectStatus,
  selectedRegion,
  onSelectRegion,
  allProjects,
  selectedContractor,
  onClearContractor,
  onFocusIKN,
  basemap = 'dark',
  onBasemapChange,
}) => {

  const categories: ProjectCategory[] = ["Transport", "Energy", "Water", "Housing", "IKN"];
  const statusOptions: (ProjectStatus | "All")[] = [
    "All",
    "Construction",
    "Operational",
    "Completed",
    "Planning",
  ];

  const categoryCounts = categories.reduce((acc, cat) => {
    acc[cat] = allProjects.filter((p) => p.properties.category === cat).length;
    return acc;
  }, {} as Record<ProjectCategory, number>);

  return (
    <div className="bg-[#0b0f17] border-b border-neutral-800 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Category Toggle Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full md:w-auto">
        <span className="text-neutral-400 text-[10px] uppercase font-semibold tracking-wider mr-1 shrink-0">
          Sector:
        </span>
        {categories.map((cat) => {
          const isSelected = selectedCategories.includes(cat);
          const config = CATEGORY_CONFIG[cat];
          const count = categoryCounts[cat] || 0;
          return (
            <button
              key={cat}
              onClick={() => onToggleCategory(cat)}
              className={`px-2.5 py-1 rounded text-xs transition-colors border flex items-center gap-1.5 whitespace-nowrap ${
                isSelected
                  ? "bg-neutral-800 text-neutral-100 border-neutral-600 font-medium"
                  : "bg-transparent text-neutral-400 border-neutral-800 hover:text-neutral-300 hover:border-neutral-700"
              }`}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: config.color }} />
              <span>{config.label}</span>
              <span className="text-[10px] font-mono tabular-nums text-neutral-400">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Contractor Active Chip */}
      {selectedContractor && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-950/70 border border-blue-700/80 text-blue-200 text-xs">
          <span className="text-[10px] uppercase font-bold text-blue-400">Contractor:</span>
          <span className="font-semibold text-neutral-100">{selectedContractor}</span>
          {onClearContractor && (
            <button
              onClick={onClearContractor}
              className="text-blue-400 hover:text-white ml-1 text-xs px-0.5 transition-colors"
              title="Clear Contractor Filter"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Status, Region & IKN Preset Controls */}
      <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
        {/* Status Segmented Control */}
        <div className="flex items-center rounded-md bg-neutral-900 p-0.5 border border-neutral-800">
          {statusOptions.map((status) => {
            const isSelected = selectedStatus === status;
            return (
              <button
                key={status}
                onClick={() => onSelectStatus(status)}
                className={`px-2 py-1 rounded text-[11px] transition-colors ${
                  isSelected
                    ? "bg-neutral-800 text-neutral-100 border border-neutral-700 font-semibold"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {status === "All"
                  ? "All Status"
                  : status === "Construction"
                  ? "Under Construction"
                  : STATUS_CONFIG[status as ProjectStatus]?.label || status}
              </button>
            );
          })}
        </div>

        {/* Region Selector Dropdown */}
        <div className="relative flex items-center">
          <select
            value={selectedRegion}
            onChange={(e) => onSelectRegion(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs rounded-md px-2.5 py-1 focus:outline-none focus:border-neutral-600 cursor-pointer"
          >
            <option value="All">All Regions / Islands</option>
            {INDONESIA_REGIONS.map((region) => (
              <option key={region.name} value={region.name}>
                {region.name}
              </option>
            ))}
          </select>
        </div>

        {/* IKN Nusantara Camera Preset */}
        {onFocusIKN && (
          <button
            type="button"
            onClick={onFocusIKN}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 hover:border-neutral-600 text-neutral-300 hover:text-white text-[11px] font-semibold transition-colors whitespace-nowrap"
            title="Fly to IKN Nusantara, Sepaku, East Kalimantan"
          >
            🏛️ Focus IKN
          </button>
        )}

        {/* Basemap Switcher Segmented Pill */}
        {onBasemapChange && (
          <div className="flex items-center rounded-md bg-neutral-900 p-0.5 border border-neutral-800">
            <button
              type="button"
              onClick={() => onBasemapChange('dark')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                basemap === 'dark'
                  ? 'bg-neutral-800 text-white border border-neutral-700 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Dark Canvas Basemap"
            >
              <span>🗺️</span> Canvas
            </button>
            <button
              type="button"
              onClick={() => onBasemapChange('satellite')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                basemap === 'satellite'
                  ? 'bg-blue-600 text-white border border-blue-500 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="High-Resolution ESRI Satellite Basemap"
            >
              <span>🛰️</span> Satelit
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

