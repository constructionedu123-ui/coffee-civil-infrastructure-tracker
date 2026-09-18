import React, { useState, useEffect } from 'react';
import {
  X,
  PlusCircle,
  CheckCircle2,
} from 'lucide-react';
import { ProjectFeature, ProjectCategory, ProjectStatus } from '../types/project';
import { INDONESIA_REGIONS } from '../utils/geo';

interface SubmitProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectSubmitted: (newProject: ProjectFeature) => void;
}

// Representative coordinate centroids for provinces & major construction hubs
const CITY_COORDS: Record<string, [number, number]> = {
  Batam: [104.0305, 1.1301],
  'DKI Jakarta': [106.8272, -6.1818],
  'Jawa Barat': [107.6098, -6.9175],
  'Jawa Tengah': [110.4203, -6.9932],
  'Jawa Timur': [112.7508, -7.2575],
  'Banten': [106.1503, -6.1200],
  'Sumatera Utara': [98.6722, 3.5952],
  'Sumatera Selatan': [104.7565, -2.9761],
  'Riau': [101.4478, 0.5071],
  'Kepulauan Riau': [104.0305, 1.1301],
  'Kalimantan Timur': [116.8312, -1.2420],
  'Sulawesi Selatan': [119.4327, -5.1477],
  'Bali': [115.2167, -8.6500],
};

const POPULAR_CONTRACTORS = [
  'PT PP (Persero) Tbk',
  'PT Wijaya Karya (WIKA)',
  'PT Adhi Karya (Persero) Tbk',
  'PT Waskita Karya (Persero) Tbk',
  'PT Brantas Abipraya',
  'PT Nindya Karya',
  'PT Total Bangun Persada Tbk',
  'PT Jaya Konstruksi MP Tbk',
  'PT Nusa Raya Cipta Tbk',
  'PT Acset Indonusa Tbk',
];

