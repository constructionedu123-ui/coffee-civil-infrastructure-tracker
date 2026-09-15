import React from 'react';
import { ChevronRight } from 'lucide-react';
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
    <div
      className={`absolute left-4 top-4 bottom-4 z-20 transition-all duration-200 flex ${
        isOpen ? 'w-80 sm:w-96' : 'w-9'
      }`}
    >
      {/* Container Panel */}
      <div
        className={`w-full h-full bg-neutral-950 border border-neutral-800 rounded-lg shadow-lg flex flex-col overflow-hidden transition-all duration-200 ${
          !isOpen && 'pointer-events-none opacity-0 -translate-x-3'
        }`}
      >
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/90">
          <div>
            <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
              Project Index
            </h3>
            <span className="text-[11px] text-neutral-400 font-mono tabular-nums">
              {projects.length} matching records
            </span>
          </div>
          <button
            onClick={onToggleOpen}
            className="text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors text-xs"
            title="Collapse panel"
          >
            ✕
          </button>
        </div>

        {/* Scrollable list of cards */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {projects.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-1.5">
              <p className="text-xs font-medium text-neutral-300">No matching projects found</p>
              <p className="text-[11px] text-neutral-500">
                Adjust the sector filters or search query.
              </p>
            </div>
          ) : (
            projects.map((project) => {
              const props = project.properties;
              const categoryConfig = CATEGORY_CONFIG[props.category];
              const statusConfig = STATUS_CONFIG[props.status] || STATUS_CONFIG.Unknown;
              const isSelected = selectedProject?.properties.project_id === props.project_id;

              return (
                <div
                  key={props.project_id}
                  onClick={() => onSelectProject(project)}
                  className={`p-2.5 rounded border transition-colors cursor-pointer text-xs space-y-1.5 ${
                    isSelected
                      ? 'bg-neutral-900 border-neutral-500'
                      : 'bg-neutral-900/60 border-neutral-800/80 hover:bg-neutral-900 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: categoryConfig.color }}
                      />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                        {categoryConfig.label}
                      </span>
                      <span className="text-neutral-600">•</span>
                      <span className="text-[10px] text-neutral-400">
                        {statusConfig.label}
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-500 font-mono tabular-nums">
                      {props.province || 'National'}
                    </span>
                  </div>

                  <h4 className="font-semibold text-neutral-100 leading-snug">
                    {props.project_name}
                  </h4>

                  <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-neutral-800/60 font-mono tabular-nums">
                    <span className="truncate text-neutral-500 text-[10px] uppercase">
                      CAPEX
                    </span>
                    <span className="font-bold text-neutral-200">
                      {formatBudget(props.budget_idr, props.budget_raw)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Expand Button when panel is closed */}
      {!isOpen && (
        <button
          onClick={onToggleOpen}
          className="h-9 w-9 bg-neutral-900 border border-neutral-800 rounded-md shadow-md text-neutral-300 hover:text-white flex items-center justify-center transition-colors hover:bg-neutral-800"
          title="Open project index"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

