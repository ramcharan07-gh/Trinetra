export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'w-3.5 h-3.5 border', md: 'w-5 h-5 border-2', lg: 'w-8 h-8 border-2' }[size]
  return (
    <div
      className={`${s} border-slate-600 border-t-blue-400 rounded-full animate-spin`}
    />
  )
}

