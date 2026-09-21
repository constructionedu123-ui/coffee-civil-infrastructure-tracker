import React, { useEffect, useMemo, useState, Suspense, lazy } from 'react';
import { ExternalLink, X, Copy, Check, Printer } from 'lucide-react';
import { ProjectPrintDossier } from './ProjectPrintDossier';

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.983zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
  </svg>
);
import { ProjectFeature, getProjectCoordinates } from '../types/project';
import { BatchingPlantFeature } from '../types/batchingPlant';
import { FaultLineFeature } from '../types/faultLine';
import { MaterialHubFeature } from '../types/materialHub';
import { findNearestBatchingPlants, findNearestMaterialHubs } from '../utils/logistics';
import { findNearestFaultLine } from '../utils/seismic';
import { CATEGORY_CONFIG, STATUS_CONFIG } from '../constants/categories';
import { formatBudget, formatDate } from '../utils/formatters';
import { getProjectContractors, getPrimaryContractor } from '../utils/contractorMatcher';
import { getProjectRainfallAnalysis } from '../utils/rainfallData';
import { getProjectRegionalCost } from '../utils/regionalCostData';
import { getProjectGeotechProfile } from '../utils/geotechSoilData';

const BimViewerModal = lazy(() => import('./BimViewerModal'));

interface ProjectDrawerProps {
  project: ProjectFeature | null;
  onClose: () => void;
  onZoomTo: (coords: [number, number]) => void;
  batchingPlants?: BatchingPlantFeature[];
  faultLines?: FaultLineFeature[];
  materialHubs?: MaterialHubFeature[];
  onSelectContractor?: (contractor: string) => void;
}


const MILESTONES = [
  { step: '01', title: 'Penyiapan', subtitle: 'Feasibility & Readiness' },
  { step: '02', title: 'Transaksi', subtitle: 'Tender & Financing' },
  { step: '03', title: 'Konstruksi', subtitle: 'Pekerjaan Fisik' },
  { step: '04', title: 'Operasional', subtitle: 'Beroperasi Penuh' },
];

