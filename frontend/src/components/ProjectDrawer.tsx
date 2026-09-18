import React, { useEffect, useMemo, useState, Suspense, lazy } from 'react';
import { ExternalLink, X } from 'lucide-react';
import { ProjectFeature, getProjectCoordinates } from '../types/project';
import { BatchingPlantFeature } from '../types/batchingPlant';
import { FaultLineFeature } from '../types/faultLine';
import { findNearestBatchingPlants } from '../utils/logistics';
import { findNearestFaultLine } from '../utils/seismic';
import { CATEGORY_CONFIG, STATUS_CONFIG } from '../constants/categories';
import { formatBudget, formatDate } from '../utils/formatters';

const BimViewerModal = lazy(() => import('./BimViewerModal'));

interface ProjectDrawerProps {
  project: ProjectFeature | null;
  onClose: () => void;
  onZoomTo: (coords: [number, number]) => void;
  batchingPlants?: BatchingPlantFeature[];
  faultLines?: FaultLineFeature[];
}


const MILESTONES = [
  { step: '01', title: 'Penyiapan', subtitle: 'Feasibility & Readiness' },
  { step: '02', title: 'Transaksi', subtitle: 'Tender & Financing' },
  { step: '03', title: 'Konstruksi', subtitle: 'Pekerjaan Fisik' },
  { step: '04', title: 'Operasional', subtitle: 'Beroperasi Penuh' },
];

const BUMN_TAGS: { match: string; label: string }[] = [
  { match: 'WIKA',       label: 'Wijaya Karya (WIKA)' },
  { match: 'PP',         label: 'PT PP (Persero)' },
  { match: 'Hutama',     label: 'Hutama Karya (HK)' },
  { match: 'Adhi',       label: 'Adhi Karya' },
  { match: 'Waskita',    label: 'Waskita Karya' },
  { match: 'Jasa Marga', label: 'Jasa Marga' },
  { match: 'PLN',        label: 'PT PLN (Persero)' },
  { match: 'Pertamina',  label: 'PT Pertamina (Persero)' },
];

