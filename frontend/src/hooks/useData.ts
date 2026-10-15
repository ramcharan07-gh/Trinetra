import { useState, useEffect, useCallback } from 'react'
import { api } from '@/services/api'
import type {
  Hotspot,
  Vehicle,
  DispatchRecommendation,
  DispatchLogEntry,
  ImpactMetrics,
  Stop,
} from '@/types'

const POLL_INTERVAL = 30_000 // 30 seconds

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
  lastUpdated: Date | null
}

export function usePolling<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = []
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetcher()
      .then((result) => {
        if (!cancelled) {
          setData(result)
          setLastUpdated(new Date())
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unknown error')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    const interval = setInterval(refetch, POLL_INTERVAL)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps])

  return { data, loading, error, refetch, lastUpdated }
}

export const useStops = () => usePolling<Stop[]>(api.stops)
export const useVehicles = () => usePolling<Vehicle[]>(api.vehicles)
export const useHotspots = () => usePolling<Hotspot[]>(api.hotspots)
export const useRecommendations = () => usePolling<DispatchRecommendation[]>(api.recommendations.list)
export const useHistory = () => usePolling<DispatchLogEntry[]>(api.history)
export const useImpact = () => usePolling<ImpactMetrics>(api.impact)

