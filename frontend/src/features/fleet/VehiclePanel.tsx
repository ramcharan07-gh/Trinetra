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
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Fleet Monitoring
        </h2>
        {vehicles && (
          <span className="text-[11px] text-slate-500 font-mono">
            {availableCount}/{vehicles.length} Available
          </span>
        )}
      </div>

      {loading && !vehicles && (
        <div className="flex justify-center py-4">
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
              className={`p-2 rounded border text-xs transition-colors ${
                isAvailable
                  ? 'bg-slate-800/80 border-slate-700 hover:border-slate-600'
                  : 'bg-slate-900/60 border-slate-800/60 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">{v.vehicle_code}</span>
                <StatusBadge value={v.status} />
              </div>
              <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                <span>
                  Seats: <b className="text-slate-300">{v.available_seats}</b> / {v.capacity}
                </span>
                <span>GPS: {timeAgo(v.location_updated_at)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

