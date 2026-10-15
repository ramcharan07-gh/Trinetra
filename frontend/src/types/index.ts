export interface Stop {
  id: number
  name: string
  latitude: number
  longitude: number
  location_type: string
  is_active: boolean
}

export interface Vehicle {
  id: number
  vehicle_code: string
  capacity: number
  occupied_seats: number
  available_seats: number
  latitude: number | null
  longitude: number | null
  status: 'available' | 'assigned' | 'in_service' | 'out_of_service'
  location_updated_at: string | null
}

export interface DemandObservation {
  id: number
  stop_id: number
  stop_name: string
  queue_count: number
  booking_demand: number
  observation_source: string
  observed_at: string
  data_quality: string
}

export interface Hotspot {
  stop_id: number
  stop_name: string
  latitude: number
  longitude: number
  current_demand: number
  historical_baseline: number
  surge_ratio: number
  capacity_shortage: number
  available_capacity: number
  priority: 'critical' | 'high' | 'medium' | 'low'
  observed_at: string
  data_quality: string
}

export interface ImpactEstimate {
  baseline_wait_minutes: number
  projected_wait_minutes: number
  reduction_percent: number | null
  passengers_cleared: number
  remaining_queue: number
}

export interface RouteGeometry {
  coordinates: [number, number][]
  source: 'osrm' | 'haversine_estimate'
}

export interface DispatchRecommendation {
  id: number
  vehicle_id: number
  vehicle_code: string
  source_stop_id: number
  source_stop_name: string
  destination_stop_id: number
  destination_stop_name: string
  estimated_arrival_minutes: number
  estimated_distance_km: number | null
  useful_capacity: number
  priority_score: number
  reason: string
  route_source: 'osrm' | 'haversine_estimate'
  status: 'proposed' | 'approved' | 'adjusted' | 'rejected' | 'cancelled' | 'completed'
  created_at: string
  reviewed_at: string | null
  route_geometry: RouteGeometry | null
  impact: ImpactEstimate | null
}

export interface DispatchLogEntry {
  id: number
  recommendation_id: number
  vehicle_id: number
  vehicle_code: string
  action: string
  previous_state: string | null
  new_state: string | null
  notes: string | null
  created_at: string
}

export interface ImpactMetrics {
  total_hotspots: number
  total_recommendations: number
  approved_count: number
  rejected_count: number
  average_eta_minutes: number | null
  average_wait_reduction_percent: number | null
}

export interface SimulationScenario {
  id: number
  name: string
  description: string
  config: Record<string, any>
  created_at: string
}

export interface SimulationComparison {
  scenario_name: string
  baseline_avg_wait_minutes: number
  reallocation_avg_wait_minutes: number
  wait_reduction_percent: number
  passengers_served: number
  residual_queue: number
  vehicles_reassigned: number
  recommendation_latency_ms: number
  data_mode: string
}

