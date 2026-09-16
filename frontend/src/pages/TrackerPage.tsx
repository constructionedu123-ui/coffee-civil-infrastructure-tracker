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
import { Header } from '../components/Header';
import { KPICards } from '../components/KPICards';
import { FilterBar } from '../components/FilterBar';
import { InfrastructureMap } from '../components/Map/InfrastructureMap';
import { MapLegend } from '../components/Map/MapLegend';
import { ProjectDrawer } from '../components/ProjectDrawer';
import { ProjectList } from '../components/ProjectList';
import { ProjectTable } from '../components/ProjectTable';
import { AnalyticsDrawer } from '../components/AnalyticsDrawer';
import { exportAsGeoJSON, exportAsCSV } from '../utils/export';
import { resolveContractorEntity } from '../utils/contractor';
import { getRegionForProvince } from '../utils/geo';
import { Loader2, AlertTriangle } from 'lucide-react';

export const TrackerPage: React.FC = () => {
  const [allProjects, setAllProjects] = useState<ProjectFeature[]>([]);
  const [batchingPlants, setBatchingPlants] = useState<BatchingPlantFeature[]>([]);
  const [showBatchingPlants, setShowBatchingPlants] = useState<boolean>(true);
  const [showSupplyBuffers, setShowSupplyBuffers] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // View Switcher State ('map' | 'table')
  const [activeView, setActiveView] = useState<'map' | 'table'>('map');

  // Analytics Drawer State
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState<boolean>(false);
  const [selectedContractor, setSelectedContractor] = useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<ProjectCategory[]>([
    'Transport',
    'Energy',
    'Water',
    'Housing',
    'IKN',
  ]);
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | 'All'>('All');
  const [selectedRegion, setSelectedRegion] = useState<string | 'All'>('All');

  // UI Drawer and List states
  const [selectedProject, setSelectedProject] = useState<ProjectFeature | null>(null);
  const [isListOpen, setIsListOpen] = useState<boolean>(false);
  const [flyToCoords, setFlyToCoords] = useState<[number, number] | null>(null);
  const [focusIKNCounter, setFocusIKNCounter] = useState<number>(0);
  const [basemap, setBasemap] = useState<'dark' | 'satellite'>('satellite');

  // Fetch GeoJSON data on mount (Projects & Batching Plants)
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [resProjects, resPlants] = await Promise.all([
          fetch('/data/projects.geojson'),
          fetch('/data/batching_plants.geojson'),
        ]);

        if (!resProjects.ok) {
          throw new Error(`Failed to load data/projects.geojson: HTTP ${resProjects.status}`);
        }
        const dataProjects: ProjectFeatureCollection = await resProjects.json();
        setAllProjects(dataProjects.features || []);

        if (resPlants.ok) {
          const dataPlants: BatchingPlantFeatureCollection = await resPlants.json();
          setBatchingPlants(dataPlants.features || []);
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
        // Prevent deselecting all
        if (prev.length === 1) return prev;
        return prev.filter((c) => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategories(['Transport', 'Energy', 'Water', 'Housing', 'IKN']);
    setSelectedStatus('All');
    setSelectedRegion('All');
    setSelectedContractor(null);
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedCategories.length < 5 ||
    selectedStatus !== 'All' ||
    selectedRegion !== 'All' ||
    selectedContractor !== null;

  // Filtered Projects computation
  const filteredProjects = useMemo(() => {
    return allProjects.filter((project) => {
      const props = project.properties;

      // 1. Category Filter
      if (!selectedCategories.includes(props.category)) {
        return false;
      }

      // 2. Status Filter
      if (selectedStatus !== 'All') {
        if (selectedStatus === 'Operational') {
          if (props.status !== 'Operational' && props.status !== 'Completed') return false;
        } else if (props.status !== selectedStatus) {
          return false;
        }
      }

      // 3. Region Filter
      if (selectedRegion !== 'All') {
        const projectRegion = getRegionForProvince(props.province);
        if (projectRegion !== selectedRegion) {
          return false;
        }
      }

      // 4. Contractor Filter (from Analytics Drawer)
      if (selectedContractor) {
        const entity = resolveContractorEntity(props);
        if (entity !== selectedContractor) {
          return false;
        }
      }

      // 5. Search Query Filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesName = props.project_name.toLowerCase().includes(query);
        const matchesProvince = (props.province || '').toLowerCase().includes(query);
        const matchesRegency = (props.regency || '').toLowerCase().includes(query);
        const matchesContractor = (props.contractor || '').toLowerCase().includes(query);

        if (!matchesName && !matchesProvince && !matchesRegency && !matchesContractor) {
          return false;
        }
      }

      return true;
    });
  }, [allProjects, selectedCategories, selectedStatus, selectedRegion, searchQuery, selectedContractor]);

  // Handle Project Selection from List, Marker, or Search
  const handleSelectProject = (project: ProjectFeature) => {
    setSelectedProject(project);
    const [lon, lat] = getProjectCoordinates(project.geometry);
    setFlyToCoords([lat, lon]);
  };

  if (loading) {
    return (
      <div className="w-screen h-screen bg-dark-900 flex flex-col items-center justify-center gap-3 text-slate-300">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm font-semibold tracking-wide">Loading Indonesian Infrastructure GIS Data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-screen h-screen bg-dark-900 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-white">Failed to Load Infrastructure Map</h2>
        <p className="text-xs text-slate-400 max-w-md">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-dark-900 text-slate-100 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header - Pure Tracker Branding */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalFiltered={filteredProjects.length}
        totalProjects={allProjects.length}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
        activeView={activeView}
        onViewChange={setActiveView}
        onExportGeoJSON={() => exportAsGeoJSON(filteredProjects, 'projects.geojson')}
        onExportCSV={() => exportAsCSV(filteredProjects, 'psn_projects.csv')}
        isAnalyticsOpen={isAnalyticsOpen}
        onToggleAnalytics={() => setIsAnalyticsOpen((prev) => !prev)}
      />

      {/* KPI Cards */}
      <KPICards projects={filteredProjects} allProjectsCount={allProjects.length} />

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
        showBatchingPlants={showBatchingPlants}
        onToggleBatchingPlants={() => {
          setShowBatchingPlants((prev) => {
            const next = !prev;
            if (!next) setShowSupplyBuffers(false);
            return next;
          });
        }}
        showSupplyBuffers={showSupplyBuffers}
        onToggleSupplyBuffers={() => {
          setShowSupplyBuffers((prev) => {
            const next = !prev;
            if (next) setShowBatchingPlants(true);
            return next;
          });
        }}
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
              showBatchingPlants={showBatchingPlants}
              showSupplyBuffers={showSupplyBuffers}
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
              showBatchingPlants={showBatchingPlants}
              showSupplyBuffers={showSupplyBuffers}
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
      />
    </div>
  );
};
