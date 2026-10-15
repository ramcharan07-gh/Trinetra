import { useState } from 'react'
import type { Stop } from '@/types'
import { api } from '@/services/api'
import { LoadingSpinner } from '@/components/LoadingSpinner'

interface Props {
  stops: Stop[]
  onInjected: () => void
}

export function SurgeInjector({ stops, onInjected }: Props) {
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
      setStatusMsg('✓ Surge injected! Click "Generate Recommendations" above.')
      onInjected()
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : 'Injection failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="p-3 bg-slate-800/80 border border-slate-700/80 rounded-lg text-xs space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">
          Simulate Demand Surge
        </h3>
      </div>

      <div className="space-y-2">
        <div>
          <label className="text-slate-400 text-[10px] block mb-1">Target Location</label>
          <select
            value={stopId}
            onChange={(e) => setStopId(Number(e.target.value))}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
          >
            {stops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.location_type})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-slate-400 text-[10px] block mb-1">Queue Count</label>
            <input
              type="number"
              min="0"
              max="500"
              value={queueCount}
              onChange={(e) => setQueueCount(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
          <div>
            <label className="text-slate-400 text-[10px] block mb-1">Booking Count</label>
            <input
              type="number"
              min="0"
              max="200"
              value={bookingDemand}
              onChange={(e) => setBookingDemand(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleInject}
        disabled={busy}
        className="w-full py-1.5 px-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-900 font-bold rounded text-xs transition-colors flex items-center justify-center gap-1.5"
      >
        {busy ? <LoadingSpinner size="sm" /> : <span>⚡</span>}
        Inject Surge Spike
      </button>

      {statusMsg && (
        <p className="text-[11px] text-amber-300 font-medium leading-tight">
          {statusMsg}
        </p>
      )}
    </div>
  )
}

