import { useState, useCallback } from 'react'
import { MapView } from '@/components/MapView'
import { HotspotPanel } from '@/features/demand/HotspotPanel'
import { VehiclePanel } from '@/features/fleet/VehiclePanel'
import { RecommendationCard } from '@/features/dispatch/RecommendationCard'
import { DispatchHistory } from '@/features/dispatch/DispatchHistory'
import { ImpactPanel } from '@/features/impact/ImpactPanel'
import { SurgeInjector } from '@/features/dispatch/SurgeInjector'
import { SimulationControls } from '@/features/dispatch/SimulationControls'
import { OverviewBar } from '@/components/OverviewBar'
import { DataSourceBadge } from '@/components/DataSourceBadge'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ToastProvider, useToast } from '@/components/Toast'
import {
  useStops,
  useVehicles,
  useHotspots,
  useRecommendations,
  useHistory,
  useImpact,
} from '@/hooks/useData'
import type { DispatchRecommendation } from '@/types'
import { formatTime } from '@/utils/format'
import { api } from '@/services/api'
import {
  Send,
  Bus,
  Sparkles,
  BarChart3,
  RotateCw,
  Flame,
  CheckCircle2,
  X,
  Radio,
  ArrowRight,
  Maximize2,
  Minimize2,
} from 'lucide-react'

type TabType = 'dispatch' | 'fleet' | 'simulation' | 'impact'

