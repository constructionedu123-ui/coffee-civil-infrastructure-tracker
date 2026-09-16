import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

// Code-split route pages so Tracker and Mix Simulator load independently
const TrackerPage = lazy(() =>
  import('./pages/TrackerPage').then((module) => ({ default: module.TrackerPage }))
);

const MixDesignPage = lazy(() =>
  import('./pages/MixDesignPage').then((module) => ({ default: module.MixDesignPage }))
);

const RouteLoadingFallback: React.FC = () => (
  <div className="w-screen h-screen bg-[#0b0f17] flex flex-col items-center justify-center gap-3 text-slate-300 font-['Plus_Jakarta_Sans',sans-serif]">
    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    <p className="text-xs font-semibold tracking-wide text-neutral-400">Loading module...</p>
  </div>
);

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          {/* Route / and /tracker: Renders ONLY the Indonesian National Infrastructure Tracker */}
          <Route path="/" element={<TrackerPage />} />
          <Route path="/tracker" element={<TrackerPage />} />

          {/* Route /mix-design and /concrete: Renders ONLY the Concrete Mix Design Simulator */}
          <Route path="/mix-design" element={<MixDesignPage />} />
          <Route path="/concrete" element={<Navigate to="/mix-design" replace />} />

          {/* Fallback unknown routes to Tracker */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};
