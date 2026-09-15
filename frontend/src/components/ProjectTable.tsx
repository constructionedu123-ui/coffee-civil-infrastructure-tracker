import React, { useState, useMemo } from 'react';
import { ProjectFeature } from '../types/project';
import { CATEGORY_CONFIG, STATUS_CONFIG } from '../constants/categories';
import { formatBudget } from '../utils/formatters';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

interface ProjectTableProps {
  projects: ProjectFeature[];
  selectedProject: ProjectFeature | null;
  onSelectProject: (project: ProjectFeature) => void;
}

type SortField = 'name' | 'province' | 'capex';
type SortDirection = 'asc' | 'desc';

export const ProjectTable: React.FC<ProjectTableProps> = ({
  projects,
  selectedProject,
  onSelectProject,
}) => {
  const [sortField, setSortField] = useState<SortField>('capex');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'capex' ? 'desc' : 'asc');
    }
    setCurrentPage(1);
  };

  // Sort projects
  const sortedProjects = useMemo(() => {
    const list = [...projects];
    list.sort((a, b) => {
      const pA = a.properties;
      const pB = b.properties;

      if (sortField === 'name') {
        const comp = pA.project_name.localeCompare(pB.project_name, 'id');
        return sortDirection === 'asc' ? comp : -comp;
      }

      if (sortField === 'province') {
        const provA = pA.province || 'ZZZ';
        const provB = pB.province || 'ZZZ';
        const comp = provA.localeCompare(provB, 'id');
        return sortDirection === 'asc' ? comp : -comp;
      }

      if (sortField === 'capex') {
        const capexA = pA.budget_idr || 0;
        const capexB = pB.budget_idr || 0;
        return sortDirection === 'asc' ? capexA - capexB : capexB - capexA;
      }

      return 0;
    });
    return list;
  }, [projects, sortField, sortDirection]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(sortedProjects.length / pageSize));
  const validPage = Math.min(currentPage, totalPages);

  const paginatedProjects = useMemo(() => {
    const start = (validPage - 1) * pageSize;
    return sortedProjects.slice(start, start + pageSize);
  }, [sortedProjects, validPage, pageSize]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-neutral-500 opacity-60 ml-1 inline" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-blue-400 ml-1 inline" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-400 ml-1 inline" />
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-hidden">
      {/* Table Container */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse border-b border-neutral-800">
          <thead className="sticky top-0 z-10 bg-neutral-900 border-b border-neutral-800 text-[10px] font-bold uppercase tracking-wider text-neutral-400 select-none">
            <tr>
              <th
                onClick={() => handleSort('name')}
                className="py-3 px-4 sm:px-6 cursor-pointer hover:text-white transition-colors"
              >
                <span>Project Name & Sector</span>
                {renderSortIcon('name')}
              </th>
              <th className="py-3 px-3 sm:px-4">
                <span>Status</span>
              </th>
              <th
                onClick={() => handleSort('province')}
                className="py-3 px-3 sm:px-4 cursor-pointer hover:text-white transition-colors"
              >
                <span>Location</span>
                {renderSortIcon('province')}
              </th>
              <th
                onClick={() => handleSort('capex')}
                className="py-3 px-3 sm:px-4 text-right cursor-pointer hover:text-white transition-colors"
              >
                <span>CAPEX (IDR Trillion)</span>
                {renderSortIcon('capex')}
              </th>
              <th className="py-3 px-3 sm:px-4 text-center">
                <span>Source</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/70 text-xs">
            {paginatedProjects.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-neutral-500">
                  No infrastructure projects match the current filter criteria.
                </td>
              </tr>
            ) : (
              paginatedProjects.map((item) => {
                const props = item.properties;
                const isSelected = selectedProject?.properties.project_id === props.project_id;
                const catCfg = CATEGORY_CONFIG[props.category] || CATEGORY_CONFIG.Transport;
                const statusCfg = STATUS_CONFIG[props.status] || STATUS_CONFIG.Unknown;
                const isNational =
                  props.province === 'Lintas Provinsi' ||
                  props.province === 'Nasional' ||
                  props.geocode_method === 'national_fallback';

                return (
                  <tr
                    key={props.project_id}
                    onClick={() => onSelectProject(item)}
                    className={`cursor-pointer transition-colors group ${
                      isSelected
                        ? 'bg-neutral-900/90 border-l-2 border-l-blue-500'
                        : 'hover:bg-neutral-900/50'
                    }`}
                  >
                    {/* Project Name & Category Badge */}
                    <td className="py-3 px-4 sm:px-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border"
                            style={{
                              borderColor: `${catCfg.color}40`,
                              backgroundColor: `${catCfg.color}15`,
                              color: catCfg.color,
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: catCfg.color }}
                            />
                            {catCfg.label}
                          </span>

                          {isNational && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                              Corridor
                            </span>
                          )}
                        </div>

                        <div className="font-semibold text-neutral-100 group-hover:text-blue-400 transition-colors line-clamp-2">
                          {props.project_name}
                        </div>

                        {props.contractor && (
                          <div className="text-[10px] text-neutral-500 truncate max-w-md">
                            {props.contractor}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded border ${statusCfg.badgeClass}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                        {statusCfg.label}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <div className="font-medium text-neutral-200">
                          {props.province || 'Lintas Provinsi'}
                        </div>
                        {props.regency && (
                          <div className="text-[10px] text-neutral-500">
                            {props.regency}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* CAPEX */}
                    <td className="py-3 px-3 sm:px-4 text-right whitespace-nowrap font-mono tabular-nums">
                      <span className="font-bold text-neutral-100">
                        {formatBudget(props.budget_idr, props.budget_raw)}
                      </span>
                    </td>

                    {/* Source Link */}
                    <td
                      className="py-3 px-3 sm:px-4 text-center whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a
                        href={props.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open Official Project Source"
                        className="inline-flex items-center justify-center p-1.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Pagination & Stats Footer */}
      <div className="bg-neutral-900 border-t border-neutral-800 px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 text-xs text-neutral-400">
        <div className="flex items-center gap-3">
          <span>
            Showing{' '}
            <span className="font-semibold text-neutral-200 font-mono">
              {sortedProjects.length === 0
                ? 0
                : (validPage - 1) * pageSize + 1}
            </span>
            –
            <span className="font-semibold text-neutral-200 font-mono">
              {Math.min(validPage * pageSize, sortedProjects.length)}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-neutral-200 font-mono">
              {sortedProjects.length}
            </span>{' '}
            projects
          </span>

          {/* Rows per page selector */}
          <div className="flex items-center gap-1.5 pl-3 border-l border-neutral-800">
            <span className="text-[11px] text-neutral-500">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-neutral-950 border border-neutral-800 rounded px-1.5 py-0.5 text-xs text-neutral-300 focus:outline-none focus:border-neutral-700"
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Page Nav Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={validPage <= 1}
            className="p-1 rounded bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
            title="First Page"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={validPage <= 1}
            className="p-1 rounded bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
            title="Previous Page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <span className="px-2.5 py-0.5 text-xs font-mono tabular-nums text-neutral-300">
            Page {validPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={validPage >= totalPages}
            className="p-1 rounded bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
            title="Next Page"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={validPage >= totalPages}
            className="p-1 rounded bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
            title="Last Page"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
