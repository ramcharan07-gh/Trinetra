import { useState, useEffect } from 'react'
import { api } from '@/services/api'
import type { SimulationScenario, SimulationComparison } from '@/types'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Play, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react'

interface SimulationControlsProps {
  onScenarioRan: () => void
  onViewDispatches?: () => void
  disabled?: boolean
}

// Fallback scenarios if API is loading or network is slow
const DEFAULT_SCENARIOS: SimulationScenario[] = [
  {
    id: 2,
    name: 'College Class Dismissal Rush',
    description: '140 students waiting at MITS College at 4:30 PM. Severe shortage requires redistributing spare vehicles from nearby depot/stops.',
    config: { target_stop_id: 2, simulated_queue: 140, time_of_day: '16:30' },
    created_at: new Date().toISOString(),
  },
  {
    id: 1,
    name: 'Evening Railway Arrival Spike',
    description: 'Sudden train arrival at Madanapalle Road Railway Station at 6:30 PM generates 180 passengers needing transit toward town.',
    config: { target_stop_id: 3, simulated_queue: 180, time_of_day: '18:30' },
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'Depot Fleet Morning Rebalance',
    description: 'Morning peak at Madanapalle Central Bus Stand with 220 passengers queuing for inter-district commuter routes.',
    config: { target_stop_id: 1, simulated_queue: 220, time_of_day: '08:45' },
    created_at: new Date().toISOString(),
  },
]

export function SimulationControls({
  onScenarioRan,
  onViewDispatches,
  disabled = false,
}: SimulationControlsProps) {
  const [scenarios, setScenarios] = useState<SimulationScenario[]>(DEFAULT_SCENARIOS)
  const [selectedId, setSelectedId] = useState<number | null>(2)
  const [loading, setLoading] = useState(false)
  const [lastComparison, setLastComparison] = useState<SimulationComparison | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.simulation.scenarios()
      .then((data) => {
        if (data && data.length > 0) {
          setScenarios(data)
          if (!selectedId) {
            setSelectedId(data[0].id)
          }
        }
      })
      .catch((err) => {
        console.warn('Scenarios loaded from static catalog:', err)
      })
  }, [])

  async function handleRunScenario() {
    if (!selectedId) return
    setLoading(true)
    setError(null)
    try {
      const comparison = await api.simulation.run(selectedId)
      setLastComparison(comparison)
      onScenarioRan()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 text-xs flex flex-col gap-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 text-xs">Simulation & Surge Studio</h3>
            <p className="text-[10px] text-zinc-500">Test fleet responsiveness against artificial demand spikes</p>
          </div>
        </div>
        <span className="text-[10px] bg-zinc-100 text-zinc-700 font-medium px-2 py-0.5 rounded-full border border-zinc-200">
          STUDIO
        </span>
      </div>

      {/* Scenario Cards */}
      <div className="space-y-2">
        <label className="text-[11px] text-zinc-500 font-medium block">
          Preset Operational Scenarios:
        </label>
        <div className="space-y-2">
          {scenarios.map((s) => {
            const isSelected = selectedId === s.id
            const queueCount = s.config?.simulated_queue || 150
            const timeStr = s.config?.time_of_day || 'Peak'

            return (
              <div
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                    : 'bg-zinc-50/70 hover:bg-zinc-100/70 border-zinc-200/80 text-zinc-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-white' : 'border-zinc-400'
                      }`}
                    >
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    <span className="font-semibold text-xs leading-tight">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                        isSelected ? 'bg-zinc-800 text-zinc-200' : 'bg-white text-zinc-600 border border-zinc-200'
                      }`}
                    >
                      {timeStr}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                        isSelected ? 'bg-rose-500 text-white' : 'bg-rose-50 text-rose-700 border border-rose-200/80'
                      }`}
                    >
                      +{queueCount} pax
                    </span>
                  </div>
                </div>
                <p className={`text-[11px] mt-1.5 leading-relaxed pl-6 ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>
                  {s.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {error && (
        <div className="text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-[11px]">
          {error}
        </div>
      )}

      {/* Run Action */}
      <button
        onClick={handleRunScenario}
        disabled={loading || disabled || !selectedId}
        className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-xl transition-all shadow-xs"
      >
        {loading ? <LoadingSpinner size="sm" /> : <Play className="w-3.5 h-3.5 fill-current" />}
        <span>Run Evaluation Scenario</span>
      </button>

      {/* Outcome Results */}
      {lastComparison && (
        <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-3.5 flex flex-col gap-2.5 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
            <span className="font-semibold text-xs text-emerald-950 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Scenario Outcome Analysis
            </span>
            <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full">
              Latency: {lastComparison.recommendation_latency_ms}ms
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <div className="bg-white p-2.5 rounded-xl border border-zinc-200/80 shadow-xs">
              <span className="text-zinc-400 block text-[10px] font-medium">Scheduled Baseline</span>
              <span className="font-bold text-zinc-800 font-mono text-sm tabular-nums">{lastComparison.baseline_avg_wait_minutes} min</span>
              <span className="text-[10px] text-zinc-500 block mt-0.5">Average passenger wait</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-emerald-200 shadow-xs">
              <span className="text-emerald-700 block text-[10px] font-medium">With Reallocation</span>
              <span className="font-bold text-emerald-700 font-mono text-sm tabular-nums">{lastComparison.reallocation_avg_wait_minutes} min</span>
              <span className="text-[10px] text-emerald-600 block mt-0.5">After bus dispatch</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-200/70">
            <span className="text-zinc-700 font-medium">Wait Time Relief:</span>
            <span className="font-bold text-emerald-700 font-mono text-sm tabular-nums">
              ↓ {lastComparison.wait_reduction_percent}%
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-600 pt-0.5">
            <span>Crowd Served by Dispatches:</span>
            <span className="font-bold text-zinc-900 tabular-nums">{lastComparison.passengers_served} passengers</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-zinc-600">
            <span>Residual Queue Remaining:</span>
            <span className="font-bold text-zinc-900 tabular-nums">{lastComparison.residual_queue} passengers</span>
          </div>

          {onViewDispatches && (
            <button
              type="button"
              onClick={onViewDispatches}
              className="w-full mt-2 py-2 px-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 shadow-xs transition-all"
            >
              <span>View Generated Reallocation Plans</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
