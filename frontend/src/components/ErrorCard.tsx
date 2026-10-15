interface Props {
  message: string
  onRetry?: () => void
}

export function ErrorCard({ message, onRetry }: Props) {
  return (
    <div className="flex flex-col items-center gap-1.5 p-3 bg-red-950/40 border border-red-800/80 rounded text-xs text-center">
      <span className="text-red-300">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-red-400 hover:text-red-200 underline font-medium"
        >
          Retry
        </button>
      )}
    </div>
  )
}

