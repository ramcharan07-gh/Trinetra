import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L, { type LatLngExpression } from 'leaflet'
import type { Stop, Vehicle, Hotspot, DispatchRecommendation } from '@/types'
import { timeAgo } from '@/utils/format'
import { Navigation, Plus, Minus, ArrowRight } from 'lucide-react'

interface Props {
  stops: Stop[]
  vehicles: Vehicle[]
  hotspots: Hotspot[]
  selectedRecommendation: DispatchRecommendation | null
  onSelectHotspot?: (stopId: number) => void
}

const MADANAPALLE_CENTER: [number, number] = [13.55, 78.5012]

function priorityColor(priority: string): string {
  switch (priority) {
    case 'critical':
      return '#ef4444'
    case 'high':
      return '#f97316'
    case 'medium':
      return '#f59e0b'
    case 'low':
      return '#22c55e'
    default:
      return '#71717a'
  }
}

function makeStopIcon(color: string, isHotspot: boolean, name: string) {
  if (isHotspot) {
    return L.divIcon({
      html: `
        <div class="relative flex items-center justify-center cursor-pointer group">
          <div class="absolute -inset-2.5 rounded-full animate-radar opacity-40" style="background-color: ${color}"></div>
          <div class="w-4 h-4 rounded-full border-2 border-white shadow-md flex items-center justify-center" style="background-color: ${color}">
            <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
          </div>
          <div class="absolute top-5 px-1.5 py-0.5 rounded-md bg-zinc-900/90 backdrop-blur-sm text-white text-[9px] font-medium tracking-tight whitespace-nowrap shadow-xs pointer-events-none opacity-90 group-hover:opacity-100 transition-opacity">
            ${name}
          </div>
        </div>
      `,
      className: '',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      popupAnchor: [0, -14],
    })
  }

  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center cursor-pointer group">
        <div class="w-2.5 h-2.5 rounded-full bg-zinc-500 border border-white shadow-xs"></div>
        <div class="absolute top-3.5 px-1.5 py-0.5 rounded bg-zinc-800/80 backdrop-blur-sm text-zinc-200 text-[8px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          ${name}
        </div>
      </div>
    `,
    className: '',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    popupAnchor: [0, -10],
  })
}

function makeBusIcon(status: string, code: string) {
  const isAvailable = status === 'available'
  const dotColor = isAvailable ? '#10b981' : '#3b82f6'
  const cleanCode = code.replace(/^[A-Z]{2}\s*\d{2}\s*/, '') // Shorten e.g. "AP 27 Z 0045" to "Z 0045"

  return L.divIcon({
    html: `
      <div class="relative flex flex-col items-center justify-center cursor-pointer group">
        <div class="w-7 h-7 bg-zinc-900 rounded-lg border-2 border-white shadow-md flex items-center justify-center transition-transform group-hover:scale-110">
          <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 6v6"/>
            <path d="M15 6v6"/>
            <path d="M2 12h19.6"/>
            <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.7 19.1 6 18 6H4c-1.1 0-2.1.7-2.4 1.8l-1.4 5c-.1.4-.2.8-.2 1.2 0 .4.1.8.2 1.2.3 1.1.8 2.8.8 2.8h3"/>
            <circle cx="7" cy="18" r="2"/>
            <path d="M9 18h5"/>
            <circle cx="16" cy="18" r="2"/>
          </svg>
          <span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white" style="background-color: ${dotColor}"></span>
        </div>
        <div class="mt-0.5 px-1 py-[2px] rounded bg-white/95 border border-zinc-200/80 shadow-xs text-[8px] font-mono font-semibold text-zinc-800 whitespace-nowrap">
          ${cleanCode}
        </div>
      </div>
    `,
    className: '',
    iconSize: [28, 42],
    iconAnchor: [14, 21],
    popupAnchor: [0, -22],
  })
}

function MapFlyController({
  rec,
  stops,
}: {
  rec: DispatchRecommendation | null
  stops: Stop[]
}) {
  const map = useMap()
  useEffect(() => {
    if (!rec) return

    if (rec.route_geometry?.coordinates?.length) {
      const coords = rec.route_geometry.coordinates
      const latLngs = coords.map(([lon, lat]) => [lat, lon] as [number, number])
      map.fitBounds(L.latLngBounds(latLngs), { padding: [60, 60], maxZoom: 13 })
    } else {
      const src = stops.find((s) => s.id === rec.source_stop_id)
      const dst = stops.find((s) => s.id === rec.destination_stop_id)
      if (src && dst) {
        map.fitBounds(
          [
            [src.latitude, src.longitude],
            [dst.latitude, dst.longitude],
          ],
          { padding: [70, 70], maxZoom: 13 }
        )
      }
    }
  }, [rec, stops, map])
  return null
}

function FloatingMapControls() {
  const map = useMap()

  const handleReset = () => {
    map.flyTo(MADANAPALLE_CENTER, 10, { duration: 0.8 })
  }

  const handleZoomIn = () => {
    map.zoomIn()
  }

  const handleZoomOut = () => {
    map.zoomOut()
  }

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-1.5 pointer-events-auto">
      <div className="flex flex-col bg-white/95 backdrop-blur-md border border-zinc-200/80 rounded-xl shadow-xs overflow-hidden">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          aria-label="Zoom in on map"
          className="p-2 hover:bg-zinc-100 text-zinc-700 transition-colors border-b border-zinc-100 flex items-center justify-center"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          aria-label="Zoom out on map"
          className="p-2 hover:bg-zinc-100 text-zinc-700 transition-colors flex items-center justify-center"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      <button
        onClick={handleReset}
        title="Center on Madanapalle Corridor"
        aria-label="Reset map focus"
        className="p-2 bg-white/95 backdrop-blur-md hover:bg-zinc-100 border border-zinc-200/80 rounded-xl shadow-xs text-zinc-700 transition-colors flex items-center justify-center"
      >
        <Navigation className="w-4 h-4 text-blue-600" />
      </button>
    </div>
  )
}

export function MapView({
  stops,
  vehicles,
  hotspots,
  selectedRecommendation,
  onSelectHotspot,
}: Props) {
  const hotspotMap = new Map(hotspots.map((h) => [h.stop_id, h]))
  const center: LatLngExpression = MADANAPALLE_CENTER

  // Build route polyline points
  let routePositions: LatLngExpression[] | null = null
  let isEstimated = false

  if (selectedRecommendation) {
    const geo = selectedRecommendation.route_geometry
    if (geo?.coordinates?.length) {
      routePositions = geo.coordinates.map(([lon, lat]) => [lat, lon] as [number, number])
      isEstimated = geo.source === 'haversine_estimate'
    } else {
      const src = stops.find((s) => s.id === selectedRecommendation.source_stop_id)
      const dst = stops.find((s) => s.id === selectedRecommendation.destination_stop_id)
      if (src && dst) {
        routePositions = [
          [src.latitude, src.longitude],
          [dst.latitude, dst.longitude],
        ]
        isEstimated = true
      }
    }
  }

  return (
    <div className="relative w-full h-full bg-zinc-100 select-none">
      <MapContainer
        center={center}
        zoom={10}
        zoomControl={false}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <MapFlyController rec={selectedRecommendation} stops={stops} />
        <FloatingMapControls />

        {/* Bus Stop Markers */}
        {stops
          .filter((s) => s.is_active)
          .map((stop) => {
            const hotspot = hotspotMap.get(stop.id)
            const color = hotspot ? priorityColor(hotspot.priority) : '#71717a'
            return (
              <Marker
                key={stop.id}
                position={[stop.latitude, stop.longitude]}
                icon={makeStopIcon(color, !!hotspot, stop.name)}
              >
                <Popup>
                  <div className="p-3 w-60 text-xs space-y-2">
                    <div className="border-b border-zinc-100 pb-2">
                      <p className="font-semibold text-zinc-900 text-sm leading-tight">{stop.name}</p>
                      <p className="text-[11px] text-zinc-500 capitalize mt-0.5">{stop.location_type.replace('_', ' ')}</p>
                    </div>

                    {hotspot ? (
                      <div className="space-y-1.5 pt-0.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-zinc-500">Passenger Queue</span>
                          <span className="font-bold text-zinc-900 font-mono">{hotspot.current_demand} pax</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-zinc-500">Capacity Deficit</span>
                          <span className="font-bold text-rose-600 font-mono">-{hotspot.capacity_shortage} seats</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-zinc-500">Surge Ratio</span>
                          <span className="font-semibold text-amber-600">{hotspot.surge_ratio}x</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 pt-1 border-t border-zinc-100">
                          Updated {timeAgo(hotspot.observed_at)}
                        </p>

                        {onSelectHotspot && (
                          <button
                            type="button"
                            onClick={() => onSelectHotspot(stop.id)}
                            className="w-full mt-2 py-1.5 px-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-[11px] font-medium transition-all text-center flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <span>Focus Dispatches for Station</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="py-1">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Normal Operating Baseline
                        </span>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            )
          })}

        {/* Vehicle Markers */}
        {vehicles
          .filter((v) => v.latitude != null && v.longitude != null && v.status !== 'out_of_service')
          .map((v) => (
            <Marker key={v.id} position={[v.latitude!, v.longitude!]} icon={makeBusIcon(v.status, v.vehicle_code)}>
              <Popup>
                <div className="p-3 w-56 text-xs space-y-2">
                  <div className="border-b border-zinc-100 pb-2">
                    <p className="font-semibold text-zinc-900 font-mono text-sm">{v.vehicle_code}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`w-2 h-2 rounded-full ${v.status === 'available' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                      <span className="text-[11px] font-medium text-zinc-700 capitalize">{v.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5 pt-0.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-500">Available Seats</span>
                      <span className="font-bold text-zinc-900 font-mono">{v.available_seats} / {v.capacity}</span>
                    </div>
                    <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${v.status === 'available' ? 'bg-emerald-500' : 'bg-blue-500'}`}
                        style={{ width: `${Math.round(((v.capacity - v.available_seats) / v.capacity) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-zinc-400 pt-1 border-t border-zinc-100">
                      GPS Ping: {timeAgo(v.location_updated_at)}
                    </p>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Reallocation Route Polyline */}
        {routePositions && (
          <Polyline
            positions={routePositions}
            pathOptions={{
              color: '#2563eb',
              weight: isEstimated ? 3 : 5,
              dashArray: isEstimated ? '8, 8' : undefined,
              opacity: 0.9,
            }}
          />
        )}
      </MapContainer>

      {/* Modern Floating Map Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-md border border-zinc-200/80 rounded-2xl shadow-float p-3 text-xs space-y-2 pointer-events-auto max-w-xs select-none">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-1.5">
          <span className="font-semibold text-zinc-900 text-[10px] uppercase tracking-wider">
            Corridor Map Legend
          </span>
          <span className="text-[10px] text-zinc-400">APSRTC GIS</span>
        </div>

        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-500/20" />
            <span className="text-zinc-700">Critical Surge (≥50 shortfall)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-zinc-700">High Demand (≥25 shortfall)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-400" />
            <span className="text-zinc-700">Normal Scheduled Stop</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-zinc-100">
            <div className="w-4 h-4 bg-zinc-900 rounded-md flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
            <span className="text-zinc-700">Fleet Bus (Green: Idle · Blue: Active)</span>
          </div>
          {routePositions && (
            <div className="flex items-center gap-2 pt-1 border-t border-zinc-100 text-blue-700 font-medium">
              <span className={`w-5 h-0.5 ${isEstimated ? 'border-t-2 border-dashed border-blue-600' : 'bg-blue-600'}`} />
              <span>{isEstimated ? 'Estimated Corridor' : 'OSRM Highway Corridor'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
