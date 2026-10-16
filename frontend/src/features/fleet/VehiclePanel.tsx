import { useState, useMemo } from 'react'
import type { Vehicle } from '@/types'
import { StatusBadge } from '@/components/StatusBadge'
import { ErrorCard } from '@/components/ErrorCard'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { timeAgo } from '@/utils/format'
import { Bus, Radio, Users, Search, X } from 'lucide-react'

interface Props {
  vehicles: Vehicle[] | null
  loading: boolean
  error: string | null
  onRetry: () => void
}

export function VehiclePanel({ vehicles, loading, error, onRetry }: Props) {
  const [filter, setFilter] = useState<'all' | 'available' | 'assigned'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const availableCount = vehicles?.filter((v) => v.status === 'available').length ?? 0
  const assignedCount = vehicles?.filter((v) => v.status === 'assigned' || v.status === 'in_service').length ?? 0

  const filteredVehicles = useMemo(() => {
    if (!vehicles) return []
    return vehicles.filter((v) => {
      // Status filter
      if (filter === 'available' && v.status !== 'available') return false
      if (filter === 'assigned' && v.status !== 'assigned' && v.status !== 'in_service') return false

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchesCode = v.vehicle_code.toLowerCase().includes(q)
        const matchesStatus = v.status.toLowerCase().includes(q)
        return matchesCode || matchesStatus
      }
      return true
    })
  }, [vehicles, filter, searchQuery])

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700">
            <Bus className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 text-xs">Fleet Real-Time Status</h3>
            <p className="text-[10px] text-zinc-500">APSRTC regional vehicle telemetry</p>
          </div>
        </div>
        {vehicles && (
          <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200/80">
            {availableCount} Available
          </span>
        )}
      </div>

      {/* Search Bar & Filter Controls */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bus registration number..."
            className="w-full bg-zinc-50 hover:bg-zinc-100/60 focus:bg-white text-xs pl-8 pr-7 py-1.5 rounded-xl border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 p-0.5"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Segmented Filter Pills */}
        <div className="flex items-center gap-1 p-1 bg-zinc-100/80 rounded-xl text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-1 px-2.5 rounded-lg text-[11px] font-medium transition-all ${
              filter === 'all'
                ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            All ({vehicles?.length ?? 0})
          </button>
          <button
            onClick={() => setFilter('available')}
            className={`flex-1 py-1 px-2.5 rounded-lg text-[11px] font-medium transition-all ${
              filter === 'available'
                ? 'bg-white text-emerald-800 shadow-2xs font-semibold'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Idle ({availableCount})
          </button>
          <button
            onClick={() => setFilter('assigned')}
            className={`flex-1 py-1 px-2.5 rounded-lg text-[11px] font-medium transition-all ${
              filter === 'assigned'
                ? 'bg-white text-blue-800 shadow-2xs font-semibold'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Active ({assignedCount})
          </button>
        </div>
      </div>

      {loading && !vehicles && (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      )}

      {error && <ErrorCard message={error} onRetry={onRetry} />}

      <div className="space-y-2 max-h-[460px] overflow-y-auto pr-0.5">
        {filteredVehicles.length === 0 && vehicles && (
          <div className="p-6 text-center bg-zinc-50 border border-zinc-200/80 rounded-2xl text-xs text-zinc-500">
            No vehicles match the selected filter or search query.
          </div>
        )}

        {filteredVehicles.map((v) => {
          const isAvailable = v.status === 'available'
          const occupied = v.capacity - v.available_seats
          const occupancyPct = Math.round((occupied / v.capacity) * 100)

          return (
            <div
              key={v.id}
              className={`p-3 rounded-2xl border transition-all ${
                isAvailable
                  ? 'bg-white border-zinc-200/80 hover:border-zinc-300 shadow-xs'
                  : 'bg-zinc-50/70 border-zinc-200/80 text-zinc-600'
              }`}
            >
              <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-zinc-900 font-mono text-xs">{v.vehicle_code}</span>
                </div>
                <StatusBadge value={v.status} />
              </div>

              {/* Occupancy and capacity bar */}
              <div className="mt-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-500 flex items-center gap-1">
                    <Users className="w-3 h-3 text-zinc-400" />
                    Seat Capacity
                  </span>
                  <span className="font-semibold text-zinc-900 font-mono">
                    <b className="text-emerald-700">{v.available_seats} Free</b> / {v.capacity} Total
                  </span>
                </div>

                <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isAvailable ? 'bg-emerald-500' : 'bg-blue-500'}`}
                    style={{ width: `${occupancyPct}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-zinc-100 text-[10px] text-zinc-400">
                <span className="flex items-center gap-1">
                  <Radio className="w-2.5 h-2.5 text-zinc-400" />
                  GPS Live Ping
                </span>
                <span>{timeAgo(v.location_updated_at)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
