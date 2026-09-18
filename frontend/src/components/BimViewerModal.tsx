import React, { useState, useEffect } from 'react';
import { ExternalLink, X, Loader2, Box } from 'lucide-react';

interface BimViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  bimUuid?: string | null;
  bimViewerUrl?: string | null;
  unor?: string | null;
  balai?: string | null;
}

export const BimViewerModal: React.FC<BimViewerModalProps> = ({
  isOpen,
  onClose,
  projectName,
  bimUuid,
  bimViewerUrl,
  unor,
  balai,
}) => {
  const [isLoading, setIsLoading] = useState(true);

  // Derive viewer URL
  const viewerUrl = bimViewerUrl || (bimUuid ? `https://bim.pu.go.id/${bimUuid}` : '');

  // Handle escape key exclusively for the modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose]);

  // Reset loading state whenever modal opens or url changes
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
    }
  }, [isOpen, viewerUrl]);

  if (!isOpen || !viewerUrl) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`3D BIM Model Viewer - ${projectName}`}
      className="fixed inset-0 z-[1300] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* Backdrop click to dismiss */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-6xl h-[90vh] flex flex-col bg-[#0f141c] border border-neutral-700/80 rounded-xl shadow-2xl overflow-hidden ring-1 ring-white/10">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-3.5 bg-neutral-900/90 border-b border-neutral-800">
          <div className="flex items-center gap-3 overflow-hidden pr-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 shrink-0">
              <Box className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                  3D BIM Model
                </span>
                {unor && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700 font-mono">
                    {unor}
                  </span>
                )}
                {balai && (
                  <span className="hidden sm:inline text-[10px] font-medium px-2 py-0.5 rounded bg-neutral-800/80 text-neutral-400 border border-neutral-700/60 truncate max-w-[200px]">
                    {balai}
                  </span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white truncate" title={projectName}>
                {projectName}
              </h3>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={viewerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-xs font-medium border border-neutral-700 transition-colors"
              title="Open full page in official Kementerian PU portal"
            >
              <span className="hidden sm:inline">Official Portal</span>
              <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
            </a>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              title="Close 3D Viewer (Esc)"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewer Canvas / iframe */}
        <div className="relative flex-1 w-full h-full bg-neutral-950 overflow-hidden">
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-neutral-950/90 text-neutral-300">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-neutral-200">
                  Loading 3D BIM Model & Digital Assets
                </p>
                <p className="text-xs text-neutral-500">
                  Connecting to Kementerian PU BIM cloud derivative service...
                </p>
              </div>
            </div>
          )}

          {/* Embedded Viewer iframe */}
          <iframe
            src={viewerUrl}
            title={`BIM Model - ${projectName}`}
            className="w-full h-full border-0"
            allow="fullscreen; xr-spatial-tracking"
            onLoad={() => setIsLoading(false)}
          />
        </div>

        {/* Footer info bar */}
        <div className="shrink-0 px-4 py-2 bg-neutral-900/80 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Interactive Autodesk Forge / APS Model Environment</span>
          </div>
          <div className="text-neutral-500 font-mono text-[10px]">
            Source: Kementerian Pekerjaan Umum BIM Center
          </div>
        </div>
      </div>
    </div>
  );
};

export default BimViewerModal;
