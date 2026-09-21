import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { ProjectFeature } from '../../types/project';
import {
  aggregateProvincialData,
  getProvinceStatForFeature,
  HEATMAP_THRESHOLDS,
} from '../../utils/provincialAggregator';
import { X, Layers } from 'lucide-react';

interface ProvincialHeatmapLayerProps {
  map: L.Map | null;
  projects: ProjectFeature[];
  isActive: boolean;
  onSelectProvince?: (provinceName: string) => void;
  onClose?: () => void;
}

export const ProvincialHeatmapLayer: React.FC<ProvincialHeatmapLayerProps> = ({
  map,
  projects,
  isActive,
  onSelectProvince,
  onClose,
}) => {
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const [boundariesData, setBoundariesData] = useState<any | null>(null);
  const [showLegend, setShowLegend] = useState<boolean>(true);

  // Fetch provincial boundary GeoJSON once
  useEffect(() => {
    let isMounted = true;
    async function loadBoundaries() {
      try {
        const res = await fetch('/data/provinces.geojson');
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} when fetching provinces.geojson`);
        }
        const data = await res.json();
        if (isMounted) {
          setBoundariesData(data);
        }
      } catch (err) {
        console.error('Failed to load provincial boundary GeoJSON:', err);
      }
    }

    loadBoundaries();
    return () => {
      isMounted = false;
    };
  }, []);

  // Update Leaflet Choropleth Layer when boundaries, projects, or active state changes
  useEffect(() => {
    if (!map) return;

    // Remove any existing layer
    if (geoJsonLayerRef.current) {
      geoJsonLayerRef.current.remove();
      geoJsonLayerRef.current = null;
    }

    if (!isActive || !boundariesData) return;

    // Aggregate statistics across projects
    const aggregates = aggregateProvincialData(projects);

    const geoJsonLayer = L.geoJSON(boundariesData, {
      style: (feature) => {
        const stat = getProvinceStatForFeature(feature, aggregates);
        const fillColor = stat ? stat.color : '#334155';
        return {
          weight: 1.2,
          color: '#94A3B8',
          fillColor: fillColor,
          fillOpacity: 0.38,
          dashArray: '2, 2',
        };
      },
      onEachFeature: (feature, layer) => {
        const stat = getProvinceStatForFeature(feature, aggregates);
        const name = stat?.provinceName || feature.properties.provinsi || feature.properties.state || 'Provinsi';
        const capex = stat ? stat.totalCapexTrillion : 0;
        const count = stat ? stat.projectCount : 0;
        const sector = stat ? stat.topSector : 'Belum Ada';
        const color = stat ? stat.color : '#334155';
        const threshold = stat ? stat.thresholdLabel : '< 25T';

        // Floating tooltip
        const tooltipHtml = `
          <div style="font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; min-width: 190px; padding: 3px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
              <span style="font-weight: 700; font-size: 12px; color: #ffffff;">📍 ${name}</span>
              <span style="font-size: 9px; font-weight: 700; color: ${color}; background: rgba(255,255,255,0.08); border: 1px solid ${color}; padding: 1px 5px; border-radius: 4px; font-family: monospace;">
                ${threshold}
              </span>
            </div>
            <div style="font-size: 11px; line-height: 1.6; color: #cbd5e1; border-top: 1px solid #334155; padding-top: 4px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #94a3b8;">Total Investasi:</span>
                <strong style="color: #38bdf8; font-family: monospace;">Rp ${capex.toLocaleString('id-ID')} T</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #94a3b8;">Total Proyek:</span>
                <strong style="color: #f1f5f9; font-family: monospace;">${count} Proyek</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #94a3b8;">Sektor Terbesar:</span>
                <strong style="color: #fbbf24;">${sector}</strong>
              </div>
            </div>
            <div style="margin-top: 4px; border-top: 1px solid rgba(255,255,255,0.07); padding-top: 3px; font-size: 9px; color: #60a5fa; text-align: center; text-transform: uppercase; letter-spacing: 0.5px;">
              [Klik untuk zoom ke provinsi]
            </div>
          </div>
        `;

        layer.bindTooltip(tooltipHtml, {
          className: 'custom-map-popup',
          sticky: true,
          direction: 'auto',
          opacity: 0.98,
        });

        // Interactive mouse events
        layer.on({
          mouseover: (e) => {
            const poly = e.target;
            poly.setStyle({
              weight: 2.5,
              color: '#FBBF24', // Glowing gold
              fillOpacity: 0.6,
              dashArray: '',
            });
            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
              poly.bringToFront();
            }
          },
          mouseout: (e) => {
            geoJsonLayer.resetStyle(e.target);
          },
          click: (e) => {
            const poly = e.target;
            if (poly.getBounds) {
              map.fitBounds(poly.getBounds(), {
                padding: [40, 40],
                maxZoom: 8,
              });
            }
            if (onSelectProvince) {
              onSelectProvince(name);
            }
          },
        });
      },
    });

    geoJsonLayer.addTo(map);
    geoJsonLayerRef.current = geoJsonLayer;

    return () => {
      if (geoJsonLayerRef.current) {
        geoJsonLayerRef.current.remove();
        geoJsonLayerRef.current = null;
      }
    };
  }, [map, projects, isActive, boundariesData, onSelectProvince]);

  if (!isActive) return null;

  return (
    <>
      {/* Minimalist Map Heatmap Legend */}
      {showLegend && (
        <div className="absolute bottom-6 left-6 z-[1000] bg-[#0f141c]/95 backdrop-blur-md border border-neutral-800 shadow-2xl rounded-xl p-3 text-xs text-white max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-200 select-none">
          <div className="flex items-center justify-between gap-3 pb-2 mb-2 border-b border-neutral-800/80">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-neutral-900 border border-neutral-800 text-sky-400">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-neutral-100 tracking-tight">
                  Heatmap Anggaran Provinsi
                </h3>
                <p className="text-[10px] text-neutral-400">
                  Total Disclosed CAPEX (IDR Trillion)
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setShowLegend(false);
                if (onClose) onClose();
              }}
              className="text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors"
              title="Close Heatmap"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Color Scale Gradient Pills */}
          <div className="grid grid-cols-4 gap-1.5 pt-0.5">
            {HEATMAP_THRESHOLDS.map((t) => (
              <div
                key={t.label}
                className="flex flex-col items-center p-1.5 rounded-lg bg-neutral-900/60 border border-neutral-800/80 text-center"
              >
                <div
                  className="w-full h-2 rounded-sm mb-1"
                  style={{ backgroundColor: t.color }}
                />
                <span className="text-[10px] font-mono font-bold text-neutral-200">
                  {t.label}
                </span>
                <span className="text-[8px] text-neutral-400 font-medium">
                  {t.range}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-2 pt-2 border-t border-neutral-800/60 flex items-center justify-between text-[10px] text-neutral-400">
            <span>Arahkan kursor &amp; klik untuk fokus</span>
            <span className="text-sky-400 font-medium">33 Wilayah Prov</span>
          </div>
        </div>
      )}
    </>
  );
};
