import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

export interface ToastItem {
  id: string
  title: string
  message?: string
  type: 'success' | 'warning' | 'info' | 'error'
}

interface ToastContextValue {
  showToast: (title: string, message?: string, type?: ToastItem['type']) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    return {
      showToast: () => {},
    }
  }
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback((title: string, message?: string, type: ToastItem['type'] = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    const newToast: ToastItem = { id, title, message, type }
    setToasts((prev) => [...prev.slice(-3), newToast]) // keep at most 4 active

    setTimeout(() => {
      dismiss(id)
    }, 4000)
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Notification Container */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4"
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success'
          const isError = toast.type === 'error'
          const isWarning = toast.type === 'warning'

          return (
            <div
              key={toast.id}
              role="status"
              className="pointer-events-auto flex items-start gap-3 p-3 bg-white/95 backdrop-blur-md border border-zinc-200/90 rounded-2xl shadow-float text-xs text-zinc-900 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2"
            >
              <div className="flex-shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                {isError && <X className="w-4 h-4 text-rose-600" />}
                {isWarning && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-4 h-4 text-blue-600" />}
              </div>
              <div className="flex-1 min-w-0 pr-1">
                <p className="font-semibold text-zinc-900 text-xs leading-snug">{toast.title}</p>
                {toast.message && (
                  <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">{toast.message}</p>
                )}
              </div>
              <button
                onClick={() => dismiss(toast.id)}
                className="text-zinc-400 hover:text-zinc-700 p-0.5 rounded-lg hover:bg-zinc-100 transition-colors"
                title="Dismiss"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
