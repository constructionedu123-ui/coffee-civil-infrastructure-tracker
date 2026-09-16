import { ProjectFeature, getProjectCoordinates } from '../types/project';


/**
 * Downloads a string or blob as a local file.
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports the filtered project features as a clean GeoJSON FeatureCollection.
 */
export function exportAsGeoJSON(projects: ProjectFeature[], filename = 'projects.geojson') {
  const geojson = {
    type: 'FeatureCollection',
    features: projects,
  };
  const jsonString = JSON.stringify(geojson, null, 2);
  downloadFile(jsonString, filename, 'application/geo+json');
}

/**
 * Escapes a field for safe CSV output.
 */
function escapeCsvValue(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Exports the filtered project features as a clean CSV with required columns:
 * name, sector, status, budget_idr_trillion, province, regency, contractor, latitude, longitude, source_url
 */
export function exportAsCSV(projects: ProjectFeature[], filename = 'psn_projects.csv') {
  const headers = [
    'name',
    'sector',
    'status',
    'budget_idr_trillion',
    'province',
    'regency',
    'contractor',
    'latitude',
    'longitude',
    'source_url',
  ];

  const rows = projects.map((feat) => {
    const p = feat.properties;
    const [lon, lat] = getProjectCoordinates(feat.geometry);

    const budgetTrillion =
      p.budget_idr !== null && p.budget_idr !== undefined
        ? (p.budget_idr / 1e12).toFixed(2)
        : '';

    return [
      escapeCsvValue(p.project_name),
      escapeCsvValue(p.category),
      escapeCsvValue(p.status),
      escapeCsvValue(budgetTrillion),
      escapeCsvValue(p.province),
      escapeCsvValue(p.regency),
      escapeCsvValue(p.contractor),
      escapeCsvValue(lat),
      escapeCsvValue(lon),
      escapeCsvValue(p.source_url),
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}
