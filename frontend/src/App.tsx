import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

// Code-split route modules
const InfrastructureTracker = lazy(() =>
  import('./pages/TrackerPage').then((module) => ({ default: module.TrackerPage }))
);

const SimulatorPage = lazy(() =>
  import('./pages/SimulatorPage').then((module) => ({ default: module.SimulatorPage }))
);

const MixDesignPage = lazy(() =>
  import('./pages/MixDesignPage').then((module) => ({ default: module.MixDesignPage }))
);

const CostControlPage = lazy(() =>
  import('./pages/CostControlPage').then((module) => ({ default: module.CostControlPage }))
);

const LoadingFallback: React.FC = () => (
  <div className="w-screen h-screen bg-[#0b0f17] flex flex-col items-center justify-center gap-3 text-slate-300 font-['Plus_Jakarta_Sans',sans-serif]">
    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
    <p className="text-xs font-semibold tracking-wide text-neutral-400">Loading module...</p>
  </div>
);

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Standalone 4D Construction Phasing & Site Logistics Simulator (Default) */}
          <Route path="/" element={<SimulatorPage />} />
          <Route path="/4d-simulator" element={<SimulatorPage />} />
          <Route path="/simulator" element={<SimulatorPage />} />

          {/* National Infrastructure Radar */}
          <Route path="/radar" element={<InfrastructureTracker />} />

          {/* Concrete Mix & Sieve Analysis Lab */}
          <Route path="/mix-design" element={<MixDesignPage />} />

          {/* Cost Control / S-Curve */}
          <Route path="/cost-control" element={<CostControlPage />} />

          {/* Legacy / Convenience Redirects */}
          <Route path="/concrete" element={<Navigate to="/mix-design" replace />} />

          {/* Wildcard Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};
