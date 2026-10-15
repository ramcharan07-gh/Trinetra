import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { RecommendationCard } from '@/features/dispatch/RecommendationCard'
import type { DispatchRecommendation } from '@/types'

const mockRec: DispatchRecommendation = {
  id: 1,
  vehicle_id: 1,
  vehicle_code: 'AP 27 Z 0045',
  source_stop_id: 1,
  source_stop_name: 'Madanapalle Bus Stand',
  destination_stop_id: 2,
  destination_stop_name: 'MITS College',
  estimated_arrival_minutes: 8,
  estimated_distance_km: 3.2,
  useful_capacity: 40,
  priority_score: 82,
  reason: 'Available vehicle with sufficient capacity and feasible ETA.',
  route_source: 'haversine_estimate',
  status: 'proposed',
  created_at: new Date().toISOString(),
  reviewed_at: null,
  route_geometry: null,
  impact: {
    baseline_wait_minutes: 20,
    projected_wait_minutes: 14,
    reduction_percent: 30,
    passengers_cleared: 40,
    remaining_queue: 102,
  },
}

describe('RecommendationCard', () => {
  it('renders vehicle code', () => {
    render(
      <RecommendationCard
        rec={mockRec}
        onAction={vi.fn()}
        onSelect={vi.fn()}
        isSelected={false}
      />
    )
    expect(screen.getByText('AP 27 Z 0045')).toBeInTheDocument()
  })

  it('shows ETA', () => {
    render(
      <RecommendationCard
        rec={mockRec}
        onAction={vi.fn()}
        onSelect={vi.fn()}
        isSelected={false}
      />
    )
    expect(screen.getByText('8 min')).toBeInTheDocument()
  })

  it('shows approve and reject buttons for proposed status', () => {
    render(
      <RecommendationCard
        rec={mockRec}
        onAction={vi.fn()}
        onSelect={vi.fn()}
        isSelected={false}
      />
    )
    expect(screen.getByText(/Approve/i)).toBeInTheDocument()
    expect(screen.getByText(/Reject/i)).toBeInTheDocument()
  })
})

