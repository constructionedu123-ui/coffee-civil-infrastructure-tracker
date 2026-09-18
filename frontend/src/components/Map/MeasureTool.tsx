import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { Ruler, Maximize2, RotateCcw, Undo2, X } from 'lucide-react';
import {
  calculatePolylineDistance,
  calculateSphericalPolygonArea,
  formatDistance,
  formatArea,
} from '../../utils/measurement';

interface MeasureToolProps {
  map: L.Map | null;
  /** Optional trigger to force close (e.g. when a project drawer opens) */
  forceCloseTrigger?: any;
}

export const MeasureTool: React.FC<MeasureToolProps> = ({ map, forceCloseTrigger }) => {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [mode, setMode] = useState<'distance' | 'area'>('distance');
  const [points, setPoints] = useState<[number, number][]>([]);

  const hudRef = useRef<HTMLDivElement>(null);
  const layerGroupRef = useRef<L.FeatureGroup | null>(null);
  const rubberbandRef = useRef<L.Polyline | null>(null);

  // Close when triggered by parent
  useEffect(() => {
    if (forceCloseTrigger && isActive) {
      setIsActive(false);
      setPoints([]);
    }
  }, [forceCloseTrigger]);

  // Prevent Leaflet map clicks/drags from propagating through HUD panel
  useEffect(() => {
    if (hudRef.current) {
      L.DomEvent.disableClickPropagation(hudRef.current);
      L.DomEvent.disableScrollPropagation(hudRef.current);
    }
  }, [isActive]);

  // Setup/Teardown measurement layer & map event listeners
  useEffect(() => {
    if (!map) return;

    if (!isActive) {
      // Cleanup when inactive
      if (layerGroupRef.current) {
        layerGroupRef.current.clearLayers();
        map.removeLayer(layerGroupRef.current);
        layerGroupRef.current = null;
      }
      if (rubberbandRef.current) {
        map.removeLayer(rubberbandRef.current);
        rubberbandRef.current = null;
      }
      const container = map.getContainer();
      container.classList.remove('is-measuring');
      container.style.cursor = '';
      return;
    }

    // Initialize layer group
    const layerGroup = L.featureGroup().addTo(map);
    layerGroupRef.current = layerGroup;

    // Set cursor and marker suppression class
    const container = map.getContainer();
    container.classList.add('is-measuring');
    container.style.cursor = 'crosshair';

    // Click handler on map
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const latlng: [number, number] = [e.latlng.lat, e.latlng.lng];
      setPoints((prev) => [...prev, latlng]);
    };

    // Mousemove handler for live rubberband preview
    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      setPoints((currentPoints) => {
        if (currentPoints.length === 0) return currentPoints;

        const lastPt = currentPoints[currentPoints.length - 1];
        const mousePt: [number, number] = [e.latlng.lat, e.latlng.lng];

        if (!rubberbandRef.current) {
          rubberbandRef.current = L.polyline([lastPt, mousePt], {
            color: '#38BDF8',
            weight: 2,
            dashArray: '4, 4',
            opacity: 0.65,
            interactive: false,
            className: 'measure-active-geometry',
          }).addTo(map);
        } else {
          rubberbandRef.current.setLatLngs([lastPt, mousePt]);
        }

        return currentPoints;
      });
    };

    map.on('click', handleMapClick);
    map.on('mousemove', handleMouseMove);

    return () => {
      map.off('click', handleMapClick);
      map.off('mousemove', handleMouseMove);
      if (layerGroupRef.current) {
        layerGroupRef.current.clearLayers();
        map.removeLayer(layerGroupRef.current);
        layerGroupRef.current = null;
      }
      if (rubberbandRef.current) {
        map.removeLayer(rubberbandRef.current);
        rubberbandRef.current = null;
      }
      container.classList.remove('is-measuring');
      container.style.cursor = '';
    };
  }, [map, isActive]);

  // Update geometry rendering when points or mode changes
  useEffect(() => {
    const layerGroup = layerGroupRef.current;
    if (!layerGroup || !isActive) return;

    layerGroup.clearLayers();

    if (points.length === 0) return;

    // 1. Draw Geometry (Polyline or Polygon)
    if (mode === 'distance') {
      if (points.length >= 2) {
        // Glowing casing
        L.polyline(points, {
          color: '#0284C7',
          weight: 6,
          opacity: 0.35,
          interactive: false,
          className: 'measure-active-geometry',
        }).addTo(layerGroup);

        // Vibrant dashed core line
        L.polyline(points, {
          color: '#38BDF8',
          weight: 3,
          dashArray: '6, 6',
          opacity: 1,
          interactive: false,
          className: 'measure-active-geometry',
        }).addTo(layerGroup);
      }
    } else {
      // Area Mode
      if (points.length >= 3) {
        L.polygon(points, {
          color: '#38BDF8',
          weight: 3,
          dashArray: '6, 6',
          fillColor: '#38BDF8',
          fillOpacity: 0.2,
          interactive: false,
          className: 'measure-active-geometry',
        }).addTo(layerGroup);
      } else if (points.length === 2) {
        L.polyline(points, {
          color: '#38BDF8',
          weight: 3,
          dashArray: '6, 6',
          opacity: 1,
          interactive: false,
          className: 'measure-active-geometry',
        }).addTo(layerGroup);
      }
    }

    // 2. Render Crisp Vertex Dots (White circle with blue border)
    const distanceM = mode === 'distance' ? calculatePolylineDistance(points) : 0;
    const areaM2 = mode === 'area' ? calculateSphericalPolygonArea(points) : 0;

    points.forEach((pt, index) => {
      const isLast = index === points.length - 1;
      const marker = L.circleMarker(pt, {
        radius: isLast ? 6 : 5,
        color: '#0284C7',
        weight: 2.5,
        fillColor: '#FFFFFF',
        fillOpacity: 1,
        interactive: false,
        className: 'measure-active-geometry',
      });

      // Bind floating metric label on the final vertex
      if (isLast && points.length >= 2) {
        const label =
          mode === 'distance'
            ? formatDistance(distanceM)
            : points.length >= 3
            ? formatArea(areaM2).primary
            : `${points.length} titik`;

        marker.bindTooltip(label, {
          permanent: true,
          direction: 'top',
          offset: [0, -8],
          className: 'custom-measure-tooltip',
        });
      }

      layerGroup.addLayer(marker);
    });
  }, [points, mode, isActive]);

  // Actions
  const handleReset = () => {
    setPoints([]);
    if (rubberbandRef.current && map) {
      map.removeLayer(rubberbandRef.current);
      rubberbandRef.current = null;
    }
  };

  const handleUndo = () => {
    setPoints((prev) => prev.slice(0, -1));
  };

  const handleClose = () => {
    setIsActive(false);
    setPoints([]);
  };

  // Calculations
  const distance = mode === 'distance' ? calculatePolylineDistance(points) : 0;
  const areaM2 = mode === 'area' ? calculateSphericalPolygonArea(points) : 0;
  const areaFormatted = formatArea(areaM2);

  // Status text
  let statusText = 'Klik pada peta untuk meletakkan titik ukur...';
  if (mode === 'distance') {
    if (points.length === 1) {
      statusText = 'Klik titik kedua untuk mengukur jarak...';
    } else if (points.length >= 2) {
      statusText = `${points.length} titik terhubung • Klik untuk tambah segmen`;
    }
  } else {
    if (points.length === 1) {
      statusText = 'Klik titik sudut kedua...';
    } else if (points.length === 2) {
      statusText = 'Klik titik sudut ketiga untuk membentuk bidang...';
    } else if (points.length >= 3) {
      statusText = `${points.length} sudut bidang terhubung • Klik untuk memperluas`;
    }
  }

  return (
    <>
      {/* Floating Trigger Button (when closed) */}
      {!isActive && (
        <button
          onClick={() => setIsActive(true)}
          title="Alat Ukur Geospasial (Jarak & Luas)"
          className="absolute top-2.5 right-14 z-[1000] flex items-center gap-1.5 px-3 py-1.5 bg-[#0f141c]/90 hover:bg-[#1a2230] text-neutral-200 hover:text-white border border-neutral-700 rounded-lg shadow-xl text-xs font-medium backdrop-blur transition-all duration-150 hover:border-sky-500/50"
        >
          <Ruler className="w-3.5 h-3.5 text-sky-400" />
          <span>Ukur</span>
        </button>
      )}

      {/* Floating HUD Panel (when active) */}
      {isActive && (
        <div
          ref={hudRef}
          className="absolute top-2.5 right-14 z-[1100] w-80 max-w-[calc(100vw-76px)] bg-[#0f141c]/95 backdrop-blur border border-neutral-700 shadow-2xl p-3.5 rounded-xl text-neutral-200 animate-in fade-in duration-150 select-none"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-md bg-sky-500/20 text-sky-400 border border-sky-500/30">
                <Ruler className="w-3 h-3" />
              </span>
              <span className="text-xs font-bold text-white tracking-wide">
                Alat Ukur Geospasial
              </span>
            </div>
            <button
              onClick={handleClose}
              className="text-neutral-400 hover:text-white p-1 rounded-md hover:bg-neutral-800 transition-colors"
              title="Tutup Pengukuran"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mode Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-neutral-900/90 rounded-lg border border-neutral-800 mb-3">
            <button
              onClick={() => setMode('distance')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs transition-colors ${
                mode === 'distance'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
              }`}
            >
              <Ruler className="w-3.5 h-3.5" />
              <span>Jarak (Distance)</span>
            </button>
            <button
              onClick={() => setMode('area')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs transition-colors ${
                mode === 'area'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Luas (Area)</span>
            </button>
          </div>

          {/* Live Metrics Display */}
          <div className="bg-[#0b0f17] border border-neutral-800/90 rounded-lg p-3 mb-3 shadow-inner">
            <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 mb-1">
              {mode === 'distance' ? 'Total Jarak' : 'Total Luas'}
            </div>
            <div className="text-xl font-bold font-mono text-sky-400 tracking-tight">
              {mode === 'distance' ? formatDistance(distance) : areaFormatted.primary}
            </div>
            {mode === 'area' && (
              <div className="text-xs font-mono text-neutral-400 mt-0.5">
                {points.length >= 3 ? areaFormatted.secondary : '(Minimal 3 titik)'}
              </div>
            )}
            <div className="text-[11px] text-neutral-400 mt-2 flex items-center gap-1.5 pt-2 border-t border-neutral-800/60">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse shrink-0" />
              <span className="truncate">{statusText}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-800/80">
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleUndo}
                disabled={points.length === 0}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs text-neutral-300 transition-colors"
                title="Batalkan titik terakhir"
              >
                <Undo2 className="w-3 h-3" />
                <span>Undo</span>
              </button>
              <button
                onClick={handleReset}
                disabled={points.length === 0}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs text-neutral-300 transition-colors"
                title="Hapus semua titik"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
            <button
              onClick={handleClose}
              className="flex items-center gap-1 px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors"
            >
              <X className="w-3 h-3" />
              <span>Tutup</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
