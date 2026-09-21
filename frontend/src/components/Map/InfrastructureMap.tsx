import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import { ProjectFeature } from '../../types/project';
import { BatchingPlantFeature } from '../../types/batchingPlant';
import { FaultLineFeature } from '../../types/faultLine';
import { MaterialHubFeature } from '../../types/materialHub';
import { ShippingRouteFeature, PortHubFeature } from '../../types/maritimeLogistics';
import { createProjectIcon } from './ProjectMarker';
import { createBatchingPlantIcon } from './BatchingPlantMarker';
import { createMaterialHubIcon, MATERIAL_HUB_CONFIG } from './MaterialHubMarker';
import { MeasureTool } from './MeasureTool';
import { CATEGORY_CONFIG, STATUS_CONFIG } from '../../constants/categories';
import { formatBudget } from '../../utils/formatters';
import { getLatestWeatherUrls } from '../../utils/rainRadar';
import { ProvincialHeatmapLayer } from './ProvincialHeatmapLayer';
import { KekCorridorsLayer } from './KekCorridorsLayer';
import { MegathrustLayer } from './MegathrustLayer';
import { X } from 'lucide-react';

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
  batchingPlants?: BatchingPlantFeature[];
  showBatchingPlants?: boolean;
  showSupplyBuffers?: boolean;
  faultLines?: FaultLineFeature[];
  showFaultLines?: boolean;
  shippingRoutes?: ShippingRouteFeature[];
  portHubs?: PortHubFeature[];
  showMaritimeRoutes?: boolean;
  showRainRadar?: boolean;
  weatherMode?: 'radar' | 'satellite';
  onWeatherModeChange?: (mode: 'radar' | 'satellite') => void;
  showProvincialHeatmap?: boolean;
  onToggleProvincialHeatmap?: () => void;
  onSelectProvince?: (provinceName: string) => void;
  showKekCorridors?: boolean;
  onToggleKekCorridors?: () => void;
  showMegathrust?: boolean;
  onToggleMegathrust?: () => void;
  materialHubs?: MaterialHubFeature[];
  showMaterialHubs?: {
    quarry: boolean;
    steel: boolean;
    cement: boolean;
    facade: boolean;
    batching: boolean;
  };
  opportunityFinder?: {
    isOpen: boolean;
    center: [number, number] | null;
    radiusKm: number;
    isPickingLocation: boolean;
    onPickLocation: (coords: [number, number]) => void;
  };
  onMapReady?: (map: L.Map) => void;
}

