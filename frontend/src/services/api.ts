import type {
  Stop,
  Vehicle,
  DemandObservation,
  Hotspot,
  DispatchRecommendation,
  DispatchLogEntry,
  ImpactMetrics,
} from '@/types'

// Clean base URL and strip any trailing slash
const rawBase = (import.meta.env.VITE_API_BASE_URL as string) || ''
const BASE_URL = rawBase.trim().replace(/\/+$/, '')

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  // Ensure path starts with single / and remove double slashes
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  const targetUrl = BASE_URL ? `${BASE_URL}${cleanPath}` : cleanPath

  const res = await fetch(targetUrl, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  health: () => request<{ status: string }>('/health'),
  stops: () => request<Stop[]>('/api/stops'),
  vehicles: () => request<Vehicle[]>('/api/vehicles'),
  demand: () => request<DemandObservation[]>('/api/demand'),
  hotspots: () => request<Hotspot[]>('/api/hotspots'),

  recommendations: {
    list: () => request<DispatchRecommendation[]>('/api/dispatch/recommendations'),
    generate: () =>
      request<DispatchRecommendation[]>('/api/dispatch/recommendations', {
        method: 'POST',
      }),
    approve: (id: number) =>
      request<DispatchRecommendation>(`/api/dispatch/recommendations/${id}/approve`, {
        method: 'POST',
      }),
    reject: (id: number, notes = '') =>
      request<DispatchRecommendation>(`/api/dispatch/recommendations/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      }),
    adjust: (id: number, data: { vehicle_id?: number; destination_stop_id?: number; notes?: string }) =>
      request<DispatchRecommendation>(`/api/dispatch/recommendations/${id}/adjust`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  history: () => request<DispatchLogEntry[]>('/api/dispatch/history'),
  impact: () => request<ImpactMetrics>('/api/impact'),

  simulation: {
    scenarios: () => request<import('@/types').SimulationScenario[]>('/api/simulation/scenarios'),
    run: (scenarioId: number) =>
      request<import('@/types').SimulationComparison>(`/api/simulation/run/${scenarioId}`, {
        method: 'POST',
      }),
  },

  submitObservation: (data: {
    stop_id: number
    queue_count: number
    booking_demand?: number
    observation_source?: string
  }) =>
    request<DemandObservation>('/api/demand/observations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

