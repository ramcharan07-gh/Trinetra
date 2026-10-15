import { cn } from '@/utils/cn'

const STATUS_STYLES: Record<string, string> = {
  available: 'bg-green-950 text-green-300 border-green-800',
  assigned: 'bg-blue-950 text-blue-300 border-blue-800',
  in_service: 'bg-yellow-950 text-yellow-300 border-yellow-800',
  out_of_service: 'bg-red-950 text-red-300 border-red-800',
  proposed: 'bg-slate-800 text-slate-300 border-slate-700',
  approved: 'bg-green-900 text-green-200 border-green-700',
  rejected: 'bg-red-900 text-red-200 border-red-700',
  adjusted: 'bg-yellow-900 text-yellow-200 border-yellow-700',
  cancelled: 'bg-gray-800 text-gray-400 border-gray-700',
  completed: 'bg-purple-900 text-purple-200 border-purple-700',
  critical: 'bg-red-950 text-red-400 border-red-800',
  high: 'bg-orange-950 text-orange-400 border-orange-800',
  medium: 'bg-yellow-950 text-yellow-400 border-yellow-800',
  low: 'bg-green-950 text-green-400 border-green-800',
}

const LABELS: Record<string, string> = {
  available: 'Available',
  assigned: 'Assigned',
  in_service: 'In Service',
  out_of_service: 'Out of Service',
  proposed: 'Proposed',
  approved: 'Approved',
  rejected: 'Rejected',
  adjusted: 'Adjusted',
  cancelled: 'Cancelled',
  completed: 'Completed',
  critical: '🔴 Critical',
  high: '🟠 High',
  medium: '🟡 Medium',
  low: '🟢 Low',
}

interface Props {
  value: string
  className?: string
}

export function StatusBadge({ value, className }: Props) {
  const style = STATUS_STYLES[value] ?? 'bg-slate-800 text-slate-400 border-slate-700'
  const label = LABELS[value] ?? value.replace(/_/g, ' ')
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border tracking-wide',
        style,
        className
      )}
    >
      {label}
    </span>
  )
}

