import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ToastProvider, useToast } from '@/components/Toast'

function TestComponent() {
  const { showToast } = useToast()
  return (
    <div>
      <button onClick={() => showToast('Test Success', 'Detail info', 'success')}>Trigger Success</button>
      <button onClick={() => showToast('Test Error', 'Error info', 'error')}>Trigger Error</button>
    </div>
  )
}

describe('Toast Notification System', () => {
  it('renders and dismisses toast notifications', () => {
    vi.useFakeTimers()
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    // Trigger toast
    fireEvent.click(screen.getByText('Trigger Success'))
    expect(screen.getByText('Test Success')).toBeInTheDocument()
    expect(screen.getByText('Detail info')).toBeInTheDocument()

    // Fast-forward 4 seconds to test auto-dismiss
    act(() => {
      vi.advanceTimersByTime(4100)
    })
    expect(screen.queryByText('Test Success')).not.toBeInTheDocument()
    vi.useRealTimers()
  })

  it('allows manual dismissal of toast', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    fireEvent.click(screen.getByText('Trigger Error'))
    expect(screen.getByText('Test Error')).toBeInTheDocument()

    const dismissBtn = screen.getByLabelText('Dismiss notification')
    fireEvent.click(dismissBtn)
    expect(screen.queryByText('Test Error')).not.toBeInTheDocument()
  })
})
