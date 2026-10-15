import type { Vehicle } from '@/types'

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
  const assignedBuses = vehicles.filter((v) => v.status === 'assigned').length
  const totalSpareSeats = vehicles
    .filter((v) => v.status === 'available')
    .reduce((sum, v) => sum + v.available_seats, 0)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 px-6 py-3 bg-white border-b border-slate-200 text-xs shadow-xs">
      <div className="flex flex-col bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active Fleet</span>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-xl font-bold text-slate-900 font-mono">{vehicles.length}</span>
          <span className="text-[11px] text-slate-600 font-medium">({availableBuses} Idle / {assignedBuses} Active)</span>
        </div>
      </div>

      <div className="flex flex-col bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Available Capacity</span>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-xl font-bold text-blue-700 font-mono">{totalSpareSeats}</span>
          <span className="text-[11px] text-slate-600 font-medium">passenger seats</span>
        </div>
      </div>

      <div className="flex flex-col bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Surge Hotspots</span>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className={`text-xl font-bold font-mono ${totalHotspots > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
            {totalHotspots}
          </span>
          <span className="text-[11px] text-slate-600 font-medium">stations / stops</span>
        </div>
      </div>

      <div className="flex flex-col bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Pending Dispatches</span>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-xl font-bold text-indigo-700 font-mono">{totalRecommendations}</span>
          <span className="text-[11px] text-slate-600 font-medium">recommendations</span>
        </div>
      </div>

      <div className="flex flex-col bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Mean Transit ETA</span>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-xl font-bold text-slate-900 font-mono">
            {avgEta !== null ? `${avgEta} min` : '—'}
          </span>
          <span className="text-[11px] text-slate-600 font-medium">road route</span>
        </div>
      </div>

      <div className="flex flex-col bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Projected Wait Relief</span>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-xl font-bold text-emerald-700 font-mono">
            {avgWaitReduction !== null ? `↓ ${avgWaitReduction}%` : '—'}
          </span>
          <span className="text-[11px] text-slate-600 font-medium">vs schedule baseline</span>
        </div>
      </div>
    </div>
  )
}