export const InfrastructureMap: React.FC<InfrastructureMapProps> = ({
  projects,
  selectedProject,
  onSelectProject,
  flyToCoords,
  focusIKNCounter = 0,
  basemap = 'satellite',
  batchingPlants = [],
  showBatchingPlants = false,
  showSupplyBuffers = false,
  faultLines = [],
  showFaultLines = true,
  shippingRoutes = [],
  portHubs = [],
  showMaritimeRoutes = true,
  showRainRadar = false,
  weatherMode = 'radar',
  onWeatherModeChange,
  showProvincialHeatmap = false,
  onToggleProvincialHeatmap,
  onSelectProvince,
  showKekCorridors = false,
  onToggleKekCorridors,
  showMegathrust = false,
  onToggleMegathrust,
  materialHubs = [],
  showMaterialHubs,
  opportunityFinder,
  onMapReady,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const polylineLayerRef = useRef<L.FeatureGroup | null>(null);
  const supplyBufferLayerRef = useRef<L.FeatureGroup | null>(null);
  const batchingPlantLayerRef = useRef<L.FeatureGroup | null>(null);
  const faultLineLayerRef = useRef<L.FeatureGroup | null>(null);
  const materialHubLayerRef = useRef<L.FeatureGroup | null>(null);
  const maritimeLayerRef = useRef<L.FeatureGroup | null>(null);
  const opportunityLayerRef = useRef<L.FeatureGroup | null>(null);
  const rainRadarLayerRef = useRef<L.TileLayer | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const refTileLayerRef = useRef<L.TileLayer | null>(null);
  const [mapReady, setMapReady] = useState<L.Map | null>(null);
  const [showRainLegend, setShowRainLegend] = useState<boolean>(true);

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
          html: `<div class="custom-cluster-icon"><span>${count}</span></div>`,
          className: 'marker-cluster-custom',
          iconSize: L.point(36, 36),
        });
      },
    });

    map.addLayer(clusterGroup);
    clusterGroupRef.current = clusterGroup;

    // Dedicated FeatureGroup for 90-minute concrete supply buffers (15km & 30km)
    const supplyBufferLayer = L.featureGroup().addTo(map);
    supplyBufferLayerRef.current = supplyBufferLayer;

    // Dedicated FeatureGroup for commercial batching plants & precast facilities
    const batchingPlantLayer = L.featureGroup().addTo(map);
    batchingPlantLayerRef.current = batchingPlantLayer;

    // Dedicated FeatureGroup for construction material supply hubs (Quarry, Steel, Cement, Facade)
    const materialHubLayer = L.featureGroup().addTo(map);
    materialHubLayerRef.current = materialHubLayer;

    // Dedicated FeatureGroup for linear alignments (LineString / MultiLineString)
    const polylineLayer = L.featureGroup().addTo(map);
    polylineLayerRef.current = polylineLayer;

    // Dedicated FeatureGroup for Indonesian active fault lines overlay (PuSGeN)
    const faultLineLayer = L.featureGroup().addTo(map);
    faultLineLayerRef.current = faultLineLayer;

    // Dedicated FeatureGroup for Maritime Freight Logistics Network (Tol Laut Material)
    const maritimeLayer = L.featureGroup().addTo(map);
    maritimeLayerRef.current = maritimeLayer;

    // Dedicated FeatureGroup for Site Radius Opportunity Finder
    const opportunityLayer = L.featureGroup().addTo(map);
    opportunityLayerRef.current = opportunityLayer;

    mapInstanceRef.current = map;
    setMapReady(map);
    onMapReady?.(map);

    return () => {
      clusterGroup.clearLayers();
      polylineLayer.clearLayers();
      supplyBufferLayer.clearLayers();
      batchingPlantLayer.clearLayers();
      materialHubLayer.clearLayers();
      faultLineLayer.clearLayers();
      maritimeLayer.clearLayers();
      opportunityLayer.clearLayers();
      if (rainRadarLayerRef.current) {
        rainRadarLayerRef.current.remove();
        rainRadarLayerRef.current = null;
      }
      map.remove();
      mapInstanceRef.current = null;
      setMapReady(null);
      clusterGroupRef.current = null;
      polylineLayerRef.current = null;
      supplyBufferLayerRef.current = null;
      batchingPlantLayerRef.current = null;
      materialHubLayerRef.current = null;
      faultLineLayerRef.current = null;
      maritimeLayerRef.current = null;
      opportunityLayerRef.current = null;
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

  // Render Commercial Batching Plants & Spatial Supply Buffers
  useEffect(() => {
    const plantLayer = batchingPlantLayerRef.current;
    const bufferLayer = supplyBufferLayerRef.current;
    if (!plantLayer || !bufferLayer) return;

    plantLayer.clearLayers();
    bufferLayer.clearLayers();

    if (!showBatchingPlants) return;

    batchingPlants.forEach((plant) => {
      const [lon, lat] = plant.geometry.coordinates;
      const p = plant.properties;

      // ── Spatial Delivery Buffers (Concentric ASTM/SNI radii) ──────────────
      if (showSupplyBuffers) {
        // 30 km Outer Limit (Amber, opacity 0.08): Max Retarded Delivery Limit
        L.circle([lat, lon], {
          radius: 30000,
          color: '#F59E0B',
          weight: 1.2,
          opacity: 0.5,
          fillColor: '#F59E0B',
          fillOpacity: 0.08,
          dashArray: '4, 4',
          interactive: false,
        }).addTo(bufferLayer);

        // 15 km Inner Circle (Green, opacity 0.12): Optimal Delivery Radius (ASTM/SNI 90-min limit)
        L.circle([lat, lon], {
          radius: 15000,
          color: '#10B981',
          weight: 1.2,
          opacity: 0.65,
          fillColor: '#10B981',
          fillOpacity: 0.12,
          dashArray: '3, 3',
          interactive: false,
        }).addTo(bufferLayer);
      }

      // ── Batching Plant Marker Pin ──────────────────────────────────────────
      const icon = createBatchingPlantIcon(p);
      const marker = L.marker([lat, lon], { icon });

      // Clean Editorial Tooltip
      const tooltipHtml = `
        <div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; font-size: 11px; padding: 2px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
            <span style="font-size: 9px; font-weight: 700; text-transform: uppercase; color: #F59E0B;">
              ${p.operator}
            </span>
            <span style="font-size: 9px; color: #94a3b8;">
              • ${p.capacity_m3_per_hour} m³/h
            </span>
          </div>
          <div style="font-size: 12px; font-weight: 700; color: #f8fafc; line-height: 1.35; max-width: 240px;">
            ${p.name}
          </div>
          <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">
            ${p.type} • ${p.city}, ${p.province}
          </div>
        </div>
      `;

      marker.bindTooltip(tooltipHtml, {
        direction: 'top',
        offset: [0, -12],
        className: 'custom-map-tooltip',
        opacity: 0.98,
      });

      // Interactive Placard Popup
      const popupHtml = `
        <div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; min-width: 240px; padding: 10px 12px; background: #0f172a;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 9px; font-weight: 700; text-transform: uppercase; color: #F59E0B;">
              ${p.operator}
            </span>
            <span style="font-size: 9px; color: #10B981; font-weight: 600;">
              Active Batching Facility
            </span>
          </div>
          <div style="font-size: 13px; font-weight: 700; color: #f8fafc; line-height: 1.35; margin-bottom: 8px;">
            ${p.name}
          </div>
          <div style="font-size: 11px; border-top: 1px solid #1e293b; padding-top: 6px; margin-bottom: 6px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span style="color: #64748b; font-size: 10px;">Capacity</span>
              <span style="font-weight: 700; color: #f8fafc; font-family: monospace;">${p.capacity_m3_per_hour} m³/hour</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span style="color: #64748b; font-size: 10px;">Facility Type</span>
              <span style="color: #cbd5e1; font-size: 10px;">${p.type}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b; font-size: 10px;">Location</span>
              <span style="color: #cbd5e1; font-size: 10px;">${p.city}, ${p.province}</span>
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: 'custom-map-popup',
        offset: [0, -12],
      });

      marker.addTo(plantLayer);
    });
  }, [batchingPlants, showBatchingPlants, showSupplyBuffers]);

  // Update Indonesian Active Fault Lines Overlay (PuSGeN / Badan Geologi)
  useEffect(() => {
    const faultLayer = faultLineLayerRef.current;
    if (!faultLayer) return;

    faultLayer.clearLayers();
    if (!showFaultLines || !faultLines || faultLines.length === 0) return;

    faultLines.forEach((feature) => {
      const coords = feature.geometry.coordinates;
      if (!coords || coords.length === 0) return;

      // Leaflet requires [lat, lon] pairs
      const latLngs: L.LatLngExpression[] = coords.map(([lon, lat]) => [lat, lon]);

      // Subtle glowing red underlay
      const glowPolyline = L.polyline(latLngs, {
        color: '#EF4444',
        weight: 6,
        opacity: 0.35,
        lineCap: 'round',
        lineJoin: 'round',
        interactive: false,
      });
      faultLayer.addLayer(glowPolyline);

      // Sharp primary active fault polyline
      const faultPolyline = L.polyline(latLngs, {
        color: '#EF4444',
        weight: 2.5,
        opacity: 0.92,
        lineCap: 'round',
        lineJoin: 'round',
      });

      // Hover tooltip: Fault Name, Slip Rate, Mechanism
      const p = feature.properties;
      const tooltipHtml = `
        <div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; min-width: 200px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 3px;">
            <div style="display: flex; align-items: center; gap: 5px;">
              <span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background-color: #EF4444; box-shadow: 0 0 6px #EF4444;"></span>
              <strong style="font-size: 12px; color: #ffffff; line-height: 1.2;">${p.name}</strong>
            </div>
            <span style="font-size: 9px; font-weight: 700; color: #ef4444; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); padding: 1px 4px; rounded: 3px; font-family: monospace;">
              ${p.island}
            </span>
          </div>
          <div style="font-size: 11px; color: #cbd5e1; border-top: 1px solid #334155; padding-top: 4px; margin-top: 2px; line-height: 1.4;">
            <div>Mekanisme: <span style="color: #fca5a5; font-weight: 600;">${p.fault_type}</span></div>
            <div>Slip Rate: <span style="color: #fef08a; font-weight: 700; font-family: monospace;">${p.slip_rate_mm_year} mm/tahun</span></div>
            <div style="color: #94a3b8; font-size: 9px; margin-top: 2px;">Sumber: ${p.source}</div>
          </div>
        </div>
      `;

      faultPolyline.bindTooltip(tooltipHtml, {
        direction: 'top',
        sticky: true,
        className: 'custom-fault-tooltip',
        opacity: 0.98,
      });

      faultLayer.addLayer(faultPolyline);
    });
  }, [faultLines, showFaultLines]);

  // Render Material Supply Chain Hubs (Quarry, Steel, Cement, Facade)
  useEffect(() => {
    const hubLayer = materialHubLayerRef.current;
    if (!hubLayer) return;

    hubLayer.clearLayers();

    if (!materialHubs || materialHubs.length === 0) return;

    materialHubs.forEach((hub) => {
      const p = hub.properties;

      // Filter check based on showMaterialHubs state
      if (p.hub_type === 'Quarry (Pasir & Agregat)' && showMaterialHubs && !showMaterialHubs.quarry) return;
      if (p.hub_type === 'Baja Konstruksi (Steel Mills)' && showMaterialHubs && !showMaterialHubs.steel) return;
      if (p.hub_type === 'Pabrik Semen Terpadu' && showMaterialHubs && !showMaterialHubs.cement) return;
      if (p.hub_type === 'Fasad & Kaca (Architectural Facade)' && showMaterialHubs && !showMaterialHubs.facade) return;

      const [lon, lat] = hub.geometry.coordinates;
      const icon = createMaterialHubIcon(p);
      const marker = L.marker([lat, lon], { icon });

      const cfg = MATERIAL_HUB_CONFIG[p.hub_type] || MATERIAL_HUB_CONFIG['Quarry (Pasir & Agregat)'];

      const tooltipHtml = `
        <div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; padding: 2px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
            <span style="font-size: 9px; font-weight: 700; text-transform: uppercase; color: ${cfg.color};">
              ${cfg.emoji} ${cfg.shortLabel}
            </span>
            <span style="font-size: 9px; color: #94a3b8;">
              • ${p.city}
            </span>
          </div>
          <div style="font-size: 12px; font-weight: 700; color: #f8fafc; line-height: 1.3; max-width: 260px;">
            ${p.name}
          </div>
          <div style="font-size: 10px; color: ${cfg.color}; font-weight: 600; font-family: monospace; margin-top: 3px;">
            ${p.capacity_output}
          </div>
        </div>
      `;

      marker.bindTooltip(tooltipHtml, {
        direction: 'top',
        offset: [0, -13],
        className: 'custom-map-tooltip',
        opacity: 0.98,
      });

      const popupHtml = `
        <div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; min-width: 270px; max-width: 310px; padding: 12px; background: #0b0f17; border-radius: 8px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
            <span style="font-size: 9px; font-weight: 700; text-transform: uppercase; color: ${cfg.color}; background: ${cfg.color}18; border: 1px solid ${cfg.color}40; padding: 2px 6px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;">
              <span>${cfg.emoji}</span> ${cfg.shortLabel}
            </span>
            <span style="font-size: 10px; color: #94a3b8; font-family: monospace;">
              ${p.city}, ${p.province}
            </span>
          </div>

          <div style="font-size: 13px; font-weight: 700; color: #f8fafc; line-height: 1.3; margin-bottom: 4px;">
            ${p.name}
          </div>
          <div style="font-size: 11px; color: #cbd5e1; margin-bottom: 8px;">
            Operator: <strong style="color: #f1f5f9;">${p.operator}</strong>
          </div>

          <div style="font-size: 11px; background: #111827; border: 1px solid #1f2937; border-radius: 6px; padding: 8px; margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="color: #94a3b8; font-size: 10px; text-transform: uppercase; font-weight: 600;">Kapasitas Produksi</span>
              <span style="font-weight: 700; color: ${cfg.color}; font-family: monospace; font-size: 11px;">${p.capacity_output}</span>
            </div>
            <div style="border-top: 1px solid #1f2937; padding-top: 4px; margin-top: 4px;">
              <span style="color: #94a3b8; font-size: 10px; text-transform: uppercase; font-weight: 600; display: block; margin-bottom: 2px;">Pasar Utama / Koridor</span>
              <span style="color: #e2e8f0; font-size: 11px; line-height: 1.35; display: block;">${p.key_supplied_markets}</span>
            </div>
          </div>

          ${
            p.special_feature
              ? `
            <div style="font-size: 10.5px; background: rgba(6, 182, 212, 0.1); border: 1px solid rgba(6, 182, 212, 0.3); border-radius: 6px; padding: 6px 8px; color: #67e8f9; line-height: 1.35;">
              <strong>⚓ Catatan Logistik:</strong> ${p.special_feature}
            </div>
          `
              : ''
          }
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: 'custom-map-popup',
        offset: [0, -13],
        closeButton: false,
      });

      hubLayer.addLayer(marker);
    });
  }, [materialHubs, showMaterialHubs]);

  // Render Inter-Island Maritime Freight Logistics Network (Tol Laut Material)
  useEffect(() => {
    const layer = maritimeLayerRef.current;
    if (!layer) return;

    layer.clearLayers();
    if (!showMaritimeRoutes) return;

    // 1. Render Shipping Corridors (Curved nautical LineStrings)
    if (shippingRoutes && shippingRoutes.length > 0) {
      shippingRoutes.forEach((route) => {
        const coords = route.geometry.coordinates;
        if (!coords || coords.length === 0) return;

        // Leaflet takes [lat, lon]
        const latLngs: L.LatLngExpression[] = coords.map(([lon, lat]) => [lat, lon]);

        // Glowing underlay casing
        const glowLine = L.polyline(latLngs, {
          color: '#0891b2',
          weight: 6,
          opacity: 0.25,
          lineCap: 'round',
          lineJoin: 'round',
          interactive: false,
        });
        layer.addLayer(glowLine);

        // Nautical dashed line: color #06B6D4, weight 2.5, dashArray '6, 8', opacity 0.85
        const shippingLine = L.polyline(latLngs, {
          color: '#06B6D4',
          weight: 2.5,
          dashArray: '6, 8',
          opacity: 0.85,
          lineCap: 'round',
          lineJoin: 'round',
        });

        // Hover tooltip
        const p = route.properties;
        const tooltipHtml = `
          <div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; font-size: 11px; padding: 2px;">
            <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 2px;">
              <span style="font-size: 13px;">🚢</span>
              <strong style="font-size: 12px; color: #38bdf8; line-height: 1.2;">${p.name}</strong>
            </div>
            <div style="font-size: 10px; color: #94a3b8; margin-bottom: 3px;">
              ${p.corridor}
            </div>
            <div style="font-size: 10.5px; color: #f1f5f9; border-top: 1px solid #334155; padding-top: 3px;">
              📦 Muatan: <strong style="color: #67e8f9;">${p.cargo}</strong>
            </div>
            <div style="font-size: 10px; color: #fde047; font-family: monospace; margin-top: 2px;">
              ⏱️ Waktu Tempuh: ${p.transit_time}
            </div>
          </div>
        `;
        shippingLine.bindTooltip(tooltipHtml, {
          sticky: true,
          className: 'custom-map-tooltip',
          opacity: 0.98,
        });

        // Detailed interactive popup
        const popupHtml = `
          <div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; min-width: 270px; max-width: 320px; padding: 4px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="font-size: 16px;">🚢</span>
                <strong style="font-size: 13px; color: #38bdf8; font-weight: 700; line-height: 1.2;">${p.name}</strong>
              </div>
              <span style="font-size: 9px; font-weight: 700; color: #06b6d4; background: rgba(6, 182, 212, 0.15); border: 1px solid rgba(6, 182, 212, 0.4); padding: 2px 6px; border-radius: 4px; font-family: monospace; white-space: nowrap;">
                ${p.primary_material}
              </span>
            </div>
            
            <div style="font-size: 11px; font-weight: 600; color: #e2e8f0; background: rgba(15, 23, 42, 0.6); padding: 5px 8px; border-radius: 6px; border: 1px solid rgba(51, 65, 85, 0.6); margin-bottom: 8px;">
              📍 ${p.corridor}
            </div>

            <div style="display: flex; flex-direction: column; gap: 5px; font-size: 11px; color: #cbd5e1; border-top: 1px solid #334155; padding-top: 6px;">
              <div><span style="color: #94a3b8;">📦 Muatan Material:</span> <strong style="color: #f1f5f9;">${p.cargo}</strong></div>
              <div><span style="color: #94a3b8;">⚓ Armada Kapal:</span> <strong style="color: #a5f3fc;">${p.vessel_type}</strong></div>
              <div style="display: flex; justify-content: space-between; gap: 8px;">
                <span><span style="color: #94a3b8;">⏱️ Transit:</span> <strong style="color: #fde047; font-family: monospace;">${p.transit_time}</strong></span>
                <span><span style="color: #94a3b8;">🔄 Frekuensi:</span> <strong style="color: #86efac;">${p.frequency}</strong></span>
              </div>
            </div>

            <div style="font-size: 10.5px; color: #94a3b8; line-height: 1.4; margin-top: 8px; padding-top: 6px; border-top: 1px dashed #334155;">
              ℹ️ ${p.description}
            </div>
          </div>
        `;
        shippingLine.bindPopup(popupHtml, {
          className: 'custom-map-popup',
          maxWidth: 340,
        });

        layer.addLayer(shippingLine);
      });
    }

    // 2. Render Port Hubs (Point features with anchor badge)
    if (portHubs && portHubs.length > 0) {
      portHubs.forEach((hub) => {
        const [lon, lat] = hub.geometry.coordinates;
        const p = hub.properties;

        const portIcon = L.divIcon({
          className: 'port-hub-icon',
          html: `
            <div style="
              width: 24px;
              height: 24px;
              border-radius: 50%;
              background: #0891b2;
              border: 2px solid #22d3ee;
              box-shadow: 0 0 10px rgba(6, 182, 212, 0.7);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 11px;
              color: white;
              cursor: pointer;
              transition: transform 0.15s ease;
            " title="${p.name}">⚓</div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
          popupAnchor: [0, -12],
        });

        const marker = L.marker([lat, lon], { icon: portIcon });

        const tooltipHtml = `
          <div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; font-size: 11px;">
            <div style="display: flex; align-items: center; gap: 4px;">
              <span>⚓</span>
              <strong style="color: #ffffff;">${p.name}</strong>
            </div>
            <div style="font-size: 10px; color: #67e8f9; margin-top: 1px;">${p.port_type}</div>
          </div>
        `;
        marker.bindTooltip(tooltipHtml, {
          direction: 'top',
          className: 'custom-map-tooltip',
          opacity: 0.98,
        });

        const popupHtml = `
          <div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; min-width: 230px; padding: 3px;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span style="font-size: 15px;">⚓</span>
              <div>
                <strong style="font-size: 12px; color: #ffffff;">${p.name}</strong>
                <div style="font-size: 10px; color: #94a3b8;">${p.city}</div>
              </div>
            </div>
            <div style="font-size: 11px; color: #cbd5e1; border-top: 1px solid #334155; padding-top: 5px; margin-top: 4px; line-height: 1.4;">
              <div>Tipe: <span style="color: #38bdf8; font-weight: 600;">${p.port_type}</span></div>
              <div>Fokus Kargo: <span style="color: #f1f5f9; font-weight: 600;">${p.cargo_focus}</span></div>
              <div style="margin-top: 4px; font-size: 10px; color: #94a3b8;">
                Rute Tol Laut: <span style="color: #06b6d4;">${p.key_routes.join(', ')}</span>
              </div>
            </div>
          </div>
        `;
        marker.bindPopup(popupHtml, {
          className: 'custom-map-popup',
          maxWidth: 280,
        });

        layer.addLayer(marker);
      });
    }
  }, [shippingRoutes, portHubs, showMaritimeRoutes]);

  // Handle Live Weather Overlay (Radar Presipitasi Hujan & Satelit Awan Real-Time)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    let isMounted = true;
    let refreshInterval: ReturnType<typeof setInterval> | null = null;

    const loadWeatherLayer = async (forceRefresh = false) => {
      try {
        const urls = await getLatestWeatherUrls(forceRefresh);
        if (!isMounted) return;

        if (rainRadarLayerRef.current) {
          map.removeLayer(rainRadarLayerRef.current);
          rainRadarLayerRef.current = null;
        }

        if (showRainRadar && urls) {
          let layer: L.TileLayer;
          if (weatherMode === 'satellite') {
            layer = L.tileLayer(urls.satelliteUrl, {
              opacity: 0.60,
              zIndex: 420,
              maxNativeZoom: 6, // Himawari-9 / NASA GIBS clean infrared native resolution
              maxZoom: 19,      // Auto-scales smoothly all the way to zoom 19
              minZoom: 2,
              tileSize: 256,
              attribution: '&copy; <a href="https://earthdata.nasa.gov" target="_blank" rel="noopener noreferrer">Himawari-9 / NASA GIBS</a>',
            });
          } else {
            layer = L.tileLayer(urls.radarUrl, {
              opacity: 0.65,
              zIndex: 420,
              maxNativeZoom: 7, // RainViewer public native tile limit (prevents "Zoom Level Not Supported" tiles on zooms 8-19)
              maxZoom: 19,      // Auto-scales zoom 7 tiles cleanly up to zoom 19
              minZoom: 2,
              tileSize: 256,
              attribution: '&copy; <a href="https://www.rainviewer.com" target="_blank" rel="noopener noreferrer">RainViewer</a>',
            });
          }
          layer.addTo(map);
          rainRadarLayerRef.current = layer;
        }
      } catch (err) {
        console.error('Failed to load live weather layer:', err);
      }
    };

    if (showRainRadar) {
      setShowRainLegend(true);
      loadWeatherLayer();

      // Refresh weather timestamp every 10 minutes
      refreshInterval = setInterval(() => {
        loadWeatherLayer(true);
      }, 10 * 60 * 1000);
    } else {
      if (rainRadarLayerRef.current) {
        map.removeLayer(rainRadarLayerRef.current);
        rainRadarLayerRef.current = null;
      }
    }

    return () => {
      isMounted = false;
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [showRainRadar, weatherMode, mapReady]);

  // Handle Fly-To coordinates (from project list / marker click)

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !flyToCoords) return;

    const currentZoom = map.getZoom();
    const targetZoom = Math.max(currentZoom, 12);
    map.flyTo(flyToCoords, targetZoom, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [flyToCoords, mapReady]);

  // Handle "Focus IKN Nusantara" camera preset
  useEffect(() => {
    if (!focusIKNCounter) return;
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo(IKN_CENTER, IKN_ZOOM, { duration: 1.6, easeLinearity: 0.2 });
  }, [focusIKNCounter]);

  // Render Opportunity Finder Radius Circle & Center Target Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = opportunityLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    if (!opportunityFinder?.isOpen || !opportunityFinder.center) {
      return;
    }

    const [centerLat, centerLon] = opportunityFinder.center;

    // Glowing buffer circle
    const circle = L.circle([centerLat, centerLon], {
      radius: opportunityFinder.radiusKm * 1000,
      color: '#3B82F6',
      weight: 2,
      fillColor: '#3B82F6',
      fillOpacity: 0.08,
      dashArray: '4, 4',
      interactive: false,
    });
    layer.addLayer(circle);

    // Target Icon Center Marker
    const targetIcon = L.divIcon({
      className: 'opportunity-target-icon',
      html: `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(15, 20, 28, 0.95);
          border: 2px solid #3B82F6;
          box-shadow: 0 0 18px rgba(59, 130, 246, 0.7), 0 4px 6px -1px rgba(0,0,0,0.5);
          font-size: 18px;
          cursor: pointer;
        ">
          🎯
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    const marker = L.marker([centerLat, centerLon], {
      icon: targetIcon,
      zIndexOffset: 1200,
    });

    marker.bindPopup(`
      <div style="font-family: sans-serif; font-size: 12px; color: #f1f5f9; padding: 4px; min-width: 160px;">
        <div style="display:flex; align-items:center; gap: 6px;">
          <span style="font-size: 15px;">🎯</span>
          <strong style="color: #60A5FA; font-size: 13px;">Pusat Radar Vendor</strong>
        </div>
        <div style="margin-top: 6px; color: #94a3b8; font-size: 11px;">
          Radius Jangkauan: <span style="color: #fff; font-weight: bold;">${opportunityFinder.radiusKm} km</span>
        </div>
        <div style="font-size: 10px; color: #64748b; font-family: monospace; margin-top: 3px;">
          ${centerLat.toFixed(5)}, ${centerLon.toFixed(5)}
        </div>
      </div>
    `, {
      className: 'custom-map-popup',
      offset: [0, -12],
    });

    layer.addLayer(marker);
  }, [
    opportunityFinder?.isOpen,
    opportunityFinder?.center?.[0],
    opportunityFinder?.center?.[1],
    opportunityFinder?.radiusKm,
  ]);

  // Handle "Klik Peta" to drop target center pin
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!opportunityFinder?.isOpen || !opportunityFinder.isPickingLocation) {
      return;
    }

    const container = map.getContainer();
    const originalCursor = container.style.cursor;
    container.style.cursor = 'crosshair';

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      opportunityFinder.onPickLocation([e.latlng.lat, e.latlng.lng]);
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
      container.style.cursor = originalCursor;
    };
  }, [
    opportunityFinder?.isOpen,
    opportunityFinder?.isPickingLocation,
    opportunityFinder?.onPickLocation,
  ]);

  return (
    <div className={`relative w-full h-full ${basemap === 'satellite' ? 'is-satellite' : ''}`}>
      <div ref={mapContainerRef} className="w-full h-full" />
      <MeasureTool map={mapReady} forceCloseTrigger={selectedProject} />

      {/* Provincial Investment & Budget Heatmap Layer */}
      <ProvincialHeatmapLayer
        map={mapReady}
        projects={projects}
        isActive={showProvincialHeatmap}
        onSelectProvince={onSelectProvince}
        onClose={onToggleProvincialHeatmap}
      />

      {/* Strategic Hilirisasi & KEK Industrial Corridors Layer */}
      <KekCorridorsLayer
        map={mapReady}
        isActive={showKekCorridors}
        onClose={onToggleKekCorridors}
      />

      {/* Indonesian Megathrust Subduction Segments & Tsunami Hazard Layer */}
      <MegathrustLayer
        map={mapReady}
        isActive={showMegathrust}
        onClose={onToggleMegathrust}
      />

      {/* Floating Weather Overlay Control & Legend */}
      {showRainRadar && showRainLegend && (
        <div className="absolute bottom-6 left-4 z-[1000] flex flex-wrap sm:flex-nowrap items-center gap-2.5 px-3 py-2 rounded-xl bg-[#0f141c]/95 backdrop-blur-md border border-neutral-700 shadow-2xl text-xs text-neutral-200 select-none animate-in fade-in slide-in-from-bottom-2 duration-200 max-w-[95vw]">
          {/* Mode Switcher: Hujan vs Awan Satelit */}
          <div className="flex items-center rounded-lg bg-neutral-900/90 p-0.5 border border-neutral-800 shrink-0">
            <button
              type="button"
              onClick={() => onWeatherModeChange?.('radar')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                weatherMode === 'radar'
                  ? 'bg-sky-500/30 text-sky-300 border border-sky-500/60 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="Tampilkan Radar Presipitasi Hujan (RainViewer / BMKG)"
            >
              <span>🌧️</span> Hujan
            </button>
            <button
              type="button"
              onClick={() => onWeatherModeChange?.('satellite')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                weatherMode === 'satellite'
                  ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/60 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="Tampilkan Citra Satelit Awan Real-Time (Himawari-9 Infrared)"
            >
              <span>☁️</span> Awan Satelit
            </button>
          </div>

          {/* Legend Items based on mode */}
          {weatherMode === 'radar' ? (
            <div className="flex items-center gap-2 text-[11px] font-medium border-l border-neutral-800 pl-2">
              <span className="flex items-center gap-1 text-emerald-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 inline-block shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                <span>Ringan</span>
              </span>
              <span className="text-neutral-600">•</span>
              <span className="flex items-center gap-1 text-amber-300">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0 inline-block shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
                <span>Sedang</span>
              </span>
              <span className="text-neutral-600">•</span>
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 inline-block shadow-[0_0_6px_rgba(244,63,94,0.5)]" />
                <span>Lebat</span>
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[11px] font-medium border-l border-neutral-800 pl-2">
              <span className="text-neutral-400">Himawari-9 IR:</span>
              <span className="flex items-center gap-1 text-cyan-300">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0 inline-block shadow-[0_0_6px_rgba(34,211,238,0.5)]" />
                <span>Awan Tebal / Konvektif</span>
              </span>
              <span className="text-neutral-600">•</span>
              <span className="flex items-center gap-1 text-neutral-300">
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-400 shrink-0 inline-block" />
                <span>Awan Tipis</span>
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowRainLegend(false)}
            className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors ml-auto shrink-0"
            title="Tutup Legenda Cuaca"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

