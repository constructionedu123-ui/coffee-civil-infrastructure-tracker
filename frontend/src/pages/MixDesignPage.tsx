import React from 'react';
import { MixDesignSimulator } from '../components/MixDesign/MixDesignSimulator';

export const MixDesignPage: React.FC = () => {
  return (
    <div className="w-screen h-screen flex flex-col bg-[#0b0f17] text-slate-100 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif] print:w-auto print:h-auto print:overflow-visible print:bg-white print-reset-container">
      <MixDesignSimulator />
    </div>
  );
};
