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
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null)
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

  const scoreColor =
    rec.priority_score >= 70
      ? 'text-green-400'
      : rec.priority_score >= 40
      ? 'text-amber-400'
      : 'text-slate-400'

  return (
    <div
      onClick={() => onSelect(rec)}
      className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
        isSelected
          ? 'bg-slate-800 border-blue-500 shadow-lg ring-1 ring-blue-500'
          : 'bg-slate-800/90 border-slate-700/80 hover:border-slate-600'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="font-bold text-slate-100 text-sm tracking-wide">
            {rec.vehicle_code}
          </span>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {rec.source_stop_name} <span className="text-blue-400">➔</span> {rec.destination_stop_name}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge value={rec.status} />
          <span className={`text-xs font-mono font-bold ${scoreColor}`}>
            Score {rec.priority_score.toFixed(0)}
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-1.5 mt-2.5 bg-slate-900/60 p-2 rounded text-center">
        <div>
          <span className="text-[10px] text-slate-400 uppercase block">ETA</span>
          <span className="font-bold text-slate-200">{formatEta(rec.estimated_arrival_minutes)}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase block">Spare Seats</span>
          <span className="font-bold text-emerald-400">{rec.useful_capacity}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase block">Route Mode</span>
          <span className="font-bold text-blue-300 capitalize text-[10px]">
            {rec.route_source === 'osrm' ? 'OSRM Live' : 'Estimated'}
          </span>
        </div>
      </div>

      {/* Waiting Time Impact Comparison */}
      {rec.impact && (
        <div className="mt-2 p-2 bg-slate-900/40 border border-slate-700/50 rounded flex items-center justify-between text-[11px]">
          <div>
            <span className="text-slate-400 block text-[10px]">Avg Wait Impact</span>
            <span className="text-slate-300 font-mono">
              {formatWait(rec.impact.baseline_wait_minutes)} ➔{' '}
              <b className="text-slate-100">{formatWait(rec.impact.projected_wait_minutes)}</b>
            </span>
          </div>
          <div className="text-right">
            <span
              className={`font-bold font-mono text-xs ${
                (rec.impact.reduction_percent ?? 0) > 0 ? 'text-green-400' : 'text-slate-400'
              }`}
            >
              {formatReduction(rec.impact.reduction_percent)}
            </span>
          </div>
        </div>
      )}

      {/* Explainable Decision Text */}
      <p className="mt-2 text-[11px] text-slate-300/80 italic leading-snug">
        "{rec.reason}"
      </p>

      {/* Operator Action Controls */}
      {isProposed && (
        <div className="flex gap-2 mt-3 pt-2 border-t border-slate-700/70">
          <button
            onClick={handleApprove}
            disabled={busy !== null}
            className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            {busy === 'approve' ? <LoadingSpinner size="sm" /> : <span>✓</span>}
            Approve
          </button>
          <button
            onClick={handleReject}
            disabled={busy !== null}
            className="flex-1 py-1.5 px-3 bg-red-700/80 hover:bg-red-600 disabled:opacity-50 text-red-100 font-semibold rounded text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            {busy === 'reject' ? <LoadingSpinner size="sm" /> : <span>✕</span>}
            Reject
          </button>
        </div>
      )}

      {actionError && (
        <p className="mt-2 text-red-400 text-[11px] font-medium">{actionError}</p>
      )}
    </div>
  )
}