export const ProjectDrawer: React.FC<ProjectDrawerProps> = ({
  project,
  onClose,
  onZoomTo,
  batchingPlants = [],
  faultLines = [],
  materialHubs = [],
  onSelectContractor,
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
    Boolean(props?.is_national) ||
    props?.province === 'Lintas Provinsi' ||
    props?.province === 'Nasional' ||
    Boolean(props?.regency?.includes('Nasional')) ||
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

  // Nearest Material Supply Hubs (Quarry, Steel, Cement, Facade)
  const nearestQuarry = useMemo(() => {
    if (!project || !materialHubs || materialHubs.length === 0) return null;
    const res = findNearestMaterialHubs(lat, lon, materialHubs, 'Quarry (Pasir & Agregat)', 1);
    return res[0] || null;
  }, [project, lat, lon, materialHubs]);

  const nearestSteel = useMemo(() => {
    if (!project || !materialHubs || materialHubs.length === 0) return null;
    const res = findNearestMaterialHubs(lat, lon, materialHubs, 'Baja Konstruksi (Steel Mills)', 1);
    return res[0] || null;
  }, [project, lat, lon, materialHubs]);

  const nearestCement = useMemo(() => {
    if (!project || !materialHubs || materialHubs.length === 0) return null;
    const res = findNearestMaterialHubs(lat, lon, materialHubs, 'Pabrik Semen Terpadu', 1);
    return res[0] || null;
  }, [project, lat, lon, materialHubs]);

  const isIKNProject = useMemo(() => {
    if (!props) return false;
    const text = (props.project_name + ' ' + (props.province || '') + ' ' + (props.regency || '')).toLowerCase();
    return props.category === 'IKN' || text.includes('ikn') || text.includes('sepaku') || text.includes('penajam') || text.includes('kalimantan timur');
  }, [props]);

  // Regional hydrometeorology and rainfall mitigation analysis (BMKG Normals)
  const rainfallAnalysis = useMemo(() => {
    if (!props) return null;
    return getProjectRainfallAnalysis(props.province, props.regency, props.project_name);
  }, [props?.province, props?.regency, props?.project_name]);

  // Geotechnical Soil Profile & Foundation Engineering (SNI 1726)
  const geotechProfile = useMemo(() => {
    if (!props) return null;
    return getProjectGeotechProfile(props.province, props.regency, props.project_name);
  }, [props?.province, props?.regency, props?.project_name]);

  // Regional Cost Benchmark & AHSP Unit Price Engine (BPS IKK & PUPR)
  const regionalCost = useMemo(() => {
    if (!props) return null;
    return getProjectRegionalCost(props.province, props.regency, props.project_name);
  }, [props?.province, props?.regency, props?.project_name]);

  const [costTab, setCostTab] = useState<'materials' | 'ahsp'>('materials');
  const [calcVolume, setCalcVolume] = useState<string>('100');

  const estimatedConcreteCost = useMemo(() => {
    if (!regionalCost) return 0;
    const vol = parseFloat(calcVolume);
    if (isNaN(vol) || vol <= 0) return 0;
    return vol * regionalCost.compositeAhsp.struktur_beton_lengkap_m3;
  }, [calcVolume, regionalCost]);



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
    if (s.includes('swasta murni') || s.includes('private murni'))
      return {
        label: scheme || 'Swasta Murni (Private)',
        desc: 'Investasi Swasta Komersial / Corporate Finance Mandiri (Non-APBN)',
        badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
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
  const projectContractors = props ? getProjectContractors(props) : [];
  const primaryContractor = props ? getPrimaryContractor(props) : 'BUMN Karya / Swasta';

  const [copied, setCopied] = useState(false);

  // Reset copied state on project change
  useEffect(() => {
    setCopied(false);
  }, [project]);

  // Project identifier & deep link URL for sharing
  const projectId = (project as any)?.id || props?.project_id || props?.project_name || '';
  const shareUrl = `https://coffeecivil.com/tracker/?project=${encodeURIComponent(projectId)}`;

  const formattedBudget = formatBudget(props?.budget_idr ?? null, props?.budget_raw);
  const budgetText = formattedBudget !== 'Estimating' ? formattedBudget : (props?.budget_raw || 'Dalam Perhitungan');
  const contractorText = props?.contractor || primaryContractor || 'BUMN Karya / Swasta';

  const whatsappMessage = [
    '🏗️ *Coffee Civil — Radar Konstruksi Indonesia*',
    `*Proyek:* ${props?.project_name || ''}`,
    `*Sektor:* ${props?.category || ''} | *Status:* ${props?.status || ''}`,
    `*Kontraktor:* ${contractorText}`,
    `*Nilai Investasi:* ${budgetText}`,
    '',
    '📍 Cek lokasi & analisis logistik di peta interaktif:',
    shareUrl,
  ].join('\n');

  const handleShareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const ta = document.createElement('textarea');
        ta.value = shareUrl;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 bg-black/60 transition-opacity duration-200 print:hidden ${
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
          ${isOpen ? 'translate-x-0' : 'translate-x-full'} print:hidden`}
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

              {/* Social Share & Quick Link Action Bar */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-neutral-800/80">
                <button
                  onClick={handleShareWhatsApp}
                  className="w-full py-2 px-2.5 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] hover:text-[#46e482] border border-[#25D366]/40 hover:border-[#25D366]/70 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 group"
                  title="Bagikan ringkasan proyek ke WhatsApp"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366] group-hover:scale-110 transition-transform shrink-0" />
                  <span className="truncate">Bagikan ke WhatsApp</span>
                </button>
                <button
                  onClick={handleCopyLink}
                  className="w-full py-2 px-2.5 rounded-lg bg-neutral-800/90 hover:bg-neutral-700 text-neutral-200 hover:text-white border border-neutral-700 hover:border-neutral-500 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
                  title="Salin tautan interaktif proyek"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-emerald-300 truncate font-bold">✔ Tautan Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span className="truncate">Salin Tautan</span>
                    </>
                  )}
                </button>
              </div>
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
              <section className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Lead Contractor / Concessionaire
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    Click badge to filter
                  </span>
                </div>

                <div
                  onClick={() => {
                    if (onSelectContractor && primaryContractor) {
                      onSelectContractor(primaryContractor);
                      onClose();
                    }
                  }}
                  className="font-semibold text-neutral-200 hover:text-blue-300 text-[12px] leading-snug cursor-pointer transition-colors"
                  title={`Filter map by ${primaryContractor}`}
                >
                  {contractorStr || 'BUMN Konstruksi / Swasta'}
                </div>

                {projectContractors.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-neutral-800/60">
                    {projectContractors.map((cName) => (
                      <button
                        key={cName}
                        type="button"
                        onClick={() => {
                          if (onSelectContractor) {
                            onSelectContractor(cName);
                            onClose();
                          }
                        }}
                        className="text-[11px] font-medium px-2.5 py-1 rounded bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 hover:text-white border border-blue-800/60 hover:border-blue-500 transition-all flex items-center gap-1.5 group/badge cursor-pointer shadow-sm"
                        title={`Filter map by: ${cName}`}
                      >
                        <span className="text-[10px]">👷</span>
                        <span>{cName}</span>
                        <span className="text-[9px] text-blue-400 group-hover/badge:translate-x-0.5 transition-transform">→</span>
                      </button>
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

                {isNational && (
                  <div className="flex items-start gap-2 p-2.5 rounded bg-blue-950/40 border border-blue-800/40 text-blue-300 text-[11px] leading-relaxed">
                    <span className="text-sm shrink-0">🏛️</span>
                    <span>
                      <strong className="text-white font-medium">Program Strategis Multi-Regional / Nasional:</strong> Koordinat dijangkarkan pada kementerian pembina pusat di DKI Jakarta (Kementerian PUPR Pattimura).
                    </span>
                  </div>
                )}

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

              {/* 7. Construction Material Supply Chain & Quarry Radar */}
              <section className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">🏭</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-300">
                      Material Supply Chain & Quarry Radar
                    </span>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                    SNI / Pareto Items
                  </span>
                </div>

                {/* Special IKN Maritime Supply Corridor Callout */}
                {isIKNProject && (
                  <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-700/50 space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 font-bold text-cyan-300 text-xs">
                      <span>⚓</span>
                      <span>Koridor Pasokan Maritim IKN (Selat Makassar)</span>
                    </div>
                    <p className="text-[11px] text-cyan-100/90 leading-relaxed">
                      Sekitar <strong>70–80% pasir beton mutu tinggi IKN</strong> dipasok dari <strong>Tambang Palu - Donggala (Watusampu)</strong> melalui tongkang laut melintasi Selat Makassar ke Pelabuhan Semayang Balikpapan dan Dermaga Logistik ITCI Sepaku (~350 km jalur laut). Pasokan semen curah diangkut via kapal curah semen dari <strong>Semen Tonasa Pangkep</strong> dan <strong>SIG Tuban</strong>.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-2.5">
                  {/* Nearest Quarry */}
                  {nearestQuarry && (
                    <div className="p-2.5 rounded-lg bg-neutral-950/80 border border-neutral-800/90 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">⛰️</span>
                          <div>
                            <span className="text-[9px] uppercase font-bold text-amber-400 tracking-wider block">
                              Nearest Quarry (Pasir & Agregat)
                            </span>
                            <div className="text-xs font-bold text-neutral-100 leading-snug">
                              {nearestQuarry.hub.properties.name}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-sm font-bold font-mono text-amber-300 tabular-nums">
                            {nearestQuarry.distanceKm.toFixed(1)} km
                          </span>
                        </div>
                      </div>
                      <div className="text-[10px] text-neutral-400 flex items-center justify-between pt-1 border-t border-neutral-800/60">
                        <span>Operator: <strong className="text-neutral-300">{nearestQuarry.hub.properties.operator}</strong></span>
                        <span className="text-amber-400/90 font-mono">{nearestQuarry.hub.properties.capacity_output}</span>
                      </div>
                    </div>
                  )}

                  {/* Nearest Steel Mill */}
                  {nearestSteel && (
                    <div className="p-2.5 rounded-lg bg-neutral-950/80 border border-neutral-800/90 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">🔩</span>
                          <div>
                            <span className="text-[9px] uppercase font-bold text-cyan-400 tracking-wider block">
                              Nearest Baja Konstruksi (Steel Mill)
                            </span>
                            <div className="text-xs font-bold text-neutral-100 leading-snug">
                              {nearestSteel.hub.properties.name}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-sm font-bold font-mono text-cyan-300 tabular-nums">
                            {nearestSteel.distanceKm.toFixed(1)} km
                          </span>
                        </div>
                      </div>
                      <div className="text-[10px] text-neutral-400 flex items-center justify-between pt-1 border-t border-neutral-800/60">
                        <span>Operator: <strong className="text-neutral-300">{nearestSteel.hub.properties.operator}</strong></span>
                        <span className="text-cyan-400/90 font-mono">{nearestSteel.hub.properties.capacity_output}</span>
                      </div>
                    </div>
                  )}

                  {/* Nearest Cement Plant */}
                  {nearestCement && (
                    <div className="p-2.5 rounded-lg bg-neutral-950/80 border border-neutral-800/90 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">🧱</span>
                          <div>
                            <span className="text-[9px] uppercase font-bold text-rose-400 tracking-wider block">
                              Nearest Pabrik Semen Terpadu
                            </span>
                            <div className="text-xs font-bold text-neutral-100 leading-snug">
                              {nearestCement.hub.properties.name}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-sm font-bold font-mono text-rose-300 tabular-nums">
                            {nearestCement.distanceKm.toFixed(1)} km
                          </span>
                        </div>
                      </div>
                      <div className="text-[10px] text-neutral-400 flex items-center justify-between pt-1 border-t border-neutral-800/60">
                        <span>Operator: <strong className="text-neutral-300">{nearestCement.hub.properties.operator}</strong></span>
                        <span className="text-rose-400/90 font-mono">{nearestCement.hub.properties.capacity_output}</span>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* 8. Geotechnical & Seismic Fault Proximity */}
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

              {/* 9. Geotechnical Soil Profile & Foundation Engineering (SNI 1726) */}
              {geotechProfile && (
                <section className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">🔬</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-300">
                        Profil Geoteknik & Karakteristik Tanah (SNI 1726)
                      </span>
                    </div>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                      SNI 1726 / Geologi
                    </span>
                  </div>

                  {/* Header & Badges Box */}
                  <div className="p-3 rounded-lg bg-neutral-950/80 border border-neutral-800 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-neutral-500 tracking-wider block">
                          Formasi Geologi Regional
                        </span>
                        <div className="text-xs font-semibold text-neutral-200 mt-0.5">
                          {geotechProfile.geologicalFormation}
                        </div>
                        <div className="text-[10px] text-neutral-400 mt-0.5">
                          Wilayah: <span className="text-neutral-300 font-medium">{geotechProfile.regionName}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {/* SNI Site Class Badge */}
                        <div className={`px-2.5 py-1 rounded border text-right font-mono text-xs font-bold ${geotechProfile.siteClassColorClass}`}>
                          Kelas Situs: {geotechProfile.sniSiteClass}
                        </div>
                        {/* Liquefaction Risk Pill */}
                        <div className={`px-2 py-0.5 rounded border text-[9.5px] font-medium ${geotechProfile.liquefactionColorClass}`}>
                          Likuifaksi: {geotechProfile.liquefactionRisk}
                        </div>
                      </div>
                    </div>

                    {/* Dominant Soil & Hard Stratum Depth */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-800/80 text-xs">
                      <div className="p-2 rounded bg-neutral-900/80 border border-neutral-800/60 space-y-0.5">
                        <span className="text-[9px] text-neutral-500 uppercase font-semibold block">
                          Jenis Tanah Dominan
                        </span>
                        <div className="font-semibold text-neutral-200 text-[11px] leading-tight">
                          {geotechProfile.soilClassification}
                        </div>
                      </div>

                      <div className="p-2 rounded bg-neutral-900/80 border border-neutral-800/60 space-y-0.5">
                        <span className="text-[9px] text-neutral-500 uppercase font-semibold block">
                          Kedalaman Lapisan Keras (N-SPT &gt; 50)
                        </span>
                        <div className="font-mono font-bold text-sky-400 text-xs">
                          ~{geotechProfile.hardSoilDepth}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Key Geotechnical Hazards */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider block">
                      Bahaya & Tantangan Geoteknik Tapak:
                    </span>
                    <div className="space-y-1">
                      {geotechProfile.keyGeotechHazards.map((hazard, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 p-2 rounded bg-neutral-950/60 border border-neutral-800/70 text-[11px] text-neutral-300 leading-relaxed"
                        >
                          <span className="text-amber-400 shrink-0 text-xs mt-0.5">⚠️</span>
                          <span>{hazard}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommended Foundation & Ground Improvement */}
                  <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 space-y-2">
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
                        <span>🏗️</span>
                        <span>Rekomendasi Rekayasa Pondasi:</span>
                      </div>
                      <p className="text-[11px] text-neutral-300 leading-relaxed mt-1 font-medium">
                        {geotechProfile.recommendedFoundation}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-neutral-800/70">
                      <div className="flex items-center gap-1.5 text-[10.5px] font-semibold text-neutral-300">
                        <span>🛠️</span>
                        <span>Metode Perbaikan Tanah (Ground Improvement):</span>
                      </div>
                      <p className="text-[10.5px] text-neutral-400 leading-relaxed mt-0.5">
                        {geotechProfile.groundImprovement}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-neutral-800/50">
                      <p className="text-[10px] text-neutral-400 italic leading-relaxed">
                        💡 Catatan Geoteknik: {geotechProfile.engineeringAdvice}
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {/* 10. Site Hydrometeorology & Rainfall Mitigation Card (BMKG) */}
              {rainfallAnalysis && (
                <section className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">🌧️</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-300">
                        Analisis Hidrologi & Mitigasi Cuaca (BMKG)
                      </span>
                    </div>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                      BMKG Normals
                    </span>
                  </div>

                  {/* Header: Curah Hujan Tahunan & Color-coded Severity Badge */}
                  <div className="p-3 rounded-lg bg-neutral-950/80 border border-neutral-800 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-neutral-500 tracking-wider block">
                          Rata-rata Curah Hujan Tahunan
                        </span>
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <span className="text-xl font-bold font-mono text-white tabular-nums">
                            ~{rainfallAnalysis.annualMm.toLocaleString('id-ID')}
                          </span>
                          <span className="text-xs text-neutral-400 font-medium">mm/tahun</span>
                        </div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">
                          Rentang Historis: <span className="text-neutral-200 font-mono font-medium">{rainfallAnalysis.annualRangeText}</span>
                        </div>
                      </div>

                      {/* Color-Coded Severity Badge */}
                      <div className="shrink-0 text-right">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${rainfallAnalysis.badgeColorClass}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${rainfallAnalysis.badgeBgClass}`} />
                          {rainfallAnalysis.badgeLabel}
                        </span>
                      </div>
                    </div>

                    {/* Peak Wet Season & Climate Zone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-neutral-800/80 text-[11px]">
                      <div className="bg-neutral-900/80 p-2 rounded border border-neutral-800/60">
                        <span className="text-[9px] text-neutral-500 uppercase font-semibold block">
                          Puncak Musim Hujan
                        </span>
                        <span className="font-semibold text-sky-300">
                          {rainfallAnalysis.peakSeasonMonths}
                        </span>
                      </div>
                      <div className="bg-neutral-900/80 p-2 rounded border border-neutral-800/60">
                        <span className="text-[9px] text-neutral-500 uppercase font-semibold block">
                          Tipe Iklim Tapak
                        </span>
                        <span className="font-medium text-neutral-200 truncate block" title={rainfallAnalysis.climateZone}>
                          {rainfallAnalysis.climateZone}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-neutral-300/90 leading-relaxed bg-neutral-900/40 p-2 rounded border border-neutral-800/40 italic">
                      💡 {rainfallAnalysis.summaryGuidance}
                    </p>
                  </div>

                  {/* Actionable Engineering Mitigation Advice */}
                  <div className="space-y-2">
                    <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider block">
                      Rekomendasi Metode Kerja & Mitigasi Konstruksi:
                    </span>
                    <div className="grid grid-cols-1 gap-2">
                      {rainfallAnalysis.mitigations.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800/70 text-xs"
                        >
                          <span className="text-base shrink-0 select-none mt-0.5">{item.icon}</span>
                          <div className="space-y-0.5">
                            <div className="font-semibold text-neutral-200 text-[11px]">
                              {item.title}
                            </div>
                            <div className="text-[10.5px] text-neutral-400 leading-relaxed">
                              {item.desc}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* 11. Regional Construction Cost Benchmark & AHSP Unit Price Engine */}
              {regionalCost && (
                <section className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">💰</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-300">
                        Indeks Kemahalan & Biaya Konstruksi (BPS / AHSP)
                      </span>
                    </div>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                      BPS IKK / AHSP PUPR
                    </span>
                  </div>

                  {/* Top Box: Regional IKK Score & Baseline Comparison */}
                  <div className="p-3 rounded-lg bg-neutral-950/80 border border-neutral-800 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-neutral-500 tracking-wider block">
                          Wilayah Acuan & Indeks Kemahalan Konstruksi
                        </span>
                        <div className="text-xs font-semibold text-neutral-200 mt-0.5">
                          {regionalCost.regionName}
                        </div>
                      </div>
                      <div className={`px-2.5 py-1 rounded border text-right ${regionalCost.badgeColorClass}`}>
                        <div className="text-xs font-bold font-mono">
                          IKK: {regionalCost.ikkIndex.toFixed(1)}
                        </div>
                        <div className="text-[9px] font-medium tracking-tight">
                          ({regionalCost.diffText})
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-neutral-800/60 text-[10.5px]">
                      <span className="text-neutral-400">Klasifikasi Kemahalan:</span>
                      <span className={`font-semibold px-2 py-0.5 rounded text-[10px] ${regionalCost.badgeColorClass}`}>
                        {regionalCost.badgeLabel}
                      </span>
                    </div>

                    <p className="text-[10.5px] text-neutral-400 leading-relaxed pt-1 border-t border-neutral-800/50 italic">
                      💡 {regionalCost.logisticsNote}
                    </p>
                  </div>

                  {/* Segmented Tab Switcher */}
                  <div className="flex items-center p-1 bg-neutral-950 rounded-lg border border-neutral-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setCostTab('materials')}
                      className={`flex-1 py-1.5 px-2 rounded-md font-medium text-[11px] transition-all flex items-center justify-center gap-1.5 ${
                        costTab === 'materials'
                          ? 'bg-neutral-800 text-white shadow-sm font-semibold'
                          : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      <span>🧱</span>
                      <span>Bahan & Upah</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCostTab('ahsp')}
                      className={`flex-1 py-1.5 px-2 rounded-md font-medium text-[11px] transition-all flex items-center justify-center gap-1.5 ${
                        costTab === 'ahsp'
                          ? 'bg-neutral-800 text-white shadow-sm font-semibold'
                          : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      <span>🏗️</span>
                      <span>Pekerjaan Jadi (AHSP)</span>
                    </button>
                  </div>

                  {/* Tab Content */}
                  {costTab === 'materials' ? (
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded-lg bg-neutral-950/60 border border-neutral-800/80 space-y-0.5">
                          <span className="text-[9px] text-neutral-500 uppercase font-semibold block truncate">
                            Ready-Mix K-300
                          </span>
                          <div className="font-mono font-bold text-white text-xs">
                            Rp {regionalCost.materials.beton_k300_m3.toLocaleString('id-ID')}
                          </div>
                          <span className="text-[9px] text-neutral-400">per m³ beton segar</span>
                        </div>

                        <div className="p-2 rounded-lg bg-neutral-950/60 border border-neutral-800/80 space-y-0.5">
                          <span className="text-[9px] text-neutral-500 uppercase font-semibold block truncate">
                            Besi Beton Ulir (BJTS)
                          </span>
                          <div className="font-mono font-bold text-white text-xs">
                            Rp {regionalCost.materials.besi_beton_kg.toLocaleString('id-ID')}
                          </div>
                          <span className="text-[9px] text-neutral-400">per kg material</span>
                        </div>

                        <div className="p-2 rounded-lg bg-neutral-950/60 border border-neutral-800/80 space-y-0.5">
                          <span className="text-[9px] text-neutral-500 uppercase font-semibold block truncate">
                            Semen Portland 50kg
                          </span>
                          <div className="font-mono font-bold text-white text-xs">
                            Rp {regionalCost.materials.semen_50kg_sak.toLocaleString('id-ID')}
                          </div>
                          <span className="text-[9px] text-neutral-400">per sak (tipe 1)</span>
                        </div>

                        <div className="p-2 rounded-lg bg-neutral-950/60 border border-neutral-800/80 space-y-0.5">
                          <span className="text-[9px] text-neutral-500 uppercase font-semibold block truncate">
                            Pasir Pasang / Beton
                          </span>
                          <div className="font-mono font-bold text-white text-xs">
                            Rp {regionalCost.materials.pasir_m3.toLocaleString('id-ID')}
                          </div>
                          <span className="text-[9px] text-neutral-400">per m³ stockpile</span>
                        </div>
                      </div>

                      {/* Upah Tenaga Kerja */}
                      <div className="p-2.5 rounded-lg bg-neutral-950/70 border border-neutral-800 space-y-1.5">
                        <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider block">
                          Standar Upah Harian Lapangan (7 Jam Kerja):
                        </span>
                        <div className="grid grid-cols-3 gap-1.5 text-center">
                          <div className="p-1.5 bg-neutral-900/80 rounded border border-neutral-800/60">
                            <span className="text-[9px] text-neutral-500 block truncate">Pekerja Kasar</span>
                            <span className="font-mono font-bold text-neutral-200 text-xs block mt-0.5 truncate">
                              Rp {regionalCost.laborDaily.pekerja.toLocaleString('id-ID')}
                            </span>
                          </div>
                          <div className="p-1.5 bg-neutral-900/80 rounded border border-neutral-800/60">
                            <span className="text-[9px] text-neutral-500 block truncate">Tukang Batu/Besi</span>
                            <span className="font-mono font-bold text-sky-300 text-xs block mt-0.5 truncate">
                              Rp {regionalCost.laborDaily.tukang.toLocaleString('id-ID')}
                            </span>
                          </div>
                          <div className="p-1.5 bg-neutral-900/80 rounded border border-neutral-800/60">
                            <span className="text-[9px] text-neutral-500 block truncate">Mandor</span>
                            <span className="font-mono font-bold text-amber-300 text-xs block mt-0.5 truncate">
                              Rp {regionalCost.laborDaily.mandor.toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800/80 flex items-center justify-between">
                        <div className="space-y-0.5 pr-2">
                          <div className="font-semibold text-neutral-200 text-xs">
                            Struktur Beton Bertulang Lengkap
                          </div>
                          <div className="text-[10px] text-neutral-400 leading-tight">
                            K-300 + 120 kg Besi BJTS + Bekisting 2x + Upah
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-mono font-bold text-white text-xs">
                            Rp {regionalCost.compositeAhsp.struktur_beton_lengkap_m3.toLocaleString('id-ID')}
                          </div>
                          <span className="text-[9px] text-neutral-400">per m³ jadi</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800/80 flex items-center justify-between">
                        <div className="space-y-0.5 pr-2">
                          <div className="font-semibold text-neutral-200 text-xs">
                            Galian Tanah Keras / Berbatu
                          </div>
                          <div className="text-[10px] text-neutral-400 leading-tight">
                            Excavator, perapihan dasar & disposal 5 km
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-mono font-bold text-white text-xs">
                            Rp {regionalCost.compositeAhsp.galian_tanah_m3.toLocaleString('id-ID')}
                          </div>
                          <span className="text-[9px] text-neutral-400">per m³ lepas</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800/80 flex items-center justify-between">
                        <div className="space-y-0.5 pr-2">
                          <div className="font-semibold text-neutral-200 text-xs">
                            Tiang Pancang Spun Pile Ø400–500
                          </div>
                          <div className="text-[10px] text-neutral-400 leading-tight">
                            Pengadaan precast K-600 & pemancangan hydraulic
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-mono font-bold text-white text-xs">
                            Rp {regionalCost.compositeAhsp.tiang_pancang_m.toLocaleString('id-ID')}
                          </div>
                          <span className="text-[9px] text-neutral-400">per meter lari</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Interactive Quick Estimator */}
                  <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800/90 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-neutral-300">
                        <span>⚡</span>
                        <span>Hitung Cepat Biaya Struktur Beton:</span>
                      </div>
                      <span className="text-[9px] text-neutral-500 font-mono">Estimator Cepat</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min="1"
                          step="10"
                          value={calcVolume}
                          onChange={(e) => setCalcVolume(e.target.value)}
                          placeholder="Volume m³"
                          className="w-full bg-neutral-900 border border-neutral-700 focus:border-sky-500 focus:outline-none rounded px-3 py-1.5 text-xs text-white font-mono font-bold placeholder-neutral-500 pr-10"
                        />
                        <span className="absolute right-2.5 top-1.5 text-[11px] text-neutral-400 font-mono">m³</span>
                      </div>

                      <div className="flex items-center gap-1">
                        {['50', '100', '250', '500'].map((vol) => (
                          <button
                            key={vol}
                            type="button"
                            onClick={() => setCalcVolume(vol)}
                            className={`px-2 py-1 rounded text-[10px] font-mono transition-colors border ${
                              calcVolume === vol
                                ? 'bg-sky-950 text-sky-300 border-sky-600 font-bold'
                                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:bg-neutral-800'
                            }`}
                          >
                            {vol}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-2.5 rounded bg-neutral-900/90 border border-neutral-800 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider block">
                          Estimasi Kasar Anggaran Struktur:
                        </span>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {calcVolume || 0} m³ × Rp {(regionalCost.compositeAhsp.struktur_beton_lengkap_m3 / 1e6).toFixed(2)} Jt/m³
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold font-mono text-emerald-400">
                          Rp {estimatedConcreteCost.toLocaleString('id-ID')}
                        </div>
                        {estimatedConcreteCost >= 1e9 && (
                          <span className="text-[10px] text-emerald-300/80 font-mono block">
                            (~Rp {(estimatedConcreteCost / 1e9).toFixed(2)} Miliar)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* 12. Audit Metadata */}
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
              {/* Bottom Quick Share Bar */}
              <div className="grid grid-cols-2 gap-2 pb-1">
                <button
                  onClick={handleShareWhatsApp}
                  className="w-full py-2 px-2.5 rounded-md bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] hover:text-[#46e482] border border-[#25D366]/40 hover:border-[#25D366]/70 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 group"
                  title="Bagikan ringkasan proyek ke WhatsApp"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366] group-hover:scale-110 transition-transform shrink-0" />
                  <span className="truncate">Bagikan WhatsApp</span>
                </button>
                <button
                  onClick={handleCopyLink}
                  className="w-full py-2 px-2.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white border border-neutral-700 hover:border-neutral-500 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
                  title="Salin tautan interaktif proyek"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-emerald-300 truncate font-bold">✔ Tautan Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span className="truncate">Salin Tautan</span>
                    </>
                  )}
                </button>
              </div>

              {/* Printable A4 Engineering Fact Sheet Button (Phase 21) */}
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full py-2 px-3 rounded-md bg-sky-950/40 hover:bg-sky-900/60 text-sky-300 hover:text-sky-200 border border-sky-600/50 hover:border-sky-400 font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 group"
                title="Cetak atau simpan Lembar Intelijen Rekayasa Proyek ke PDF A4"
              >
                <Printer className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform shrink-0" />
                <span>🖨️ Cetak Ringkasan / PDF (A4)</span>
              </button>

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

      {/* ── Printable A4 Project Fact Sheet (Hidden on screen, active on window.print()) ── */}
      {project && (
        <ProjectPrintDossier
          project={project}
          batchingPlants={batchingPlants}
          faultLines={faultLines}
          materialHubs={materialHubs}
        />
      )}

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
