import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L, { type LatLngExpression } from 'leaflet'
import type { Stop, Vehicle, Hotspot, DispatchRecommendation } from '@/types'
import { timeAgo } from '@/utils/format'

interface Props {
  stops: Stop[]
  vehicles: Vehicle[]
  hotspots: Hotspot[]
  selectedRecommendation: DispatchRecommendation | null
}

function priorityColor(priority: string): string {
  switch (priority) {
    case 'critical':
      return '#ef4444'
    case 'high':
      return '#f97316'
    case 'medium':
      return '#eab308'
    case 'low':
      return '#22c55e'
    default:
      return '#64748b'
  }
}

function makeStopIcon(color: string) {
  return L.divIcon({
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #ffffff;box-shadow:0 1px 4px rgba(0,0,0,0.6)"></div>`,
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -8],
  })
}

const BUS_ICON = L.divIcon({
  html: `<div style="font-size:20px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">🚌</div>`,
  className: '',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -12],
})

function MapFlyController({ rec }: { rec: DispatchRecommendation | null }) {
  const map = useMap()
  useEffect(() => {
    if (rec && rec.route_geometry?.coordinates?.length) {
      const coords = rec.route_geometry.coordinates
      const mid = coords[Math.floor(coords.length / 2)]
      // mid is [lon, lat] from OSRM, map flyTo takes [lat, lon]
      map.flyTo([mid[1], mid[0]], 11, { duration: 1 })
    }
  }, [rec, map])
  return null
}

export function MapView({ stops, vehicles, hotspots, selectedRecommendation }: Props) {
  const hotspotMap = new Map(hotspots.map((h) => [h.stop_id, h]))
  const center: LatLngExpression = [13.55, 78.5012] // Madanapalle center

  // Build route polyline points
  let routePositions: LatLngExpression[] | null = null
  let isEstimated = false

  if (selectedRecommendation) {
    const geo = selectedRecommendation.route_geometry
    if (geo?.coordinates?.length) {
      // OSRM provides [lon, lat] -> Leaflet requires [lat, lon]
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
    <div className="relative w-full h-full bg-slate-950">
      <MapContainer
        center={center}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <MapFlyController rec={selectedRecommendation} />

        {/* Bus Stop Markers */}
        {stops
          .filter((s) => s.is_active)
          .map((stop) => {
            const hotspot = hotspotMap.get(stop.id)
            const color = hotspot ? priorityColor(hotspot.priority) : '#64748b'
            return (
              <Marker
                key={stop.id}
                position={[stop.latitude, stop.longitude]}
                icon={makeStopIcon(color)}
              >
                <Popup>
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-slate-900">{stop.name}</p>
                    <p className="text-slate-500 capitalize">{stop.location_type.replace('_', ' ')}</p>
                    {hotspot ? (
                      <div className="pt-1 border-t border-slate-200 text-slate-700">
                        <p>Waiting Queue: <b>{hotspot.current_demand}</b></p>
                        <p className="text-red-600">Capacity Shortage: <b>{hotspot.capacity_shortage}</b></p>
                        <p className="text-slate-400">Updated: {timeAgo(hotspot.observed_at)}</p>
                      </div>
                    ) : (
                      <p className="text-green-600 font-medium">Normal operating conditions</p>
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
            <Marker key={v.id} position={[v.latitude!, v.longitude!]} icon={BUS_ICON}>
              <Popup>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-slate-900">{v.vehicle_code}</p>
                  <p className="text-slate-600">
                    Status: <span className="capitalize font-semibold">{v.status.replace('_', ' ')}</span>
                  </p>
                  <p className="text-slate-600">
                    Available Seats: <b>{v.available_seats}</b> / {v.capacity}
                  </p>
                  <p className="text-slate-400">GPS: {timeAgo(v.location_updated_at)}</p>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Reallocation Route Polyline */}
        {routePositions && (
          <Polyline
            positions={routePositions}
            pathOptions={{
              color: '#3b82f6',
              weight: isEstimated ? 3 : 5,
              dashArray: isEstimated ? '8, 8' : undefined,
              opacity: 0.9,
            }}
          />
        )}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg shadow-xl p-3 text-[11px] space-y-1.5 pointer-events-auto">
        <p className="font-bold text-slate-200">Map Legend</p>
        <div className="space-y-1">
          {[
            ['#ef4444', 'Critical Shortage'],
            ['#f97316', 'High Shortage'],
            ['#eab308', 'Moderate Surge'],
            ['#22c55e', 'Normal / Balanced'],
            ['#64748b', 'Baseline Stop'],
          ].map(([col, label]) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full border border-white" style={{ background: col }} />
              <span className="text-slate-300">{label}</span>
            </div>
          ))}
        </div>
        <div className="pt-1.5 border-t border-slate-700/80 flex items-center gap-2">
          <span>🚌</span>
          <span className="text-slate-300">Active Bus</span>
        </div>
        {routePositions && (
          <div className="flex items-center gap-2 pt-1 border-t border-slate-700/80">
            <span
              className={`w-5 h-0.5 ${
                isEstimated ? 'border-t-2 border-dashed border-blue-400' : 'bg-blue-500'
              }`}
            />
            <span className="text-blue-300 font-medium">
              {isEstimated ? 'Haversine Est. Route' : 'OSRM Road Route'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

