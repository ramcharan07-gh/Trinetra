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
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 font-bold text-slate-900 tracking-tight text-xs uppercase">
          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          <span>Waiting-Time Impact Model</span>
        </div>
      </div>

      {loading && !metrics && (
        <div className="flex justify-center py-6">
          <LoadingSpinner />
        </div>
      )}

      {error && <ErrorCard message={error} onRetry={onRetry} />}

      {metrics && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-white border border-slate-200 p-2.5 rounded-md shadow-2xs">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Surge Hubs</span>
            <span className="text-lg font-bold text-slate-900 font-mono">
              {metrics.total_hotspots}
            </span>
          </div>

          <div className="bg-white border border-slate-200 p-2.5 rounded-md shadow-2xs">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Dispatched Buses</span>
            <span className="text-lg font-bold text-emerald-700 font-mono">
              {metrics.approved_count}
            </span>
          </div>

          <div className="bg-white border border-slate-200 p-2.5 rounded-md shadow-2xs">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Mean Transit Time</span>
            <span className="text-lg font-bold text-blue-700 font-mono">
              {metrics.average_eta_minutes ? `${metrics.average_eta_minutes}m` : '—'}
            </span>
          </div>

          <div className="bg-white border border-slate-200 p-2.5 rounded-md shadow-2xs">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Mean Delay Saved</span>
            <span
              className={`text-lg font-bold font-mono ${
                (metrics.average_wait_reduction_percent ?? 0) > 0
                  ? 'text-emerald-700'
                  : 'text-slate-700'
              }`}
            >
              {metrics.average_wait_reduction_percent
                ? `↓ ${metrics.average_wait_reduction_percent}%`
                : '—'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
