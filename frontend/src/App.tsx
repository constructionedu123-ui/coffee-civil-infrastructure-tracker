import React, { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

// Code-split route modules
const InfrastructureTracker = lazy(() =>
  import('./pages/TrackerPage').then((module) => ({ default: module.TrackerPage }))
);

const LoadingFallback: React.FC = () => (
  <div className="w-screen h-screen bg-[#0b0f17] flex flex-col items-center justify-center gap-3 text-slate-300 font-['Plus_Jakarta_Sans',sans-serif]">
    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
    <p className="text-xs font-semibold tracking-wide text-neutral-400">Loading module...</p>
  </div>
);

export const App: React.FC = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <InfrastructureTracker />
    </Suspense>
  );
};
