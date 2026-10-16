import { useState } from 'react'
import type { Stop } from '@/types'
import { api } from '@/services/api'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Sliders, Zap, CheckCircle2, ArrowRight } from 'lucide-react'

interface Props {
  stops: Stop[]
  onInjected: () => void
  onViewDispatches?: () => void
}

export function SurgeInjector({ stops, onInjected, onViewDispatches }: Props) {
  const [stopId, setStopId] = useState<number>(stops[1]?.id ?? 2) // Defaults to MITS College
  const [queueCount, setQueueCount] = useState<number>(140)
  const [bookingDemand, setBookingDemand] = useState<number>(30)
  const [busy, setBusy] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  async function handleInject() {
    setBusy(true)
    setStatusMsg(null)
    try {
      await api.submitObservation({
        stop_id: stopId,
        queue_count: queueCount,
        booking_demand: bookingDemand,
        observation_source: 'simulation_interactive',
      })
      setStatusMsg('Surge observation recorded. Fleet reallocation recalculating.')
      onInjected()
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : 'Injection failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="p-4 bg-white border border-zinc-200/80 rounded-2xl text-xs space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700">
            <Sliders className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 text-xs">Manual Demand Surge Injector</h3>
            <p className="text-[10px] text-zinc-500">Inject custom crowd surges at any corridor stop</p>
          </div>
        </div>
        <span className="text-[10px] bg-amber-50 text-amber-700 font-medium px-2 py-0.5 rounded-full border border-amber-200/80">
          OVERRIDE
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-zinc-600 font-medium text-[11px] block mb-1.5">Target Station / Stop</label>
          <select
            value={stopId}
            onChange={(e) => setStopId(Number(e.target.value))}
            className="w-full bg-zinc-50 hover:bg-zinc-100/70 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-900 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
          >
            {stops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.location_type.replace('_', ' ')})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3 pt-1">
          {/* Queue Count Slider & Input */}
          <div className="bg-zinc-50/70 p-3 rounded-xl border border-zinc-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-zinc-600 font-medium text-[11px]">Platform Queue Demand</span>
              <span className="font-semibold text-zinc-900 font-mono text-xs bg-white px-2 py-0.5 rounded-md border border-zinc-200 tabular-nums">
                {queueCount} pax
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="400"
              step="10"
              value={queueCount}
              onChange={(e) => setQueueCount(Number(e.target.value))}
              aria-label="Platform Queue Demand Slider"
              className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Advance Bookings Slider & Input */}
          <div className="bg-zinc-50/70 p-3 rounded-xl border border-zinc-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-zinc-600 font-medium text-[11px]">Advance Mobile Bookings</span>
              <span className="font-semibold text-zinc-900 font-mono text-xs bg-white px-2 py-0.5 rounded-md border border-zinc-200 tabular-nums">
                {bookingDemand} tickets
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="150"
              step="5"
              value={bookingDemand}
              onChange={(e) => setBookingDemand(Number(e.target.value))}
              aria-label="Advance Mobile Bookings Slider"
              className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleInject}
        disabled={busy}
        className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-50 text-white font-medium rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-2"
      >
        {busy ? <LoadingSpinner size="sm" /> : <Zap className="w-3.5 h-3.5 fill-current" />}
        <span>Inject Custom Demand Surge</span>
      </button>

      {statusMsg && (
        <div className="space-y-2 pt-1 animate-in fade-in">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded-xl p-2.5 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span>{statusMsg}</span>
          </div>
          {onViewDispatches && (
            <button
              type="button"
              onClick={onViewDispatches}
              className="w-full py-2 px-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 shadow-xs transition-all"
            >
              <span>View Generated Reallocations</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
