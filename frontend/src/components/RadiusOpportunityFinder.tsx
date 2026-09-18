import React, { useState, useMemo, useRef, useEffect } from 'react';
import L from 'leaflet';
import {
  X,
  Crosshair,
  Download,
  Search,
  Building2,
  ChevronDown,
  Minimize2,
  Sparkles,
} from 'lucide-react';
import { ProjectFeature, getProjectCoordinates } from '../types/project';
import { haversineDistanceKm } from '../utils/measurement';
import { formatBudget } from '../utils/formatters';
import { CATEGORY_CONFIG, STATUS_CONFIG } from '../constants/categories';

export interface OpportunityPreset {
  label: string;
  name: string;
  coords: [number, number]; // [lat, lon]
  zoom: number;
}

export const OPPORTUNITY_PRESETS: OpportunityPreset[] = [
  { label: 'Jabodetabek (DKI & Bodetabek)', name: 'jabodetabek', coords: [-6.2088, 106.8456], zoom: 10 },
  { label: 'IKN / Balikpapan (Kaltim)', name: 'ikn-balikpapan', coords: [-1.0500, 116.8000], zoom: 10 },
  { label: 'Surabaya Raya (Gerbangkertosusila)', name: 'surabaya-raya', coords: [-7.2575, 112.7521], zoom: 10 },
  { label: 'Medan (Mebidangro, Sumut)', name: 'medan', coords: [3.5952, 98.6722], zoom: 11 },
  { label: 'Makassar (Mamminasata, Sulsel)', name: 'makassar', coords: [-5.1477, 119.4327], zoom: 11 },
  { label: 'Batam & Bintan (Kepri)', name: 'batam', coords: [1.1301, 104.0529], zoom: 11 },
  { label: 'Palu & Donggala (Sulteng Hub)', name: 'palu', coords: [-0.8917, 119.8707], zoom: 11 },
];

export interface MatchedLeadProject {
  project: ProjectFeature;
  distanceKm: number;
}

interface RadiusOpportunityFinderProps {
  isOpen: boolean;
  onClose: () => void;
  allProjects: ProjectFeature[];
  center: [number, number] | null;
  radiusKm: number;
  onChangeRadius: (radius: number) => void;
  isPickingLocation: boolean;
  onTogglePickLocation: () => void;
  presetName: string;
  onSelectPreset: (preset: OpportunityPreset) => void;
  onSelectProject: (project: ProjectFeature) => void;
  onFlyToProject: (coords: [number, number]) => void;
}

