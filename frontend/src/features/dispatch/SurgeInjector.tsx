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
      setStatusMsg('✓ Surge observation recorded. System updated.')
      onInjected()
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : 'Injection failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="p-3.5 bg-white border border-slate-200 rounded-lg text-xs space-y-3 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <h3 className="font-bold text-slate-900 tracking-tight text-xs uppercase">
          Inject Passenger Surge
        </h3>
        <span className="text-[10px] bg-amber-50 text-amber-800 font-semibold px-2 py-0.5 rounded border border-amber-200">
          MANUAL OVERRIDE
        </span>
      </div>

      <div className="space-y-2">
        <div>
          <label className="text-slate-600 font-semibold text-[11px] block mb-1">Target Station / Stop</label>
          <select
            value={stopId}
            onChange={(e) => setStopId(Number(e.target.value))}
            className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-800 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all font-medium"
          >
            {stops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.location_type.replace('_', ' ')})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-slate-600 font-semibold text-[11px] block mb-1">Platform Queue</label>
            <input
              type="number"
              min="0"
              max="500"
              value={queueCount}
              onChange={(e) => setQueueCount(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-800 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all font-mono"
            />
          </div>
          <div>
            <label className="text-slate-600 font-semibold text-[11px] block mb-1">Advance Bookings</label>
            <input
              type="number"
              min="0"
              max="200"
              value={bookingDemand}
              onChange={(e) => setBookingDemand(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-800 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all font-mono"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleInject}
        disabled={busy}
        className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-900 active:bg-slate-950 disabled:opacity-50 text-white font-semibold rounded-md text-xs transition-colors shadow-xs flex items-center justify-center gap-2"
      >
        {busy ? <LoadingSpinner size="sm" /> : <span>⚡</span>}
        Inject Custom Demand
      </button>

      {statusMsg && (
        <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-1.5 font-medium text-center">
          {statusMsg}
        </p>
      )}
    </div>
  )
}
