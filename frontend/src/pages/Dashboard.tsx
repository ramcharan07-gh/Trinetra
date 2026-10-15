import { useState, useCallback } from 'react'
import { MapView } from '@/components/MapView'
import { HotspotPanel } from '@/features/demand/HotspotPanel'
import { VehiclePanel } from '@/features/fleet/VehiclePanel'
import { RecommendationCard } from '@/features/dispatch/RecommendationCard'
import { DispatchHistory } from '@/features/dispatch/DispatchHistory'
import { ImpactPanel } from '@/features/impact/ImpactPanel'
import { SurgeInjector } from '@/features/dispatch/SurgeInjector'
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

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Top Navbar */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔭</span>
            <span className="text-base font-black tracking-wider text-white">TRINETRA</span>
          </div>
          <span className="text-xs text-slate-500 font-medium hidden sm:inline-block border-l border-slate-800 pl-3">
            Real-Time Vehicle Reallocation on Demand Spikes
          </span>
          <DataSourceBadge />
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-[11px] text-slate-500 font-mono hidden md:inline-block">
              Refreshed {formatTime(lastUpdated.toISOString())}
            </span>
          )}

          <button
            onClick={generateRecommendations}
            disabled={generating}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded shadow transition-colors"
          >
            {generating ? <LoadingSpinner size="sm" /> : <span>⚡</span>}
            Generate Reallocations
          </button>
        </div>
      </header>

      {genError && (
        <div className="bg-red-950/80 border-b border-red-800 text-red-200 text-xs px-4 py-1.5 flex items-center justify-between">
          <span>{genError}</span>
          <button onClick={() => setGenError(null)} className="text-red-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Main App Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side Control & Monitoring Column */}
        <aside className="w-80 flex-shrink-0 border-r border-slate-800 bg-slate-900/95 flex flex-col overflow-y-auto">
          <div className="flex flex-col gap-4 p-3.5">
            <HotspotPanel
              hotspots={hotspots.data}
              loading={hotspots.loading}
              error={hotspots.error}
              onRetry={hotspots.refetch}
            />

            <hr className="border-slate-800" />

            <VehiclePanel
              vehicles={vehicles.data}
              loading={vehicles.loading}
              error={vehicles.error}
              onRetry={vehicles.refetch}
            />

            <hr className="border-slate-800" />

            <ImpactPanel
              metrics={impact.data}
              loading={impact.loading}
              error={impact.error}
              onRetry={impact.refetch}
            />

            <hr className="border-slate-800" />

            {stops.data && (
              <SurgeInjector
                stops={stops.data}
                onInjected={allRefetch}
              />
            )}
          </div>
        </aside>

        {/* Center / Right Content: Map + Recommendations View */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">
          {/* Map Section (Upper 55%) */}
          <div className="flex-shrink-0" style={{ height: '56%' }}>
            <MapView
              stops={stops.data ?? []}
              vehicles={vehicles.data ?? []}
              hotspots={hotspots.data ?? []}
              selectedRecommendation={selected}
            />
          </div>

          {/* Lower Split: Recommendations Carousel + Dispatch History (44%) */}
          <div className="flex-1 flex overflow-hidden border-t border-slate-800 bg-slate-900/60">
            {/* Dispatch Recommendation Cards Section */}
            <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-800">
              <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-800 bg-slate-900/90 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Recommended Bus Reallocations
                  </h2>
                  {recs.data && (
                    <span className="text-[11px] bg-blue-950 text-blue-300 border border-blue-800 px-1.5 py-0.2 rounded font-mono">
                      {recs.data.filter((r) => r.status === 'proposed').length} Pending Review
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500">
                  Select card to view route geometry on map
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {recs.loading && !recs.data && (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                )}

                {recs.data && recs.data.length === 0 && (
                  <div className="text-center py-10 text-slate-500 text-xs space-y-1">
                    <p className="font-semibold text-slate-400">No Reallocation Recommendations Pending</p>
                    <p>
                      Use the "Simulate Demand Surge" form on the left, then click "Generate Reallocations".
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {recs.data?.map((rec) => (
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
            <div className="w-72 flex-shrink-0 flex flex-col overflow-hidden bg-slate-900/80">
              <div className="px-3.5 py-2 border-b border-slate-800 bg-slate-900/90 flex-shrink-0">
                <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Operator Actions
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
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