function DashboardContent() {
  const stops = useStops()
  const vehicles = useVehicles()
  const hotspots = useHotspots()
  const recs = useRecommendations()
  const history = useHistory()
  const impact = useImpact()
  const { showToast } = useToast()

  const [activeTab, setActiveTab] = useState<TabType>('dispatch')
  const [selected, setSelected] = useState<DispatchRecommendation | null>(null)
  const [selectedStopId, setSelectedStopId] = useState<number | null>(null)
  const [generating, setGenerating] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [isFullscreenMap, setIsFullscreenMap] = useState(false)

  const allRefetch = useCallback(() => {
    setRefreshing(true)
    hotspots.refetch()
    recs.refetch()
    history.refetch()
    impact.refetch()
    vehicles.refetch()
    setTimeout(() => {
      setRefreshing(false)
      showToast('Telemetry Refreshed', 'APSRTC corridor fleet and station data updated', 'info')
    }, 600)
  }, [hotspots, recs, history, impact, vehicles, showToast])

  async function generateRecommendations() {
    setGenerating(true)
    setGenError(null)
    try {
      const generated = await api.recommendations.generate()
      allRefetch()
      if (generated.length > 0) {
        setSelected(generated[0])
        showToast(
          'Reallocation Plan Ready',
          `Generated ${generated.length} fleet reallocation plans`,
          'success'
        )
      } else {
        showToast('Fleet Balanced', 'Current bus allocation meets all passenger demand', 'info')
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Recommendation generation failed'
      setGenError(msg)
      showToast('Computation Error', msg, 'error')
    } finally {
      setGenerating(false)
    }
  }

  const lastUpdated = hotspots.lastUpdated ?? recs.lastUpdated

  // Filter recommendations if a specific hotspot stop was clicked
  const filteredRecs = selectedStopId
    ? recs.data?.filter((r) => r.destination_stop_id === selectedStopId)
    : recs.data

  const proposedCount = recs.data?.filter((r) => r.status === 'proposed').length ?? 0
  const totalVehiclesCount = vehicles.data?.length ?? 0
  const hasHotspots = (hotspots.data?.length ?? 0) > 0

  return (
    <div className="flex flex-col min-h-screen lg:h-screen bg-[#fafafb] text-zinc-900 font-sans lg:overflow-hidden select-none">
      {/* Apple / Linear Style Header Command Bar */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-2.5 bg-white border-b border-zinc-200/80 flex-shrink-0 z-20 shadow-xs">
        {/* Brand identity & System pills */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            {/* Custom brand emblem */}
            <div className="w-8 h-8 bg-zinc-950 rounded-xl flex items-center justify-center text-white shadow-xs border border-zinc-800">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="m4.93 4.93 4.24 4.24" />
                <path d="m14.83 9.17 4.24-4.24" />
                <path d="M12 3v6" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-tight text-zinc-950">
                  TRINETRA
                </h1>
                <span className="text-[10px] bg-zinc-100 text-zinc-600 font-mono font-medium px-1.5 py-0.5 rounded-md border border-zinc-200/80">
                  v2.4
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 font-medium hidden sm:block">
                APSRTC Real-Time Bus Fleet Dynamic Reallocation
              </p>
            </div>
          </div>

          <div className="h-5 w-px bg-zinc-200 hidden md:block" />

          {/* Telemetry DataSource Badge */}
          <div className="hidden sm:flex items-center">
            <DataSourceBadge isConnected={!hotspots.error && !vehicles.error} />
          </div>
        </div>

        {/* Status indicator & Primary CTA */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Telemetry timestamp */}
          {lastUpdated && (
            <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono bg-zinc-50 px-2.5 py-1 rounded-full border border-zinc-200/80">
              <Radio className="w-3 h-3 text-emerald-500" />
              <span>Synced {formatTime(lastUpdated.toISOString())}</span>
            </div>
          )}

          {/* Refresh button */}
          <button
            onClick={allRefetch}
            disabled={refreshing}
            title="Refresh All Telemetry"
            aria-label="Refresh telemetry data"
            className="p-2 hover:bg-zinc-100 active:scale-95 text-zinc-600 hover:text-zinc-900 rounded-xl transition-all border border-zinc-200/80 shadow-xs disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {/* Primary Action Button */}
          <button
            onClick={generateRecommendations}
            disabled={generating}
            aria-label="Compute fleet reallocation plan"
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-50 text-white text-xs font-medium px-3.5 sm:px-4 py-2 rounded-xl shadow-xs transition-all border border-zinc-800"
          >
            {generating ? <LoadingSpinner size="sm" /> : <Sparkles className="w-3.5 h-3.5 text-blue-400" />}
            <span>Compute Reallocation Plan</span>
          </button>
        </div>
      </header>

      {/* Top Overview KPI Summary Bar */}
      <OverviewBar
        vehicles={vehicles.data ?? []}
        totalHotspots={hotspots.data?.length ?? 0}
        totalRecommendations={recs.data?.length ?? 0}
        avgWaitReduction={impact.data?.average_wait_reduction_percent ?? null}
        avgEta={impact.data?.average_eta_minutes ?? null}
      />

      {/* Error alert banner */}
      {genError && (
        <div className="bg-rose-50 border-b border-rose-200 text-rose-800 text-xs px-4 sm:px-6 py-2.5 flex items-center justify-between" role="alert">
          <span className="font-medium">{genError}</span>
          <button onClick={() => setGenError(null)} aria-label="Dismiss alert" className="text-rose-600 hover:text-rose-900 font-bold p-1">
            ✕
          </button>
        </div>
      )}

      {/* Main Integrated Workspace */}
      <div className="flex flex-col lg:flex-row flex-1 lg:overflow-hidden min-h-0">
        {/* Left Side: Interactive GIS Map Centerpiece */}
        <main
          className={`relative flex flex-col min-h-0 bg-zinc-100 transition-all duration-300 ${
            isFullscreenMap ? 'w-full h-full' : 'w-full lg:flex-1 h-[380px] lg:h-auto'
          }`}
          role="main"
          aria-label="Geographical Bus Fleet and Route Map"
        >
          {/* Selected Route Corridor Floating Indicator Banner */}
          {selected && (
            <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-md border border-zinc-200/90 rounded-2xl shadow-float px-3.5 py-2 flex items-center gap-3 text-xs max-w-md pointer-events-auto animate-in fade-in">
              <div className="flex items-center gap-1.5 font-medium text-zinc-900">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span className="font-mono font-semibold">{selected.vehicle_code}</span>
                <span className="text-zinc-400">|</span>
                <span className="text-zinc-600">{selected.source_stop_name}</span>
                <ArrowRight className="w-3 h-3 text-blue-600" />
                <span className="font-semibold text-zinc-900">{selected.destination_stop_name}</span>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-zinc-400 hover:text-zinc-800 p-0.5 rounded-md hover:bg-zinc-100 transition-colors ml-auto"
                title="Deselect corridor"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Fullscreen Map Toggle Button (Desktop) */}
          <button
            onClick={() => setIsFullscreenMap((prev) => !prev)}
            title={isFullscreenMap ? 'Restore Split View' : 'Maximize Map'}
            aria-label={isFullscreenMap ? 'Restore Split View' : 'Maximize Map'}
            className="hidden lg:flex absolute top-4 left-1/2 -translate-x-1/2 z-[1000] items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-md hover:bg-zinc-100 border border-zinc-200/80 rounded-xl shadow-xs text-xs font-medium text-zinc-700 transition-all pointer-events-auto"
          >
            {isFullscreenMap ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Show Command Deck</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Expand Map</span>
              </>
            )}
          </button>

          <MapView
            stops={stops.data ?? []}
            vehicles={vehicles.data ?? []}
            hotspots={hotspots.data ?? []}
            selectedRecommendation={selected}
            onSelectHotspot={(stopId) => {
              setSelectedStopId(stopId)
              setActiveTab('dispatch')
            }}
          />
        </main>

        {/* Right Side: Modern Operations Command Deck */}
        {!isFullscreenMap && (
          <aside
            className="w-full lg:w-[480px] xl:w-[540px] flex-shrink-0 flex flex-col bg-white border-t lg:border-t-0 lg:border-l border-zinc-200/80 lg:overflow-hidden shadow-xs"
            aria-label="Transport Operations Command Deck"
          >
            {/* Apple / Linear Segmented Tab Controls */}
            <div className="p-3 border-b border-zinc-200/80 bg-zinc-50/70 flex-shrink-0">
              <nav aria-label="Operations Navigation" className="flex items-center gap-1 p-1 bg-zinc-200/60 rounded-2xl text-xs font-medium">
                {/* Tab 1: Dispatch */}
                <button
                  onClick={() => setActiveTab('dispatch')}
                  aria-selected={activeTab === 'dispatch'}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl transition-all ${
                    activeTab === 'dispatch'
                      ? 'bg-white text-zinc-950 font-semibold shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  <Send className="w-3.5 h-3.5 text-blue-600" />
                  <span>Dispatch</span>
                  {proposedCount > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                        activeTab === 'dispatch' ? 'bg-blue-50 text-blue-700' : 'bg-zinc-300 text-zinc-800'
                      }`}
                    >
                      {proposedCount}
                    </span>
                  )}
                </button>

                {/* Tab 2: Fleet */}
                <button
                  onClick={() => setActiveTab('fleet')}
                  aria-selected={activeTab === 'fleet'}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl transition-all ${
                    activeTab === 'fleet'
                      ? 'bg-white text-zinc-950 font-semibold shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  <Bus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Fleet</span>
                  <span className="text-[10px] text-zinc-400 font-mono">({totalVehiclesCount})</span>
                </button>

                {/* Tab 3: Simulation Studio */}
                <button
                  onClick={() => setActiveTab('simulation')}
                  aria-selected={activeTab === 'simulation'}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl transition-all ${
                    activeTab === 'simulation'
                      ? 'bg-white text-zinc-950 font-semibold shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Simulation</span>
                </button>

                {/* Tab 4: Audit & Impact */}
                <button
                  onClick={() => setActiveTab('impact')}
                  aria-selected={activeTab === 'impact'}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl transition-all ${
                    activeTab === 'impact'
                      ? 'bg-white text-zinc-950 font-semibold shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5 text-zinc-600" />
                  <span>Audit</span>
                </button>
              </nav>
            </div>

            {/* Tab Body Content */}
            <div className="flex-1 lg:overflow-y-auto p-4 space-y-4">
              {/* TAB 1: DISPATCH OPERATIONS */}
              {activeTab === 'dispatch' && (
                <div className="space-y-4">
                  {/* Hotspots Station Filter Pills Bar */}
                  {hotspots.data && hotspots.data.length > 0 && (
                    <div className="p-3 bg-zinc-50/80 border border-zinc-200/80 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-800 text-[11px] flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-rose-500" />
                          Filter by Surge Station
                        </span>
                        {selectedStopId && (
                          <button
                            onClick={() => setSelectedStopId(null)}
                            className="text-[10px] text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Reset to All Stations
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() => setSelectedStopId(null)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                            selectedStopId === null
                              ? 'bg-zinc-900 text-white shadow-xs'
                              : 'bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200/80'
                          }`}
                        >
                          All Stops ({recs.data?.length ?? 0})
                        </button>
                        {hotspots.data.map((h) => {
                          const isStationSelected = selectedStopId === h.stop_id
                          return (
                            <button
                              key={h.stop_id}
                              onClick={() => setSelectedStopId(isStationSelected ? null : h.stop_id)}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                                isStationSelected
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'bg-white text-zinc-700 hover:bg-rose-50 border border-zinc-200/80'
                              }`}
                            >
                              <span>{h.stop_name}</span>
                              <span
                                className={`text-[10px] font-mono px-1 py-0.5 rounded ${
                                  isStationSelected ? 'bg-rose-700 text-white' : 'bg-rose-50 text-rose-700'
                                }`}
                              >
                                -{h.capacity_shortage}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Recommendation Cards List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                          Reallocation Plans
                        </h2>
                        {recs.data && (
                          <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-200/80">
                            {proposedCount} Pending Review
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-400 font-normal">
                        Select card to view route
                      </span>
                    </div>

                    {recs.loading && !recs.data && (
                      <div className="flex justify-center py-12">
                        <LoadingSpinner />
                      </div>
                    )}

                    {filteredRecs && filteredRecs.length === 0 && (
                      <div className="text-center py-10 px-6 bg-white border border-zinc-200/80 rounded-2xl shadow-xs space-y-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto ${
                            hasHotspots ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                          }`}
                        >
                          {hasHotspots ? <Flame className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-900 text-sm">
                            {hasHotspots ? 'Surge Detected — No Plan Computed Yet' : 'No Pending Reallocations'}
                          </p>
                          <p className="text-zinc-500 text-xs mt-1 max-w-sm mx-auto leading-relaxed">
                            {hasHotspots
                              ? 'Corridor stops have reported passenger queue deficits. Click below to compute an optimal fleet reallocation plan.'
                              : 'All stops have adequate local bus seating. Run an evaluation scenario to test surge response.'}
                          </p>
                        </div>
                        <div className="flex items-center justify-center gap-2 pt-1">
                          {hasHotspots ? (
                            <button
                              onClick={generateRecommendations}
                              disabled={generating}
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-medium transition-all shadow-xs"
                            >
                              {generating ? <LoadingSpinner size="sm" /> : <Sparkles className="w-3.5 h-3.5 text-blue-400" />}
                              <span>Compute Reallocation Plan Now</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setActiveTab('simulation')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-medium transition-all"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Open Simulation Studio</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      {filteredRecs?.map((rec) => (
                        <RecommendationCard
                          key={rec.id}
                          rec={rec}
                          onAction={allRefetch}
                          onSelect={setSelected}
                          isSelected={selected?.id === rec.id}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: FLEET REAL-TIME STATUS */}
              {activeTab === 'fleet' && (
                <div className="space-y-4">
                  <VehiclePanel
                    vehicles={vehicles.data}
                    loading={vehicles.loading}
                    error={vehicles.error}
                    onRetry={vehicles.refetch}
                  />

                  {/* Hotspots secondary overview */}
                  <div className="pt-2 border-t border-zinc-100">
                    <HotspotPanel
                      hotspots={hotspots.data}
                      loading={hotspots.loading}
                      error={hotspots.error}
                      onRetry={hotspots.refetch}
                      onSelectHotspot={(stopId) => {
                        setSelectedStopId((prev) => (prev === stopId ? null : stopId))
                        setActiveTab('dispatch')
                      }}
                      selectedStopId={selectedStopId}
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: SIMULATION & SURGE STUDIO */}
              {activeTab === 'simulation' && (
                <div className="space-y-4">
                  {/* Scenario Runner */}
                  <SimulationControls
                    onScenarioRan={allRefetch}
                    onViewDispatches={() => setActiveTab('dispatch')}
                    disabled={generating}
                  />

                  {/* Manual Demand Injector */}
                  {stops.data && (
                    <SurgeInjector
                      stops={stops.data}
                      onInjected={allRefetch}
                      onViewDispatches={() => setActiveTab('dispatch')}
                    />
                  )}
                </div>
              )}

              {/* TAB 4: AUDIT TRAIL & IMPACT MODEL */}
              {activeTab === 'impact' && (
                <div className="space-y-4">
                  <ImpactPanel
                    metrics={impact.data}
                    loading={impact.loading}
                    error={impact.error}
                    onRetry={impact.refetch}
                  />

                  <div className="pt-2 border-t border-zinc-100">
                    <DispatchHistory
                      history={history.data}
                      loading={history.loading}
                      error={history.error}
                      onRetry={history.refetch}
                    />
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}

export function Dashboard() {
  return (
    <ToastProvider>
      <DashboardContent />
    </ToastProvider>
  )
}