export const ProjectDrawer: React.FC<ProjectDrawerProps> = ({
  project,
  onClose,
  onZoomTo,
  batchingPlants = [],
  faultLines = [],
}) => {
  const [isBimModalOpen, setIsBimModalOpen] = useState(false);

  // Escape key dismissal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If BIM modal is open, don't close the drawer on Esc
      if (e.key === 'Escape' && !isBimModalOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isBimModalOpen]);

  // Reset BIM modal when drawer closes or project changes
  useEffect(() => {
    if (!project) {
      setIsBimModalOpen(false);
    }
  }, [project]);

  const isOpen = project !== null;
  const props = project?.properties;
  const categoryConfig = props ? CATEGORY_CONFIG[props.category] : null;
  const statusConfig = props
    ? STATUS_CONFIG[props.status] || STATUS_CONFIG.Unknown
    : null;

  const isNational =
    props?.province === 'Lintas Provinsi' ||
    props?.province === 'Nasional' ||
    props?.geocode_method === 'national_fallback';

  const coords = project ? getProjectCoordinates(project.geometry) : [0, 0];
  const [lon, lat] = coords;

  // Nearest concrete batching facilities calculation (Haversine proximity)
  const nearbyPlants = useMemo(() => {
    if (!project || !batchingPlants || batchingPlants.length === 0) return [];
    return findNearestBatchingPlants(lat, lon, batchingPlants, 3);
  }, [project, lat, lon, batchingPlants]);

  const nearestPlant = nearbyPlants[0] || null;

  // Nearest active fault line calculation (PuSGeN / SNI 1726 seismic proximity)
  const nearestFault = useMemo(() => {
    if (!project || !faultLines || faultLines.length === 0) return null;
    return findNearestFaultLine(lat, lon, faultLines);
  }, [project, lat, lon, faultLines]);



  // Milestone step index
  const getMilestoneIndex = (status?: string) => {
    switch (status) {
      case 'Planning':     return 0;
      case 'Construction': return 2;
      case 'Operational':
      case 'Completed':    return 3;
      default:             return 1;
    }
  };
  const currentMilestone = getMilestoneIndex(props?.status);

  // LPSE tender search URL
  const lpseSearchUrl = props
    ? `https://inaproc.id/pengadaan?keyword=${encodeURIComponent(
        props.project_name.replace(/[–\-\/]/g, ' ').trim()
      )}`
    : '#';

  // Funding scheme badge helper
  const getSchemeBadge = (scheme?: string | null) => {
    const s = (scheme || 'KPBU / PPP').toLowerCase();
    if (s.includes('kpbu') || s.includes('ppp'))
      return {
        label: scheme || 'KPBU / PPP (BUJT Concession)',
        desc: 'Kerjasama Pemerintah dan Badan Usaha (Public-Private Partnership)',
        badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      };
    if (s.includes('apbn'))
      return {
        label: scheme || 'APBN (State Budget)',
        desc: 'Anggaran Pendapatan dan Belanja Negara murni atau pinjaman bilateral',
        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      };
    if (s.includes('bumn') || s.includes('penugasan'))
      return {
        label: scheme || 'Penugasan BUMN',
        desc: 'Penugasan Khusus Pemerintah kepada BUMN (Corporate Finance)',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      };
    if (s.includes('swasta') || s.includes('private') || s.includes('kks') || s.includes('ipp'))
      return {
        label: scheme || 'Swasta / Private Investment',
        desc: 'Investasi Swasta Mandiri / Independent Power Producer (IPP) / KKS',
        badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      };
    return {
      label: scheme || 'APBN / KPBU Mixed',
      desc: 'Pembiayaan Campuran Pemerintah & Badan Usaha',
      badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    };
  };

  const schemeInfo = getSchemeBadge(props?.funding_scheme);
  const contractorStr = props?.contractor || '';
  const matchedTags = BUMN_TAGS.filter(({ match }) => contractorStr.includes(match));

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 bg-black/60 transition-opacity duration-200 ${
          isOpen
            ? 'opacity-100 pointer-events-auto z-[1100]'
            : 'opacity-0 pointer-events-none z-[-1]'
        }`}
      />

      {/* ── Full-height right-side drawer ── */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={props?.project_name ?? 'Project detail'}
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] md:w-[460px] z-[1200]
          bg-[#0f141c] border-l border-neutral-800 shadow-2xl
          flex flex-col
          transform transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {props && categoryConfig && statusConfig && (
          <>
            {/* ── Sticky Header ── */}
            <div className="sticky top-0 z-10 shrink-0 px-5 pt-5 pb-4 bg-[#0f141c] border-b border-neutral-800">
              {/* Top row: sector/status badges + close button */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border ${categoryConfig.badgeClass}`}
                  >
                    {categoryConfig.label}
                  </span>
                  <span
                    className={`text-[10px] font-medium px-2.5 py-1 rounded border ${statusConfig.badgeClass}`}
                  >
                    {statusConfig.label}
                  </span>
                  {isNational && (
                    <span className="text-[10px] font-medium px-2.5 py-1 rounded bg-neutral-800 text-neutral-300 border border-neutral-700 font-mono">
                      Lintas Wilayah
                    </span>
                  )}
                </div>

                <button
                  onClick={onClose}
                  className="shrink-0 p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                  title="Close (Esc)"
                  aria-label="Close drawer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Project title */}
              <h2 className="text-lg font-bold text-neutral-100 leading-snug tracking-tight">
                {props.project_name}
              </h2>

              {/* 3D BIM Model inspect button if available */}
              {(props.bim_viewer_url || props.bim_uuid) && (
                <div className="mt-2.5">
                  <button
                    onClick={() => setIsBimModalOpen(true)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-cyan-300 font-bold text-xs shadow-lg shadow-cyan-500/10 border border-cyan-500/40 hover:border-cyan-400 transition-all transform hover:scale-[1.02]"
                  >
                    <span>🧊 Inspect 3D BIM Model</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  </button>
                </div>
              )}
            </div>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-xs">

              {/* 1. Lifecycle Milestone Stepper */}
              <section className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Project Lifecycle Stage
                  </span>
                  <span className="text-[10px] font-mono text-neutral-500">PSN Milestone</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {MILESTONES.map((m, idx) => {
                    const isCompleted = idx < currentMilestone;
                    const isCurrent   = idx === currentMilestone;
                    return (
                      <div
                        key={m.step}
                        className={`rounded-md p-2.5 border text-center transition-colors ${
                          isCurrent
                            ? 'bg-neutral-800 border-neutral-500 text-white'
                            : isCompleted
                            ? 'bg-neutral-900 border-neutral-700 text-neutral-300'
                            : 'bg-neutral-950/60 border-neutral-800 text-neutral-600'
                        }`}
                      >
                        <div className="text-[9px] font-mono font-bold mb-0.5 text-neutral-400">
                          {isCompleted ? `✓ ${m.step}` : m.step}
                        </div>
                        <div className="text-[11px] font-semibold leading-tight">{m.title}</div>
                        <div className="text-[9px] text-neutral-500 mt-0.5 leading-tight">{m.subtitle}</div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* 2. CAPEX & Funding Scheme */}
              <section className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Estimated Investment (CAPEX)
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">IDR Trillion</span>
                </div>

                <div>
                  <div className="text-2xl font-bold text-neutral-100 font-mono tabular-nums tracking-tight">
                    {formatBudget(props.budget_idr, props.budget_raw)}
                  </div>
                  {props.budget_raw && props.budget_raw !== formatBudget(props.budget_idr) && (
                    <p className="text-[11px] text-neutral-400 italic mt-0.5">
                      Official Gazette: "{props.budget_raw}"
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-neutral-800 space-y-1.5">
                  <div className="flex items-start justify-between gap-2 text-[11px]">
                    <span className="text-neutral-400 font-medium shrink-0">Funding Scheme</span>
                    <span
                      className={`font-semibold text-right px-2 py-0.5 rounded border text-[10px] ${schemeInfo.badge}`}
                    >
                      {schemeInfo.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-500">{schemeInfo.desc}</p>
                </div>
              </section>

              {/* 3. Responsible Agency / PJPK & Ministry */}
              <section className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-4 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Responsible Agency / PJPK
                </span>
                <h3 className="font-bold text-neutral-100 text-sm leading-snug">
                  {props.pjpk || 'Kementerian PUPR / Lembaga Terkait'}
                </h3>
                {(props.unor || props.balai || (props.fiscal_year && props.fiscal_year !== 'NULL') || (props.progress !== null && props.progress !== undefined)) && (
                  <div className="pt-2 border-t border-neutral-800/80 space-y-1.5 text-[11px]">
                    {props.unor && (
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400">Unit Organisasi (Unor):</span>
                        <span className="text-neutral-200 font-semibold">{props.unor}</span>
                      </div>
                    )}
                    {props.balai && (
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400">Balai Kerja:</span>
                        <span className="text-neutral-200 font-semibold">{props.balai}</span>
                      </div>
                    )}
                    {props.fiscal_year && props.fiscal_year !== 'NULL' && (
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400">Tahun Anggaran:</span>
                        <span className="text-neutral-300 font-mono">{props.fiscal_year}</span>
                      </div>
                    )}
                    {props.progress !== null && props.progress !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400">Progres Fisik:</span>
                        <span className="text-cyan-400 font-mono font-bold">{props.progress}%</span>
                      </div>
                    )}
                  </div>
                )}
                <p className="text-[10px] text-neutral-500">
                  Sector regulating ministry and project contracting authority
                </p>
              </section>

              {/* 4. Lead Contractor */}
              <section className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-4 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Lead Contractor / Concessionaire
                </span>
                <div className="font-semibold text-neutral-200 text-[12px] leading-snug">
                  {contractorStr || 'BUMN Konstruksi / Swasta'}
                </div>
                {matchedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-neutral-800/60">
                    {matchedTags.map(({ match, label }) => (
                      <span
                        key={match}
                        className="text-[10px] font-medium px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                )}
              </section>

              {/* 5. Location & Coordinates */}
              <section className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-4 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Location & Coordinates
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800">
                    <span className="text-neutral-500 block text-[9px] uppercase font-semibold mb-0.5">
                      Province
                    </span>
                    <span className="font-semibold text-neutral-200 text-[12px] leading-snug">
                      {props.province || 'National / Multi-Province'}
                    </span>
                  </div>
                  <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800">
                    <span className="text-neutral-500 block text-[9px] uppercase font-semibold mb-0.5">
                      Regency / City
                    </span>
                    <span className="font-semibold text-neutral-200 text-[12px] leading-snug">
                      {props.regency || (isNational ? 'Lintas Wilayah' : 'Provincial Scope')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-mono tabular-nums text-[11px] text-neutral-400">
                    {lat.toFixed(4)}°&nbsp;{lat >= 0 ? 'N' : 'S'},&nbsp;{lon.toFixed(4)}°&nbsp;E
                  </span>
                  <button
                    onClick={() => onZoomTo([lat, lon])}
                    className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-[11px] font-medium transition-colors"
                  >
                    Center on Map
                  </button>
                </div>
              </section>

              {/* 6. Concrete Supply & Logistics Radar */}
              <section className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">🏗️</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-300">
                      Concrete Supply & Logistics Radar
                    </span>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                    ASTM C94 / SNI
                  </span>
                </div>

                {nearestPlant ? (
                  <div className="space-y-2.5">
                    {/* Nearest Facility Card */}
                    <div className="p-3 rounded-lg bg-neutral-950/80 border border-neutral-800 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-neutral-500 tracking-wider block">
                            Nearest Batching Facility
                          </span>
                          <div className="text-[13px] font-bold text-neutral-100 leading-snug">
                            {nearestPlant.plant.properties.name}
                          </div>
                          <div className="text-[11px] text-neutral-400 mt-0.5">
                            Operator: <span className="font-semibold text-neutral-200">{nearestPlant.plant.properties.operator}</span> • {nearestPlant.plant.properties.city}, {nearestPlant.plant.properties.province}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-lg font-bold font-mono text-white tabular-nums">
                            {nearestPlant.distanceKm.toFixed(1)} km
                          </div>
                          <span className="text-[9px] text-neutral-500 uppercase font-mono block">Haul Distance</span>
                        </div>
                      </div>

                      {/* Capacity & Type Row */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-neutral-800/80 text-[10px] text-neutral-400">
                        <span>Capacity: <strong className="text-neutral-200 font-mono">{nearestPlant.plant.properties.capacity_m3_per_hour} m³/h</strong></span>
                        <span className="text-neutral-500">•</span>
                        <span className="truncate max-w-[170px]">{nearestPlant.plant.properties.type}</span>
                      </div>
                    </div>

                    {/* Supply Status Badge & Engineering Specs */}
                    <div className={`p-3 rounded-lg border ${nearestPlant.status.badgeClass} space-y-1.5`}>
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <span>{nearestPlant.status.icon}</span>
                        <span>{nearestPlant.status.label}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-90">
                        {nearestPlant.status.technicalGuidance}
                      </p>
                    </div>

                    {/* Alternative Nearby Facilities */}
                    {nearbyPlants.length > 1 && (
                      <div className="pt-2 border-t border-neutral-800 space-y-1.5">
                        <span className="text-[9px] uppercase font-bold text-neutral-500 tracking-wider block">
                          Alternative Facilities in Range
                        </span>
                        <div className="space-y-1">
                          {nearbyPlants.slice(1, 3).map((alt) => (
                            <div
                              key={alt.plant.properties.id}
                              className="flex items-center justify-between text-[11px] p-2 rounded bg-neutral-950/70 border border-neutral-800/60"
                            >
                              <div className="truncate pr-2">
                                <span className="font-semibold text-neutral-300">{alt.plant.properties.operator}</span>
                                <span className="text-neutral-500"> • {alt.plant.properties.name}</span>
                              </div>
                              <div className="font-mono text-neutral-400 shrink-0 font-medium tabular-nums">
                                {alt.distanceKm.toFixed(1)} km
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-neutral-500 text-xs py-2">
                    Calculating nearest concrete facilities...
                  </div>
                )}
              </section>

              {/* 7. Geotechnical & Seismic Fault Proximity */}
              <section className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">⚡</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-300">
                      Geotechnical & Seismic Proximity
                    </span>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                    PuSGeN / SNI 1726
                  </span>
                </div>

                {nearestFault ? (
                  <div className="space-y-2.5">
                    {/* Nearest Fault Card */}
                    <div className="p-3 rounded-lg bg-neutral-950/80 border border-neutral-800 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-neutral-500 tracking-wider block">
                            Nearest Active Geological Fault
                          </span>
                          <div className="text-[13px] font-bold text-neutral-100 leading-snug">
                            {nearestFault.fault.properties.name}
                          </div>
                          <div className="text-[11px] text-neutral-400 mt-0.5">
                            Wilayah: <span className="text-neutral-300 font-semibold">{nearestFault.fault.properties.island}</span> • Mekanisme: <span className="text-neutral-300 font-medium">{nearestFault.fault.properties.fault_type}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-lg font-bold font-mono text-white tabular-nums">
                            {nearestFault.distanceKm.toFixed(1)} km
                          </div>
                          <span className="text-[9px] text-neutral-500 uppercase font-mono block">Fault Distance</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-neutral-800/80 text-[10px] text-neutral-400">
                        <span>Slip Rate: <strong className="text-amber-300 font-mono">{nearestFault.fault.properties.slip_rate_mm_year} mm/year</strong></span>
                        <span className="text-neutral-500">•</span>
                        <span className="truncate max-w-[170px]">Data: {nearestFault.fault.properties.source}</span>
                      </div>
                    </div>

                    {/* Seismic Alert Level Banner */}
                    <div className={`p-3 rounded-lg border ${nearestFault.badgeClass} space-y-1.5`}>
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <span>{nearestFault.alertText}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-90">
                        {nearestFault.alertLevel === 'high'
                          ? 'Project site sits directly within the active fault rupture influence zone. Structural design requires response spectrum analysis (RSA), site-specific ground motion assessment (SSGMA), and high ductility detailing per SNI 1726.'
                          : nearestFault.alertLevel === 'moderate'
                          ? 'Intermediate distance from major mapped active fault. Verify local site amplification factor (Soil Class SD/SE/SF) and ensure standard seismic detailing.'
                          : 'Low proximity risk to mapped major onshore active fault ruptures. Standard seismic design coefficients apply based on regional hazard maps.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-neutral-500 text-xs py-2">
                    Calculating nearest active fault lines...
                  </div>
                )}
              </section>

              {/* 8. Audit Metadata */}
              <div className="px-1 pb-1 space-y-1 text-[10px] text-neutral-500 font-mono border-t border-neutral-800/60 pt-2">
                <div className="flex items-center justify-between">
                  <span>Source Registry:</span>
                  <span className="text-neutral-400">{props.source_name} Proyek Strategis Nasional</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last Verified:</span>
                  <span className="text-neutral-400">{formatDate(props.scraped_at)}</span>
                </div>
              </div>

            </div>

            {/* ── Pinned Action Bar ── */}
            <div className="shrink-0 px-5 py-4 border-t border-neutral-800 bg-[#0f141c] space-y-2">
              {(props.bim_viewer_url || props.bim_uuid) && (
                <button
                  onClick={() => setIsBimModalOpen(true)}
                  className="w-full py-2.5 px-4 rounded-md bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/25 border border-cyan-400/40 transition-all transform hover:scale-[1.01]"
                >
                  <span>🧊 Inspect 3D BIM Model</span>
                  <span className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse" />
                </button>
              )}

              <a
                href={props.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <span>Official Document Profile ({props.source_name})</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>

              <a
                href={lpseSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-4 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white font-medium text-xs flex items-center justify-center gap-2 border border-neutral-700 transition-colors"
              >
                <span>Search Tenders on LPSE / INAPROC</span>
                <ExternalLink className="w-3 h-3 text-neutral-400 shrink-0" />
              </a>
            </div>
          </>
        )}
      </aside>

      {/* ── Lazy-Loaded 3D BIM Viewer Modal ── */}
      {isBimModalOpen && props && (
        <Suspense fallback={null}>
          <BimViewerModal
            isOpen={isBimModalOpen}
            onClose={() => setIsBimModalOpen(false)}
            projectName={props.project_name}
            bimUuid={props.bim_uuid}
            bimViewerUrl={props.bim_viewer_url}
            unor={props.unor}
            balai={props.balai}
          />
        </Suspense>
      )}
    </>
  );
};
