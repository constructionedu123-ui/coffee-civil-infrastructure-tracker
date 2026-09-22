import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  RotateCcw,
  Map,
  Table2,
  Download,
  ChevronDown,
  FileJson,
  FileSpreadsheet,
  BarChart3,
  PlusCircle,
} from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  totalFiltered: number;
  totalProjects: number;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
  activeView: 'map' | 'table';
  onViewChange: (view: 'map' | 'table') => void;
  onExportGeoJSON: () => void;
  onExportCSV: () => void;
  isAnalyticsOpen: boolean;
  onToggleAnalytics: () => void;
  onOpenSubmitModal?: () => void;
  isOpportunityFinderOpen?: boolean;
  onToggleOpportunityFinder?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  totalFiltered,
  totalProjects,
  onResetFilters,
  hasActiveFilters,
  activeView,
  onViewChange,
  onExportGeoJSON,
  onExportCSV,
  isAnalyticsOpen,
  onToggleAnalytics,
  onOpenSubmitModal,
  isOpportunityFinderOpen,
  onToggleOpportunityFinder,
}) => {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setIsExportOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-[#0b0f17] border-b border-neutral-800 px-4 sm:px-6 py-2.5 sticky top-0 z-30 flex flex-col md:flex-row md:items-center md:justify-between gap-2.5">
      {/* Brand & Editorial Title */}
      <div className="flex items-center gap-3">
        <div className="px-2 h-7 rounded bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[11px] font-mono font-bold text-neutral-200 shrink-0 tracking-wider">
          RADAR
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-sm sm:text-base font-bold text-neutral-100 tracking-tight">
              Indonesian National Infrastructure Tracker
            </h1>
            <span className="hidden lg:inline text-[11px] text-neutral-400 font-medium">
              Katalog Proyek Nasional, Komersial & Fasilitas Konstruksi
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 hidden sm:block">
            Official infrastructure monitoring catalog • KPPIP, BPJT & Commercial Projects
          </p>
        </div>
      </div>

      {/* Controls: Search, View Switcher & Export */}
      <div className="flex items-center flex-wrap sm:flex-nowrap gap-2.5 w-full md:w-auto justify-between sm:justify-end">
        {/* Search Bar */}
        <div className="relative flex-1 sm:w-64">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter project, province, contractor..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-md pl-8 pr-7 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 text-xs px-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Live filtered count pill */}
        <div className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-400 font-mono tabular-nums whitespace-nowrap">
          <span className="font-semibold text-neutral-200">{totalFiltered}</span>
          <span>/</span>
          <span>{totalProjects}</span>
        </div>

        {/* Reset button if filters active */}
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            title="Reset filters"
            className="p-1.5 text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 rounded-md border border-neutral-800 transition-colors flex items-center justify-center shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Segmented View Switcher [ Map | Table ] */}
        <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-md p-0.5 shrink-0">
          <button
            onClick={() => onViewChange('map')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
              activeView === 'map'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="Switch to Map View"
          >
            <Map className="w-3.5 h-3.5" />
            <span>Map</span>
          </button>
          <button
            onClick={() => onViewChange('table')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
              activeView === 'table'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="Switch to Table View"
          >
            <Table2 className="w-3.5 h-3.5" />
            <span>Table</span>
          </button>
        </div>

        {/* Radius Opportunity Finder Button */}
        {onToggleOpportunityFinder && (
          <button
            onClick={onToggleOpportunityFinder}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-semibold transition-all shrink-0 ${
              isOpportunityFinderOpen
                ? 'bg-blue-600 text-white border-blue-400 shadow-sm shadow-blue-900/30'
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border-neutral-800'
            }`}
            title="Cari Peluang Proyek dalam Radius Fasilitas (Vendor & Contractor Leads)"
          >
            <span className="text-sm leading-none">🎯</span>
            <span className="hidden sm:inline font-medium">Cari Peluang</span>
          </button>
        )}

        {/* Analytics Toggle Button */}
        <button
          onClick={onToggleAnalytics}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-semibold transition-colors shrink-0 ${
            isAnalyticsOpen
              ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
              : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border-neutral-800'
          }`}
          title="Open Contractor & Financing Analytics Drawer"
        >
          <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
          <span>Analytics</span>
        </button>

        {/* Submit Project / Laporkan Proyek Button */}
        {onOpenSubmitModal && (
          <button
            onClick={onOpenSubmitModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-semibold transition-all shrink-0 bg-violet-600/90 hover:bg-violet-500 text-white border-violet-500/80 shadow-sm shadow-violet-900/30 whitespace-nowrap"
            title="Laporkan proyek infrastruktur atau gedung swasta/komersial baru"
          >
            <PlusCircle className="w-3.5 h-3.5 text-violet-200" />
            <span>Laporkan Proyek</span>
          </button>
        )}

        {/* Export Dropdown */}
        <div className="relative shrink-0" ref={exportRef}>
          <button
            onClick={() => setIsExportOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-200 hover:text-white transition-colors"
            title="Export filtered dataset"
          >
            <Download className="w-3.5 h-3.5 text-neutral-400" />
            <span>Export</span>
            <ChevronDown className="w-3 h-3 text-neutral-500" />
          </button>

          {isExportOpen && (
            <div className="absolute right-0 mt-1.5 w-48 bg-neutral-900 border border-neutral-800 rounded-md shadow-xl py-1 z-50 text-xs">
              <button
                onClick={() => {
                  setIsExportOpen(false);
                  onExportGeoJSON();
                }}
                className="w-full px-3 py-2 text-left text-neutral-300 hover:text-white hover:bg-neutral-800/80 flex items-center gap-2 transition-colors"
              >
                <FileJson className="w-4 h-4 text-emerald-400" />
                <div className="space-y-0.5">
                  <div className="font-semibold">Export as GeoJSON</div>
                  <div className="text-[10px] text-neutral-500">Filtered features ({totalFiltered})</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsExportOpen(false);
                  onExportCSV();
                }}
                className="w-full px-3 py-2 text-left text-neutral-300 hover:text-white hover:bg-neutral-800/80 flex items-center gap-2 transition-colors border-t border-neutral-800/60"
              >
                <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                <div className="space-y-0.5">
                  <div className="font-semibold">Export as CSV</div>
                  <div className="text-[10px] text-neutral-500">Tabular format ({totalFiltered} rows)</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

