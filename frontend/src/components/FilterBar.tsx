import React, { useMemo, useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { ProjectCategory, ProjectStatus, ProjectFeature } from "../types/project";
import { CATEGORY_CONFIG, STATUS_CONFIG } from "../constants/categories";
import { INDONESIA_REGIONS } from "../utils/geo";
import { getContractorStats } from "../utils/contractorMatcher";
import { WorkModeId, WorkModeConfig } from "../types/workModes";
import { WorkModeSelector } from "./WorkModeSelector";

export interface MaterialHubFilterState {
  quarry: boolean;
  steel: boolean;
  cement: boolean;
  facade: boolean;
  batching: boolean;
}

interface FilterBarProps {
  selectedCategories: ProjectCategory[];
  onToggleCategory: (category: ProjectCategory) => void;
  selectedStatus: ProjectStatus | "All" | "active_construction_and_tender";
  onSelectStatus: (status: ProjectStatus | "All" | "active_construction_and_tender") => void;
  selectedRegion: string | "All";
  onSelectRegion: (region: string | "All") => void;
  allProjects: ProjectFeature[];
  selectedContractor?: string | null;
  onSelectContractor?: (contractor: string | null) => void;
  onClearContractor?: () => void;
  onFocusIKN?: () => void;
  basemap?: 'dark' | 'satellite';
  onBasemapChange?: (basemap: 'dark' | 'satellite') => void;
  showBatchingPlants?: boolean;
  onToggleBatchingPlants?: () => void;
  showSupplyBuffers?: boolean;
  onToggleSupplyBuffers?: () => void;
  showFaultLines?: boolean;
  onToggleFaultLines?: () => void;
  showMaritimeRoutes?: boolean;
  onToggleMaritimeRoutes?: () => void;
  showRainRadar?: boolean;
  onToggleRainRadar?: () => void;
  materialFilters?: MaterialHubFilterState;
  onToggleMaterialFilter?: (key: keyof MaterialHubFilterState) => void;
  onSetAllMaterialFilters?: (val: boolean) => void;
  activeWorkModeId?: WorkModeId;
  onSelectWorkMode?: (mode: WorkModeConfig) => void;
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
  onSelectContractor,
  onClearContractor,
  onFocusIKN,
  basemap = 'satellite',
  onBasemapChange,
  showBatchingPlants = false,
  onToggleBatchingPlants,
  showSupplyBuffers = false,
  onToggleSupplyBuffers,
  showFaultLines = true,
  onToggleFaultLines,
  showMaritimeRoutes = true,
  onToggleMaritimeRoutes,
  showRainRadar = false,
  onToggleRainRadar,
  materialFilters,
  onToggleMaterialFilter,
  onSetAllMaterialFilters,
  activeWorkModeId = 'standard',
  onSelectWorkMode,
}) => {
  const categories: ProjectCategory[] = ["Transport", "Energy", "Water", "Housing", "IKN", "Commercial & Private"];
  const statusOptions: (ProjectStatus | "All" | "active_construction_and_tender")[] = [
    "All",
    "active_construction_and_tender",
    "Tender & Transaksi",
    "Construction",
    "Planning",
    "Operational",
    "Completed",
  ];

  const [isMaterialDropdownOpen, setIsMaterialDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsMaterialDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const categoryCounts = categories.reduce((acc, cat) => {
    acc[cat] = allProjects.filter((p) => p.properties.category === cat).length;
    return acc;
  }, {} as Record<ProjectCategory, number>);

  const contractorOptions = useMemo(() => {
    return getContractorStats(allProjects);
  }, [allProjects]);

  const activeMaterialCount = materialFilters
    ? [
        materialFilters.quarry,
        materialFilters.steel,
        materialFilters.cement,
        materialFilters.facade,
        materialFilters.batching,
      ].filter(Boolean).length
    : showBatchingPlants
    ? 1
    : 0;

  return (
    <div className="bg-[#0b0f17] border-b border-neutral-800 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Category Toggle Chips & Work Mode Selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full md:w-auto">
        {onSelectWorkMode && (
          <>
            <WorkModeSelector
              activeModeId={activeWorkModeId}
              onSelectMode={onSelectWorkMode}
            />
            <div className="h-4 w-px bg-neutral-800 shrink-0 mx-1 hidden sm:block" />
          </>
        )}
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
          <span className="font-semibold">{selectedContractor}</span>
          {onClearContractor && (
            <button
              type="button"
              onClick={onClearContractor}
              className="ml-1 text-blue-400 hover:text-white p-0.5 hover:bg-blue-800/50 rounded transition-colors"
              title="Clear contractor filter"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Right Controls: Contractor Dropdown, Region, Status, Presets & Layers */}
      <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-end">
        {/* Contractor / BUMN Karya Dropdown */}
        {onSelectContractor && (
          <div className="flex items-center gap-1">
            <span className="text-neutral-500 text-[10px] uppercase font-semibold hidden sm:inline">
              Contractor:
            </span>
            <select
              value={selectedContractor || "All"}
              onChange={(e) => onSelectContractor(e.target.value === "All" ? null : e.target.value)}
              className="bg-neutral-900 text-neutral-200 border border-neutral-800 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500 font-medium max-w-[170px] truncate"
            >
              <option value="All">All Contractors ({contractorOptions.length})</option>
              {contractorOptions.map((opt) => (
                <option key={opt.name} value={opt.name}>
                  {opt.name} ({opt.count})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Region Dropdown */}
        <div className="flex items-center gap-1">
          <span className="text-neutral-500 text-[10px] uppercase font-semibold hidden sm:inline">
            Region:
          </span>
          <select
            value={selectedRegion}
            onChange={(e) => onSelectRegion(e.target.value)}
            className="bg-neutral-900 text-neutral-200 border border-neutral-800 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-neutral-700"
          >
            <option value="All">All Regions</option>
            {INDONESIA_REGIONS.map((region) => (
              <option key={region.name} value={region.name}>
                {region.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-neutral-500 text-[10px] uppercase font-semibold hidden sm:inline">
            Status:
          </span>
          <select
            value={selectedStatus}
            onChange={(e) => onSelectStatus(e.target.value as ProjectStatus | "All" | "active_construction_and_tender")}
            className={`border rounded px-2.5 py-1 text-xs focus:outline-none transition-colors font-medium cursor-pointer ${
              selectedStatus === 'active_construction_and_tender'
                ? 'text-emerald-300 border-emerald-500/60 bg-emerald-950/30'
                : selectedStatus === 'Tender & Transaksi'
                ? 'text-amber-300 border-amber-500/60 bg-amber-950/30'
                : selectedStatus !== 'All'
                ? 'bg-neutral-900 text-neutral-100 border-neutral-700'
                : 'bg-neutral-900 text-neutral-300 border-neutral-800 focus:border-neutral-700'
            }`}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === "All"
                  ? "All Status"
                  : status === "active_construction_and_tender"
                  ? "⚡ Konstruksi & Tender"
                  : status === "Tender & Transaksi"
                  ? "🟡 Tender & Transaksi"
                  : STATUS_CONFIG[status as ProjectStatus]?.label || status}
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

        {/* Material Supply Chain Hubs Dropdown */}
        {materialFilters && onToggleMaterialFilter ? (
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setIsMaterialDropdownOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold transition-colors whitespace-nowrap ${
                activeMaterialCount > 0
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/80 shadow-sm"
                  : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700"
              }`}
              title="Filter Material Supply Chain Hubs (Quarry, Steel, Cement, Facade, Batching)"
            >
              <span>🏭</span>
              <span>Rantai Pasok</span>
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-neutral-800 border border-neutral-700/70 text-neutral-300">
                {activeMaterialCount}/5
              </span>
              <ChevronDown
                className={`w-3 h-3 text-neutral-400 transition-transform ${
                  isMaterialDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isMaterialDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-64 bg-[#0f141c]/98 backdrop-blur border border-neutral-700 shadow-2xl p-2.5 rounded-xl z-[1200] text-neutral-200 text-xs animate-in fade-in duration-150 select-none">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                    Rantai Pasok & Material
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => onSetAllMaterialFilters?.(true)}
                      className="text-sky-400 hover:text-sky-300 transition-colors font-medium"
                    >
                      Semua
                    </button>
                    <span className="text-neutral-600">•</span>
                    <button
                      type="button"
                      onClick={() => onSetAllMaterialFilters?.(false)}
                      className="text-neutral-400 hover:text-neutral-300 transition-colors font-medium"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  {/* Quarry */}
                  <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-neutral-800/60 cursor-pointer transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">⛰️</span>
                      <div>
                        <div className="text-xs font-medium text-neutral-200">Quarry Pasir & Agregat</div>
                        <div className="text-[10px] text-amber-400/80">Palu (IKN), Rumpin, Merapi</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={materialFilters.quarry}
                      onChange={() => onToggleMaterialFilter("quarry")}
                      className="rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                    />
                  </label>

                  {/* Steel */}
                  <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-neutral-800/60 cursor-pointer transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🔩</span>
                      <div>
                        <div className="text-xs font-medium text-neutral-200">Pabrik Baja Konstruksi</div>
                        <div className="text-[10px] text-cyan-400/80">Krakatau Steel, POSCO, GRP</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={materialFilters.steel}
                      onChange={() => onToggleMaterialFilter("steel")}
                      className="rounded border-neutral-700 bg-neutral-900 text-cyan-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                    />
                  </label>

                  {/* Cement */}
                  <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-neutral-800/60 cursor-pointer transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🧱</span>
                      <div>
                        <div className="text-xs font-medium text-neutral-200">Pabrik Semen Terpadu</div>
                        <div className="text-[10px] text-rose-400/80">Tonasa, Tuban, Indocement</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={materialFilters.cement}
                      onChange={() => onToggleMaterialFilter("cement")}
                      className="rounded border-neutral-700 bg-neutral-900 text-rose-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                    />
                  </label>

                  {/* Facade */}
                  <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-neutral-800/60 cursor-pointer transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🪟</span>
                      <div>
                        <div className="text-xs font-medium text-neutral-200">Fasad & Kaca Arsitektur</div>
                        <div className="text-[10px] text-emerald-400/80">Asahimas, Mulia, YKK AP</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={materialFilters.facade}
                      onChange={() => onToggleMaterialFilter("facade")}
                      className="rounded border-neutral-700 bg-neutral-900 text-emerald-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                    />
                  </label>

                  {/* Batching Plants */}
                  <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-neutral-800/60 cursor-pointer transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🏗️</span>
                      <div>
                        <div className="text-xs font-medium text-neutral-200">Ready-Mix Batching Plants</div>
                        <div className="text-[10px] text-neutral-400">WIKA, Pionir, SCG, WSBP</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={materialFilters.batching}
                      onChange={() => onToggleMaterialFilter("batching")}
                      className="rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                    />
                  </label>
                </div>

                {onToggleSupplyBuffers && (
                  <div className="pt-2 mt-2 border-t border-neutral-800/80">
                    <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-neutral-800/60 cursor-pointer transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">⭕</span>
                        <div>
                          <div className="text-xs font-medium text-neutral-200">Buffer Suplai 90 Menit</div>
                          <div className="text-[10px] text-neutral-400">Radius 15 km & 30 km</div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={showSupplyBuffers}
                        onChange={onToggleSupplyBuffers}
                        className="rounded border-neutral-700 bg-neutral-900 text-emerald-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                      />
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          onToggleBatchingPlants && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onToggleBatchingPlants}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold transition-colors whitespace-nowrap ${
                  showBatchingPlants
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/80 shadow-sm"
                    : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700"
                }`}
                title="Toggle Commercial Concrete Batching Plants & Precast Facilities Layer"
              >
                <span>🏗️</span> Batching Plants
              </button>

              {onToggleSupplyBuffers && (
                <button
                  type="button"
                  onClick={onToggleSupplyBuffers}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold transition-colors whitespace-nowrap ${
                    showSupplyBuffers
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/80 shadow-sm"
                      : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700"
                  }`}
                  title="Toggle 15 km Optimal (ASTM 90-min) & 30 km Max Retarded Delivery Radii"
                >
                  <span>⭕</span> Supply Buffers
                </button>
              )}
            </div>
          )
        )}

        {/* Active Fault Lines (PuSGeN) Layer Toggle */}
        {onToggleFaultLines && (
          <button
            type="button"
            onClick={onToggleFaultLines}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold transition-colors whitespace-nowrap ${
              showFaultLines
                ? "bg-rose-500/20 text-rose-300 border-rose-500/80 shadow-sm shadow-rose-500/10"
                : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700"
            }`}
            title="Toggle Indonesian Active Geological Fault Lines Overlay (PuSGeN / Badan Geologi)"
          >
            <span>⚡</span> Sesar Aktif
          </button>
        )}

        {/* Inter-Island Maritime Freight Logistics Layer Toggle (Tol Laut Material) */}
        {onToggleMaritimeRoutes && (
          <button
            type="button"
            onClick={onToggleMaritimeRoutes}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold transition-colors whitespace-nowrap ${
              showMaritimeRoutes
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/80 shadow-sm shadow-cyan-500/10"
                : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700"
            }`}
            title="Toggle Inter-Island Maritime Construction Logistics Network (Tol Laut Material, Rute Tongkang & Kapal Curah)"
          >
            <span>🚢</span> Logistik Maritim
          </button>
        )}

        {/* Live Weather & Rainfall Radar Toggle (RainViewer / Radar Cuaca BMKG) */}
        {onToggleRainRadar && (
          <button
            type="button"
            onClick={onToggleRainRadar}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold transition-colors whitespace-nowrap ${
              showRainRadar
                ? "bg-sky-500/20 text-sky-300 border-sky-500/80 shadow-sm shadow-sky-500/10"
                : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700"
            }`}
            title="Toggle Live Rainfall & Weather Radar (RainViewer / Radar Cuaca BMKG)"
          >
            <span>🌧️</span> Radar Hujan
          </button>
        )}

        {/* Basemap Switcher Segmented Pill */}
        {onBasemapChange && (
          <div className="flex items-center rounded-md bg-neutral-900 p-0.5 border border-neutral-800">
            <button
              type="button"
              onClick={() => onBasemapChange("dark")}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                basemap === "dark"
                  ? "bg-neutral-800 text-white border border-neutral-700 shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <span>🗺️</span>
              <span className="hidden sm:inline">Canvas</span>
            </button>
            <button
              type="button"
              onClick={() => onBasemapChange("satellite")}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                basemap === "satellite"
                  ? "bg-blue-600 text-white font-medium shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <span>🛰️</span>
              <span className="hidden sm:inline">Satelit</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
