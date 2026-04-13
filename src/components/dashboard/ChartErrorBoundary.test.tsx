import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import ChartErrorBoundary from './ChartErrorBoundary'

function ThrowingChart(): ReactElement {
  throw new Error('boom')
}

describe('ChartErrorBoundary', () => {
  it('renders chart content when no error occurs', () => {
    render(
      <ChartErrorBoundary title="Payoff timeline">
        <div>Chart rendered</div>
      </ChartErrorBoundary>,
    )

    expect(screen.getByText('Chart rendered')).toBeInTheDocument()
  })

  it('shows fallback message when child render fails', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ChartErrorBoundary title="Payoff timeline">
        <ThrowingChart />
      </ChartErrorBoundary>,
    )

    expect(
      screen.getByText('Payoff timeline chart is unavailable right now. Please try adjusting your inputs.'),
    ).toBeInTheDocument()

    consoleErrorSpy.mockRestore()
  })
})
