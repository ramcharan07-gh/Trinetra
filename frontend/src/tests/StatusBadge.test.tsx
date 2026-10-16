import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StatusBadge } from '@/components/StatusBadge'

describe('StatusBadge', () => {
  it('renders available status with correct text', () => {
    render(<StatusBadge value="available" />)
    expect(screen.getByText('Available')).toBeInTheDocument()
  })

  it('renders critical surge status', () => {
    render(<StatusBadge value="critical" />)
    expect(screen.getByText('Critical Surge')).toBeInTheDocument()
  })

  it('renders proposed status as Under Review', () => {
    render(<StatusBadge value="proposed" />)
    expect(screen.getByText('Under Review')).toBeInTheDocument()
  })

  it('renders fallback for custom status', () => {
    render(<StatusBadge value="custom_state" />)
    expect(screen.getByText('custom state')).toBeInTheDocument()
  })
})
