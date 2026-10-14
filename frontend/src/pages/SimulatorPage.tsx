import React, { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

const ConstructionSandbox = lazy(() =>
  import('../components/ConstructionSandbox/ConstructionSandbox').then((m) => ({
    default: m.ConstructionSandbox,
  }))
);

export const SimulatorPage: React.FC = () => {
  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden bg-[#0a0f1d] text-slate-100 font-sans">
      <Suspense
        fallback={
          <div className="w-full h-full bg-[#0a0f1d] flex flex-col items-center justify-center gap-3 text-slate-300">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            <span className="text-xs font-semibold tracking-wide text-neutral-400">
              Loading Coffee Civil 4D Construction Simulation & Site Logistics Command Center...
            </span>
          </div>
        }
      >
        <ConstructionSandbox />
      </Suspense>
    </div>
  );
};
