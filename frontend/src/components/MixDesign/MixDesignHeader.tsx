import React from 'react';
import { Download, Printer, RotateCcw, FlaskConical } from 'lucide-react';

interface MixDesignHeaderProps {
  onExportCSV: () => void;
  onPrintPDF: () => void;
  onReset: () => void;
}

export const MixDesignHeader: React.FC<MixDesignHeaderProps> = ({
  onExportCSV,
  onPrintPDF,
  onReset,
}) => {
  return (
    <header className="bg-[#0b0f17] border-b border-neutral-800 px-4 sm:px-6 py-2.5 sticky top-0 z-30 flex flex-col md:flex-row md:items-center md:justify-between gap-2.5">
      {/* Brand & Editorial Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
          <FlaskConical className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-sm sm:text-base font-bold text-neutral-100 tracking-tight">
              Coffee Civil — Concrete Mix & Sieve Analysis Lab
            </h1>
            <span className="hidden lg:inline text-[11px] text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40">
              SNI 7656 / ACI 211
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 hidden sm:block">
            Official Civil Engineering QC Suite • Kurva Gradasi Semi-Log & Koreksi Batching Lapangan
          </p>
        </div>
      </div>

      {/* Export & Action Controls */}
      <div className="flex items-center flex-wrap gap-2 justify-end">
        <button
          onClick={onExportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold text-neutral-200 hover:text-white rounded-lg transition"
          title="Download full JMF ticket as CSV spreadsheet"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>Download CSV</span>
        </button>

        <button
          onClick={onPrintPDF}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold text-neutral-200 hover:text-white rounded-lg transition"
          title="Cetak Lembar Uji Laboratorium / Simpan PDF"
        >
          <Printer className="w-3.5 h-3.5 text-blue-400" />
          <span>Print / PDF</span>
        </button>

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold text-neutral-400 hover:text-white rounded-lg transition"
          title="Reset ke parameter default SNI"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>
    </header>
  );
};
