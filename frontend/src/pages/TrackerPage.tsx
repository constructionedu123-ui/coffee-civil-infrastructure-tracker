import React, { useState, useEffect, useMemo } from 'react';
import {
  ProjectFeature,
  ProjectCategory,
  ProjectStatus,
  ProjectFeatureCollection,
  getProjectCoordinates,
} from '../types/project';
import {
  BatchingPlantFeature,
  BatchingPlantFeatureCollection,
} from '../types/batchingPlant';
import {
  FaultLineFeature,
  FaultLineFeatureCollection,
} from '../types/faultLine';
import {
  MaterialHubFeature,
  MaterialHubFeatureCollection,
} from '../types/materialHub';
import { Header } from '../components/Header';
import { KPICards } from '../components/KPICards';
import { FilterBar, MaterialHubFilterState } from '../components/FilterBar';
import { InfrastructureMap } from '../components/Map/InfrastructureMap';
import { MapLegend } from '../components/Map/MapLegend';
import { ProjectDrawer } from '../components/ProjectDrawer';
import { ProjectList } from '../components/ProjectList';
import { ProjectTable } from '../components/ProjectTable';
import { AnalyticsDrawer } from '../components/AnalyticsDrawer';
import { SubmitProjectModal } from '../components/SubmitProjectModal';
import { RadiusOpportunityFinder, OpportunityPreset } from '../components/RadiusOpportunityFinder';
import {
  ShippingRouteFeature,
  ShippingRouteFeatureCollection,
  PortHubFeature,
  PortHubFeatureCollection,
} from '../types/maritimeLogistics';
import { exportAsGeoJSON, exportAsCSV } from '../utils/export';
import { projectMatchesContractor } from '../utils/contractorMatcher';
import { getRegionForProvince } from '../utils/geo';
import { Loader2, AlertTriangle } from 'lucide-react';

