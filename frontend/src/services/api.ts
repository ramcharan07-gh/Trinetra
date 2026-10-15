import type {
  Stop,
  Vehicle,
  DemandObservation,
  Hotspot,
  DispatchRecommendation,
  DispatchLogEntry,
  ImpactMetrics,
} from '@/types'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
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
  },

  history: () => request<DispatchLogEntry[]>('/api/dispatch/history'),
  impact: () => request<ImpactMetrics>('/api/impact'),

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

