import React, { useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { ProjectFeature } from '../types/project';
import { CATEGORY_CONFIG, STATUS_CONFIG } from '../constants/categories';
import { formatBudget, formatDate } from '../utils/formatters';

interface ProjectDrawerProps {
  project: ProjectFeature | null;
  onClose: () => void;
  onZoomTo: (coords: [number, number]) => void;
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
}) => {
  // Listen for Escape key to dismiss drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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

  const coords = project?.geometry.coordinates || [0, 0];
  const [lon, lat] = coords;

  // Determine current milestone step index
  const getMilestoneIndex = (status?: string) => {
    switch (status) {
      case 'Planning':
        return 0;
      case 'Construction':
        return 2;
      case 'Operational':
      case 'Completed':
        return 3;
      default:
        return 1;
    }
  };
  const currentMilestone = getMilestoneIndex(props?.status);

  // Generate LPSE tender search URL based on project name
  const lpseSearchUrl = props
    ? `https://inaproc.id/pengadaan?keyword=${encodeURIComponent(
        props.project_name.replace(/[–\-\/]/g, ' ').trim()
      )}`
    : '#';

  // Funding Scheme styling helper
  const getSchemeBadge = (scheme?: string | null) => {
    const s = (scheme || 'KPBU / PPP').toLowerCase();
    if (s.includes('kpbu') || s.includes('ppp')) {
      return {
        label: scheme || 'KPBU / PPP (BUJT Concession)',
        desc: 'Kerjasama Pemerintah dan Badan Usaha (Public-Private Partnership)',
        badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      };
    }
    if (s.includes('apbn')) {
      return {
        label: scheme || 'APBN (State Budget)',
        desc: 'Anggaran Pendapatan dan Belanja Negara murni atau pinjaman bilateral',
        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      };
    }
    if (s.includes('bumn') || s.includes('penugasan')) {
      return {
        label: scheme || 'Penugasan BUMN',
        desc: 'Penugasan Khusus Pemerintah kepada BUMN (Corporate Finance)',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      };
    }
    if (s.includes('swasta') || s.includes('private') || s.includes('kks') || s.includes('ipp')) {
      return {
        label: scheme || 'Swasta / Private Investment',
        desc: 'Investasi Swasta Mandiri / Independent Power Producer (IPP) / KKS',
        badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      };
    }
    return {
      label: scheme || 'APBN / KPBU Mixed',
      desc: 'Pembiayaan Campuran Pemerintah & Badan Usaha',
      badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    };
  };

  const schemeInfo = getSchemeBadge(props?.funding_scheme);

  return (
    <>
      {/* Dimmed backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-200 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Slide-out Editorial Inspection Drawer */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] md:w-[480px] bg-neutral-950 border-l border-neutral-800 shadow-2xl flex flex-col transform transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {props && categoryConfig && statusConfig && (
          <>
            {/* Drawer Header */}
            <div className="px-5 py-4 border-b border-neutral-800 bg-neutral-900/90 flex items-start justify-between gap-3 shrink-0">
              <div className="space-y-1.5 flex-1 pr-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* PSN Sector Badge */}
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${categoryConfig.badgeClass}`}
                  >
                    {categoryConfig.label}
                  </span>

                  {/* Status Milestone Tag */}
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded border ${statusConfig.badgeClass}`}
                  >
                    {statusConfig.label}
                  </span>

                  {/* National Scope Tag */}
                  {isNational && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700 font-mono">
                      Lintas Wilayah
                    </span>
                  )}
                </div>

                <h2 className="text-base sm:text-lg font-bold text-neutral-100 leading-snug tracking-tight">
                  {props.project_name}
                </h2>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors shrink-0 text-sm"
                title="Close drawer (Esc)"
              >
                ✕
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3.5 text-xs">
              {/* 1. Status Milestone Lifecycle Tracker */}
              <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Project Lifecycle Stage
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400">
                    PSN Milestone
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {MILESTONES.map((m, idx) => {
                    const isCompleted = idx < currentMilestone;
                    const isCurrent = idx === currentMilestone;
                    return (
                      <div
                        key={m.step}
                        className={`rounded p-2 text-center border transition-colors ${
                          isCurrent
                            ? 'bg-neutral-800 border-neutral-500 text-white'
                            : isCompleted
                            ? 'bg-neutral-900 border-neutral-700 text-neutral-300'
                            : 'bg-neutral-950/60 border-neutral-800/80 text-neutral-500'
                        }`}
                      >
                        <div className="text-[9px] font-mono font-bold mb-0.5 text-neutral-400">
                          {isCompleted ? '✓ ' + m.step : m.step}
                        </div>
                        <div className="text-[11px] font-semibold truncate">{m.title}</div>
                        <div className="text-[9px] text-neutral-500 hidden sm:block truncate">{m.subtitle}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Financial Breakdown (CAPEX & Scheme) */}
              <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Estimated Investment (CAPEX)
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    IDR Trillion
                  </span>
                </div>

                <div className="space-y-0.5">
                  <div className="text-xl sm:text-2xl font-bold text-neutral-100 font-mono tabular-nums tracking-tight">
                    {formatBudget(props.budget_idr, props.budget_raw)}
                  </div>
                  {props.budget_raw && props.budget_raw !== formatBudget(props.budget_idr) && (
                    <p className="text-[11px] text-neutral-400 italic">
                      Official Gazette: "{props.budget_raw}"
                    </p>
                  )}
                </div>

                {/* Funding Scheme Sub-section */}
                <div className="pt-2.5 border-t border-neutral-800/80 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-400 font-medium">
                      Funding Scheme:
                    </span>
                    <span className="font-semibold text-neutral-200">
                      {schemeInfo.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-500">
                    {schemeInfo.desc}
                  </p>
                </div>
              </div>

              {/* 3. Penanggung Jawab Proyek Kerjasama (PJPK) / Ministry */}
              <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Responsible Agency / PJPK
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    GCA Authority
                  </span>
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-bold text-neutral-100 text-sm leading-snug">
                    {props.pjpk || 'Kementerian PUPR / Lembaga Terkait'}
                  </h3>
                  <p className="text-[10px] text-neutral-500">
                    Sector regulating ministry and project contracting authority
                  </p>
                </div>
              </div>

              {/* 4. Contractors & Implementing Entities */}
              <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-3.5 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Lead Contractor / Concessionaire
                </div>
                <div className="space-y-1.5">
                  <div className="font-semibold text-neutral-200 text-xs">
                    {props.contractor || 'BUMN Konstruksi / Swasta'}
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-neutral-800/60">
                    {props.contractor?.includes('WIKA') && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                        Wijaya Karya (WIKA)
                      </span>
                    )}
                    {props.contractor?.includes('PP') && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                        PT PP (Persero)
                      </span>
                    )}
                    {props.contractor?.includes('Hutama') && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                        Hutama Karya (HK)
                      </span>
                    )}
                    {props.contractor?.includes('Adhi') && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                        Adhi Karya
                      </span>
                    )}
                    {props.contractor?.includes('Waskita') && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                        Waskita Karya
                      </span>
                    )}
                    {props.contractor?.includes('Jasa Marga') && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                        Jasa Marga
                      </span>
                    )}
                    {props.contractor?.includes('PLN') && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                        PT PLN (Persero)
                      </span>
                    )}
                    {props.contractor?.includes('Pertamina') && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                        PT Pertamina (Persero)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 5. Geographic Scope & Coordinates */}
              <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-3.5 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Location & Coordinates
                </div>
                <div className="grid grid-cols-2 gap-2 text-neutral-300 text-xs">
                  <div className="bg-neutral-950 p-2 rounded border border-neutral-800">
                    <span className="text-neutral-500 block text-[9px] uppercase font-semibold">
                      Province
                    </span>
                    <span className="font-semibold text-neutral-200">
                      {props.province || 'National / Multi-Province'}
                    </span>
                  </div>
                  <div className="bg-neutral-950 p-2 rounded border border-neutral-800">
                    <span className="text-neutral-500 block text-[9px] uppercase font-semibold">
                      Regency / City
                    </span>
                    <span className="font-semibold text-neutral-200">
                      {props.regency || (isNational ? 'Lintas Wilayah' : 'Provincial Scope')}
                    </span>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between text-[11px] text-neutral-400">
                  <span className="font-mono tabular-nums text-neutral-400">
                    {lat.toFixed(4)}° N, {lon.toFixed(4)}° E
                  </span>
                  <button
                    onClick={() => onZoomTo([lat, lon])}
                    className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-medium transition-colors"
                  >
                    Center on Map
                  </button>
                </div>
              </div>

              {/* Ingestion & Audit Metadata */}
              <div className="p-2.5 border-t border-neutral-800/60 space-y-1 text-[10px] text-neutral-500 font-mono">
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

            {/* External Links Action Bar */}
            <div className="p-4 border-t border-neutral-800 bg-neutral-900/90 space-y-2 shrink-0">
              <a
                href={props.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Official Document Profile ({props.source_name})</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <a
                href={lpseSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white font-medium text-xs flex items-center justify-center gap-1.5 border border-neutral-700 transition-colors"
              >
                <span>Search Tenders on LPSE / INAPROC</span>
                <ExternalLink className="w-3 h-3 text-neutral-400" />
              </a>
            </div>
          </>
        )}
      </aside>
    </>
  );
};

