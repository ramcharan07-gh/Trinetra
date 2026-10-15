export function formatTime(isoString: string | null): string {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

export function formatEta(minutes: number | null | undefined): string {
  if (minutes == null) return '—'
  if (minutes < 1) return '< 1 min'
  return `${Math.round(minutes)} min`
}

export function formatWait(minutes: number | null | undefined): string {
  if (minutes == null) return '—'
  return `${minutes.toFixed(1)} min`
}

export function formatReduction(pct: number | null | undefined): string {
  if (pct == null) return '—'
  const sign = pct > 0 ? '-' : pct < 0 ? '+' : ''
  return `${sign}${Math.abs(pct).toFixed(1)}%`
}

export function timeAgo(isoString: string | null): string {
  if (!isoString) return '—'
  const diff = (Date.now() - new Date(isoString).getTime()) / 1000
  if (diff < 60) return `${Math.max(1, Math.round(diff))}s ago`
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`
  return `${Math.round(diff / 3600)}h ago`
}

