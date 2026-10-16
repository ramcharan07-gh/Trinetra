import type { DispatchLogEntry } from '@/types'
import { ErrorCard } from '@/components/ErrorCard'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { formatTime } from '@/utils/format'
import { History, Clock, FileText } from 'lucide-react'

interface Props {
  history: DispatchLogEntry[] | null
  loading: boolean
  error: string | null
  onRetry: () => void
}

const ACTION_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  proposed: { label: 'Proposed', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200/80' },
  approved: { label: 'Dispatched', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/80' },
  rejected: { label: 'Declined', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200/80' },
  adjusted: { label: 'Modified', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/80' },
  cancelled: { label: 'Cancelled', bg: 'bg-zinc-100', text: 'text-zinc-600', border: 'border-zinc-200' },
  completed: { label: 'Arrived', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200/80' },
}

export function DispatchHistory({ history, loading, error, onRetry }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700">
            <History className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 text-xs">Dispatch Audit Trail</h3>
            <p className="text-[10px] text-zinc-500">Live operational event log</p>
          </div>
        </div>
        {history && history.length > 0 && (
          <span className="text-[10px] bg-zinc-100 text-zinc-600 font-mono px-2 py-0.5 rounded-full border border-zinc-200">
            {history.length} Events
          </span>
        )}
      </div>

      {loading && !history && (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      )}

      {error && <ErrorCard message={error} onRetry={onRetry} />}

      {history && history.length === 0 && (
        <div className="p-6 bg-white border border-zinc-200/80 rounded-2xl text-center shadow-xs">
          <FileText className="w-6 h-6 text-zinc-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-zinc-700">No Dispatch Actions Recorded</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Approved or rejected reallocations will appear here.</p>
        </div>
      )}

      <div className="space-y-2 max-h-[460px] overflow-y-auto pr-0.5">
        {history?.map((entry) => {
          const cfg = ACTION_CONFIG[entry.action] ?? {
            label: entry.action,
            bg: 'bg-zinc-100',
            text: 'text-zinc-700',
            border: 'border-zinc-200',
          }

          return (
            <div
              key={entry.id}
              className="p-3 bg-white border border-zinc-200/80 rounded-2xl text-xs space-y-2 shadow-xs hover:border-zinc-300 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-900 font-mono text-xs">{entry.vehicle_code}</span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                >
                  {cfg.label}
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-100">
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-2.5 h-2.5" />
                  {formatTime(entry.created_at)}
                </span>
                {entry.notes && (
                  <span className="truncate max-w-[160px] text-zinc-600 italic bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-100">
                    "{entry.notes}"
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
