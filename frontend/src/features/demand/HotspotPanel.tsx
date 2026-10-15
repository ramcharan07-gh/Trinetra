import type { Hotspot } from '@/types'
import { StatusBadge } from '@/components/StatusBadge'
import { ErrorCard } from '@/components/ErrorCard'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { timeAgo } from '@/utils/format'

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
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 font-bold text-slate-900 tracking-tight text-xs uppercase">
          <span className="w-2 h-2 rounded-full bg-rose-600"></span>
          <span>Demand Hotspots</span>
        </div>
        {hotspots && (
          <span className="text-[11px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded border border-slate-200">
            {hotspots.length} flagged
          </span>
        )}
      </div>

      {loading && !hotspots && (
        <div className="flex justify-center py-6">
          <LoadingSpinner />
        </div>
      )}

      {error && <ErrorCard message={error} onRetry={onRetry} />}

      {hotspots && hotspots.length === 0 && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
          <p className="text-xs font-semibold text-slate-700">All stops balanced</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Passenger demand is within regular scheduled baseline.</p>
        </div>
      )}

      <div className="space-y-2">
        {hotspots?.map((h) => {
          const isSelected = selectedStopId === h.stop_id
          return (
            <div
              key={h.stop_id}
              onClick={() => onSelectHotspot?.(h.stop_id)}
              className={`border rounded-lg p-3 space-y-2 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-50/60 border-blue-500 ring-1 ring-blue-500/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-slate-900">{h.stop_name}</p>
                  <p className="text-[10px] text-slate-500">Updated {timeAgo(h.observed_at)}</p>
                </div>
                <StatusBadge value={h.priority} />
              </div>

              <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px] bg-slate-50 p-2 rounded-md border border-slate-100">
                <span className="text-slate-500 font-medium">Passenger Queue:</span>
                <span className="text-right font-bold text-slate-800">{h.current_demand} passengers</span>

                <span className="text-slate-500 font-medium">Capacity Deficit:</span>
                <span className="text-right font-bold text-rose-700">-{h.capacity_shortage} seats</span>

                <span className="text-slate-500 font-medium">Historical Baseline:</span>
                <span className="text-right text-slate-600 font-medium">{h.historical_baseline} pax</span>

                <span className="text-slate-500 font-medium">Surge Factor:</span>
                <span className="text-right font-bold text-amber-700">{h.surge_ratio}x</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
