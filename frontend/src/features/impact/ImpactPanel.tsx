import type { ImpactMetrics } from '@/types'
import { ErrorCard } from '@/components/ErrorCard'
import { LoadingSpinner } from '@/components/LoadingSpinner'

interface Props {
  metrics: ImpactMetrics | null
  loading: boolean
  error: string | null
  onRetry: () => void
}

export function ImpactPanel({ metrics, loading, error, onRetry }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Waiting-Time Impact
        </h2>
      </div>

      {loading && !metrics && (
        <div className="flex justify-center py-4">
          <LoadingSpinner />
        </div>
      )}

      {error && <ErrorCard message={error} onRetry={onRetry} />}

      {metrics && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded text-center">
            <span className="text-[10px] text-slate-400 uppercase block">Active Surges</span>
            <span className="text-base font-bold text-amber-400 font-mono">
              {metrics.total_hotspots}
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded text-center">
            <span className="text-[10px] text-slate-400 uppercase block">Approved Buses</span>
            <span className="text-base font-bold text-emerald-400 font-mono">
              {metrics.approved_count}
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded text-center">
            <span className="text-[10px] text-slate-400 uppercase block">Average ETA</span>
            <span className="text-base font-bold text-blue-400 font-mono">
              {metrics.average_eta_minutes ? `${metrics.average_eta_minutes}m` : '—'}
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded text-center">
            <span className="text-[10px] text-slate-400 uppercase block">Wait Reduction</span>
            <span
              className={`text-base font-bold font-mono ${
                (metrics.average_wait_reduction_percent ?? 0) > 0
                  ? 'text-emerald-400'
                  : 'text-slate-300'
              }`}
            >
              {metrics.average_wait_reduction_percent
                ? `-${metrics.average_wait_reduction_percent}%`
                : '—'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

