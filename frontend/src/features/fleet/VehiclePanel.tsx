import type { Vehicle } from '@/types'
import { StatusBadge } from '@/components/StatusBadge'
import { ErrorCard } from '@/components/ErrorCard'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { timeAgo } from '@/utils/format'

interface Props {
  vehicles: Vehicle[] | null
  loading: boolean
  error: string | null
  onRetry: () => void
}

export function VehiclePanel({ vehicles, loading, error, onRetry }: Props) {
  const availableCount = vehicles?.filter((v) => v.status === 'available').length ?? 0

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 font-bold text-slate-900 tracking-tight text-xs uppercase">
          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          <span>Fleet Real-Time Status</span>
        </div>
        {vehicles && (
          <span className="text-[11px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded border border-slate-200">
            {availableCount}/{vehicles.length} Available
          </span>
        )}
      </div>

      {loading && !vehicles && (
        <div className="flex justify-center py-6">
          <LoadingSpinner />
        </div>
      )}

      {error && <ErrorCard message={error} onRetry={onRetry} />}

      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
        {vehicles?.map((v) => {
          const isAvailable = v.status === 'available'
          return (
            <div
              key={v.id}
              className={`p-2.5 rounded-md border text-xs transition-colors ${
                isAvailable
                  ? 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 font-mono">{v.vehicle_code}</span>
                <StatusBadge value={v.status} />
              </div>
              <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                <span>
                  Seats Free: <b className="text-slate-800">{v.available_seats}</b> / {v.capacity}
                </span>
                <span className="text-[10px]">GPS: {timeAgo(v.location_updated_at)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
