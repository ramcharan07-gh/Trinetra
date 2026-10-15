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

const ACTION_STYLES: Record<string, string> = {
  proposed: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  approved: 'bg-emerald-50 text-emerald-800 border-emerald-300',
  rejected: 'bg-rose-50 text-rose-800 border-rose-200',
  adjusted: 'bg-amber-50 text-amber-800 border-amber-300',
  cancelled: 'bg-slate-100 text-slate-700 border-slate-200',
  completed: 'bg-teal-50 text-teal-800 border-teal-200',
}

export function DispatchHistory({ history, loading, error, onRetry }: Props) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 font-bold text-slate-900 tracking-tight text-xs uppercase">
          <span className="w-2 h-2 rounded-full bg-slate-600"></span>
          <span>Dispatch Audit Trail</span>
        </div>
      </div>

      {loading && !history && (
        <div className="flex justify-center py-6">
          <LoadingSpinner />
        </div>
      )}

      {error && <ErrorCard message={error} onRetry={onRetry} />}

      {history && history.length === 0 && (
        <p className="text-slate-400 text-xs text-center py-6">No dispatcher actions recorded in this session.</p>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {history?.map((entry) => (
          <div
            key={entry.id}
            className="p-2.5 bg-white border border-slate-200 rounded-md text-[11px] space-y-1.5 shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 font-mono">{entry.vehicle_code}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${ACTION_STYLES[entry.action] ?? 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                {entry.action}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-500 text-[10px]">
              <span className="font-mono">{formatTime(entry.created_at)}</span>
              {entry.notes && <span className="truncate max-w-[130px] text-slate-600 italic">{entry.notes}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
