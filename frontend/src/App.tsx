import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

// Code-split route modules
const InfrastructureTracker = lazy(() =>
  import('./pages/TrackerPage').then((module) => ({ default: module.TrackerPage }))
);

const MixDesignSimulator = lazy(() =>
  import('./components/MixDesign/MixDesignSimulator').then((module) => ({
    default: module.MixDesignSimulator,
  }))
);

const LoadingFallback: React.FC = () => (
  <div className="w-screen h-screen bg-[#0b0f17] flex flex-col items-center justify-center gap-3 text-slate-300 font-['Plus_Jakarta_Sans',sans-serif]">
    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
    <p className="text-xs font-semibold tracking-wide text-neutral-400">Loading module...</p>
  </div>
);

export const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return (window.location.pathname + window.location.hash).toLowerCase();
    }
    return '/';
  });

  useEffect(() => {
    const updatePath = () => {
      setCurrentPath((window.location.pathname + window.location.hash).toLowerCase());
    };

    window.addEventListener('popstate', updatePath);
    window.addEventListener('hashchange', updatePath);

    return () => {
      window.removeEventListener('popstate', updatePath);
      window.removeEventListener('hashchange', updatePath);
    };
  }, []);

  // 1. Path-Based Check:
  // If window.location.pathname.includes('mix-design') or pathname === '/mix-design' (or /concrete)
  const isMixDesignRoute =
    currentPath.includes('mix-design') ||
    currentPath.includes('/mix-design') ||
    currentPath.includes('concrete');

  if (isMixDesignRoute) {
    // Render ONLY the Concrete Mix Design Lab (Sieve Analysis curve, JMF calculator, Batching scaler)
    return (
      <Suspense fallback={<LoadingFallback />}>
        <div className="w-screen h-screen flex flex-col bg-[#f8fafc] text-slate-900 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
          <MixDesignSimulator />
        </div>
      </Suspense>
    );
  }

  // Otherwise (for '/' or '/tracker'):
  // Render ONLY the Infrastructure Tracker (Map, PSN Index, Batching Plant layers)
  return (
    <Suspense fallback={<LoadingFallback />}>
      <InfrastructureTracker />
    </Suspense>
  );
};
