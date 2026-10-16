import type { ImpactMetrics } from '@/types'
import { ErrorCard } from '@/components/ErrorCard'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { TrendingDown, Clock, CheckCircle2, Flame, BarChart3 } from 'lucide-react'

interface Props {
  metrics: ImpactMetrics | null
  loading: boolean
  error: string | null
  onRetry: () => void
}

export function ImpactPanel({ metrics, loading, error, onRetry }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700">
            <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 text-xs">Waiting-Time Impact Model</h3>
            <p className="text-[10px] text-zinc-500">APSRTC corridor delay reduction metrics</p>
          </div>
        </div>
      </div>

      {loading && !metrics && (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      )}

      {error && <ErrorCard message={error} onRetry={onRetry} />}

      {metrics && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white border border-zinc-200/80 p-3 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-zinc-400 mb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Surge Hubs</span>
                <Flame className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <span className="text-xl font-bold text-zinc-900 font-mono tabular-nums">
                {metrics.total_hotspots}
              </span>
              <p className="text-[10px] text-zinc-400 mt-0.5">Active flagged stations</p>
            </div>

            <div className="bg-white border border-zinc-200/80 p-3 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-zinc-400 mb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Dispatched</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <span className="text-xl font-bold text-emerald-600 font-mono tabular-nums">
                {metrics.approved_count}
              </span>
              <p className="text-[10px] text-zinc-400 mt-0.5">Approved bus reallocations</p>
            </div>

            <div className="bg-white border border-zinc-200/80 p-3 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-zinc-400 mb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Route ETA</span>
                <Clock className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <span className="text-xl font-bold text-zinc-900 font-mono tabular-nums">
                {metrics.average_eta_minutes ? `${metrics.average_eta_minutes}m` : '—'}
              </span>
              <p className="text-[10px] text-zinc-400 mt-0.5">Mean time to hotspot</p>
            </div>

            <div className="bg-white border border-zinc-200/80 p-3 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-zinc-400 mb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Wait Saved</span>
                <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <span
                className={`text-xl font-bold font-mono tabular-nums ${
                  (metrics.average_wait_reduction_percent ?? 0) > 0
                    ? 'text-emerald-600'
                    : 'text-zinc-700'
                }`}
              >
                {metrics.average_wait_reduction_percent
                  ? `↓ ${metrics.average_wait_reduction_percent}%`
                  : '—'}
              </span>
              <p className="text-[10px] text-zinc-400 mt-0.5">vs scheduled headway</p>
            </div>
          </div>

          <div className="bg-zinc-50/70 border border-zinc-200/80 p-3 rounded-xl text-[11px] text-zinc-600 leading-relaxed">
            <span className="font-semibold text-zinc-900 block mb-0.5">Evaluation Logic</span>
            Relief is quantified by comparing the queue clearance rate of reallocated spare buses against the standard APSRTC timetable headway.
          </div>
        </div>
      )}
    </div>
  )
}
