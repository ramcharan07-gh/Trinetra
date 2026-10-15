import type { DispatchLogEntry } from '@/types'
import { ErrorCard } from '@/components/ErrorCard'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { formatTime } from '@/utils/format'

interface Props {
  history: DispatchLogEntry[] | null
  loading: boolean
  error: string | null
  onRetry: () => void
}

const ACTION_COLORS: Record<string, string> = {
  proposed: 'text-slate-400',
  approved: 'text-emerald-400 font-bold',
  rejected: 'text-red-400 font-bold',
  adjusted: 'text-amber-400 font-bold',
  cancelled: 'text-slate-400',
  completed: 'text-purple-400 font-bold',
}

export function DispatchHistory({ history, loading, error, onRetry }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Audit Log
        </h2>
      </div>

      {loading && !history && (
        <div className="flex justify-center py-4">
          <LoadingSpinner />
        </div>
      )}

      {error && <ErrorCard message={error} onRetry={onRetry} />}

      {history && history.length === 0 && (
        <p className="text-slate-500 text-xs text-center py-4">No audit events recorded.</p>
      )}

      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
        {history?.map((entry) => (
          <div
            key={entry.id}
            className="p-2 bg-slate-900/60 border border-slate-800 rounded text-[11px] space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">{entry.vehicle_code}</span>
              <span className={ACTION_COLORS[entry.action] ?? 'text-slate-300'}>
                {entry.action.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400 text-[10px]">
              <span>{formatTime(entry.created_at)}</span>
              {entry.notes && <span className="truncate max-w-[120px] text-slate-500">{entry.notes}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

