import React, { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

const MixDesignSimulator = lazy(() =>
  import('../components/MixDesign/MixDesignSimulator').then((m) => ({
    default: m.MixDesignSimulator,
  }))
);

export const MixDesignPage: React.FC = () => {
  return (
    <div className="w-screen h-screen flex flex-col bg-[#0b0f17] text-slate-100 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif] print:w-auto print:h-auto print:overflow-visible print:bg-white print-reset-container">
      <Suspense
        fallback={
          <div className="w-full h-full bg-[#0b0f17] flex flex-col items-center justify-center gap-3 text-slate-300">
            <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
            <span className="text-xs font-semibold tracking-wide text-neutral-400">
              Memuat Concrete Mix & Sieve Analysis Lab...
            </span>
          </div>
        }
      >
        <MixDesignSimulator />
      </Suspense>
    </div>
  );
};
