import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface WorkModeToastProps {
  message: string | null;
  icon?: string;
  onClose: () => void;
}

export const WorkModeToast: React.FC<WorkModeToastProps> = ({
  message,
  icon = '🎛️',
  onClose,
}) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[1300] max-w-md w-[92vw] sm:w-auto animate-in fade-in slide-in-from-top-3 duration-200 pointer-events-auto">
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#0f141c]/95 backdrop-blur-md border border-neutral-700 shadow-2xl shadow-black/60 text-xs text-neutral-100">
        <span className="text-base shrink-0">{icon}</span>
        <span className="font-medium leading-relaxed min-w-0">{message}</span>
        <button
          type="button"
          onClick={onClose}
          className="ml-2 p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors shrink-0"
          title="Tutup Notifikasi"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
