import React, { useEffect, useRef } from 'react';

import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import { ProjectFeature } from '../../types/project';
import { createProjectIcon } from './ProjectMarker';
import { CATEGORY_CONFIG, STATUS_CONFIG } from '../../constants/categories';
import { formatBudget } from '../../utils/formatters';

// IKN Nusantara camera preset (Sepaku, East Kalimantan)
const IKN_CENTER: [number, number] = [-0.97, 116.70];
const IKN_ZOOM = 11;

interface InfrastructureMapProps {
  projects: ProjectFeature[];
  selectedProject: ProjectFeature | null;
  onSelectProject: (project: ProjectFeature) => void;
  flyToCoords: [number, number] | null;
  /** Increment each time user clicks "Focus IKN" to trigger the fly-to */
  focusIKNCounter?: number;
  basemap?: 'dark' | 'satellite';
}


export const InfrastructureMap: React.FC<InfrastructureMapProps> = ({
  projects,
  selectedProject,
  onSelectProject,
  flyToCoords,
  focusIKNCounter = 0,
  basemap = 'satellite',
}) => {

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const polylineLayerRef = useRef<L.FeatureGroup | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const refTileLayerRef = useRef<L.TileLayer | null>(null);



  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default Indonesia archipelago center
    const map = L.map(mapContainerRef.current, {
      center: [-0.7893, 113.9213],
      zoom: 5,
      minZoom: 4,
      maxZoom: 19,
      zoomControl: false,
    });

    // Add Zoom control at top right
    L.control.zoom({ position: 'topright' }).addTo(map);

    const clusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 32,
      spiderfyDistanceMultiplier: 1.5,
      spiderLegPolylineOptions: {
        weight: 1.5,
        color: '#64748b',
        opacity: 0.85,
        dashArray: '3, 3',
      },
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        return L.divIcon({
          html: `<div class="custom-cluster-badge"><span>${count}</span></div>`,
          className: 'custom-cluster-wrapper',
          iconSize: L.point(28, 28),
          iconAnchor: L.point(14, 14),
        });
      },
    });

    map.addLayer(clusterGroup);
    clusterGroupRef.current = clusterGroup;

    // Dedicated FeatureGroup for linear alignments (LineString / MultiLineString)
    const polylineLayer = L.featureGroup().addTo(map);
    polylineLayerRef.current = polylineLayer;

    mapInstanceRef.current = map;

    return () => {
      clusterGroup.clearLayers();
      polylineLayer.clearLayers();
      map.remove();
      mapInstanceRef.current = null;
      clusterGroupRef.current = null;
      polylineLayerRef.current = null;
    };
  }, []);

  // Update Basemap Tiles (Dark Canvas vs High-Res Satellite)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
      baseTileLayerRef.current = null;
    }
    if (refTileLayerRef.current) {
      map.removeLayer(refTileLayerRef.current);
      refTileLayerRef.current = null;
    }

    if (basemap === 'dark') {
      baseTileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
          maxZoom: 19,
        }
      ).addTo(map);

      refTileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '',
          maxZoom: 19,
          pane: 'overlayPane',
        }
      ).addTo(map);
    } else {
      // High-Resolution ESRI World Imagery
      baseTileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri',
          maxZoom: 19,
        }
      ).addTo(map);

      // Boundaries & Geography Reference Overlay
      refTileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '',
          maxZoom: 19,
          pane: 'overlayPane',
        }
      ).addTo(map);
    }
  }, [basemap]);

  // Update Markers + Linear Alignments whenever projects/selectedProject/basemap change
  useEffect(() => {
    const clusterGroup = clusterGroupRef.current;
    const polylineLayer = polylineLayerRef.current;
    if (!clusterGroup || !polylineLayer) return;

    clusterGroup.clearLayers();
    polylineLayer.clearLayers();

    const markers: L.Marker[] = [];
    const isSatellite = basemap === 'satellite';

    projects.forEach((project) => {
      const props = project.properties;
      const geomType = (project.geometry as { type: string }).type;
      const categoryCfg = CATEGORY_CONFIG[props.category];
      const statusCfg = STATUS_CONFIG[props.status] || STATUS_CONFIG.Unknown;

      const tooltipHtml = `
        <div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; font-size: 11px; padding: 2px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
            <span style="font-size: 9px; font-weight: 700; text-transform: uppercase; color: ${categoryCfg.color};">
              ${categoryCfg.label}
            </span>
            <span style="font-size: 9px; color: #94a3b8;">
              • ${statusCfg.label}
            </span>
          </div>
          <div style="font-size: 12px; font-weight: 700; color: #f8fafc; line-height: 1.35; max-width: 240px;">
            ${props.project_name}
          </div>
          <div style="display: flex; align-items: baseline; gap: 6px; margin-top: 4px;">
            <span style="font-size: 11px; font-weight: 700; color: #e2e8f0; font-family: monospace;">
              ${formatBudget(props.budget_idr, props.budget_raw)}
            </span>
            <span style="font-size: 10px; color: #64748b;">• Click to inspect</span>
          </div>
        </div>
      `;

      // ── Linear alignments (LineString / MultiLineString) ──────────────────
      if (geomType === 'LineString' || geomType === 'MultiLineString') {
        const lines: [number, number][][] =
          geomType === 'LineString'
            ? [(project.geometry as { type: 'LineString'; coordinates: [number, number][] }).coordinates]
            : (project.geometry as { type: 'MultiLineString'; coordinates: [number, number][][] }).coordinates;

        lines.forEach((line) => {
          // Leaflet expects [lat, lng]
          const latlngs = line.map(([lng, lat]) => [lat, lng] as [number, number]);

          // Subtle casing underlay for contrast against dark canvas or satellite imagery
          L.polyline(latlngs, {
            color: isSatellite ? 'rgba(0, 0, 0, 0.5)' : 'rgba(15, 23, 42, 0.6)',
            weight: 4.5,
            opacity: 0.6,
            interactive: false,
          }).addTo(polylineLayer!);

          // 2.5px solid path matching sector color (e.g. Transport = Blue)
          const polyline = L.polyline(latlngs, {
            color: categoryCfg.color,
            weight: 2.5,
            opacity: 0.9,
            lineCap: 'round',
            lineJoin: 'round',
          }).addTo(polylineLayer!);

          polyline.bindTooltip(tooltipHtml, {
            sticky: true,
            className: 'custom-map-tooltip',
            opacity: 0.98,
          });

          polyline.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            onSelectProject(project);
          });
        });

        return; // don't add a marker for line features
      }

      // ── Point markers ────────────────────────────────────────────────────────
      if (geomType !== 'Point') return;
      const pointGeom = project.geometry as { type: 'Point'; coordinates: [number, number] };
      const [lon, lat] = pointGeom.coordinates;
      const isSelected = selectedProject?.properties.project_id === props.project_id;
      const isNational =
        props.province === 'Lintas Provinsi' ||
        props.province === 'Nasional' ||
        props.geocode_method === 'national_fallback';

      const icon = createProjectIcon(props.category, isNational, isSelected, isSatellite);
      const marker = L.marker([lat, lon], { icon });


      marker.bindTooltip(tooltipHtml, {
        direction: 'top',
        offset: [0, -12],
        className: 'custom-map-tooltip',
        opacity: 0.98,
      });

      const popupHtml = `
        <div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; min-width: 250px; max-width: 280px; padding: 10px 12px; background: #0f172a;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 9px; font-weight: 700; text-transform: uppercase; color: ${categoryCfg.color};">
              ${categoryCfg.label}
            </span>
            <span style="font-size: 9px; color: #94a3b8; font-weight: 500;">
              ${statusCfg.label}
            </span>
          </div>
          <div style="font-size: 13px; font-weight: 700; color: #f8fafc; line-height: 1.35; margin-bottom: 8px;">
            ${props.project_name}
          </div>
          <div style="font-size: 11px; border-top: 1px solid #1e293b; border-bottom: 1px solid #1e293b; padding: 6px 0; margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
              <span style="color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 600;">Investasi</span>
              <span style="font-weight: 700; color: #f8fafc; font-family: monospace;">${formatBudget(props.budget_idr, props.budget_raw)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 600;">PJPK</span>
              <span style="color: #94a3b8; font-size: 10px; max-width: 170px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; text-align: right;">${props.pjpk || 'Kementerian Terkait'}</span>
            </div>
          </div>
          <button id="inspect-btn-${props.project_id}" style="width: 100%; background: #1e293b; color: #f8fafc; font-weight: 600; font-size: 11px; padding: 6px 10px; border-radius: 4px; border: 1px solid #334155; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
            <span>Inspect Project Details</span> &rarr;
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: 'custom-map-popup',
        offset: [0, -12],
        closeButton: false,
      });

      marker.on('popupopen', (e) => {
        const el = e.popup.getElement();
        if (el) {
          const btn = el.querySelector(`#inspect-btn-${props.project_id}`);
          if (btn) {
            btn.addEventListener('click', (btnEvent) => {
              btnEvent.stopPropagation();
              onSelectProject(project);
            });
          }
        }
      });

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectProject(project);
      });

      markers.push(marker);
    });

    clusterGroup.addLayers(markers);
  }, [projects, selectedProject, onSelectProject, basemap]);


  // Handle Fly-To coordinates (from project list / marker click)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !flyToCoords) return;

    const currentZoom = map.getZoom();
    const targetZoom = Math.max(currentZoom, 8);
    map.flyTo(flyToCoords, targetZoom, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [flyToCoords]);

  // Handle "Focus IKN Nusantara" camera preset
  useEffect(() => {
    if (!focusIKNCounter) return;
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo(IKN_CENTER, IKN_ZOOM, { duration: 1.6, easeLinearity: 0.2 });
  }, [focusIKNCounter]);


  return (
    <div className={`relative w-full h-full ${basemap === 'satellite' ? 'is-satellite' : ''}`}>
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};

