import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  KekCorridorFeature,
  KekCorridorFeatureCollection,
} from '../../types/kekCorridor';
import {
  KEK_CATEGORY_CONFIG,
  getKekCategoryConfig,
} from '../../utils/kekCorridorsConfig';
import { Factory, X } from 'lucide-react';

interface KekCorridorsLayerProps {
  map: L.Map | null;
  isActive: boolean;
  onSelectCorridor?: (corridor: KekCorridorFeature) => void;
  onClose?: () => void;
}

export const KekCorridorsLayer: React.FC<KekCorridorsLayerProps> = ({
  map,
  isActive,
  onSelectCorridor,
  onClose,
}) => {
  const layerGroupRef = useRef<L.FeatureGroup | null>(null);
  const [data, setData] = useState<KekCorridorFeatureCollection | null>(null);
  const [showLegend, setShowLegend] = useState<boolean>(true);

  // Fetch KEK Corridors GeoJSON once
  useEffect(() => {
    let isMounted = true;
    async function loadCorridors() {
      try {
        const res = await fetch('/data/kek_corridors.geojson');
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} when fetching kek_corridors.geojson`);
        }
        const json: KekCorridorFeatureCollection = await res.json();
        if (isMounted) {
          setData(json);
        }
      } catch (err) {
        console.error('Failed to load kek_corridors.geojson:', err);
      }
    }

    loadCorridors();
    return () => {
      isMounted = false;
    };
  }, []);

  // Update Leaflet layer when map, data, or active state changes
  useEffect(() => {
    if (!map) return;

    // Clean up existing layer group
    if (layerGroupRef.current) {
      layerGroupRef.current.clearLayers();
      layerGroupRef.current.remove();
      layerGroupRef.current = null;
    }

    if (!isActive || !data || !data.features) return;

    const layerGroup = L.featureGroup();

    data.features.forEach((feature) => {
      const p = feature.properties;
      const config = getKekCategoryConfig(p.category);

      // 1. Boundary Polygon
      const polygon = L.geoJSON(feature, {
        style: {
          color: config.color,
          weight: 2,
          fillColor: config.color,
          fillOpacity: 0.35,
          dashArray: '4, 4',
        },
      });

      // 2. Pulsing Center Badge Marker
      const centerLat = p.center_coords[0];
      const centerLon = p.center_coords[1];

      const pulsingIcon = L.divIcon({
        className: 'kek-center-pulse',
        html: `
          <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; inset: -4px; border-radius: 50%; background: ${config.color}; opacity: 0.35; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 26px; height: 26px; border-radius: 50%; background: #0f141c; border: 2px solid ${config.color}; box-shadow: 0 0 10px ${config.glowShadow}; display: flex; align-items: center; justify-content: center; font-size: 13px; cursor: pointer;">
              ${config.icon}
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const centerMarker = L.marker([centerLat, centerLon], {
        icon: pulsingIcon,
        zIndexOffset: 500,
      });

      // Sleek Frosted Glass Popup Card
      const tenantsHtml = p.anchor_tenants && p.anchor_tenants.length > 0
        ? p.anchor_tenants.slice(0, 3).map((t) => `<span style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); padding: 1px 6px; border-radius: 4px; font-size: 10px; color: #e2e8f0; display: inline-block;">${t}</span>`).join(' ')
        : '';

      const popupHtml = `
        <div style="font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; min-width: 250px; max-width: 320px; padding: 4px;">
          {/* Header */}
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
            <div>
              <div style="font-weight: 800; font-size: 13px; color: #ffffff; line-height: 1.3;">
                ${p.name}
              </div>
              <div style="font-size: 10px; color: #94a3b8;">
                📍 ${p.regency}, ${p.province}
              </div>
            </div>
            <span style="font-size: 9px; font-weight: 800; color: #ffffff; background: ${config.color}; padding: 2px 6px; border-radius: 4px; font-family: monospace; letter-spacing: 0.5px; shrink-0;">
              ${p.status}
            </span>
          </div>

          {/* Cluster Badge */}
          <div style="margin-bottom: 8px;">
            <span style="display: inline-flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 700; color: ${config.color}; background: rgba(255,255,255,0.06); border: 1px solid ${config.color}66; padding: 2px 7px; border-radius: 9999px;">
              <span>${config.icon}</span>
              <span>${p.category}</span>
            </span>
          </div>

          {/* Key Specs Grid */}
          <div style="font-size: 11px; line-height: 1.5; color: #cbd5e1; border-top: 1px solid #334155; padding-top: 6px; margin-bottom: 6px; display: flex; flex-direction: column; gap: 3px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #94a3b8;">Luas Area:</span>
              <strong style="color: #f1f5f9; font-family: monospace;">${p.area_ha.toLocaleString('id-ID')} Ha</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #94a3b8;">Est. Investasi:</span>
              <strong style="color: #38bdf8; font-family: monospace;">${p.investment_est}</strong>
            </div>
            <div style="margin-top: 2px;">
              <div style="color: #94a3b8; font-size: 10px;">Komoditas Utama:</div>
              <div style="color: #fef08a; font-weight: 600; font-size: 10.5px; line-height: 1.3;">
                ${p.core_commodities}
              </div>
            </div>
          </div>

          {/* Anchor Tenants */}
          ${
            tenantsHtml
              ? `<div style="border-top: 1px solid rgba(255,255,255,0.07); padding-top: 5px; margin-bottom: 5px;">
                  <div style="font-size: 9.5px; color: #94a3b8; text-transform: uppercase; font-weight: 700; margin-bottom: 3px;">
                    Anchor Tenants &amp; Operator:
                  </div>
                  <div style="display: flex; flex-wrap: wrap; gap: 3px;">
                    ${tenantsHtml}
                  </div>
                </div>`
              : ''
          }

          {/* Connected Infrastructure */}
          <div style="background: rgba(15, 20, 28, 0.7); border: 1px solid #334155; border-radius: 6px; padding: 5px; margin-top: 4px;">
            <div style="font-size: 9.5px; color: #38bdf8; font-weight: 700; text-transform: uppercase; margin-bottom: 2px;">
              🚢 Akses &amp; Konektivitas Logistik:
            </div>
            <div style="font-size: 10px; color: #cbd5e1; line-height: 1.3;">
              ${p.connected_infrastructure}
            </div>
          </div>
        </div>
      `;

      // Bind Popups to both polygon and center marker
      polygon.bindPopup(popupHtml, {
        className: 'custom-map-popup',
        maxWidth: 340,
        offset: [0, -4],
      });

      centerMarker.bindPopup(popupHtml, {
        className: 'custom-map-popup',
        maxWidth: 340,
        offset: [0, -14],
      });

      // Interactive mouse hover events on polygon
      polygon.on({
        mouseover: (e) => {
          const poly = e.target;
          poly.setStyle({
            weight: 3.5,
            fillOpacity: 0.55,
            color: '#FFFFFF',
            dashArray: '',
          });
          if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            poly.bringToFront();
          }
        },
        mouseout: () => {
          polygon.setStyle({
            color: config.color,
            weight: 2,
            fillColor: config.color,
            fillOpacity: 0.35,
            dashArray: '4, 4',
          });
        },
        click: () => {
          if (polygon.getBounds) {
            map.fitBounds(polygon.getBounds(), {
              padding: [50, 50],
              maxZoom: 11,
            });
          }
          if (onSelectCorridor) {
            onSelectCorridor(feature);
          }
        },
      });

      centerMarker.on({
        click: () => {
          if (polygon.getBounds) {
            map.fitBounds(polygon.getBounds(), {
              padding: [50, 50],
              maxZoom: 11,
            });
          }
          if (onSelectCorridor) {
            onSelectCorridor(feature);
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
  }, [map, data, isActive, onSelectCorridor]);

  if (!isActive) return null;

  return (
    <>
      {/* Floating KEK & Hilirisasi Downstream Legend */}
      {showLegend && (
        <div className="absolute top-20 right-4 z-[1000] bg-[#0f141c]/95 backdrop-blur-md border border-neutral-800 shadow-2xl rounded-xl p-3 text-xs text-white max-w-xs animate-in fade-in slide-in-from-top-2 duration-200 select-none">
          <div className="flex items-center justify-between gap-3 pb-2 mb-2 border-b border-neutral-800/80">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-purple-950/60 border border-purple-800/60 text-purple-400">
                <Factory className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-neutral-100 tracking-tight">
                  Klaster Hilirisasi &amp; KEK
                </h3>
                <p className="text-[10px] text-neutral-400">
                  14 Kawasan Industri Strategis
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setShowLegend(false);
                if (onClose) onClose();
              }}
              className="text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors"
              title="Tutup Layer Hilirisasi"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 5 Downstream Cluster Category Items */}
          <div className="space-y-1.5 pt-0.5">
            {Object.values(KEK_CATEGORY_CONFIG).map((cat) => (
              <div
                key={cat.label}
                className="flex items-center justify-between p-1.5 rounded-lg bg-neutral-900/60 border border-neutral-800/60 hover:bg-neutral-800/60 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="font-semibold text-neutral-200 text-[11px] truncate">
                    {cat.label}
                  </span>
                </div>
                <span className="text-sm shrink-0">{cat.icon}</span>
              </div>
            ))}
          </div>

          <div className="mt-2.5 pt-2 border-t border-neutral-800/60 flex items-center justify-between text-[10px] text-neutral-400">
            <span>Klik polygon untuk detail</span>
            <span className="text-purple-400 font-semibold font-mono">14 PSN/KEK</span>
          </div>
        </div>
      )}
    </>
  );
};
