import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MegathrustFeature,
  MegathrustFeatureCollection,
} from '../../types/megathrust';
import { getMegathrustSegmentStyle } from '../../utils/megathrust';
import { Waves, X, AlertTriangle } from 'lucide-react';

interface MegathrustLayerProps {
  map: L.Map | null;
  isActive: boolean;
  onSelectSegment?: (segment: MegathrustFeature) => void;
  onClose?: () => void;
}

export const MegathrustLayer: React.FC<MegathrustLayerProps> = ({
  map,
  isActive,
  onSelectSegment,
  onClose,
}) => {
  const layerGroupRef = useRef<L.FeatureGroup | null>(null);
  const [data, setData] = useState<MegathrustFeatureCollection | null>(null);
  const [showLegend, setShowLegend] = useState<boolean>(true);

  // Fetch Megathrust Zones GeoJSON
  useEffect(() => {
    let isMounted = true;
    async function loadMegathrust() {
      try {
        const res = await fetch('/data/megathrust_zones.geojson');
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} when fetching megathrust_zones.geojson`);
        }
        const json: MegathrustFeatureCollection = await res.json();
        if (isMounted) {
          setData(json);
        }
      } catch (err) {
        console.error('Failed to load megathrust_zones.geojson:', err);
      }
    }

    loadMegathrust();
    return () => {
      isMounted = false;
    };
  }, []);

  // Update Leaflet layer when map, data, or active state changes
  useEffect(() => {
    if (!map) return;

    if (layerGroupRef.current) {
      layerGroupRef.current.clearLayers();
      layerGroupRef.current.remove();
      layerGroupRef.current = null;
    }

    if (!isActive || !data || !data.features) return;

    const layerGroup = L.featureGroup();

    data.features.forEach((feature) => {
      const p = feature.properties;
      const style = getMegathrustSegmentStyle(p);

      // 1. Subduction Corridor Polygon
      const polygon = L.geoJSON(feature, {
        style: {
          color: style.color,
          weight: 2.5,
          fillColor: style.fillColor,
          fillOpacity: p.is_seismic_gap ? 0.32 : 0.24,
          dashArray: '6, 6',
        },
      });

      // 2. Center Pulsing Marker Badge
      const [cLat, cLon] = p.center_coords;
      const pulsingIcon = L.divIcon({
        className: 'megathrust-pulse-icon',
        html: `
          <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; inset: -4px; border-radius: 50%; background: ${style.fillColor}; opacity: 0.45; animation: ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 32px; height: 32px; border-radius: 50%; background: #0f141c; border: 2px solid ${style.color}; box-shadow: 0 0 12px ${style.glowShadow}; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 11px; cursor: pointer;">
              <span style="font-size: 11px; line-height: 1;">🌊</span>
              <span style="font-size: 8px; font-weight: 900; color: #f87171; font-family: monospace; line-height: 1;">M${p.mw_max}</span>
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const centerMarker = L.marker([cLat, cLon], {
        icon: pulsingIcon,
        zIndexOffset: 450,
      });

      // Sleek Technical Placard Popup HTML
      const popupHtml = `
        <div style="font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; min-width: 270px; max-width: 340px; padding: 4px;">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
            <div>
              <div style="font-weight: 800; font-size: 13.5px; color: #ffffff; line-height: 1.3;">
                ${p.name}
              </div>
              <div style="font-size: 10px; color: #94a3b8; margin-top: 1px;">
                📍 ${p.segment_zone}
              </div>
            </div>
            <span style="font-size: 9px; font-weight: 800; color: #ffffff; background: ${style.color}; padding: 2.5px 6px; border-radius: 4px; font-family: monospace; letter-spacing: 0.5px; shrink-0; text-align: center;">
              ${p.is_seismic_gap ? 'SEISMIC GAP' : 'SUBDUKSI'}
            </span>
          </div>

          <div style="margin-bottom: 8px; display: flex; flex-wrap: wrap; gap: 4px;">
            <span style="display: inline-flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 700; color: #f87171; background: rgba(220, 38, 38, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); padding: 2px 7px; border-radius: 9999px;">
              <span>⚡ Potensi Maks:</span>
              <strong style="font-family: monospace; font-size: 11px;">Mw ${p.mw_max}</strong>
            </span>
            <span style="display: inline-flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 600; color: #fdba74; background: rgba(234, 88, 12, 0.15); border: 1px solid rgba(249, 115, 22, 0.35); padding: 2px 7px; border-radius: 9999px;">
              <span>Slip Rate:</span>
              <strong style="font-family: monospace;">${p.slip_rate_cm_year} cm/thn</strong>
            </span>
          </div>

          <div style="font-size: 11px; line-height: 1.4; color: #cbd5e1; border-top: 1px solid #334155; padding-top: 6px; margin-bottom: 6px; display: flex; flex-direction: column; gap: 3.5px;">
            <div style="display: flex; justify-content: space-between; gap: 8px;">
              <span style="color: #94a3b8; shrink-0;">Status Akumulasi:</span>
              <strong style="color: ${p.is_seismic_gap ? '#f87171' : '#fde047'}; font-size: 10.5px; text-align: right;">${p.seismic_gap_status}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 8px;">
              <span style="color: #94a3b8; shrink-0;">Potensi Tsunami:</span>
              <strong style="color: #38bdf8; font-size: 10.5px; text-align: right;">${p.tsunami_potential}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 8px;">
              <span style="color: #94a3b8; shrink-0;">Periode Ulang:</span>
              <strong style="color: #e2e8f0; font-family: monospace; text-align: right;">${p.recurrence_period}</strong>
            </div>
            <div style="margin-top: 2px;">
              <div style="color: #94a3b8; font-size: 9.5px;">Riwayat Gempa Historis:</div>
              <div style="color: #cbd5e1; font-weight: 500; font-size: 10.5px; line-height: 1.3;">
                ${p.historical_events}
              </div>
            </div>
          </div>

          <div style="background: rgba(15, 20, 28, 0.85); border: 1px solid #451a1a; border-radius: 6px; padding: 6px; margin-top: 4px;">
            <div style="font-size: 9.5px; color: #f87171; font-weight: 700; text-transform: uppercase; margin-bottom: 2px; display: flex; items-center; gap: 4px;">
              <span>🛡️ Rekayasa Struktur &amp; Mitigasi Pesisir:</span>
            </div>
            <div style="font-size: 10px; color: #fecaca; line-height: 1.35;">
              ${p.structural_recommendation}
            </div>
          </div>
        </div>
      `;

      polygon.bindPopup(popupHtml, {
        className: 'custom-map-popup',
        maxWidth: 350,
        offset: [0, -4],
      });

      centerMarker.bindPopup(popupHtml, {
        className: 'custom-map-popup',
        maxWidth: 350,
        offset: [0, -16],
      });

      // Hover and click interaction
      polygon.on({
        mouseover: (e) => {
          const poly = e.target;
          poly.setStyle({
            weight: 4,
            fillOpacity: 0.5,
            color: '#FFFFFF',
            dashArray: '',
          });
          if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            poly.bringToFront();
          }
        },
        mouseout: () => {
          polygon.setStyle({
            color: style.color,
            weight: 2.5,
            fillColor: style.fillColor,
            fillOpacity: p.is_seismic_gap ? 0.32 : 0.24,
            dashArray: '6, 6',
          });
        },
        click: () => {
          if (polygon.getBounds) {
            map.fitBounds(polygon.getBounds(), {
              padding: [60, 60],
              maxZoom: 9,
            });
          }
          if (onSelectSegment) {
            onSelectSegment(feature);
          }
        },
      });

      centerMarker.on({
        click: () => {
          if (polygon.getBounds) {
            map.fitBounds(polygon.getBounds(), {
              padding: [60, 60],
              maxZoom: 9,
            });
          }
          if (onSelectSegment) {
            onSelectSegment(feature);
          }
        },
      });

      layerGroup.addLayer(polygon);
      layerGroup.addLayer(centerMarker);
    });

    layerGroup.addTo(map);
    layerGroupRef.current = layerGroup;

    return () => {
      if (layerGroupRef.current) {
        layerGroupRef.current.clearLayers();
        layerGroupRef.current.remove();
        layerGroupRef.current = null;
      }
    };
  }, [map, data, isActive, onSelectSegment]);

  if (!isActive) return null;

  return (
    <>
      {showLegend && (
        <div className="absolute top-20 right-4 z-[1000] bg-[#0f141c]/95 backdrop-blur-md border border-red-950/80 shadow-2xl rounded-xl p-3 text-xs text-white max-w-xs animate-in fade-in slide-in-from-top-2 duration-200 select-none">
          <div className="flex items-center justify-between gap-3 pb-2 mb-2 border-b border-red-950/70">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-red-950/80 border border-red-800/80 text-red-400">
                <Waves className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-neutral-100 tracking-tight">
                  Zona Megathrust &amp; Tsunami
                </h3>
                <p className="text-[10px] text-neutral-400">
                  11 Segmen Subduksi PuSGeN / BMKG
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setShowLegend(false);
                if (onClose) onClose();
              }}
              className="text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors"
              title="Tutup Layer Megathrust"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-red-950/30 border border-red-900/40">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
                <span className="font-semibold text-red-200 text-[11px] truncate">
                  Active Seismic Gap (Kritis)
                </span>
              </div>
              <span className="text-[10px] font-mono text-red-400 font-bold">Mw &ge; 8.7</span>
            </div>

            <div className="flex items-center justify-between p-1.5 rounded-lg bg-orange-950/20 border border-orange-900/40">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.6)]" />
                <span className="font-semibold text-orange-200 text-[11px] truncate">
                  Subduksi Aktif Terkunci
                </span>
              </div>
              <span className="text-[10px] font-mono text-orange-400 font-bold">Mw 8.2–8.8</span>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-red-950/60 flex items-center justify-between text-[10px] text-neutral-400">
            <span className="flex items-center gap-1 text-red-300">
              <AlertTriangle className="w-3 h-3 text-red-400" />
              <span>Buffer Tsunami: &lt; 200 km</span>
            </span>
            <span className="text-red-400 font-semibold font-mono">11 Segmen</span>
          </div>
        </div>
      )}
    </>
  );
};
