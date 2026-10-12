import React from 'react';
import { TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CostControlPage: React.FC = () => {
  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#0b0f17] text-slate-100 p-6 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
          <TrendingUp className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-neutral-100">Capital Project Cost Intelligence</h2>
        <p className="text-xs text-neutral-400 leading-relaxed">
          EVM (Earned Value Management) & S-Curve Cost Control Engine is reserved for future deployment.
          Looking for Concrete Mix Formula & Sieve Analysis? Visit the Mix Design Lab.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
          <Link
            to="/mix-design"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition shadow-sm"
          >
            🧪 Mix Design Lab
          </Link>
          <Link
            to="/radar"
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 transition"
          >
            🗺️ Construction Radar
          </Link>
        </div>
      </div>
    </div>
  );
};
