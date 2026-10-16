import { useState } from 'react'
import type { DispatchRecommendation } from '@/types'
import { StatusBadge } from '@/components/StatusBadge'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { formatEta, formatWait, formatReduction } from '@/utils/format'
import { api } from '@/services/api'
import { ArrowRight, Sparkles, Check, X, SlidersHorizontal, CornerDownRight } from 'lucide-react'

interface Props {
  rec: DispatchRecommendation
  onAction: () => void
  onSelect: (rec: DispatchRecommendation) => void
  isSelected: boolean
}

const PRESET_ADJUSTMENTS = [
  'Hold 5m for connecting train',
  'Express route via highway bypass',
  'Reserve 10 seats for en-route pickup',
  'Immediate depot standby',
]

export function RecommendationCard({ rec, onAction, onSelect, isSelected }: Props) {
  const [busy, setBusy] = useState<'approve' | 'reject' | 'adjust' | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isAdjusting, setIsAdjusting] = useState(false)
  const [adjustNote, setAdjustNote] = useState('')

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

  async function handleSaveAdjustment(e: React.MouseEvent) {
    e.stopPropagation()
    setBusy('adjust')
    setActionError(null)
    try {
      await api.recommendations.adjust(rec.id, {
        notes: adjustNote.trim() || 'Operational adjustment recorded by operator',
      })
      setIsAdjusting(false)
      setAdjustNote('')
      onAction()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Adjustment failed')
    } finally {
      setBusy(null)
    }
  }

  const scoreBadgeBg =
    rec.priority_score >= 70
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
      : rec.priority_score >= 40
      ? 'bg-amber-50 text-amber-700 border-amber-200/80'
      : 'bg-zinc-100 text-zinc-600 border-zinc-200'

  return (
    <div
      onClick={() => onSelect(rec)}
      className={`p-4 rounded-2xl border text-xs cursor-pointer transition-all ${
        isSelected
          ? 'bg-blue-50/[0.08] border-blue-500 ring-2 ring-blue-500/20 shadow-md'
          : 'bg-white border-zinc-200/80 hover:border-zinc-300 shadow-xs hover:shadow-subtle'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3 border-b border-zinc-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-900 text-sm font-mono tracking-tight">
              {rec.vehicle_code}
            </span>
            <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border ${scoreBadgeBg}`}>
              Score {rec.priority_score.toFixed(0)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-600 font-medium mt-1">
            <span>{rec.source_stop_name}</span>
            <ArrowRight className="w-3 h-3 text-blue-600 flex-shrink-0" />
            <span className="text-zinc-900 font-semibold">{rec.destination_stop_name}</span>
          </div>
        </div>
        <StatusBadge value={rec.status} />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2 mt-3 bg-zinc-50/80 p-2.5 rounded-xl border border-zinc-100 text-center">
        <div>
          <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider block">Estimated ETA</span>
          <span className="font-semibold text-zinc-900 text-xs font-mono">{formatEta(rec.estimated_arrival_minutes)}</span>
        </div>
        <div>
          <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider block">Free Seats</span>
          <span className="font-semibold text-blue-700 text-xs font-mono">{rec.useful_capacity} seats</span>
        </div>
        <div>
          <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider block">Routing Model</span>
          <span className="font-medium text-zinc-700 text-[11px]">
            {rec.route_source === 'osrm' ? 'OSRM Highway' : 'Direct Corridor'}
          </span>
        </div>
      </div>

      {/* Waiting Time Impact Comparison */}
      {rec.impact && (
        <div className="mt-3 p-3 bg-emerald-50/40 border border-emerald-200/60 rounded-xl flex flex-col gap-1.5 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-emerald-800 font-medium text-[11px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Modelled Delay Relief
            </span>
            <span
              className={`font-semibold font-mono text-xs ${
                (rec.impact.reduction_percent ?? 0) > 0 ? 'text-emerald-700' : 'text-zinc-600'
              }`}
            >
              {formatReduction(rec.impact.reduction_percent)}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-emerald-200/50">
            <span className="text-zinc-700 font-mono text-[11px]">
              {formatWait(rec.impact.baseline_wait_minutes)} <span className="text-zinc-400">➔</span>{' '}
              <b className="text-emerald-800">{formatWait(rec.impact.projected_wait_minutes)}</b>
            </span>
            <span className="text-[11px] text-zinc-500">
              Absorbs <b className="text-zinc-900 font-semibold">{rec.impact.passengers_cleared}</b> pax (Unmet: {rec.impact.remaining_queue})
            </span>
          </div>
        </div>
      )}

      {/* Rationale Quote */}
      <div className="mt-3 flex items-start gap-2 bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 text-[11px] text-zinc-600">
        <Sparkles className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {rec.reason}
        </p>
      </div>

      {/* Inline Operator Adjustment Drawer */}
      {isAdjusting && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-3 p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2.5 animate-in fade-in"
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-900 text-[11px] flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
              Operational Reallocation Adjustment
            </span>
            <button
              onClick={() => setIsAdjusting(false)}
              className="text-zinc-400 hover:text-zinc-700 p-0.5 rounded-md"
              title="Close adjustment"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-wrap gap-1">
            {PRESET_ADJUSTMENTS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAdjustNote(preset)}
                className="text-[10px] bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-zinc-600 border border-zinc-200 rounded-md px-2 py-0.5 transition-all"
              >
                + {preset}
              </button>
            ))}
          </div>

          <textarea
            value={adjustNote}
            onChange={(e) => setAdjustNote(e.target.value)}
            placeholder="Type custom dispatch instructions or constraints..."
            rows={2}
            className="w-full text-xs p-2 bg-white border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-sans"
          />

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdjusting(false)}
              className="px-2.5 py-1 text-xs text-zinc-600 hover:text-zinc-900 font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAdjustment}
              disabled={busy === 'adjust'}
              className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              {busy === 'adjust' ? <LoadingSpinner size="sm" /> : <CornerDownRight className="w-3 h-3" />}
              <span>Save & Apply Adjustment</span>
            </button>
          </div>
        </div>
      )}

      {/* Operator Action Controls */}
      {isProposed && !isAdjusting && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-100">
          <button
            onClick={handleApprove}
            disabled={busy !== null}
            className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 text-white font-medium rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs"
          >
            {busy === 'approve' ? <LoadingSpinner size="sm" /> : <Check className="w-3.5 h-3.5" />}
            <span>Approve Dispatch</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsAdjusting(true)
            }}
            disabled={busy !== null}
            className="py-2 px-3 bg-white hover:bg-zinc-50 active:scale-[0.98] border border-zinc-200 disabled:opacity-50 text-zinc-700 font-medium rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-500" />
            <span>Adjust</span>
          </button>
          <button
            onClick={handleReject}
            disabled={busy !== null}
            className="py-2 px-3 bg-white hover:bg-rose-50/60 active:scale-[0.98] border border-rose-200/80 disabled:opacity-50 text-rose-600 font-medium rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs"
          >
            {busy === 'reject' ? <LoadingSpinner size="sm" /> : <X className="w-3.5 h-3.5" />}
            <span>Reject</span>
          </button>
        </div>
      )}

      {actionError && (
        <p className="mt-2 text-rose-700 bg-rose-50 border border-rose-200/80 p-2 rounded-xl text-[11px] font-medium">{actionError}</p>
      )}
    </div>
  )
}
