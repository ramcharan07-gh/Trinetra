import { AlertCircle, RotateCw } from 'lucide-react'

interface Props {
  message: string
  onRetry?: () => void
}

export function ErrorCard({ message, onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 p-4 bg-rose-50/70 border border-rose-200/80 rounded-xl text-xs text-center shadow-xs">
      <div className="flex items-center gap-2 text-rose-800 font-medium">
        <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
        <span>{message}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 mt-1 px-3 py-1.5 bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-medium transition-all shadow-xs active:scale-95"
        >
          <RotateCw className="w-3 h-3" />
          <span>Retry Connection</span>
        </button>
      )}
    </div>
  )
}
