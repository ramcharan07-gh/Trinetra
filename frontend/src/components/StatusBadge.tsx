import { cn } from '@/utils/cn'

const STATUS_STYLES: Record<string, string> = {
  // Vehicle fleet statuses
  available: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold',
  assigned: 'bg-blue-50 text-blue-800 border-blue-300 font-semibold',
  in_service: 'bg-amber-50 text-amber-800 border-amber-300 font-semibold',
  out_of_service: 'bg-slate-100 text-slate-600 border-slate-300',

  // Recommendation & workflow statuses
  proposed: 'bg-indigo-50 text-indigo-800 border-indigo-200 font-semibold',
  approved: 'bg-emerald-100 text-emerald-900 border-emerald-400 font-bold',
  rejected: 'bg-rose-50 text-rose-800 border-rose-300 font-semibold',
  adjusted: 'bg-amber-100 text-amber-900 border-amber-400 font-semibold',
  cancelled: 'bg-slate-100 text-slate-600 border-slate-300',
  completed: 'bg-teal-50 text-teal-800 border-teal-300',

  // Urgency / priority levels
  critical: 'bg-rose-50 text-rose-900 border-rose-300 font-bold',
  high: 'bg-orange-50 text-orange-900 border-orange-300 font-bold',
  medium: 'bg-amber-50 text-amber-900 border-amber-300 font-medium',
  low: 'bg-slate-50 text-slate-700 border-slate-300',
}

const LABELS: Record<string, string> = {
  available: 'Available',
  assigned: 'Assigned',
  in_service: 'In Transit',
  out_of_service: 'Out of Service',
  proposed: 'Under Review',
  approved: 'Dispatched',
  rejected: 'Declined',
  adjusted: 'Modified',
  cancelled: 'Cancelled',
  completed: 'Arrived',
  critical: 'Critical Surge',
  high: 'High Demand',
  medium: 'Moderate',
  low: 'Normal',
}

interface Props {
  value: string
  className?: string
}

export function StatusBadge({ value, className }: Props) {
  const style = STATUS_STYLES[value] ?? 'bg-slate-100 text-slate-700 border-slate-300'
  const label = LABELS[value] ?? value.replace(/_/g, ' ')
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded text-[11px] border tracking-wide uppercase',
        style,
        className
      )}
    >
      {label}
    </span>
  )
}
