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

export function Dashboard() {
  const stops = useStops()
  const vehicles = useVehicles()
  const hotspots = useHotspots()
  const recs = useRecommendations()
  const history = useHistory()
  const impact = useImpact()

  const [selected, setSelected] = useState<DispatchRecommendation | null>(null)
  const [selectedStopId, setSelectedStopId] = useState<number | null>(null)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)

  const allRefetch = useCallback(() => {
    hotspots.refetch()
    recs.refetch()
    history.refetch()
    impact.refetch()
    vehicles.refetch()
  }, [hotspots, recs, history, impact, vehicles])

  async function generateRecommendations() {
    setGenerating(true)
    setGenError(null)
    try {
      const generated = await api.recommendations.generate()
      allRefetch()
      if (generated.length > 0) {
        setSelected(generated[0])
      }
    } catch (e) {
      setGenError(e instanceof Error ? e.message : 'Recommendation generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const lastUpdated = hotspots.lastUpdated ?? recs.lastUpdated

  // Filter recommendations if a specific hotspot stop was clicked
  const filteredRecs = selectedStopId
    ? recs.data?.filter((r) => r.destination_stop_id === selectedStopId)
    : recs.data

  return (
    <div className="flex flex-col min-h-screen lg:h-screen bg-slate-100 text-slate-800 font-sans lg:overflow-hidden">
      {/* Official Government Transport Portal Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-white border-b border-slate-200 flex-shrink-0 z-10 shadow-xs" role="banner">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-700 text-white rounded-md flex items-center justify-center font-black text-lg shadow-xs select-none" aria-hidden="true">
              TR
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-slate-900">
                  TRINETRA
                </h1>
                <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded border border-slate-200">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Public Bus Fleet Dynamic Reallocation & Demand Management Portal
              </p>
            </div>
          </div>
          <div className="h-6 w-px bg-slate-200 hidden md:block" aria-hidden="true" />
          <DataSourceBadge />
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {lastUpdated && (
            <span className="text-xs text-slate-500 font-mono hidden lg:inline-block">
              Telemetry Synchronized: {formatTime(lastUpdated.toISOString())}
            </span>
          )}

          <button
            onClick={generateRecommendations}
            disabled={generating}
            aria-label="Compute fleet reallocation plan"
            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 disabled:opacity-50 text-white text-xs font-semibold px-3 sm:px-4 py-2 rounded-md shadow-xs transition-colors"
          >
            {generating ? <LoadingSpinner size="sm" /> : <span aria-hidden="true">⚡</span>}
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

      {genError && (
        <div className="bg-rose-50 border-b border-rose-200 text-rose-800 text-xs px-4 sm:px-6 py-2 flex items-center justify-between" role="alert">
          <span>{genError}</span>
          <button onClick={() => setGenError(null)} aria-label="Dismiss alert" className="text-rose-600 hover:text-rose-900 font-bold p-1">
            ✕
          </button>
        </div>
      )}

      {/* Main App Layout */}
      <div className="flex flex-col lg:flex-row flex-1 lg:overflow-hidden">
        {/* Left Side Control & Monitoring Column */}
        <aside className="w-full lg:w-84 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50/80 flex flex-col lg:overflow-y-auto" aria-label="Fleet and Demand Controls">
          <div className="flex flex-col gap-4 p-4">
            {/* Predefined Simulation Scenarios Runner */}
            <SimulationControls onScenarioRan={allRefetch} disabled={generating} />

            <HotspotPanel
              hotspots={hotspots.data}
              loading={hotspots.loading}
              error={hotspots.error}
              onRetry={hotspots.refetch}
              onSelectHotspot={(stopId) => {
                setSelectedStopId((prev) => (prev === stopId ? null : stopId))
              }}
              selectedStopId={selectedStopId}
            />

            <VehiclePanel
              vehicles={vehicles.data}
              loading={vehicles.loading}
              error={vehicles.error}
              onRetry={vehicles.refetch}
            />

            <ImpactPanel
              metrics={impact.data}
              loading={impact.loading}
              error={impact.error}
              onRetry={impact.refetch}
            />

            {stops.data && (
              <SurgeInjector
                stops={stops.data}
                onInjected={allRefetch}
              />
            )}
          </div>
        </aside>

        {/* Center / Right Content: Map + Recommendations View */}
        <main className="flex-1 flex flex-col min-h-0 bg-white" role="main">
          {/* Map Section (Responsive height: 350px on mobile, ~54% on desktop) */}
          <div className="flex-shrink-0 border-b border-slate-200 h-[360px] lg:h-[54%]" aria-label="Geographical Bus Fleet and Route Map">
            <MapView
              stops={stops.data ?? []}
              vehicles={vehicles.data ?? []}
              hotspots={hotspots.data ?? []}
              selectedRecommendation={selected}
            />
          </div>

          {/* Lower Split: Recommendations Carousel + Dispatch History */}
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden bg-slate-50">
            {/* Dispatch Recommendation Cards Section */}
            <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-200">
              <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-200 bg-white flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Recommended Bus Reallocations
                  </h2>
                  {recs.data && (
                    <span className="text-[11px] bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full font-semibold">
                      {recs.data.filter((r) => r.status === 'proposed').length} Action Required
                    </span>
                  )}
                  {selectedStopId && (
                    <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                      Filtered by Station
                      <button onClick={() => setSelectedStopId(null)} className="font-bold text-slate-500 hover:text-slate-800">×</button>
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  Select card to inspect route corridor on map
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {recs.loading && !recs.data && (
                  <div className="flex justify-center py-10">
                    <LoadingSpinner />
                  </div>
                )}

                {filteredRecs && filteredRecs.length === 0 && (
                  <div className="text-center py-12 text-slate-500 text-xs space-y-1 bg-white border border-slate-200 rounded-lg p-6">
                    <p className="font-semibold text-slate-700 text-sm">No Pending Reallocations</p>
                    <p className="text-slate-500">
                      All locations have adequate local capacity. Use "Run Evaluation Scenario" on the left to test surge conditions.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

            {/* Audit Log / History Sidebar */}
            <div className="w-80 flex-shrink-0 flex flex-col overflow-hidden bg-white">
              <div className="px-4 py-2.5 border-b border-slate-200 bg-white flex-shrink-0">
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Operational Audit Log
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto p-3.5 bg-slate-50/50">
                <DispatchHistory
                  history={history.data}
                  loading={history.loading}
                  error={history.error}
                  onRetry={history.refetch}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
