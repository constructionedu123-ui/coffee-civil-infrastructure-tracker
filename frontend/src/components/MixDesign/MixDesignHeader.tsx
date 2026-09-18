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
    <header className="bg-[#0f141c] border-b border-slate-800/80 px-4 sm:px-6 py-3 sticky top-0 z-30 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-md print:bg-white print:static print:px-0 print:py-2 print:border-b-2 print:border-slate-800 print:shadow-none">
      {/* Brand & Editorial Title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-sky-400 shrink-0 shadow-inner print:hidden">
          <FlaskConical className="w-4 h-4 text-sky-400" />
        </div>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-sm sm:text-base font-bold text-slate-100 tracking-tight print:text-lg print:text-slate-900">
              Coffee Civil — Concrete Mix & Sieve Analysis Lab
            </h1>
            <span className="hidden sm:inline-flex bg-sky-950/60 text-sky-400 border border-sky-800/60 font-medium px-2.5 py-0.5 rounded-full text-[11px] print:inline-flex print:bg-sky-50 print:text-sky-700 print:border-sky-200">
              SNI 7656 / ACI 211
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block mt-0.5 print:block print:text-[11px] print:text-slate-600">
            Laporan Analisis Campuran Beton & Gradasi Butiran Agregat • Job Mix Formula (JMF) & Batching Truk
          </p>
        </div>
      </div>

      {/* Export & Action Controls (Hidden in Print) */}
      <div className="flex items-center flex-wrap gap-2 justify-end print:hidden">
        <button
          onClick={onExportCSV}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-white text-slate-900 text-xs font-semibold rounded-xl shadow-md transition active:scale-[0.98]"
          title="Download full JMF ticket as CSV spreadsheet"
        >
          <Download className="w-3.5 h-3.5 text-slate-700" />
          <span>Download CSV</span>
        </button>

        <button
          onClick={onPrintPDF}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl shadow-sm transition active:scale-[0.98]"
          title="Cetak Lembar Uji Laboratorium / Simpan PDF"
        >
          <Printer className="w-3.5 h-3.5 text-slate-400" />
          <span>Print / PDF</span>
        </button>

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 text-xs font-medium rounded-xl transition"
          title="Reset ke parameter default SNI"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Print-only Document Metadata */}
      <div className="hidden print:flex flex-col items-end text-right">
        <span className="text-[10px] font-bold tracking-wider text-slate-800 border border-slate-700 px-2 py-0.5 rounded">
          OFFICIAL LAB REPORT / JMF BATCH SHEET
        </span>
        <span className="text-[9px] text-slate-500 font-mono mt-1">
          Tanggal: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>
    </header>
  );
};
