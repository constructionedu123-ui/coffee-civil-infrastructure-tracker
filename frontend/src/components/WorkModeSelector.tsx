import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { WorkModeId, WorkModeConfig, WORK_MODES } from '../types/workModes';

interface WorkModeSelectorProps {
  activeModeId: WorkModeId;
  onSelectMode: (mode: WorkModeConfig) => void;
}

export const WorkModeSelector: React.FC<WorkModeSelectorProps> = ({
  activeModeId,
  onSelectMode,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeMode = WORK_MODES.find((m) => m.id === activeModeId) || WORK_MODES[0];

  return (
    <div ref={dropdownRef} className="relative shrink-0 select-none">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold transition-all whitespace-nowrap shadow-sm ${
          activeMode.id !== 'standard'
            ? activeMode.activeBorderClass
            : 'bg-neutral-900/90 text-neutral-200 border-neutral-700 hover:border-neutral-500 hover:text-white'
        }`}
        title="Pilih Mode Kerja Tampilan (Kurasi Layer, Filter & Basemap)"
      >
        <span className="text-sm leading-none">{activeMode.icon}</span>
        <span className="text-[10px] uppercase font-bold text-neutral-400">Mode:</span>
        <span className="font-bold tracking-tight">{activeMode.shortName}</span>
        <ChevronDown
          className={`w-3 h-3 text-neutral-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-neutral-200' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-72 sm:w-80 bg-[#0f141c]/98 backdrop-blur-md border border-neutral-700 shadow-2xl p-2 rounded-xl z-[1300] text-neutral-200 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1.5 border-b border-neutral-800/80 mb-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs">🎛️</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                Mode Kerja / Kurasi Tampilan
              </span>
            </div>
            <span className="text-[9px] font-mono text-neutral-500">1-Click Presets</span>
          </div>

          <div className="space-y-1">
            {WORK_MODES.map((mode) => {
              const isCurrent = mode.id === activeModeId;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => {
                    onSelectMode(mode);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded-lg transition-all flex items-start justify-between gap-2.5 group ${
                    isCurrent
                      ? 'bg-neutral-800/90 border border-neutral-600 shadow-sm'
                      : 'hover:bg-neutral-800/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="text-lg shrink-0 mt-0.5">{mode.icon}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold leading-tight truncate ${
                            isCurrent ? 'text-white' : 'text-neutral-200 group-hover:text-white'
                          }`}
                        >
                          {mode.name}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                            Aktif
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400 line-clamp-2 mt-0.5 leading-snug">
                        {mode.description}
                      </p>
                    </div>
                  </div>

                  {isCurrent && (
                    <Check className="w-4 h-4 text-sky-400 shrink-0 mt-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