export const RadiusOpportunityFinder: React.FC<RadiusOpportunityFinderProps> = ({
  isOpen,
  onClose,
  allProjects,
  center,
  radiusKm,
  onChangeRadius,
  isPickingLocation,
  onTogglePickLocation,
  presetName,
  onSelectPreset,
  onSelectProject,
  onFlyToProject,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyActiveConstruction, setOnlyActiveConstruction] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Prevent Leaflet map clicks/drags from propagating through panel
  useEffect(() => {
    if (panelRef.current) {
      L.DomEvent.disableClickPropagation(panelRef.current);
      L.DomEvent.disableScrollPropagation(panelRef.current);
    }
  }, [isOpen]);

  // Compute matched projects within radius and sort from closest to farthest
  const matchedLeads = useMemo<MatchedLeadProject[]>(() => {
    if (!center) return [];

    const [centerLat, centerLon] = center;
    const leads: MatchedLeadProject[] = [];

    for (const p of allProjects) {
      const [lon, lat] = getProjectCoordinates(p.geometry);
      const dist = haversineDistanceKm(centerLat, centerLon, lat, lon);

      if (dist <= radiusKm) {
        leads.push({
          project: p,
          distanceKm: dist,
        });
      }
    }

    // Sort closest to farthest
    leads.sort((a, b) => a.distanceKm - b.distanceKm);
    return leads;
  }, [allProjects, center, radiusKm]);

  // Secondary filtering for search query & status toggle inside panel
  const displayedLeads = useMemo(() => {
    let list = matchedLeads;

    if (onlyActiveConstruction) {
      list = list.filter(
        (item) =>
          item.project.properties.status === 'Construction' ||
          item.project.properties.status === 'Planning'
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((item) => {
        const props = item.project.properties;
        return (
          props.project_name.toLowerCase().includes(q) ||
          (props.contractor || '').toLowerCase().includes(q) ||
          (props.pjpk || '').toLowerCase().includes(q) ||
          (props.province || '').toLowerCase().includes(q) ||
          (props.regency || '').toLowerCase().includes(q) ||
          props.category.toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [matchedLeads, onlyActiveConstruction, searchQuery]);

  // Total capex budget calculation
  const totalCapexTrillions = useMemo(() => {
    return matchedLeads.reduce((acc, curr) => {
      return acc + (curr.project.properties.budget_idr || 0);
    }, 0);
  }, [matchedLeads]);

  // Format Total Capex
  const formattedTotalValue = useMemo(() => {
    if (totalCapexTrillions <= 0) return 'Rp 0 T';
    return `Rp ${totalCapexTrillions.toLocaleString('id-ID', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })} T`;
  }, [totalCapexTrillions]);

  // Export CSV Handler
  const handleExportCSV = () => {
    if (matchedLeads.length === 0) return;

    const headers = [
      'No',
      'Distance_km',
      'Project_Name',
      'Sector',
      'Status',
      'Contractor',
      'PJPK',
      'Estimated_Capex_IDR_Trillion',
      'Province',
      'Regency',
      'Latitude',
      'Longitude',
      'BIM_Viewer_URL',
      'Source_URL',
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = matchedLeads.map((item, idx) => {
      const p = item.project.properties;
      const [lon, lat] = getProjectCoordinates(item.project.geometry);
      return [
        idx + 1,
        item.distanceKm.toFixed(2),
        escapeCsv(p.project_name),
        escapeCsv(p.category),
        escapeCsv(p.status),
        escapeCsv(p.contractor || '-'),
        escapeCsv(p.pjpk || '-'),
        escapeCsv(p.budget_idr !== null ? p.budget_idr : ''),
        escapeCsv(p.province || ''),
        escapeCsv(p.regency || ''),
        escapeCsv(lat),
        escapeCsv(lon),
        escapeCsv(p.bim_viewer_url || ''),
        escapeCsv(p.source_url || ''),
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const cityTag = presetName ? presetName.replace(/\s+/g, '-').toLowerCase() : 'lokasi';
    link.href = url;
    link.download = `leads-${cityTag}-${radiusKm}km.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  // Minimized floating badge
  if (isMinimized) {
    return (
      <div
        ref={panelRef}
        className="fixed top-14 left-4 z-[1100] bg-[#0f141c]/95 backdrop-blur-md border border-neutral-700 shadow-2xl rounded-xl px-4 py-2.5 flex items-center gap-3 text-xs text-slate-200"
      >
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">🎯</span>
          <span className="font-semibold text-white">Radar Peluang:</span>
          <span className="font-mono text-blue-400 font-bold">{matchedLeads.length} Proyek</span>
          <span className="text-neutral-500">({radiusKm} km)</span>
        </div>
        <div className="flex items-center gap-1.5 border-l border-neutral-700 pl-3">
          <button
            onClick={() => setIsMinimized(false)}
            className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 rounded text-[11px] font-medium transition-colors"
          >
            Buka Panel
          </button>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      className="fixed top-14 left-3 right-3 sm:left-6 sm:right-auto sm:w-[680px] max-h-[calc(100vh-76px)] bg-[#0f141c]/95 backdrop-blur-md border border-neutral-700 shadow-2xl rounded-xl z-[1100] flex flex-col text-slate-100 overflow-hidden"
    >
      {/* ── Top Header ────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/60 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/50 flex items-center justify-center text-sm shadow-inner shadow-blue-500/20">
            🎯
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">
                Radius Opportunity & Vendor Lead Finder
              </h2>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 font-medium">
                B2B Procurement Radar
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Temukan proyek konstruksi aktif & estimasi nilai dalam jangkauan suplai fasilitas Anda
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
            title="Kecilkan panel"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
            title="Tutup radar peluang"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Control Bar: Center Selection & Radius ────────────────── */}
      <div className="p-4 border-b border-neutral-800 bg-[#0d121a]/80 space-y-3 shrink-0">
        {/* Row 1: Target Center Point Selection */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Quick Presets Dropdown */}
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <span className="text-xs text-neutral-400 font-medium shrink-0">Pusat Radar:</span>
            <div className="relative flex-1">
              <select
                value={presetName}
                onChange={(e) => {
                  const val = e.target.value;
                  const preset = OPPORTUNITY_PRESETS.find((p) => p.name === val);
                  if (preset) {
                    onSelectPreset(preset);
                  }
                }}
                className="w-full bg-neutral-900 border border-neutral-700/80 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-blue-500 transition-colors pr-7 appearance-none cursor-pointer"
              >
                <option value="custom" disabled={presetName !== 'custom'}>
                  📍 {presetName === 'custom' ? 'Titik Kustom Peta' : 'Pilih Kota / Koridor...'}
                </option>
                {OPPORTUNITY_PRESETS.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* "Klik Peta" Toggle Button */}
          <button
            onClick={onTogglePickLocation}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              isPickingLocation
                ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-900/40 ring-2 ring-blue-500/50 animate-pulse'
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border-neutral-700/80'
            }`}
            title="Klik sembarang titik di peta untuk memindahkan pin pusat fasilitas/batching plant"
          >
            <Crosshair className="w-3.5 h-3.5 text-blue-400" />
            <span>{isPickingLocation ? 'Klik di Peta...' : 'Klik Peta'}</span>
          </button>

          {/* Coordinates Pill */}
          {center && (
            <div className="text-[11px] font-mono text-neutral-400 bg-neutral-900 border border-neutral-800 px-2 py-1 rounded-md shrink-0">
              {center[0].toFixed(4)}, {center[1].toFixed(4)}
            </div>
          )}
        </div>

        {/* Helper text when "Klik Peta" is active */}
        {isPickingLocation && (
          <div className="text-[11px] text-blue-300 bg-blue-950/40 border border-blue-800/60 rounded-md px-3 py-1.5 flex items-center gap-2 animate-fadeIn">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping shrink-0" />
            <span>Mode pemilihan titik aktif: Silakan klik di peta untuk menentukan koordinat pusat fasilitas Anda.</span>
          </div>
        )}

        {/* Row 2: Radius Selector (Segmented buttons + Range slider) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-neutral-800/60">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-neutral-400 font-medium">Radius:</span>
            <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-md p-0.5">
              {[15, 25, 50, 100].map((r) => (
                <button
                  key={r}
                  onClick={() => onChangeRadius(r)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                    radiusKm === r
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {r} km
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-1 max-w-xs">
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={radiusKm}
              onChange={(e) => onChangeRadius(Number(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <span className="text-xs font-mono font-bold text-blue-400 bg-blue-950/50 border border-blue-800/50 px-2 py-0.5 rounded shrink-0">
              {radiusKm} km
            </span>
          </div>
        </div>
      </div>

      {/* ── Summary & Export Header ───────────────────────────────── */}
      <div className="px-4 py-2.5 bg-neutral-900/80 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-300">
            Ditemukan <strong className="text-blue-400 font-mono text-sm">{matchedLeads.length}</strong> Proyek Aktif dalam radius <strong className="text-white">{radiusKm} km</strong>
          </span>
          <span className="text-neutral-600">•</span>
          <span className="text-xs text-neutral-400">
            Total CAPEX: <strong className="text-emerald-400 font-mono">{formattedTotalValue}</strong>
          </span>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={matchedLeads.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-semibold transition-all shadow-sm shadow-emerald-900/30"
          title="Export daftar leads peluang radius sebagai CSV untuk tim sales & estimator"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Leads (.CSV)</span>
        </button>
      </div>

      {/* ── Filter Bar within Results ─────────────────────────────── */}
      <div className="px-4 py-2 bg-[#0c1017] border-b border-neutral-800 flex items-center justify-between gap-3 shrink-0">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kontraktor, proyek, atau sektor dalam radius..."
            className="w-full bg-neutral-900/90 border border-neutral-800 rounded-md pl-8 pr-3 py-1 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-700 transition-colors"
          />
        </div>

        <label className="flex items-center gap-1.5 text-xs text-neutral-400 cursor-pointer select-none shrink-0 hover:text-neutral-200 transition-colors">
          <input
            type="checkbox"
            checked={onlyActiveConstruction}
            onChange={(e) => setOnlyActiveConstruction(e.target.checked)}
            className="rounded border-neutral-700 bg-neutral-900 text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
          />
          <span>Hanya Konstruksi & Tender</span>
        </label>
      </div>

      {/* ── Opportunity Results Table ─────────────────────────────── */}
      <div className="flex-1 overflow-y-auto max-h-[380px] divide-y divide-neutral-800/60 bg-[#0b0f17]">
        {displayedLeads.length === 0 ? (
          <div className="p-8 text-center text-neutral-400 space-y-2">
            <div className="w-10 h-10 rounded-full bg-neutral-800/80 border border-neutral-700 flex items-center justify-center mx-auto text-neutral-500">
              <Building2 className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-neutral-300">
              Tidak ada proyek yang cocok dalam radius {radiusKm} km.
            </p>
            <p className="text-[11px] text-neutral-500 max-w-sm mx-auto">
              Cobalah memperbesar radius jangkauan (misal 50 km atau 100 km) atau pilih pusat kota/koridor lain melalui dropdown di atas.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-neutral-900/95 border-b border-neutral-800 text-neutral-400 text-[11px] font-medium uppercase tracking-wider backdrop-blur-sm z-10">
              <tr>
                <th className="py-2.5 px-3 w-20">Jarak</th>
                <th className="py-2.5 px-3">Nama Proyek</th>
                <th className="py-2.5 px-3 w-28">Status</th>
                <th className="py-2.5 px-3">Kontraktor / PJPK</th>
                <th className="py-2.5 px-3 text-right w-24">CAPEX</th>
                <th className="py-2.5 px-3 text-center w-16">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/40 font-normal text-neutral-300">
              {displayedLeads.map((item) => {
                const p = item.project.properties;
                const [lon, lat] = getProjectCoordinates(item.project.geometry);
                const catMeta = CATEGORY_CONFIG[p.category] || CATEGORY_CONFIG.Transport;
                const statusMeta = STATUS_CONFIG[p.status] || STATUS_CONFIG.Unknown;

                return (
                  <tr
                    key={p.project_id}
                    className="hover:bg-neutral-800/50 transition-colors group"
                  >
                    {/* Jarak */}
                    <td className="py-2 px-3 font-mono font-bold text-blue-400 whitespace-nowrap">
                      {item.distanceKm < 1
                        ? `${Math.round(item.distanceKm * 1000)} m`
                        : `${item.distanceKm.toFixed(1)} km`}
                    </td>

                    {/* Nama Proyek & Sektor Pill */}
                    <td className="py-2 px-3">
                      <div className="font-semibold text-neutral-100 group-hover:text-blue-300 transition-colors line-clamp-1" title={p.project_name}>
                        {p.project_name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded border font-medium uppercase tracking-wider ${catMeta.badgeClass}`}
                        >
                          {p.category}
                        </span>
                        {p.regency && (
                          <span className="text-[10px] text-neutral-500 truncate max-w-[140px]">
                            {p.regency}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium ${statusMeta.badgeClass}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotClass}`}
                        />
                        {statusMeta.label}
                      </span>
                    </td>

                    {/* Kontraktor Pelaksana / PJPK */}
                    <td className="py-2 px-3">
                      <div className="font-medium text-neutral-200 line-clamp-1" title={p.contractor || p.pjpk || '-'}>
                        {p.contractor || p.pjpk || (
                          <span className="text-neutral-500 italic">Belum ditentukan</span>
                        )}
                      </div>
                      {p.contractor && p.pjpk && (
                        <div className="text-[10px] text-neutral-500 line-clamp-1" title={p.pjpk}>
                          PJPK: {p.pjpk}
                        </div>
                      )}
                    </td>

                    {/* Nilai CAPEX */}
                    <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-400 whitespace-nowrap">
                      {formatBudget(p.budget_idr, p.budget_raw)}
                    </td>

                    {/* Action: Lihat di Peta */}
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => {
                          onSelectProject(item.project);
                          onFlyToProject([lat, lon]);
                        }}
                        className="px-2 py-1 bg-neutral-800 hover:bg-blue-600 text-neutral-300 hover:text-white rounded text-[11px] font-medium transition-colors border border-neutral-700/60 hover:border-blue-500"
                        title="Zoom ke lokasi proyek dan buka detail drawer"
                      >
                        Lihat
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <div className="px-4 py-2 bg-neutral-900/90 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500 shrink-0">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Vendor Tip: Filter kontraktor untuk penawaran beton ready-mix, baja, dan subkon.</span>
        </div>
        <div>
          Menampilkan <strong className="text-neutral-300">{displayedLeads.length}</strong> dari{' '}
          <strong className="text-neutral-300">{matchedLeads.length}</strong> proyek
        </div>
      </div>
    </div>
  );
};
