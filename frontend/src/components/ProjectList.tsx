import React from 'react';
import { ListFilter, X, ChevronRight } from 'lucide-react';
import { ProjectFeature } from '../types/project';
import { CATEGORY_CONFIG, STATUS_CONFIG } from '../constants/categories';
import { formatBudget } from '../utils/formatters';

interface ProjectListProps {
  projects: ProjectFeature[];
  selectedProject: ProjectFeature | null;
  onSelectProject: (project: ProjectFeature) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  selectedProject,
  onSelectProject,
  isOpen,
  onToggleOpen,
}) => {
  return (
    <>
      {/* 1. Toggle Tab Button on Left Edge (visible when sidebar is closed) */}
      {!isOpen && (
        <div className="absolute left-4 top-4 z-[1000]">
          <button
            onClick={onToggleOpen}
            className="bg-[#0f141c] hover:bg-neutral-900 text-neutral-200 hover:text-white border border-neutral-700 shadow-xl rounded-md px-3 py-2 flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer group"
            title="Open Project Index"
          >
            <ListFilter className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
            <span>Project Index</span>
            <span className="bg-neutral-800 text-neutral-300 text-[10px] font-mono px-1.5 py-0.5 rounded border border-neutral-700 tabular-nums">
              {projects.length}
            </span>
          </button>
        </div>
      )}

      {/* 2. Slide-out Sidebar Panel (Solid Opaque, z-[1000] above Leaflet map tiles) */}
      <aside
        className={`fixed sm:absolute left-0 top-0 bottom-0 z-[1000] w-full sm:w-[360px] md:w-[380px] bg-[#0f141c] border-r border-neutral-800 shadow-2xl flex flex-col transform transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        }`}
      >
        {/* Panel Header (Solid Opaque #141a24) */}
        <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between bg-[#141a24] shrink-0">
          <div className="flex items-center gap-2">
            <ListFilter className="w-4 h-4 text-blue-400" />
            <div>
              <h3 className="text-xs font-bold text-neutral-100 uppercase tracking-wider">
                Project Index
              </h3>
              <span className="text-[10px] text-neutral-400 font-mono tabular-nums">
                {projects.length} matching projects
              </span>
            </div>
          </div>

          <button
            onClick={onToggleOpen}
            className="flex items-center gap-1 text-neutral-400 hover:text-white px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 transition-colors text-xs font-medium"
            title="Collapse project list"
          >
            <span>Close</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scrollable list of cards (Solid Opaque #0f141c background) */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-2 bg-[#0f141c]">
          {projects.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-1.5">
              <p className="text-xs font-medium text-neutral-300">No matching projects found</p>
              <p className="text-[11px] text-neutral-500">
                Adjust sector filters or search query above.
              </p>
            </div>
          ) : (
            projects.map((project) => {
              const props = project.properties;
              const categoryConfig = CATEGORY_CONFIG[props.category] || CATEGORY_CONFIG.Transport;
              const statusConfig = STATUS_CONFIG[props.status] || STATUS_CONFIG.Unknown;
              const isSelected = selectedProject?.properties.project_id === props.project_id;
              const isNational =
                props.province === 'Lintas Provinsi' ||
                props.province === 'Nasional' ||
                props.geocode_method === 'national_fallback';

              return (
                <div
                  key={props.project_id}
                  onClick={() => onSelectProject(project)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer text-xs space-y-1.5 ${
                    isSelected
                      ? 'bg-[#182232] border-blue-500 shadow-md ring-1 ring-blue-500/40'
                      : 'bg-[#141a24] border-neutral-800/80 hover:bg-[#1a2332] hover:border-neutral-700'
                  }`}
                >
                  {/* Category & Status Tags */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border"
                        style={{
                          borderColor: `${categoryConfig.color}40`,
                          backgroundColor: `${categoryConfig.color}15`,
                          color: categoryConfig.color,
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: categoryConfig.color }}
                        />
                        {categoryConfig.label}
                      </span>

                      <span
                        className={`text-[9px] font-medium px-1.5 py-0.5 rounded border ${statusConfig.badgeClass}`}
                      >
                        {statusConfig.label}
                      </span>

                      {isNational && (
                        <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                          Corridor
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] text-neutral-400 font-mono tabular-nums truncate max-w-[110px]">
                      {props.province || 'National'}
                    </span>
                  </div>

                  {/* Project Name */}
                  <h4 className="font-semibold text-neutral-100 leading-snug hover:text-blue-400 transition-colors">
                    {props.project_name}
                  </h4>

                  {/* CAPEX & Action link */}
                  <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-neutral-800/60 font-mono tabular-nums">
                    <span className="text-neutral-500 text-[10px] uppercase font-medium">
                      Est. CAPEX
                    </span>
                    <div className="flex items-center gap-1 text-neutral-200">
                      <span className="font-bold">
                        {formatBudget(props.budget_idr, props.budget_raw)}
                      </span>
                      <ChevronRight className="w-3 h-3 text-neutral-500" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
};