export const SubmitProjectModal: React.FC<SubmitProjectModalProps> = ({
  isOpen,
  onClose,
  onProjectSubmitted,
}) => {
  const [projectName, setProjectName] = useState('');
  const [category, setCategory] = useState<ProjectCategory>('Commercial & Private');
  const [fundingScheme, setFundingScheme] = useState('Swasta Murni (Private)');
  const [contractor, setContractor] = useState('');
  const [client, setClient] = useState('');
  const [province, setProvince] = useState('Kepulauan Riau');
  const [regency, setRegency] = useState('Kota Batam');
  const [status, setStatus] = useState<ProjectStatus>('Construction');
  const [budgetRaw, setBudgetRaw] = useState('');
  const [submitterRole, setSubmitterRole] = useState('');
  const [customLat, setCustomLat] = useState<string>('1.1301');
  const [customLon, setCustomLon] = useState<string>('104.0305');
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedFeature, setSubmittedFeature] = useState<ProjectFeature | null>(null);

  // Update default coordinates when province changes
  useEffect(() => {
    const coords = CITY_COORDS[province] || [106.8272, -6.1818];
    setCustomLon(coords[0].toFixed(4));
    setCustomLat(coords[1].toFixed(4));
  }, [province]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !contractor.trim()) return;

    const lon = parseFloat(customLon) || 106.8272;
    const lat = parseFloat(customLat) || -6.1818;

    // Parse rough budget in Trillions if input provided (e.g. 185 Miliar -> 0.185 T)
    let budgetIdr: number | null = null;
    const cleanBudget = budgetRaw.toLowerCase();
    const numMatch = cleanBudget.match(/[\d.,]+/);
    if (numMatch) {
      let val = parseFloat(numMatch[0].replace(/\./g, '').replace(',', '.'));
      if (cleanBudget.includes('miliar') || cleanBudget.includes('milyar')) {
        budgetIdr = Math.round((val / 1000) * 1000) / 1000;
      } else if (cleanBudget.includes('triliun') || cleanBudget.includes('t')) {
        budgetIdr = val;
      } else if (val > 1000000000) {
        budgetIdr = Math.round((val / 1000000000000) * 1000) / 1000;
      }
    }

    const newFeature: ProjectFeature = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lon, lat],
      },
      properties: {
        project_id: `user-report-${Date.now()}`,
        project_name: projectName.trim(),
        category,
        status,
        budget_idr: budgetIdr,
        budget_raw: budgetRaw.trim() || null,
        funding_scheme: fundingScheme,
        pjpk: client.trim() || 'Sektor Swasta / Komersial',
        unor: submitterRole.trim()
          ? `Laporan: ${submitterRole.trim()}`
          : 'Laporan Komunitas Sipil',
        contractor: contractor.trim(),
        province,
        regency: regency.trim() || province,
        geocode_method: 'exact_kabupaten',
        source_url: '#community-submission',
        source_name: 'Laporan Komunitas / Kontrak Swasta',
        scraped_at: new Date().toISOString(),
      },
    };

    // Save to browser localStorage
    try {
      const STORAGE_KEY = 'coffee_civil_user_projects';
      const existingRaw = localStorage.getItem(STORAGE_KEY);
      const existingList = existingRaw ? JSON.parse(existingRaw) : [];
      existingList.push(newFeature);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existingList));
    } catch (err) {
      console.warn('Could not save to localStorage:', err);
    }

    setSubmittedFeature(newFeature);
    setIsSuccess(true);
  };

  const handleFinish = () => {
    if (submittedFeature) {
      onProjectSubmitted(submittedFeature);
    }
    onClose();
    setIsSuccess(false);
    setProjectName('');
    setContractor('');
    setClient('');
    setBudgetRaw('');
  };

  return (
    <div className="fixed inset-0 z-[1300] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="bg-[#0f141c] border border-neutral-800 rounded-xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Sticky Modal Header */}
        <div className="px-5 py-4 border-b border-neutral-800 bg-neutral-900/90 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-violet-500/20 border border-violet-500/30 text-violet-400">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-neutral-100 tracking-tight flex items-center gap-2">
                Laporkan Proyek Baru / Swasta
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-violet-950/80 text-violet-300 border border-violet-700/50">
                  Community Submission
                </span>
              </h2>
              <p className="text-[11px] text-neutral-400">
                Bantu catat proyek gedung swasta, menara perbankan, & data center
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors shrink-0"
            title="Tutup (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        {isSuccess ? (
          <div className="p-6 sm:p-8 flex flex-col items-center text-center space-y-4 my-auto">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full animate-in zoom-in-75 duration-200">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-white">
                Laporan Proyek Berhasil Dicatat!
              </h3>
              <p className="text-xs text-neutral-400 max-w-md">
                Terima kasih atas kontribusi Anda! Proyek{' '}
                <span className="font-semibold text-neutral-200 font-mono">
                  "{projectName}"
                </span>{' '}
                telah ditambahkan secara instan ke visualisasi peta dan tabel Anda.
              </p>
            </div>

            <div className="bg-neutral-900/80 border border-neutral-800 rounded-lg p-3 w-full max-w-md text-left text-[11px] space-y-1 font-mono">
              <div className="flex justify-between text-neutral-400">
                <span>Kontraktor:</span>
                <span className="text-neutral-200 font-semibold">{contractor}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Lokasi:</span>
                <span className="text-neutral-200">{regency}, {province}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Skema:</span>
                <span className="text-violet-300 font-semibold">{fundingScheme}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleFinish}
              className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-violet-600/30 transition-colors flex items-center gap-2"
            >
              <span>🗺️ Lihat Proyek di Peta</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            {/* Field 1: Nama Proyek */}
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-neutral-300">
                Nama Proyek <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Contoh: Pembangunan Gedung Perbankan Batam / Menara BCA Surabaya"
                className="w-full bg-neutral-900 border border-neutral-800 focus:border-violet-500 rounded-md px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Field 2 & 3: Sektor & Sumber Dana */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-neutral-300">
                  Sektor / Kategori <span className="text-rose-400">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ProjectCategory)}
                  className="w-full bg-neutral-900 border border-neutral-800 focus:border-violet-500 rounded-md px-3 py-2 text-xs text-neutral-100 focus:outline-none cursor-pointer"
                >
                  <option value="Commercial & Private">🏢 Commercial & Private (Gedung Swasta/Data Center)</option>
                  <option value="Transport">🚗 Transport (Jalan, Jembatan, Tol Swasta)</option>
                  <option value="Water">💧 Water & Sanitation (WTP, IPAL, Fasilitas Air)</option>
                  <option value="Energy">⚡ Energy (Pembangkit Listrik Swasta/IPP, Gas)</option>
                  <option value="Housing">🏠 Housing (Apartemen, Rusun, Komersial)</option>
                  <option value="IKN">🏛️ IKN Nusantara</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-neutral-300">
                  Sumber Dana / Skema <span className="text-rose-400">*</span>
                </label>
                <select
                  value={fundingScheme}
                  onChange={(e) => setFundingScheme(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 focus:border-violet-500 rounded-md px-3 py-2 text-xs text-neutral-100 focus:outline-none cursor-pointer"
                >
                  <option value="Swasta Murni (Private)">Swasta Murni (Private Investment)</option>
                  <option value="Penugasan BUMN">Penugasan BUMN (Corporate Finance)</option>
                  <option value="KPBU / PPP">KPBU / PPP (Kerjasama Pemerintah-Badan Usaha)</option>
                  <option value="APBN (State Budget)">APBN / Anggaran Negara</option>
                </select>
              </div>
            </div>

            {/* Field 4: Kontraktor Pelaksana */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-semibold text-neutral-300">
                  Kontraktor Pelaksana <span className="text-rose-400">*</span>
                </label>
                <span className="text-[10px] text-neutral-500">Pilih cepat atau ketik</span>
              </div>
              <input
                type="text"
                required
                value={contractor}
                onChange={(e) => setContractor(e.target.value)}
                placeholder="Contoh: PT PP (Persero) Tbk / Total Bangun Persada"
                className="w-full bg-neutral-900 border border-neutral-800 focus:border-violet-500 rounded-md px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none transition-colors"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {POPULAR_CONTRACTORS.slice(0, 5).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setContractor(c)}
                    className="text-[10px] px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800 transition-colors"
                  >
                    + {c.replace(' (Persero) Tbk', '')}
                  </button>
                ))}
              </div>
            </div>

            {/* Field 5: Pemilik / Klien / Investor */}
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-neutral-300">
                Pemilik Proyek / Klien (Owner / PJPK)
              </label>
              <input
                type="text"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="Contoh: PT Bank Mandiri (Persero) Tbk / PT Telkom Data Ekosistem"
                className="w-full bg-neutral-900 border border-neutral-800 focus:border-violet-500 rounded-md px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Field 6: Lokasi (Provinsi, Kota, Koordinat) */}
            <div className="space-y-2 pt-1 border-t border-neutral-800/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                Lokasi & Titik Koordinat
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] text-neutral-400">Provinsi</label>
                  <select
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-violet-500 rounded-md px-3 py-2 text-xs text-neutral-100 focus:outline-none cursor-pointer"
                  >
                    <option value="Kepulauan Riau">Kepulauan Riau (Batam / Bintan)</option>
                    <option value="DKI Jakarta">DKI Jakarta</option>
                    <option value="Jawa Barat">Jawa Barat (Bandung, Bekasi, Bogor)</option>
                    <option value="Jawa Tengah">Jawa Tengah (Semarang, Solo)</option>
                    <option value="Jawa Timur">Jawa Timur (Surabaya, Malang)</option>
                    <option value="Banten">Banten (Tangerang, Cilegon)</option>
                    <option value="Kalimantan Timur">Kalimantan Timur (Balikpapan, IKN)</option>
                    <option value="Sumatera Utara">Sumatera Utara (Medan)</option>
                    <option value="Sulawesi Selatan">Sulawesi Selatan (Makassar)</option>
                    <option value="Bali">Bali (Denpasar, Badung)</option>
                    {INDONESIA_REGIONS.map((r) => (
                      <option key={r.name} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-neutral-400">Kota / Kabupaten</label>
                  <input
                    type="text"
                    value={regency}
                    onChange={(e) => setRegency(e.target.value)}
                    placeholder="Contoh: Kota Batam / Jakarta Pusat"
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-violet-500 rounded-md px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Coordinates Preview / Adjustment */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="block text-[10px] text-neutral-500 font-mono">
                    Latitude (Lat)
                  </label>
                  <input
                    type="text"
                    value={customLat}
                    onChange={(e) => setCustomLat(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1 text-xs text-neutral-300 font-mono focus:outline-none focus:border-neutral-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] text-neutral-500 font-mono">
                    Longitude (Lon)
                  </label>
                  <input
                    type="text"
                    value={customLon}
                    onChange={(e) => setCustomLon(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1 text-xs text-neutral-300 font-mono focus:outline-none focus:border-neutral-700"
                  />
                </div>
              </div>
            </div>

            {/* Field 7: Status & Budget */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-neutral-800/80">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-neutral-300">
                  Status Pelaksanaan
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                  className="w-full bg-neutral-900 border border-neutral-800 focus:border-violet-500 rounded-md px-3 py-2 text-xs text-neutral-100 focus:outline-none cursor-pointer"
                >
                  <option value="Tender & Transaksi">Tender & Transaksi (Lelang / Pengadaan)</option>
                  <option value="Construction">Under Construction (Sedang Konstruksi)</option>
                  <option value="Planning">Planning & Prep (Perencanaan & Studi)</option>
                  <option value="Operational">Operational (Beroperasi)</option>
                  <option value="Completed">Completed (Selesai Konstruksi)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-neutral-300">
                  Estimasi Nilai Kontrak (Opsional)
                </label>
                <input
                  type="text"
                  value={budgetRaw}
                  onChange={(e) => setBudgetRaw(e.target.value)}
                  placeholder="Contoh: Rp 185 Miliar / Rp 1,2 Triliun"
                  className="w-full bg-neutral-900 border border-neutral-800 focus:border-violet-500 rounded-md px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Field 8: Pengirim (Opsional) */}
            <div className="space-y-1 pt-1 border-t border-neutral-800/80">
              <label className="block text-[11px] text-neutral-400">
                Nama / Peran Pengirim (Opsional)
              </label>
              <input
                type="text"
                value={submitterRole}
                onChange={(e) => setSubmitterRole(e.target.value)}
                placeholder="Contoh: Site Engineer PT PP / Pengawas Lapangan / Alumnus Sipil"
                className="w-full bg-neutral-900 border border-neutral-800 focus:border-violet-500 rounded-md px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-800 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/30 transition-all flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Kirim Laporan Proyek</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