export const TrackerPage: React.FC = () => {
  const [allProjects, setAllProjects] = useState<ProjectFeature[]>([]);
  const [batchingPlants, setBatchingPlants] = useState<BatchingPlantFeature[]>([]);
  const [faultLines, setFaultLines] = useState<FaultLineFeature[]>([]);
  const [materialHubs, setMaterialHubs] = useState<MaterialHubFeature[]>([]);
  const [shippingRoutes, setShippingRoutes] = useState<ShippingRouteFeature[]>([]);
  const [portHubs, setPortHubs] = useState<PortHubFeature[]>([]);
  const [showSupplyBuffers, setShowSupplyBuffers] = useState<boolean>(false);
  const [showFaultLines, setShowFaultLines] = useState<boolean>(true);
  const [showMaritimeRoutes, setShowMaritimeRoutes] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Material Hubs Filters (Quarry, Steel, Cement, Facade, Batching)
  const [materialFilters, setMaterialFilters] = useState<MaterialHubFilterState>({
    quarry: true,
    steel: true,
    cement: true,
    facade: true,
    batching: true,
  });

  // View Switcher State ('map' | 'table')
  const [activeView, setActiveView] = useState<'map' | 'table'>('map');

  // Analytics & Submission Modal States
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState<boolean>(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [selectedContractor, setSelectedContractor] = useState<string | null>(null);

  // Radius Opportunity & Vendor Lead Finder States
  const [isOpportunityFinderOpen, setIsOpportunityFinderOpen] = useState<boolean>(false);
  const [opportunityCenter, setOpportunityCenter] = useState<[number, number] | null>(null);
  const [opportunityRadiusKm, setOpportunityRadiusKm] = useState<number>(25);
  const [isPickingOpportunityCenter, setIsPickingOpportunityCenter] = useState<boolean>(false);
  const [opportunityPresetName, setOpportunityPresetName] = useState<string>('jabodetabek');
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<ProjectCategory[]>([
    'Transport',
    'Energy',
    'Water',
    'Housing',
    'IKN',
    'Commercial & Private',
  ]);
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | 'All'>('All');
  const [selectedRegion, setSelectedRegion] = useState<string | 'All'>('All');

  // UI Drawer and List states
  const [selectedProject, setSelectedProject] = useState<ProjectFeature | null>(null);
  const [isListOpen, setIsListOpen] = useState<boolean>(false);
  const [flyToCoords, setFlyToCoords] = useState<[number, number] | null>(null);
  const [focusIKNCounter, setFocusIKNCounter] = useState<number>(0);
  const [basemap, setBasemap] = useState<'dark' | 'satellite'>('satellite');

  // Fetch GeoJSON data on mount (Projects, Batching Plants, Fault Lines, Material Hubs)
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [resProjects, resPlants, resFaults, resHubs, resRoutes, resPorts] = await Promise.all([
          fetch('/data/projects.geojson'),
          fetch('/data/batching_plants.geojson'),
          fetch('/data/fault_lines.geojson'),
          fetch('/data/material_hubs.geojson'),
          fetch('/data/shipping_routes.geojson'),
          fetch('/data/port_hubs.geojson'),
        ]);

        if (!resProjects.ok) {
          throw new Error(`Failed to load data/projects.geojson: HTTP ${resProjects.status}`);
        }
        const dataProjects: ProjectFeatureCollection = await resProjects.json();

        // Merge with locally stored community/private submissions
        let userProjects: ProjectFeature[] = [];
        try {
          const stored = localStorage.getItem('coffee_civil_user_projects');
          if (stored) {
            userProjects = JSON.parse(stored);
          }
        } catch (e) {
          console.warn('Error reading user submitted projects from storage:', e);
        }

        setAllProjects([...userProjects, ...(dataProjects.features || [])]);

        if (resPlants.ok) {
          const dataPlants: BatchingPlantFeatureCollection = await resPlants.json();
          setBatchingPlants(dataPlants.features || []);
        }

        if (resFaults.ok) {
          const dataFaults: FaultLineFeatureCollection = await resFaults.json();
          setFaultLines(dataFaults.features || []);
        }

        if (resHubs.ok) {
          const dataHubs: MaterialHubFeatureCollection = await resHubs.json();
          setMaterialHubs(dataHubs.features || []);
        }

        if (resRoutes.ok) {
          const dataRoutes: ShippingRouteFeatureCollection = await resRoutes.json();
          setShippingRoutes(dataRoutes.features || []);
        }

        if (resPorts.ok) {
          const dataPorts: PortHubFeatureCollection = await resPorts.json();
          setPortHubs(dataPorts.features || []);
        }

        setError(null);
      } catch (err: any) {
        console.error('Error fetching GIS data:', err);
        setError(err.message || 'Failed to load projects.geojson');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Category Toggle
  const handleToggleCategory = (category: ProjectCategory) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        if (prev.length === 1) return prev;
        return prev.filter((c) => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  // Material filter handlers
  const handleToggleMaterialFilter = (key: keyof MaterialHubFilterState) => {
    setMaterialFilters((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      // If batching is turned off, also turn off supply buffers
      if (key === 'batching' && !next.batching) {
        setShowSupplyBuffers(false);
      }
      return next;
    });
  };

  const handleSetAllMaterialFilters = (val: boolean) => {
    setMaterialFilters({
      quarry: val,
      steel: val,
      cement: val,
      facade: val,
      batching: val,
    });
    if (!val) {
      setShowSupplyBuffers(false);
    }
  };

  // Select project and center map
  const handleSelectProject = (project: ProjectFeature) => {
    setSelectedProject(project);
    const coords = getProjectCoordinates(project.geometry);
    setFlyToCoords([coords[1], coords[0]]); // [lat, lon]
  };

  // Handle community / private project submission
  const handleProjectSubmitted = (newProject: ProjectFeature) => {
    setAllProjects((prev) => [newProject, ...prev]);
    setSelectedProject(newProject);
    const coords = getProjectCoordinates(newProject.geometry);
    setFlyToCoords([coords[1], coords[0]]);
  };

  // Toggle Opportunity Finder
  const handleToggleOpportunityFinder = () => {
    setIsOpportunityFinderOpen((prev) => {
      const next = !prev;
      if (next) {
        setActiveView('map');
        if (!opportunityCenter) {
          if (mapInstance) {
            const c = mapInstance.getCenter();
            setOpportunityCenter([c.lat, c.lng]);
          } else {
            setOpportunityCenter([-6.2088, 106.8456]);
          }
        }
      } else {
        setIsPickingOpportunityCenter(false);
      }
      return next;
    });
  };

  // Select Quick City / Corridor Preset
  const handleSelectOpportunityPreset = (preset: OpportunityPreset) => {
    setOpportunityCenter(preset.coords);
    setOpportunityPresetName(preset.name);
    setIsPickingOpportunityCenter(false);
    setActiveView('map');
    if (mapInstance) {
      mapInstance.flyTo(preset.coords, preset.zoom, { duration: 1.2 });
    }
  };

  // Pick Center Location by Clicking on the Map
  const handlePickOpportunityLocation = (coords: [number, number]) => {
    setOpportunityCenter(coords);
    setOpportunityPresetName('custom');
    setIsPickingOpportunityCenter(false);
  };

  // Filter projects by Search, Category, Status, Region, and Contractor
  const filteredProjects = useMemo(() => {
    return allProjects.filter((project) => {
      const props = project.properties;

      // Contractor Filter
      if (selectedContractor) {
        const matches = projectMatchesContractor(props, selectedContractor);
        if (!matches) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = props.project_name.toLowerCase().includes(q);
        const matchesProv = (props.province || '').toLowerCase().includes(q);
        const matchesCity = (props.regency || '').toLowerCase().includes(q);
        const matchesContractor = (props.contractor || '').toLowerCase().includes(q);
        if (!matchesName && !matchesProv && !matchesCity && !matchesContractor) {
          return false;
        }
      }

      // Category Filter
      if (!selectedCategories.includes(props.category)) {
        return false;
      }

      // Status Filter
      if (selectedStatus !== 'All') {
        const matchesStatus =
          props.status === selectedStatus ||
          (selectedStatus === 'Tender & Transaksi' &&
            (props.status === 'Tender & Transaksi' ||
              (props.status as string) === 'Tender' ||
              (props.status as string) === 'Transaksi')) ||
          (selectedStatus === 'Construction' && props.status === 'Under Construction') ||
          (selectedStatus === 'Planning' && props.status === 'Planning & Prep');
        if (!matchesStatus) {
          return false;
        }
      }

      // Region Filter
      if (selectedRegion !== 'All') {
        const projectRegion = getRegionForProvince(props.province || '');
        if (projectRegion !== selectedRegion) {
          return false;
        }
      }

      return true;
    });
  }, [allProjects, searchQuery, selectedCategories, selectedStatus, selectedRegion, selectedContractor]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategories.length < 6 ||
    selectedStatus !== 'All' ||
    selectedRegion !== 'All' ||
    selectedContractor !== null;

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0b0f17] text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="text-sm font-medium tracking-wide">
            Memuat Data Spasial Infrastruktur & Material Hubs Indonesia...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0b0f17] text-white p-6">
        <div className="max-w-md p-6 bg-red-950/40 border border-red-800/80 rounded-xl text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
          <h2 className="text-lg font-bold text-red-200">Gagal Memuat Data Spasial</h2>
          <p className="text-xs text-red-300/80 leading-relaxed">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-1.5 bg-red-900/60 hover:bg-red-800 text-red-100 rounded-lg text-xs font-semibold transition-colors"
          >
            Muat Ulang Halaman
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0b0f17] text-slate-100 font-sans">
      {/* Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalFiltered={filteredProjects.length}
        totalProjects={allProjects.length}
        onResetFilters={() => {
          setSearchQuery('');
          setSelectedCategories(['Transport', 'Energy', 'Water', 'Housing', 'IKN', 'Commercial & Private']);
          setSelectedStatus('All');
          setSelectedRegion('All');
          setSelectedContractor(null);
        }}
        hasActiveFilters={hasActiveFilters}
        activeView={activeView}
        onViewChange={setActiveView}
        onExportGeoJSON={() => exportAsGeoJSON(filteredProjects, 'projects.geojson')}
        onExportCSV={() => exportAsCSV(filteredProjects, 'psn_projects.csv')}
        isAnalyticsOpen={isAnalyticsOpen}
        onToggleAnalytics={() => setIsAnalyticsOpen((prev) => !prev)}
        onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
        isOpportunityFinderOpen={isOpportunityFinderOpen}
        onToggleOpportunityFinder={handleToggleOpportunityFinder}
      />

      {/* KPI Cards */}
      <KPICards
        projects={filteredProjects}
        allProjectsCount={allProjects.length}
        selectedContractor={selectedContractor}
      />

      {/* Filter Bar */}
      <FilterBar
        selectedCategories={selectedCategories}
        onToggleCategory={handleToggleCategory}
        selectedStatus={selectedStatus}
        onSelectStatus={setSelectedStatus}
        selectedRegion={selectedRegion}
        onSelectRegion={setSelectedRegion}
        allProjects={allProjects}
        selectedContractor={selectedContractor}
        onSelectContractor={setSelectedContractor}
        onClearContractor={() => setSelectedContractor(null)}
        onFocusIKN={() => {
          setActiveView('map');
          setFocusIKNCounter((c) => c + 1);
        }}
        basemap={basemap}
        onBasemapChange={(newBasemap) => {
          setBasemap(newBasemap);
          setActiveView('map');
        }}
        materialFilters={materialFilters}
        onToggleMaterialFilter={handleToggleMaterialFilter}
        onSetAllMaterialFilters={handleSetAllMaterialFilters}
        showSupplyBuffers={showSupplyBuffers}
        onToggleSupplyBuffers={() => {
          setShowSupplyBuffers((prev) => {
            const next = !prev;
            if (next && !materialFilters.batching) {
              setMaterialFilters((f) => ({ ...f, batching: true }));
            }
            return next;
          });
        }}
        showFaultLines={showFaultLines}
        onToggleFaultLines={() => setShowFaultLines((prev) => !prev)}
        showMaritimeRoutes={showMaritimeRoutes}
        onToggleMaritimeRoutes={() => setShowMaritimeRoutes((prev) => !prev)}
      />

      {/* Map & Overlays or Table View Container */}
      <main className="relative flex-1 w-full overflow-hidden flex flex-col">
        {activeView === 'map' ? (
          <>
            {/* Interactive Map */}
            <InfrastructureMap
              projects={filteredProjects}
              selectedProject={selectedProject}
              onSelectProject={handleSelectProject}
              flyToCoords={flyToCoords}
              focusIKNCounter={focusIKNCounter}
              basemap={basemap}
              batchingPlants={batchingPlants}
              showBatchingPlants={materialFilters.batching}
              showSupplyBuffers={showSupplyBuffers}
              faultLines={faultLines}
              showFaultLines={showFaultLines}
              shippingRoutes={shippingRoutes}
              portHubs={portHubs}
              showMaritimeRoutes={showMaritimeRoutes}
              materialHubs={materialHubs}
              showMaterialHubs={materialFilters}
              opportunityFinder={{
                isOpen: isOpportunityFinderOpen,
                center: opportunityCenter,
                radiusKm: opportunityRadiusKm,
                isPickingLocation: isPickingOpportunityCenter,
                onPickLocation: handlePickOpportunityLocation,
              }}
              onMapReady={(map) => setMapInstance(map)}
            />

            {/* Collapsible Project Directory List (Left) */}
            <ProjectList
              projects={filteredProjects}
              selectedProject={selectedProject}
              onSelectProject={handleSelectProject}
              isOpen={isListOpen}
              onToggleOpen={() => setIsListOpen(!isListOpen)}
            />

            {/* Map Legend (Bottom Right) */}
            <MapLegend
              showBatchingPlants={materialFilters.batching}
              showSupplyBuffers={showSupplyBuffers}
              showFaultLines={showFaultLines}
              showMaritimeRoutes={showMaritimeRoutes}
              showQuarries={materialFilters.quarry}
              showSteelMills={materialFilters.steel}
              showCementPlants={materialFilters.cement}
              showFacadePlants={materialFilters.facade}
            />
          </>
        ) : (
          /* Minimalist Data Table View */
          <ProjectTable
            projects={filteredProjects}
            selectedProject={selectedProject}
            onSelectProject={handleSelectProject}
          />
        )}

        {/* Contractor & BUMN Analytics Drawer */}
        <AnalyticsDrawer
          isOpen={isAnalyticsOpen}
          onClose={() => setIsAnalyticsOpen(false)}
          projects={allProjects}
          selectedContractor={selectedContractor}
          onSelectContractor={(contractor) => {
            setSelectedContractor(contractor);
          }}
        />
      </main>

      {/* Detailed Slide-out Drawer (Right) */}
      <ProjectDrawer
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
        onZoomTo={(coords) => {
          setActiveView('map');
          setFlyToCoords(coords);
        }}
        batchingPlants={batchingPlants}
        faultLines={faultLines}
        materialHubs={materialHubs}
        onSelectContractor={(contractor) => {
          setSelectedContractor(contractor);
        }}
      />

      {/* Community & Private Project Submission Modal */}
      <SubmitProjectModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onProjectSubmitted={handleProjectSubmitted}
      />

      {/* Site Radius Opportunity & Vendor Lead Finder Panel */}
      <RadiusOpportunityFinder
        isOpen={isOpportunityFinderOpen}
        onClose={() => setIsOpportunityFinderOpen(false)}
        allProjects={allProjects}
        center={opportunityCenter}
        radiusKm={opportunityRadiusKm}
        onChangeRadius={setOpportunityRadiusKm}
        isPickingLocation={isPickingOpportunityCenter}
        onTogglePickLocation={() => setIsPickingOpportunityCenter((prev) => !prev)}
        presetName={opportunityPresetName}
        onSelectPreset={handleSelectOpportunityPreset}
        onSelectProject={(proj) => {
          handleSelectProject(proj);
        }}
        onFlyToProject={(coords) => {
          setActiveView('map');
          setFlyToCoords(coords);
        }}
      />
    </div>
  );
};
