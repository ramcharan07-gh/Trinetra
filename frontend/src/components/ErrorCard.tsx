interface Props {
  message: string
  onRetry?: () => void
}

export function ErrorCard({ message, onRetry }: Props) {
  return (
    <div className="flex flex-col items-center gap-1.5 p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-center shadow-xs">
      <div className="flex items-center gap-1.5 text-rose-800 font-semibold">
        <span>⚠️</span>
        <span>{message}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 px-3 py-1 bg-white border border-rose-300 text-rose-700 hover:bg-rose-100/50 rounded font-medium transition-colors shadow-xs"
        >
          Retry Connection
        </button>
      )}
    </div>
  )
}
