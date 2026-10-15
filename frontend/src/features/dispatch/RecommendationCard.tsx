import { useState } from 'react'
import type { DispatchRecommendation } from '@/types'
import { StatusBadge } from '@/components/StatusBadge'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { formatEta, formatWait, formatReduction } from '@/utils/format'
import { api } from '@/services/api'

interface Props {
  rec: DispatchRecommendation
  onAction: () => void
  onSelect: (rec: DispatchRecommendation) => void
  isSelected: boolean
}

export function RecommendationCard({ rec, onAction, onSelect, isSelected }: Props) {
  const [busy, setBusy] = useState<'approve' | 'reject' | 'adjust' | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const isProposed = rec.status === 'proposed'

  async function handleApprove(e: React.MouseEvent) {
    e.stopPropagation()
    setBusy('approve')
    setActionError(null)
    try {
      await api.recommendations.approve(rec.id)
      onAction()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Approval failed')
    } finally {
      setBusy(null)
    }
  }

  async function handleReject(e: React.MouseEvent) {
    e.stopPropagation()
    setBusy('reject')
    setActionError(null)
    try {
      await api.recommendations.reject(rec.id)
      onAction()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Rejection failed')
    } finally {
      setBusy(null)
    }
  }

  const scoreBadgeBg =
    rec.priority_score >= 70
      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
      : rec.priority_score >= 40
      ? 'bg-amber-50 text-amber-800 border-amber-300'
      : 'bg-slate-100 text-slate-700 border-slate-300'

  return (
    <div
      onClick={() => onSelect(rec)}
      className={`p-3.5 rounded-lg border text-xs cursor-pointer transition-all ${
        isSelected
          ? 'bg-blue-50/40 border-blue-600 ring-2 ring-blue-600/20 shadow-md'
          : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-sm font-mono tracking-tight">
              {rec.vehicle_code}
            </span>
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${scoreBadgeBg}`}>
              Score {rec.priority_score.toFixed(0)}
            </span>
          </div>
          <p className="text-[11px] text-slate-600 font-medium mt-0.5">
            {rec.source_stop_name} <span className="text-blue-600 font-bold">➔</span> {rec.destination_stop_name}
          </p>
        </div>
        <StatusBadge value={rec.status} />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2 mt-2.5 bg-slate-50 p-2.5 rounded-md border border-slate-100 text-center">
        <div>
          <span className="text-[10px] text-slate-500 font-semibold uppercase block">Estimated ETA</span>
          <span className="font-bold text-slate-800 text-xs font-mono">{formatEta(rec.estimated_arrival_minutes)}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 font-semibold uppercase block">Spare Seats</span>
          <span className="font-bold text-blue-700 text-xs font-mono">{rec.useful_capacity} places</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 font-semibold uppercase block">Routing Model</span>
          <span className="font-semibold text-slate-700 text-[11px]">
            {rec.route_source === 'osrm' ? 'OSRM Highway' : 'Direct Corridor'}
          </span>
        </div>
      </div>

      {/* Waiting Time Impact Comparison */}
      {rec.impact && (
        <div className="mt-2.5 p-2.5 bg-emerald-50/50 border border-emerald-200/80 rounded-md flex flex-col gap-1 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-slate-600 font-semibold text-[10px]">Modelled Delay Relief</span>
            <span
              className={`font-bold font-mono text-xs ${
                (rec.impact.reduction_percent ?? 0) > 0 ? 'text-emerald-800' : 'text-slate-600'
              }`}
            >
              {formatReduction(rec.impact.reduction_percent)}
            </span>
          </div>
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-slate-700 font-mono text-[11px]">
              {formatWait(rec.impact.baseline_wait_minutes)} ➔{' '}
              <b className="text-emerald-800">{formatWait(rec.impact.projected_wait_minutes)}</b>
            </span>
            <span className="text-[10px] text-slate-600">
              Absorbs <b className="text-slate-900">{rec.impact.passengers_cleared}</b> pax (Unmet: {rec.impact.remaining_queue})
            </span>
          </div>
        </div>
      )}

      {/* Explainable Decision Text */}
      <p className="mt-2.5 text-[11px] text-slate-600 italic leading-relaxed bg-slate-50/80 p-2 rounded border border-slate-100">
        "{rec.reason}"
      </p>

      {/* Operator Action Controls */}
      {isProposed && (
        <div className="flex gap-2 mt-3 pt-2.5 border-t border-slate-100">
          <button
            onClick={handleApprove}
            disabled={busy !== null}
            className="flex-1 py-1.5 px-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 disabled:opacity-50 text-white font-semibold rounded-md text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
          >
            {busy === 'approve' ? <LoadingSpinner size="sm" /> : <span>✓</span>}
            Approve Dispatch
          </button>
          <button
            onClick={async (e) => {
              e.stopPropagation()
              const customNote = window.prompt('Enter operational adjustment note (e.g., Hold 5 mins for connecting train):')
              if (customNote !== null) {
                setBusy('adjust')
                try {
                  await api.recommendations.adjust(rec.id, { notes: customNote || 'Operational adjustment recorded' })
                  onAction()
                } catch (err) {
                  setActionError(err instanceof Error ? err.message : 'Adjustment failed')
                } finally {
                  setBusy(null)
                }
              }
            }}
            disabled={busy !== null}
            className="py-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-300 disabled:opacity-50 text-slate-700 font-semibold rounded-md text-xs transition-colors flex items-center justify-center gap-1 shadow-2xs"
          >
            <span>✎</span>
            Adjust
          </button>
          <button
            onClick={handleReject}
            disabled={busy !== null}
            className="py-1.5 px-3 bg-white hover:bg-rose-50 border border-rose-300 disabled:opacity-50 text-rose-700 font-semibold rounded-md text-xs transition-colors flex items-center justify-center gap-1 shadow-2xs"
          >
            {busy === 'reject' ? <LoadingSpinner size="sm" /> : <span>✕</span>}
            Reject
          </button>
        </div>
      )}

      {actionError && (
        <p className="mt-2 text-rose-700 bg-rose-50 border border-rose-200 p-1.5 rounded text-[11px] font-medium">{actionError}</p>
      )}
    </div>
  )
}
