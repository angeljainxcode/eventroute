import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { CollegeEvent } from './types/event';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './components/landing/LandingPage';
import { SearchFilters } from './components/discovery/SearchFilters';
import { EventCard } from './components/discovery/EventCard';
import { EventMap } from './components/discovery/EventMap';
import { EventDetailsModal } from './components/discovery/EventDetailsModal';
import { FeasibilityDashboard } from './components/feasibility/FeasibilityDashboard';
import { OrganiserForm } from './components/organiser/OrganiserForm';
import { SavedEvents } from './components/saved/SavedEvents';
import { LocationBudgetModal } from './components/location/LocationBudgetModal';
import { AiModal } from './components/ai/AiModal';
import { LoadingState } from './components/common/LoadingState';
import { EmptyState } from './components/common/EmptyState';

export function AppContent() {
  const {
    events,
    origin,
    preferences,
    savedEventIds,
    searchQuery,
    categoryFilter,
    feasibilityFilter,
    maxDistanceFilter,
    sortOption,
    isLoading,
    getFeasibility,
    toggleSave,
    setOrigin,
    resetFilters,
  } = useApp();

  // Navigation and active view state
  const [currentView, setCurrentView] = useState<'landing' | 'discovery' | 'saved' | 'publish'>('landing');
  const [discoveryViewMode, setDiscoveryViewMode] = useState<'list' | 'map' | 'split'>('split');

  // Active focused event for Feasibility Dashboard (Screen E)
  const [activeFeasibilityEvent, setActiveFeasibilityEvent] = useState<CollegeEvent | null>(null);

  // Modals state
  const [detailsEvent, setDetailsEvent] = useState<CollegeEvent | null>(null);
  const [locationModalOpen, setLocationModalOpen] = useState<boolean>(false);
  const [aiModalOpen, setAiModalOpen] = useState<boolean>(false);

  // Filter and sort events
  const filteredEvents = events.filter(event => {
    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        event.title.toLowerCase().includes(q) ||
        event.hostCollege.toLowerCase().includes(q) ||
        event.venue.toLowerCase().includes(q) ||
        event.city.toLowerCase().includes(q) ||
        event.category.toLowerCase().includes(q) ||
        event.description.toLowerCase().includes(q);
      if (!match) return false;
    }

    // 2. Category
    if (categoryFilter !== 'all' && event.category !== categoryFilter) {
      return false;
    }

    // 3. Feasibility Verdict & Distance calculations
    const feasibility = getFeasibility(event);

    if (feasibilityFilter !== 'all' && feasibility.verdict !== feasibilityFilter) {
      return false;
    }

    if (feasibility.distanceKm > maxDistanceFilter) {
      return false;
    }

    return true;
  });

  // Sort events
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const fA = getFeasibility(a);
    const fB = getFeasibility(b);

    switch (sortOption) {
      case 'nearest':
        return fA.distanceKm - fB.distanceKm;
      case 'lowest_cost':
        return fA.estimatedRoundTripCost - fB.estimatedRoundTripCost;
      case 'most_feasible': {
        const order = { FEASIBLE: 1, DIFFICULT: 2, NOT_FEASIBLE: 3 };
        return order[fA.verdict] - order[fB.verdict];
      }
      case 'soonest':
      default:
        return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
  });

  // Event handlers
  const handleOpenFeasibility = (event: CollegeEvent) => {
    setDetailsEvent(null);
    setActiveFeasibilityEvent(event);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectEvent = (event: CollegeEvent) => {
    setDetailsEvent(event);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      
      {/* Primary Navigation */}
      <Navbar
        currentView={activeFeasibilityEvent ? 'discovery' : currentView}
        onNavigate={view => {
          setActiveFeasibilityEvent(null);
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenLocationModal={() => setLocationModalOpen(true)}
        onOpenAiModal={() => setAiModalOpen(true)}
      />

      {/* Main Body Routing */}
      <main className="flex-1">
        {/* VIEW 1: FEASIBILITY DASHBOARD (SCREEN E — CORE FOCUS) */}
        {activeFeasibilityEvent ? (
          <FeasibilityDashboard
            event={activeFeasibilityEvent}
            origin={origin}
            preferences={preferences}
            isSaved={savedEventIds.includes(activeFeasibilityEvent.id)}
            onToggleSave={() => toggleSave(activeFeasibilityEvent.id)}
            onBack={() => setActiveFeasibilityEvent(null)}
            onUpdateOrigin={newOrigin => setOrigin(newOrigin)}
          />
        ) : currentView === 'landing' ? (
          /* VIEW 2: LANDING PAGE (SCREEN A) */
          <LandingPage
            onExploreEvents={() => setCurrentView('discovery')}
            onPublishEvent={() => setCurrentView('publish')}
            onSelectEvent={handleSelectEvent}
            onCheckFeasibility={handleOpenFeasibility}
            onOpenLocationModal={() => setLocationModalOpen(true)}
          />
        ) : currentView === 'publish' ? (
          /* VIEW 3: PUBLISH EVENT FORM (SCREEN F) */
          <OrganiserForm
            onSuccess={() => {
              setCurrentView('discovery');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onCancel={() => setCurrentView('discovery')}
          />
        ) : currentView === 'saved' ? (
          /* VIEW 4: SAVED EVENTS LIST & CALENDAR (SCREEN G) */
          <SavedEvents
            onSelectEvent={handleSelectEvent}
            onCheckFeasibility={handleOpenFeasibility}
            onExploreEvents={() => setCurrentView('discovery')}
          />
        ) : (
          /* VIEW 5: MAP-BASED EVENT DISCOVERY (SCREEN C) */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
            
            {/* Search, Filters, and Map/List Toggles */}
            <SearchFilters
              viewMode={discoveryViewMode}
              onChangeViewMode={setDiscoveryViewMode}
              onOpenLocationModal={() => setLocationModalOpen(true)}
              totalResults={sortedEvents.length}
            />

            {isLoading ? (
              <LoadingState />
            ) : sortedEvents.length === 0 ? (
              <EmptyState onAction={resetFilters} />
            ) : discoveryViewMode === 'map' ? (
              /* MAP ONLY VIEW */
              <div className="h-[75vh] w-full">
                <EventMap
                  events={sortedEvents}
                  origin={origin}
                  onSelectEvent={handleSelectEvent}
                  getFeasibility={getFeasibility}
                />
              </div>
            ) : discoveryViewMode === 'list' ? (
              /* CARDS ONLY VIEW */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedEvents.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    feasibility={getFeasibility(event)}
                    isSaved={savedEventIds.includes(event.id)}
                    onToggleSave={() => toggleSave(event.id)}
                    onSelect={handleSelectEvent}
                    onCheckFeasibility={handleOpenFeasibility}
                  />
                ))}
              </div>
            ) : (
              /* SPLIT VIEW (DESKTOP: MAP ON RIGHT, CARDS ON LEFT) */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left 7 Columns: Event Cards */}
                <div className="lg:col-span-7 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {sortedEvents.map(event => (
                      <EventCard
                        key={event.id}
                        event={event}
                        feasibility={getFeasibility(event)}
                        isSaved={savedEventIds.includes(event.id)}
                        onToggleSave={() => toggleSave(event.id)}
                        onSelect={handleSelectEvent}
                        onCheckFeasibility={handleOpenFeasibility}
                      />
                    ))}
                  </div>
                </div>

                {/* Right 5 Columns: Sticky Leaflet Map */}
                <div className="lg:col-span-5 sticky top-20 h-[calc(100vh-6.5rem)] hidden lg:block">
                  <EventMap
                    events={sortedEvents}
                    origin={origin}
                    onSelectEvent={handleSelectEvent}
                    getFeasibility={getFeasibility}
                  />
                </div>

              </div>
            )}

          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* MODALS */}
      {/* Location & Budget Modal (Screen B) */}
      <LocationBudgetModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
      />

      {/* Event Details Modal (Screen D) */}
      <EventDetailsModal
        event={detailsEvent}
        feasibility={detailsEvent ? getFeasibility(detailsEvent) : null}
        isOpen={Boolean(detailsEvent)}
        isSaved={detailsEvent ? savedEventIds.includes(detailsEvent.id) : false}
        onClose={() => setDetailsEvent(null)}
        onToggleSave={() => {
          if (detailsEvent) toggleSave(detailsEvent.id);
        }}
        onOpenFeasibility={handleOpenFeasibility}
      />

      {/* AI Assistant Modal (Screen H) */}
      <AiModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onSelectEvent={handleSelectEvent}
        onCheckFeasibility={handleOpenFeasibility}
      />

    </div>
  );
}

export default function App() {
  return <AppContent />;
}
