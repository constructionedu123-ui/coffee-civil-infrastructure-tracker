import React, { useState, useEffect, useMemo } from 'react';
import { ProjectFeature, ProjectCategory, ProjectStatus, ProjectFeatureCollection } from './types/project';
import { Header } from './components/Header';
import { KPICards } from './components/KPICards';
import { FilterBar } from './components/FilterBar';
import { InfrastructureMap } from './components/Map/InfrastructureMap';
import { MapLegend } from './components/Map/MapLegend';
import { ProjectDrawer } from './components/ProjectDrawer';
import { ProjectList } from './components/ProjectList';
import { ProjectTable } from './components/ProjectTable';
import { AnalyticsDrawer } from './components/AnalyticsDrawer';
import { exportAsGeoJSON, exportAsCSV } from './utils/export';
import { resolveContractorEntity } from './utils/contractor';
import { getRegionForProvince } from './utils/geo';
import { Loader2, AlertTriangle } from 'lucide-react';

export const App: React.FC = () => {
  const [allProjects, setAllProjects] = useState<ProjectFeature[]>([]);
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

  // Fetch GeoJSON data on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch('/data/projects.geojson');
        if (!res.ok) {
          throw new Error(`Failed to load data/projects.geojson: HTTP ${res.status}`);
        }
        const data: ProjectFeatureCollection = await res.json();
        setAllProjects(data.features || []);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching GeoJSON:', err);
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
    const [lon, lat] = project.geometry.coordinates;
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
      {/* Top Header */}
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
            <MapLegend />
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

      {/* Detailed Slide-out Drawer (Right) — rendered at root level so it covers header/KPI/filter bars */}
      <ProjectDrawer
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
        onZoomTo={(coords) => {
          setActiveView('map');
          setFlyToCoords(coords);
        }}
      />
    </div>
  );
};
