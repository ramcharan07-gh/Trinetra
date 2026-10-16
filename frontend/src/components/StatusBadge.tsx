import { cn } from '@/utils/cn'

interface StatusConfig {
  label: string
  bg: string
  text: string
  border: string
  dot: string
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  // Vehicle fleet statuses
  available: {
    label: 'Available',
    bg: 'bg-emerald-50/70',
    text: 'text-emerald-700',
    border: 'border-emerald-200/60',
    dot: 'bg-emerald-500',
  },
  assigned: {
    label: 'Assigned',
    bg: 'bg-blue-50/70',
    text: 'text-blue-700',
    border: 'border-blue-200/60',
    dot: 'bg-blue-500',
  },
  in_service: {
    label: 'In Transit',
    bg: 'bg-sky-50/70',
    text: 'text-sky-700',
    border: 'border-sky-200/60',
    dot: 'bg-sky-500',
  },
  out_of_service: {
    label: 'Out of Service',
    bg: 'bg-zinc-100',
    text: 'text-zinc-600',
    border: 'border-zinc-200',
    dot: 'bg-zinc-400',
  },

  // Recommendation statuses
  proposed: {
    label: 'Under Review',
    bg: 'bg-indigo-50/70',
    text: 'text-indigo-700',
    border: 'border-indigo-200/60',
    dot: 'bg-indigo-500',
  },
  approved: {
    label: 'Dispatched',
    bg: 'bg-emerald-50/70',
    text: 'text-emerald-800',
    border: 'border-emerald-300/70',
    dot: 'bg-emerald-600',
  },
  rejected: {
    label: 'Declined',
    bg: 'bg-rose-50/70',
    text: 'text-rose-700',
    border: 'border-rose-200/60',
    dot: 'bg-rose-500',
  },
  adjusted: {
    label: 'Modified',
    bg: 'bg-amber-50/70',
    text: 'text-amber-800',
    border: 'border-amber-200/60',
    dot: 'bg-amber-500',
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-zinc-100',
    text: 'text-zinc-600',
    border: 'border-zinc-200',
    dot: 'bg-zinc-400',
  },
  completed: {
    label: 'Arrived',
    bg: 'bg-teal-50/70',
    text: 'text-teal-700',
    border: 'border-teal-200/60',
    dot: 'bg-teal-500',
  },

  // Surge / Priority levels
  critical: {
    label: 'Critical Surge',
    bg: 'bg-rose-50/70',
    text: 'text-rose-700',
    border: 'border-rose-200/60',
    dot: 'bg-rose-500 animate-pulse',
  },
  high: {
    label: 'High Demand',
    bg: 'bg-amber-50/70',
    text: 'text-amber-700',
    border: 'border-amber-200/60',
    dot: 'bg-amber-500',
  },
  medium: {
    label: 'Moderate',
    bg: 'bg-zinc-100',
    text: 'text-zinc-700',
    border: 'border-zinc-200',
    dot: 'bg-zinc-500',
  },
  low: {
    label: 'Normal',
    bg: 'bg-zinc-50',
    text: 'text-zinc-600',
    border: 'border-zinc-200/80',
    dot: 'bg-zinc-400',
  },
}

interface Props {
  value: string
  className?: string
  showDot?: boolean
}

export function StatusBadge({ value, className, showDot = true }: Props) {
  const config = STATUS_CONFIG[value] ?? {
    label: value.replace(/_/g, ' '),
    bg: 'bg-zinc-100',
    text: 'text-zinc-700',
    border: 'border-zinc-200',
    dot: 'bg-zinc-400',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border tracking-tight transition-colors select-none',
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      {showDot && <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', config.dot)} />}
      <span>{config.label}</span>
    </span>
  )
}
