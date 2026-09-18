import React from 'react';
import { ProjectFeature } from '../types/project';
import { formatBudget } from '../utils/formatters';

interface KPICardsProps {
  projects: ProjectFeature[];
  allProjectsCount: number;
  selectedContractor?: string | null;
}

export const KPICards: React.FC<KPICardsProps> = ({ projects, allProjectsCount, selectedContractor }) => {
  const totalCount = projects.length;

  const totalInvestment = projects.reduce((sum, p) => {
    return sum + (p.properties.budget_idr || 0);
  }, 0);

  const constructionCount = projects.filter(
    (p) => p.properties.status === 'Construction'
  ).length;

  const operationalCount = projects.filter(
    (p) => p.properties.status === 'Operational' || p.properties.status === 'Completed'
  ).length;

  const disclosedCount = projects.filter((p) => p.properties.budget_idr !== null).length;

  const stats = [
    {
      label: selectedContractor ? `${selectedContractor}` : 'Total Projects',
      value: totalCount.toString(),
      subtext: selectedContractor ? `Projects in portfolio` : totalCount === allProjectsCount ? 'Full PSN catalog' : `Filtered of ${allProjectsCount}`,
    },
    {
      label: selectedContractor ? `${selectedContractor} CAPEX` : 'Estimated CAPEX',
      value: formatBudget(totalInvestment),
      subtext: `${disclosedCount} projects disclosed`,
    },
    {
      label: 'Under Construction',
      value: constructionCount.toString(),
      subtext: `${totalCount > 0 ? Math.round((constructionCount / totalCount) * 100) : 0}% of active scope`,
    },
    {
      label: 'Operational / Done',
      value: operationalCount.toString(),
      subtext: `${totalCount > 0 ? Math.round((operationalCount / totalCount) * 100) : 0}% completion`,
    },
  ];

  return (
    <div className="bg-[#0c1019] border-b border-neutral-800/80 px-4 sm:px-6 py-2">
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-neutral-800/80">
        {stats.map((item, idx) => (
          <div
            key={idx}
            className={`flex items-baseline justify-between sm:justify-start sm:flex-col gap-1 ${
              idx === 0 ? 'sm:pr-4' : idx === stats.length - 1 ? 'sm:pl-4' : 'sm:px-4'
            } ${idx >= 2 ? 'pt-1.5 md:pt-0' : ''}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-neutral-400">
                {item.label}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm sm:text-base font-bold text-neutral-100 font-mono tabular-nums tracking-tight">
                {item.value}
              </span>
              <span className="text-[11px] text-neutral-400 truncate hidden sm:inline">
                • {item.subtext}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

