import React, { useMemo } from 'react';
import { ProjectFeature, getProjectCoordinates } from '../types/project';
import { BatchingPlantFeature } from '../types/batchingPlant';
import { FaultLineFeature } from '../types/faultLine';
import { MaterialHubFeature } from '../types/materialHub';
import { findNearestBatchingPlants, findNearestMaterialHubs } from '../utils/logistics';
import { findNearestFaultLine } from '../utils/seismic';
import { getProjectRainfallAnalysis } from '../utils/rainfallData';
import { formatBudget } from '../utils/formatters';
import { getProjectContractors, getPrimaryContractor } from '../utils/contractorMatcher';

export interface ProjectPrintDossierProps {
  project: ProjectFeature | null;
  batchingPlants?: BatchingPlantFeature[];
  faultLines?: FaultLineFeature[];
  materialHubs?: MaterialHubFeature[];
}

export const ProjectPrintDossier: React.FC<ProjectPrintDossierProps> = ({
  project,
  batchingPlants = [],
  faultLines = [],
  materialHubs = [],
}) => {
  if (!project) return null;

  const props = project.properties;
  const coords = getProjectCoordinates(project.geometry);
  const [lon, lat] = coords;

  // Proximity calculations
  const nearestPlant = useMemo(() => {
    if (!batchingPlants.length) return null;
    return findNearestBatchingPlants(lat, lon, batchingPlants, 1)[0] || null;
  }, [lat, lon, batchingPlants]);

  const nearestFault = useMemo(() => {
    if (!faultLines.length) return null;
    return findNearestFaultLine(lat, lon, faultLines);
  }, [lat, lon, faultLines]);

  const nearestQuarry = useMemo(() => {
    if (!materialHubs.length) return null;
    return findNearestMaterialHubs(lat, lon, materialHubs, 'Quarry (Pasir & Agregat)', 1)[0] || null;
  }, [lat, lon, materialHubs]);

  const nearestCement = useMemo(() => {
    if (!materialHubs.length) return null;
    return findNearestMaterialHubs(lat, lon, materialHubs, 'Pabrik Semen Terpadu', 1)[0] || null;
  }, [lat, lon, materialHubs]);

  const nearestSteel = useMemo(() => {
    if (!materialHubs.length) return null;
    return findNearestMaterialHubs(lat, lon, materialHubs, 'Baja Konstruksi (Steel Mills)', 1)[0] || null;
  }, [lat, lon, materialHubs]);

  const rainfall = useMemo(() => {
    return getProjectRainfallAnalysis(props.province, props.regency, props.project_name);
  }, [props.province, props.regency, props.project_name]);

  const allContractors = useMemo(() => {
    return getProjectContractors(props);
  }, [props]);

  const primaryContractor = useMemo(() => {
    return getPrimaryContractor(props);
  }, [props]);

  const printDate = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const projectId = props.project_id || props.project_name;
  const deepLink = `https://coffeecivil.com/tracker/?project=${encodeURIComponent(projectId)}`;
  const formattedInvestment = formatBudget(props.budget_idr, props.budget_raw);

  return (
    <div
      id="project-print-dossier"
      className="hidden print:block bg-white text-slate-900 font-sans p-6 max-w-[210mm] mx-auto text-xs leading-normal"
    >
      {/* ── HEADER ── */}
      <div className="border-b-2 border-slate-900 pb-3 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">☕</span>
              <h1 className="text-base font-black tracking-tight text-slate-900 uppercase">
                COFFEE CIVIL — LEMBAR INTELIJEN & INFORMASI PROYEK
              </h1>
            </div>
            <p className="text-[11px] text-slate-600 font-medium mt-0.5">
              Katalog Infrastruktur Nasional, Sektor Swasta & Analisis Geospasial Multi-Dimensi
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block px-2 py-0.5 rounded bg-slate-900 text-white font-mono font-bold text-[9px] uppercase tracking-wider">
              Dokumen Resmi A4
            </span>
            <div className="text-[10px] text-slate-500 font-mono mt-1">
              Tanggal Cetak: <strong className="text-slate-700">{printDate}</strong>
            </div>
            <div className="text-[9px] text-slate-400 font-mono truncate max-w-[150px]">
              ID: {props.project_id || 'ID-' + Math.abs(Math.round(lat * 1000 + lon * 1000))}
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 1: IDENTITAS & PIHAK TERKAIT ── */}
      <div className="mb-4">
        <h2 className="text-[10px] font-black uppercase tracking-wider text-slate-700 border-b border-slate-300 pb-1 mb-2">
          1. Identitas Proyek & Struktur Kepemilikan
        </h2>
        <table className="w-full border-collapse border border-slate-300 text-[11px]">
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="w-1/4 bg-slate-100 font-bold p-1.5 text-slate-700 border-r border-slate-300">
                Nama Proyek
              </td>
              <td className="w-3/4 p-1.5 font-bold text-slate-900 text-xs" colSpan={3}>
                {props.project_name}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="w-1/4 bg-slate-100 font-semibold p-1.5 text-slate-700 border-r border-slate-300">
                Sektor / Klaster
              </td>
              <td className="w-1/4 p-1.5 font-medium text-slate-800 border-r border-slate-200">
                {props.category}
              </td>
              <td className="w-1/4 bg-slate-100 font-semibold p-1.5 text-slate-700 border-r border-slate-300">
                Status Milestone
              </td>
              <td className="w-1/4 p-1.5 font-bold text-slate-800">
                {props.status}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="bg-slate-100 font-semibold p-1.5 text-slate-700 border-r border-slate-300">
                Kementerian / PJPK
              </td>
              <td className="p-1.5 font-medium text-slate-800 border-r border-slate-200">
                {props.pjpk || props.unor || 'Kementerian Pekerjaan Umum (PUPR)'}
              </td>
              <td className="bg-slate-100 font-semibold p-1.5 text-slate-700 border-r border-slate-300">
                Kontraktor Utama
              </td>
              <td className="p-1.5 font-bold text-slate-900">
                {primaryContractor || allContractors[0] || props.contractor || 'Dalam Proses Tender / Konsorsium BUMN'}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="bg-slate-100 font-semibold p-1.5 text-slate-700 border-r border-slate-300">
                Nilai Investasi (CAPEX)
              </td>
              <td className="p-1.5 font-mono font-bold text-slate-900 border-r border-slate-200">
                {formattedInvestment}
              </td>
              <td className="bg-slate-100 font-semibold p-1.5 text-slate-700 border-r border-slate-300">
                Skema Pendanaan
              </td>
              <td className="p-1.5 font-medium text-slate-800">
                {props.funding_scheme || 'APBN / BUMN / KPBU'}
              </td>
            </tr>
            <tr>
              <td className="bg-slate-100 font-semibold p-1.5 text-slate-700 border-r border-slate-300">
                Lokasi Administratif
              </td>
              <td className="p-1.5 font-medium text-slate-800 border-r border-slate-200">
                {props.regency ? `${props.regency}, ` : ''}{props.province || 'Nasional'}
              </td>
              <td className="bg-slate-100 font-semibold p-1.5 text-slate-700 border-r border-slate-300">
                Koordinat Geospasial
              </td>
              <td className="p-1.5 font-mono text-[10px] text-slate-700">
                {lat.toFixed(5)}° N/S, {lon.toFixed(5)}° E
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── SECTION 2: MATRIKS REKAYASA & RISIKO LAPANGAN (3-COLUMN BOX) ── */}
      <div className="mb-4">
        <h2 className="text-[10px] font-black uppercase tracking-wider text-slate-700 border-b border-slate-300 pb-1 mb-2">
          2. Matriks Rekayasa, Logistik & Risiko Lapangan
        </h2>
        <div className="grid grid-cols-3 gap-2.5">
          {/* Kolom 1: Seismik & Geoteknik */}
          <div className="border border-slate-300 rounded p-2.5 bg-slate-50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-1.5">
                <span className="font-bold text-slate-900 flex items-center gap-1 text-[11px]">
                  <span>⚡</span> Seismik & Sesar (PuSGeN)
                </span>
                <span className="text-[9px] font-mono text-slate-500">SNI 1726</span>
              </div>
              {nearestFault ? (
                <div className="space-y-1 text-[10.5px]">
                  <div>
                    <span className="text-slate-500">Sesar Terdekat:</span>{' '}
                    <strong className="text-slate-900 block">{nearestFault.fault.properties.name}</strong>
                  </div>
                  <div className="flex justify-between items-baseline pt-0.5">
                    <span className="text-slate-500">Jarak Tapak:</span>
                    <strong className="font-mono text-xs text-slate-900">
                      {nearestFault.distanceKm.toFixed(1)} km
                    </strong>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-500">Slip Rate:</span>
                    <span className="font-mono text-slate-700">{nearestFault.fault.properties.slip_rate_mm_year} mm/thn</span>
                  </div>
                  <div className="pt-1 text-[10px] leading-tight text-slate-600 border-t border-slate-200 mt-1">
                    {nearestFault.alertLevel === 'high' ? (
                      <span className="text-red-700 font-semibold">⚠️ Zona Patahan Aktif: Wajib SSGMA & pendetailan daktal penuh.</span>
                    ) : (
                      <span className="text-slate-600">Periksa koefisien spektrum percepatan gempa (KDS) tapak proyek.</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 text-[10px]">Data sesar tidak terjangkau</div>
              )}
            </div>
          </div>

          {/* Kolom 2: Rantai Pasok Material & Beton */}
          <div className="border border-slate-300 rounded p-2.5 bg-slate-50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-1.5">
                <span className="font-bold text-slate-900 flex items-center gap-1 text-[11px]">
                  <span>🏗️</span> Pasokan Beton & Material
                </span>
                <span className="text-[9px] font-mono text-slate-500">ASTM C94</span>
              </div>
              <div className="space-y-1 text-[10.5px]">
                {nearestPlant ? (
                  <>
                    <div>
                      <span className="text-slate-500">Batching Plant:</span>{' '}
                      <strong className="text-slate-900 truncate block" title={nearestPlant.plant.properties.name}>
                        {nearestPlant.plant.properties.name}
                      </strong>
                    </div>
                    <div className="flex justify-between items-baseline pt-0.5">
                      <span className="text-slate-500">Jarak / Status:</span>
                      <strong className="font-mono text-xs text-slate-900">
                        {nearestPlant.distanceKm.toFixed(1)} km ({nearestPlant.status.label})
                      </strong>
                    </div>
                  </>
                ) : (
                  <div className="text-slate-500">Batching plant: &gt;50 km (Site-mix diperlukan)</div>
                )}
                {nearestQuarry && (
                  <div className="flex justify-between items-baseline pt-1 border-t border-slate-200">
                    <span className="text-slate-500 truncate max-w-[100px]">Quarry Pasir:</span>
                    <span className="font-mono text-slate-700">{nearestQuarry.distanceKm.toFixed(0)} km</span>
                  </div>
                )}
                {nearestSteel && (
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-500 truncate max-w-[100px]">Baja Pabrik:</span>
                    <span className="font-mono text-slate-700">{nearestSteel.distanceKm.toFixed(0)} km</span>
                  </div>
                )}
                {nearestCement && (
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-500 truncate max-w-[100px]">Semen Terpadu:</span>
                    <span className="font-mono text-slate-700">{nearestCement.distanceKm.toFixed(0)} km</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Kolom 3: Hidrometeorologi & Mitigasi BMKG */}
          <div className="border border-slate-300 rounded p-2.5 bg-slate-50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-1.5">
                <span className="font-bold text-slate-900 flex items-center gap-1 text-[11px]">
                  <span>🌧️</span> Hidrometeorologi (BMKG)
                </span>
                <span className="text-[9px] font-mono text-slate-500">Normal</span>
              </div>
              <div className="space-y-1 text-[10.5px]">
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-500">Curah Hujan:</span>
                  <strong className="font-mono text-xs text-slate-900">
                    ~{rainfall.annualMm.toLocaleString('id-ID')} mm/thn
                  </strong>
                </div>
                <div className="text-[10px] text-slate-600 font-medium">
                  Status: <strong className="text-slate-900">{rainfall.badgeLabel}</strong>
                </div>
                <div className="pt-0.5">
                  <span className="text-slate-500 text-[10px]">Puncak Hujan:</span>{' '}
                  <span className="font-semibold text-slate-800 text-[10px] block">{rainfall.peakSeasonMonths}</span>
                </div>
                <div className="pt-1 text-[10px] leading-tight text-slate-600 border-t border-slate-200 mt-1">
                  {rainfall.severity === 'high' || rainfall.severity === 'very_high' ? (
                    <span>Pompa dewatering siaga &gt;75 m³/h + terpal proteksi lereng terbuka.</span>
                  ) : (
                    <span>Proteksi retak susut beton (curing air) & pengendalian debu akses.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 3: REKOMENDASI METODE KERJA & CATATAN TEKNIS ── */}
      <div className="mb-4">
        <h2 className="text-[10px] font-black uppercase tracking-wider text-slate-700 border-b border-slate-300 pb-1 mb-2">
          3. Rekomendasi Metode Kerja & Persiapan Lelang
        </h2>
        <div className="border border-slate-300 rounded p-2.5 bg-white space-y-1.5">
          <div className="grid grid-cols-2 gap-3 text-[10.5px]">
            <div>
              <strong className="text-slate-800 block mb-0.5 font-bold">A. Logistik & Pengecoran Struktur:</strong>
              <p className="text-slate-600 leading-relaxed text-[10px]">
                {nearestPlant && nearestPlant.distanceKm <= 15
                  ? `Jarak batching plant ${nearestPlant.distanceKm.toFixed(1)} km memungkinkan pengiriman beton segar tanpa retarder khusus (waktu tempuh <45 menit). Pastikan koordinasi surat jalan mixer.`
                  : nearestPlant && nearestPlant.distanceKm <= 30
                  ? `Jarak batching plant ${nearestPlant.distanceKm.toFixed(1)} km membutuhkan penggunaan set-retarding admixture ASTM C494 Type D guna memperpanjang slump life hingga 90–120 menit.`
                  : 'Lokasi di luar jangkauan komersial standar (>30 km). Kontraktor disarankan mendirikan On-Site Batching Plant / Dry-Batching terdedikasi.'}
              </p>
            </div>
            <div>
              <strong className="text-slate-800 block mb-0.5 font-bold">B. Manajemen Limpasan & Pekerjaan Tanah:</strong>
              <p className="text-slate-600 leading-relaxed text-[10px]">
                Curah hujan rata-rata {rainfall.annualMm} mm/tahun ({rainfall.badgeLabel}). Pekerjaan galian fondasi dan pemadatan subgrade wajib dilengkapi parit perimeter keliling serta kolam endapan (sediment basin) sebelum bulan puncak ({rainfall.peakSeasonMonths}).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER & VERIFIKASI RESMI ── */}
      <div className="border-t border-slate-300 pt-2 text-[9px] text-slate-500 font-mono flex items-center justify-between">
        <div>
          <div>Sumber Data: <strong>KPPIP, Kementerian Pekerjaan Umum, BMKG, PuSGeN 2017/2024, LPSE Inaproc</strong></div>
          <div className="text-[8.5px] text-slate-400 mt-0.5">
            Dokumen ini di-generate secara otomatis oleh platform Coffee Civil untuk keperluan tinjauan teknis awal.
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold text-slate-700">Verifikasi Proyek Online:</div>
          <a
            href={deepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 underline text-[8.5px] truncate max-w-[200px] block"
          >
            coffeecivil.com/tracker
          </a>
        </div>
      </div>
    </div>
  );
};
