import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { OverviewBar } from '@/components/OverviewBar'
import type { Vehicle } from '@/types'

const mockVehicles: Vehicle[] = [
  {
    id: 1,
    vehicle_code: 'AP 27 Z 0045',
    capacity: 40,
    occupied_seats: 10,
    available_seats: 30,
    latitude: 13.55,
    longitude: 78.50,
    status: 'available',
    location_updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    vehicle_code: 'AP 27 Z 0099',
    capacity: 50,
    occupied_seats: 40,
    available_seats: 10,
    latitude: 13.56,
    longitude: 78.51,
    status: 'assigned',
    location_updated_at: new Date().toISOString(),
  },
]

describe('OverviewBar', () => {
  it('renders all key metrics accurately', () => {
    render(
      <OverviewBar
        vehicles={mockVehicles}
        totalHotspots={2}
        totalRecommendations={4}
        avgWaitReduction={32}
        avgEta={8.5}
      />
    )

    // Active fleet count and breakdown
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/1 Idle/i)).toBeInTheDocument()
    expect(screen.getByText(/1 Active/i)).toBeInTheDocument()

    // Available capacity sum (30 free seats for available buses)
    expect(screen.getByText('30')).toBeInTheDocument()

    // Pending recommendations
    expect(screen.getByText('4')).toBeInTheDocument()

    // Route ETA and Wait reduction
    expect(screen.getByText('8.5 min')).toBeInTheDocument()
    expect(screen.getByText('↓ 32%')).toBeInTheDocument()
  })

  it('handles null metrics with placeholders', () => {
    render(
      <OverviewBar
        vehicles={[]}
        totalHotspots={0}
        totalRecommendations={0}
        avgWaitReduction={null}
        avgEta={null}
      />
    )

    const zeroes = screen.getAllByText('0')
    expect(zeroes.length).toBeGreaterThanOrEqual(2)
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(2)
  })
})
