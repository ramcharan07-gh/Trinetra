import type { Vehicle } from '@/types'
import { Bus, Users, AlertTriangle, Send, Clock, TrendingDown } from 'lucide-react'

interface OverviewBarProps {
  vehicles: Vehicle[]
  totalHotspots: number
  totalRecommendations: number
  avgWaitReduction: number | null
  avgEta: number | null
}

export function OverviewBar({
  vehicles,
  totalHotspots,
  totalRecommendations,
  avgWaitReduction,
  avgEta,
}: OverviewBarProps) {
  const availableBuses = vehicles.filter((v) => v.status === 'available').length
  const assignedBuses = vehicles.filter((v) => v.status === 'assigned' || v.status === 'in_service').length
  const activeFleet = availableBuses + assignedBuses
  const totalSpareSeats = vehicles
    .filter((v) => v.status === 'available')
    .reduce((sum, v) => sum + v.available_seats, 0)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5 px-4 sm:px-6 py-2 bg-zinc-50/70 border-b border-zinc-200/80">
      {/* Metric 1: Active Fleet */}
      <div className="flex flex-col justify-between bg-white p-3 rounded-xl border border-zinc-200/80 shadow-2xs hover:border-zinc-300 transition-all">
        <div className="flex items-center justify-between text-zinc-500">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Active Fleet</span>
          <div className="w-5 h-5 rounded-md bg-zinc-100 flex items-center justify-center text-zinc-600">
            <Bus className="w-3 h-3" />
          </div>
        </div>
        <div className="mt-1.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold tracking-tight text-zinc-900 font-mono tabular-nums">{activeFleet}</span>
            <span className="text-[11px] text-zinc-500 font-medium">buses</span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-0.5 truncate">
            <span className="text-emerald-700 font-semibold">{availableBuses} Idle</span> · {assignedBuses} Active
          </p>
        </div>
      </div>

      {/* Metric 2: Available Capacity */}
      <div className="flex flex-col justify-between bg-white p-3 rounded-xl border border-zinc-200/80 shadow-2xs hover:border-zinc-300 transition-all">
        <div className="flex items-center justify-between text-zinc-500">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Available Capacity</span>
          <div className="w-5 h-5 rounded-md bg-zinc-100 flex items-center justify-center text-zinc-600">
            <Users className="w-3 h-3" />
          </div>
        </div>
        <div className="mt-1.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold tracking-tight text-blue-700 font-mono tabular-nums">{totalSpareSeats}</span>
            <span className="text-[11px] text-zinc-500 font-medium">seats</span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-0.5 truncate">
            Ready for instant dispatch
          </p>
        </div>
      </div>

      {/* Metric 3: Surge Hotspots */}
      <div className="flex flex-col justify-between bg-white p-3 rounded-xl border border-zinc-200/80 shadow-2xs hover:border-zinc-300 transition-all">
        <div className="flex items-center justify-between text-zinc-500">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Surge Hotspots</span>
          <div className={`w-5 h-5 rounded-md flex items-center justify-center ${totalHotspots > 0 ? 'bg-rose-50 text-rose-600' : 'bg-zinc-100 text-zinc-500'}`}>
            <AlertTriangle className="w-3 h-3" />
          </div>
        </div>
        <div className="mt-1.5">
          <div className="flex items-baseline gap-1.5">
            <span className={`text-xl font-bold tracking-tight font-mono tabular-nums ${totalHotspots > 0 ? 'text-rose-600' : 'text-zinc-900'}`}>
              {totalHotspots}
            </span>
            <span className="text-[11px] text-zinc-500 font-medium">flagged</span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-0.5 truncate">
            {totalHotspots > 0 ? 'Capacity deficit alert' : 'Corridor balanced'}
          </p>
        </div>
      </div>

      {/* Metric 4: Pending Dispatches */}
      <div className="flex flex-col justify-between bg-white p-3 rounded-xl border border-zinc-200/80 shadow-2xs hover:border-zinc-300 transition-all">
        <div className="flex items-center justify-between text-zinc-500">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Pending Dispatches</span>
          <div className="w-5 h-5 rounded-md bg-zinc-100 flex items-center justify-center text-zinc-600">
            <Send className="w-3 h-3" />
          </div>
        </div>
        <div className="mt-1.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold tracking-tight text-indigo-600 font-mono tabular-nums">{totalRecommendations}</span>
            <span className="text-[11px] text-zinc-500 font-medium">plans</span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-0.5 truncate">
            AI optimized reallocation
          </p>
        </div>
      </div>

      {/* Metric 5: Mean Route ETA */}
      <div className="flex flex-col justify-between bg-white p-3 rounded-xl border border-zinc-200/80 shadow-2xs hover:border-zinc-300 transition-all">
        <div className="flex items-center justify-between text-zinc-500">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Mean Transit ETA</span>
          <div className="w-5 h-5 rounded-md bg-zinc-100 flex items-center justify-center text-zinc-600">
            <Clock className="w-3 h-3" />
          </div>
        </div>
        <div className="mt-1.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold tracking-tight text-zinc-900 font-mono tabular-nums">
              {avgEta !== null ? `${avgEta} min` : '—'}
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-0.5 truncate">
            OSRM road transit time
          </p>
        </div>
      </div>

      {/* Metric 6: Projected Wait Relief */}
      <div className="flex flex-col justify-between bg-white p-3 rounded-xl border border-zinc-200/80 shadow-2xs hover:border-zinc-300 transition-all">
        <div className="flex items-center justify-between text-zinc-500">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Projected Relief</span>
          <div className="w-5 h-5 rounded-md bg-emerald-50 flex items-center justify-center text-emerald-600">
            <TrendingDown className="w-3 h-3" />
          </div>
        </div>
        <div className="mt-1.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold tracking-tight text-emerald-600 font-mono tabular-nums">
              {avgWaitReduction !== null ? `↓ ${avgWaitReduction}%` : '—'}
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-0.5 truncate">
            vs schedule baseline
          </p>
        </div>
      </div>
    </div>
  )
}
