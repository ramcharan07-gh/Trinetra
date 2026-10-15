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
}

export function HotspotPanel({ hotspots, loading, error, onRetry }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Demand Hotspots
        </h2>
        {hotspots && (
          <span className="text-[11px] text-slate-500 font-mono">
            {hotspots.length} active
          </span>
        )}
      </div>

      {loading && !hotspots && (
        <div className="flex justify-center py-4">
          <LoadingSpinner />
        </div>
      )}

      {error && <ErrorCard message={error} onRetry={onRetry} />}

      {hotspots && hotspots.length === 0 && (
        <div className="p-3 bg-slate-800/40 border border-slate-800 rounded text-center">
          <p className="text-xs text-slate-400">No active surges detected.</p>
          <p className="text-[11px] text-slate-600 mt-0.5">All stops operating within baseline.</p>
        </div>
      )}

      <div className="space-y-2">
        {hotspots?.map((h) => (
          <div
            key={h.stop_id}
            className="bg-slate-800/90 border border-slate-700/80 rounded-lg p-3 space-y-2 hover:border-slate-600 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-slate-100">{h.stop_name}</p>
                <p className="text-[11px] text-slate-400">Observed {timeAgo(h.observed_at)}</p>
              </div>
              <StatusBadge value={h.priority} />
            </div>

            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] bg-slate-900/60 p-2 rounded">
              <span className="text-slate-400">Waiting Demand:</span>
              <span className="text-right font-semibold text-slate-200">{h.current_demand} pax</span>

              <span className="text-slate-400">Capacity Gap:</span>
              <span className="text-right font-bold text-red-400">-{h.capacity_shortage}</span>

              <span className="text-slate-400">Historical Base:</span>
              <span className="text-right text-slate-300">{h.historical_baseline} pax</span>

              <span className="text-slate-400">Surge Ratio:</span>
              <span className="text-right font-semibold text-amber-400">{h.surge_ratio}x</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

