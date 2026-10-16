import type { Hotspot } from '@/types'
import { StatusBadge } from '@/components/StatusBadge'
import { ErrorCard } from '@/components/ErrorCard'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { timeAgo } from '@/utils/format'
import { AlertTriangle, CheckCircle2, Flame, Users, ArrowRight } from 'lucide-react'

interface Props {
  hotspots: Hotspot[] | null
  loading: boolean
  error: string | null
  onRetry: () => void
  onSelectHotspot?: (stopId: number) => void
  selectedStopId?: number | null
}

export function HotspotPanel({
  hotspots,
  loading,
  error,
  onRetry,
  onSelectHotspot,
  selectedStopId,
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700">
            <Flame className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 text-xs">Demand Hotspots</h3>
            <p className="text-[10px] text-zinc-500">Real-time corridor surge alerts</p>
          </div>
        </div>
        {hotspots && (
          <span className="text-[10px] bg-rose-50 text-rose-700 font-semibold px-2 py-0.5 rounded-full border border-rose-200/80">
            {hotspots.length} Flagged
          </span>
        )}
      </div>

      {loading && !hotspots && (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      )}

      {error && <ErrorCard message={error} onRetry={onRetry} />}

      {hotspots && hotspots.length === 0 && (
        <div className="p-6 bg-white border border-zinc-200/80 rounded-2xl text-center shadow-xs">
          <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-zinc-800">All Corridor Stops Balanced</p>
          <p className="text-[11px] text-zinc-500 mt-1">Passenger demand is within standard scheduled transit baseline.</p>
        </div>
      )}

      <div className="space-y-2.5">
        {hotspots?.map((h) => {
          const isSelected = selectedStopId === h.stop_id
          const deficitRatio = Math.min(100, Math.round((h.capacity_shortage / Math.max(1, h.current_demand)) * 100))

          return (
            <div
              key={h.stop_id}
              onClick={() => onSelectHotspot?.(h.stop_id)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-50/[0.12] border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                  : 'bg-white border-zinc-200/80 hover:border-zinc-300 shadow-xs hover:shadow-subtle'
              }`}
            >
              <div className="flex items-start justify-between gap-2 border-b border-zinc-100 pb-2.5">
                <div>
                  <p className="text-xs font-semibold text-zinc-900">{h.stop_name}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Updated {timeAgo(h.observed_at)}</p>
                </div>
                <StatusBadge value={h.priority} />
              </div>

              {/* Passenger Queue vs Shortage visual strip */}
              <div className="mt-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-500 flex items-center gap-1">
                    <Users className="w-3 h-3 text-zinc-400" />
                    Queue Demand
                  </span>
                  <span className="font-semibold text-zinc-900 font-mono tabular-nums">{h.current_demand} pax</span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-500 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-500" />
                    Seat Deficit
                  </span>
                  <span className="font-semibold text-rose-600 font-mono tabular-nums">-{h.capacity_shortage} seats</span>
                </div>

                {/* Visual severity bar */}
                <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-rose-500 transition-all"
                    style={{ width: `${deficitRatio}%` }}
                  />
                </div>
              </div>

              {/* Secondary Details */}
              <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2 border-t border-zinc-100 text-[10px] text-zinc-500">
                <div>
                  <span>Baseline: </span>
                  <span className="font-semibold text-zinc-700">{h.historical_baseline} pax</span>
                </div>
                <div className="text-right">
                  <span>Surge Factor: </span>
                  <span className="font-semibold text-amber-700 font-mono">{h.surge_ratio}x</span>
                </div>
              </div>

              {onSelectHotspot && (
                <div className="mt-2.5 pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-blue-600 font-medium group">
                  <span>{isSelected ? 'Filter active for this stop' : 'Filter dispatches for this stop'}</span>
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
