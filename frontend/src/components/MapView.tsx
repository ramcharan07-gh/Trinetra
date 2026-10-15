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
      return '#dc2626'
    case 'high':
      return '#ea580c'
    case 'medium':
      return '#d97706'
    case 'low':
      return '#16a34a'
    default:
      return '#475569'
  }
}

function makeStopIcon(color: string, isHotspot: boolean) {
  const size = isHotspot ? 16 : 12
  const pulse = isHotspot ? 'box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.2);' : ''
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid #ffffff;${pulse}box-shadow:0 1px 4px rgba(0,0,0,0.35)"></div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  })
}

function makeBusIcon(status: string) {
  const bg = status === 'available' ? '#059669' : status === 'assigned' ? '#2563eb' : '#64748b'
  return L.divIcon({
    html: `<div style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;background:${bg};border:2px solid #ffffff;border-radius:6px;box-shadow:0 2px 5px rgba(0,0,0,0.25);font-size:12px;color:#ffffff;">🚏</div>`,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  })
}

function MapFlyController({ rec }: { rec: DispatchRecommendation | null }) {
  const map = useMap()
  useEffect(() => {
    if (rec && rec.route_geometry?.coordinates?.length) {
      const coords = rec.route_geometry.coordinates
      const mid = coords[Math.floor(coords.length / 2)]
      map.flyTo([mid[1], mid[0]], 11, { duration: 0.8 })
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
    <div className="relative w-full h-full bg-slate-100">
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
            const color = hotspot ? priorityColor(hotspot.priority) : '#475569'
            return (
              <Marker
                key={stop.id}
                position={[stop.latitude, stop.longitude]}
                icon={makeStopIcon(color, !!hotspot)}
              >
                <Popup>
                  <div className="text-xs space-y-1.5 p-0.5">
                    <p className="font-bold text-slate-900 border-b border-slate-100 pb-1">{stop.name}</p>
                    <p className="text-slate-500 capitalize">{stop.location_type.replace('_', ' ')}</p>
                    {hotspot ? (
                      <div className="pt-1.5 border-t border-slate-200 text-slate-700 space-y-0.5">
                        <p>Passenger Queue: <b>{hotspot.current_demand}</b></p>
                        <p className="text-rose-700 font-semibold">Capacity Deficit: <b>-{hotspot.capacity_shortage}</b></p>
                        <p className="text-[10px] text-slate-400">Updated: {timeAgo(hotspot.observed_at)}</p>
                      </div>
                    ) : (
                      <p className="text-emerald-700 font-medium">Standard operating baseline</p>
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
            <Marker key={v.id} position={[v.latitude!, v.longitude!]} icon={makeBusIcon(v.status)}>
              <Popup>
                <div className="text-xs space-y-1.5 p-0.5">
                  <p className="font-bold text-slate-900 font-mono border-b border-slate-100 pb-1">{v.vehicle_code}</p>
                  <p className="text-slate-600">
                    Status: <span className="capitalize font-semibold">{v.status.replace('_', ' ')}</span>
                  </p>
                  <p className="text-slate-600">
                    Available Capacity: <b>{v.available_seats}</b> / {v.capacity} seats
                  </p>
                  <p className="text-[10px] text-slate-400">Telemetry: {timeAgo(v.location_updated_at)}</p>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Reallocation Route Polyline */}
        {routePositions && (
          <Polyline
            positions={routePositions}
            pathOptions={{
              color: '#1d4ed8',
              weight: isEstimated ? 3 : 5,
              dashArray: isEstimated ? '8, 8' : undefined,
              opacity: 0.85,
            }}
          />
        )}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-xs border border-slate-300 rounded-lg shadow-md p-3 text-[11px] space-y-2 pointer-events-auto max-w-xs">
        <p className="font-bold text-slate-900 border-b border-slate-200 pb-1 uppercase tracking-wider text-[10px]">
          Operational Map Legend
        </p>
        <div className="space-y-1">
          {[
            ['#dc2626', 'Critical Surge (≥50 shortfall)'],
            ['#ea580c', 'High Demand (≥25 shortfall)'],
            ['#d97706', 'Moderate Shortage (≥10)'],
            ['#475569', 'Normal Transit Baseline'],
          ].map(([col, label]) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full border border-white shadow-xs" style={{ background: col }} />
              <span className="text-slate-700">{label}</span>
            </div>
          ))}
        </div>
        <div className="pt-1.5 border-t border-slate-200 flex items-center gap-2">
          <span className="w-3.5 h-3.5 bg-emerald-700 rounded-xs flex items-center justify-center text-[8px] text-white">🚏</span>
          <span className="text-slate-700">Fleet Bus (Green: Idle / Blue: Assigned)</span>
        </div>
        {routePositions && (
          <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
            <span
              className={`w-5 h-0.5 ${
                isEstimated ? 'border-t-2 border-dashed border-blue-700' : 'bg-blue-700'
              }`}
            />
            <span className="text-blue-900 font-semibold">
              {isEstimated ? 'Estimated Corridor' : 'OSRM Road Highway Route'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
