import { useState, useEffect } from 'react'
import { api } from '@/services/api'
import type { SimulationScenario, SimulationComparison } from '@/types'
import { LoadingSpinner } from '@/components/LoadingSpinner'

interface SimulationControlsProps {
  onScenarioRan: () => void
  disabled?: boolean
}

export function SimulationControls({ onScenarioRan, disabled = false }: SimulationControlsProps) {
  const [scenarios, setScenarios] = useState<SimulationScenario[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastComparison, setLastComparison] = useState<SimulationComparison | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.simulation.scenarios()
      .then((data) => {
        setScenarios(data)
        if (data.length > 0 && selectedId === null) {
          setSelectedId(data[1] ? data[1].id : data[0].id)
        }
      })
      .catch((err) => setError(err.message))
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

  const selectedScenario = scenarios.find((s) => s.id === selectedId)

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3.5 text-xs flex flex-col gap-3 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-1.5 font-bold text-slate-900 tracking-tight text-xs">
          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          <span>Simulation & Evaluation</span>
        </div>
        <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded border border-slate-200">
          OPERATIONAL TEST
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] text-slate-600 font-semibold">Select Operating Scenario:</label>
        <select
          value={selectedId ?? ''}
          onChange={(e) => setSelectedId(Number(e.target.value))}
          disabled={loading || disabled}
          className="bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-800 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all font-medium"
        >
          {scenarios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {selectedScenario && (
        <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-md border border-slate-200/60">
          {selectedScenario.description}
        </p>
      )}

      {error && (
        <div className="text-rose-700 bg-rose-50 border border-rose-200 rounded p-2 text-[11px]">
          {error}
        </div>
      )}

      <button
        onClick={handleRunScenario}
        disabled={loading || disabled || !selectedId}
        className="flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 disabled:opacity-50 text-white font-semibold py-2 px-3 rounded-md transition-colors shadow-xs"
      >
        {loading ? <LoadingSpinner size="sm" /> : <span>▶</span>}
        <span>Run Evaluation Scenario</span>
      </button>

      {lastComparison && (
        <div className="mt-1 bg-emerald-50/50 border border-emerald-200 rounded-md p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-900 border-b border-emerald-200/60 pb-1.5">
            <span>Scenario Outcome</span>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded">
              Latency: {lastComparison.recommendation_latency_ms}ms
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
            <div className="bg-white p-2 rounded border border-slate-200 shadow-2xs">
              <span className="text-slate-500 block text-[10px] font-medium">Without Reallocation</span>
              <span className="font-bold text-slate-800 font-mono text-sm">{lastComparison.baseline_avg_wait_minutes} min</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Average passenger wait</span>
            </div>
            <div className="bg-white p-2 rounded border border-emerald-300 shadow-2xs">
              <span className="text-emerald-700 block text-[10px] font-medium">With Reallocation</span>
              <span className="font-bold text-emerald-800 font-mono text-sm">{lastComparison.reallocation_avg_wait_minutes} min</span>
              <span className="text-[10px] text-emerald-600 block mt-0.5">After bus dispatch</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1.5 border-t border-emerald-200/80">
            <span className="text-slate-700 font-medium">Estimated Wait Reduction:</span>
            <span className="font-bold text-emerald-800 font-mono text-sm">
              ↓ {lastComparison.wait_reduction_percent}%
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-600">
            <span>Crowd Served by Dispatches:</span>
            <span className="font-bold text-slate-900">{lastComparison.passengers_served} passengers</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-600">
            <span>Residual Demand Remaining:</span>
            <span className="font-bold text-slate-900">{lastComparison.residual_queue} passengers</span>
          </div>
        </div>
      )}
    </div>
  )
}
