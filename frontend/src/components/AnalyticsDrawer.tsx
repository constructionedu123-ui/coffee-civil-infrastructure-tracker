import React, { useMemo } from 'react';
import { ProjectFeature } from '../types/project';
import { resolveContractorEntity } from '../utils/contractor';
import { formatBudget } from '../utils/formatters';
import {
  X,
  Building2,
  PieChart,
  Coins,
  Briefcase,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface AnalyticsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projects: ProjectFeature[];
  selectedContractor: string | null;
  onSelectContractor: (contractor: string | null) => void;
}

export const AnalyticsDrawer: React.FC<AnalyticsDrawerProps> = ({
  isOpen,
  onClose,
  projects,
  selectedContractor,
  onSelectContractor,
}) => {
  // Aggregate Contractors
  const contractorAnalytics = useMemo(() => {
    const map = new Map<string, { count: number; capex: number }>();

    projects.forEach((feat) => {
      const entity = resolveContractorEntity(feat.properties);
      const current = map.get(entity) || { count: 0, capex: 0 };
      current.count += 1;
      current.capex += feat.properties.budget_idr || 0;
      map.set(entity, current);
    });

    const list = Array.from(map.entries()).map(([name, stats]) => ({
      name,
      count: stats.count,
      capex: stats.capex,
    }));

    // Sort by count descending, then capex
    list.sort((a, b) => b.count - a.count || b.capex - a.capex);
    return list;
  }, [projects]);

  // Aggregate Funding Schemes
  const schemeAnalytics = useMemo(() => {
    const buckets: Record<string, { label: string; count: number; capex: number; color: string }> = {
      apbn: { label: 'APBN (State Budget)', count: 0, capex: 0, color: '#3B82F6' },
      kpbu: { label: 'KPBU / PPP (Concessions)', count: 0, capex: 0, color: '#0D9488' },
      bumn: { label: 'Penugasan BUMN (SOE Mandate)', count: 0, capex: 0, color: '#D97706' },
      swasta: { label: 'Swasta / Private Equity', count: 0, capex: 0, color: '#8B5CF6' },
    };

    projects.forEach((feat) => {
      const scheme = (feat.properties.funding_scheme || '').toLowerCase();
      const capex = feat.properties.budget_idr || 0;

      if (scheme.includes('kpbu') || scheme.includes('ppp') || scheme.includes('bujt')) {
        buckets.kpbu.count += 1;
        buckets.kpbu.capex += capex;
      } else if (scheme.includes('penugasan') || scheme.includes('bumn')) {
        buckets.bumn.count += 1;
        buckets.bumn.capex += capex;
      } else if (scheme.includes('swasta') || scheme.includes('private') || scheme.includes('ipp')) {
        buckets.swasta.count += 1;
        buckets.swasta.capex += capex;
      } else {
        buckets.apbn.count += 1;
        buckets.apbn.capex += capex;
      }
    });

    return Object.values(buckets);
  }, [projects]);

  const maxContractorCount = contractorAnalytics[0]?.count || 1;
  const totalProjects = projects.length;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-200 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Slide-out Drawer */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] md:w-[500px] bg-neutral-950 border-l border-neutral-800 shadow-2xl flex flex-col transform transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 bg-neutral-900/90 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-neutral-800 border border-neutral-700 text-blue-400">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-neutral-100 tracking-tight">
                Contractor & Funding Analytics
              </h2>
              <p className="text-[11px] text-neutral-400">
                Portfolio distribution across SOEs & private entities
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors shrink-0"
            title="Close Analytics (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* Active Filter Notice */}
          {selectedContractor && (
            <div className="bg-blue-950/40 border border-blue-800/60 rounded-lg p-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <div>
                  <div className="text-[10px] uppercase font-bold text-blue-400">Active Contractor Filter</div>
                  <div className="text-xs font-semibold text-neutral-100">{selectedContractor}</div>
                </div>
              </div>
              <button
                onClick={() => onSelectContractor(null)}
                className="px-2 py-1 bg-blue-900/60 hover:bg-blue-800 border border-blue-700/60 rounded text-[11px] font-semibold text-blue-200 transition-colors"
              >
                Clear Filter
              </button>
            </div>
          )}

          {/* Section 1: Top Contractors & Concessionaires */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-neutral-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Lead Contractors & Concessionaires
                </span>
              </div>
              <span className="text-[10px] font-mono text-neutral-500">
                Click row to filter map
              </span>
            </div>

            <div className="space-y-1.5">
              {contractorAnalytics.map((c, idx) => {
                const isSelected = selectedContractor === c.name;
                const percentage = Math.round((c.count / totalProjects) * 100);

                return (
                  <div
                    key={c.name}
                    onClick={() => onSelectContractor(isSelected ? null : c.name)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer group ${
                      isSelected
                        ? 'bg-blue-950/40 border-blue-600 shadow-sm'
                        : 'bg-neutral-900/60 hover:bg-neutral-900 border-neutral-800/80 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-[10px] font-mono font-bold text-neutral-500 w-4">
                          #{idx + 1}
                        </span>
                        <span className="font-semibold text-neutral-200 group-hover:text-blue-400 transition-colors truncate text-xs">
                          {c.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-mono font-bold text-neutral-100">
                          {c.count} <span className="text-[10px] font-normal text-neutral-400">proj</span>
                        </span>
                        <ChevronRight className="w-3 h-3 text-neutral-500 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>

                    {/* Progress Bar & CAPEX */}
                    <div className="space-y-1">
                      <div className="w-full bg-neutral-950 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${(c.count / maxContractorCount) * 100}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                        <span>{percentage}% of active projects</span>
                        <span>
                          {c.capex > 0 ? formatBudget(c.capex) : 'Disclosed on tender'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Funding Scheme Breakdown */}
          <div className="space-y-3 pt-3 border-t border-neutral-800">
            <div className="flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-neutral-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Funding Schemes Breakdown
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {schemeAnalytics.map((s) => {
                const pct = totalProjects > 0 ? Math.round((s.count / totalProjects) * 100) : 0;
                return (
                  <div
                    key={s.label}
                    className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800/80 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: s.color }}
                        />
                        <span className="font-semibold text-neutral-200 text-[11px] truncate">
                          {s.label}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-neutral-300">
                        {s.count}
                      </span>
                    </div>

                    <div className="w-full bg-neutral-950 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: s.color }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                      <span>{pct}% share</span>
                      <span>{s.capex > 0 ? formatBudget(s.capex) : 'APBN / Mixed'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary Audit Footer */}
          <div className="p-3 bg-neutral-900/40 border border-neutral-800 rounded-lg space-y-1 text-[11px] text-neutral-400">
            <div className="flex items-center gap-1.5 text-neutral-300 font-semibold">
              <Briefcase className="w-3.5 h-3.5 text-neutral-400" />
              <span>KPPIP & BPJT Concession Registry</span>
            </div>
            <p className="text-[10px] text-neutral-500 leading-relaxed">
              Data aggregated from official National Strategic Projects gazette. Select any contractor above to focus the map and table view on their assigned infrastructure assets.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
