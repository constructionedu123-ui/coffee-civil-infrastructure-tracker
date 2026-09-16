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
    <header className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-3 sticky top-0 z-30 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      {/* Brand & Editorial Title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 shrink-0 shadow-sm">
          <FlaskConical className="w-4 h-4 text-slate-700" />
        </div>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Coffee Civil — Concrete Mix & Sieve Analysis Lab
            </h1>
            <span className="hidden sm:inline-flex bg-sky-50 text-sky-700 border border-sky-200/70 font-semibold px-2.5 py-0.5 rounded-full text-[11px]">
              SNI 7656 / ACI 211
            </span>
          </div>
          <p className="text-xs text-slate-500 hidden sm:block mt-0.5">
            Modern Civil Engineering Laboratory Suite • Kurva Gradasi Semi-Log & Koreksi Batching Lapangan
          </p>
        </div>
      </div>

      {/* Export & Action Controls (Built Intelligence Minimalist Style) */}
      <div className="flex items-center flex-wrap gap-2 justify-end">
        <button
          onClick={onExportCSV}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm transition active:scale-[0.98]"
          title="Download full JMF ticket as CSV spreadsheet"
        >
          <Download className="w-3.5 h-3.5 text-slate-300" />
          <span>Download CSV</span>
        </button>

        <button
          onClick={onPrintPDF}
          className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl shadow-sm transition active:scale-[0.98]"
          title="Cetak Lembar Uji Laboratorium / Simpan PDF"
        >
          <Printer className="w-3.5 h-3.5 text-slate-500" />
          <span>Print / PDF</span>
        </button>

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 text-xs font-medium rounded-xl transition"
          title="Reset ke parameter default SNI"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>
    </header>
  );
};
