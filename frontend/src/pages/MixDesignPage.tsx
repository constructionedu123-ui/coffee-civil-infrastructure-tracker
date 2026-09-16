import React from 'react';
import { MixDesignSimulator } from '../components/MixDesign/MixDesignSimulator';

export const MixDesignPage: React.FC = () => {
  return (
    <div className="w-screen h-screen flex flex-col bg-[#f8fafc] text-slate-900 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      <MixDesignSimulator />
    </div>
  );
};
