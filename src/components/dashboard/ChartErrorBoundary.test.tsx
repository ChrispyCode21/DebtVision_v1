import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ChartErrorBoundary from './ChartErrorBoundary'

function ThrowingChart(): ReactElement {
  throw new Error('boom')
}

function RecoverableChart({ shouldThrow }: { shouldThrow: boolean }): ReactElement {
  if (shouldThrow) {
    throw new Error('boom')
  }

  return <div>Recovered chart</div>
}

describe('ChartErrorBoundary', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders chart content when no error occurs', () => {
    render(
      <ChartErrorBoundary title="Payoff timeline">
        <div>Chart rendered</div>
      </ChartErrorBoundary>,
    )

    expect(screen.getByText('Chart rendered')).toBeInTheDocument()
  })

  it('shows fallback message when child render fails', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ChartErrorBoundary title="Payoff timeline">
        <ThrowingChart />
      </ChartErrorBoundary>,
    )

    expect(
      screen.getByText('Payoff timeline chart is unavailable right now. Please try adjusting your inputs.'),
    ).toBeInTheDocument()
  })

  it('recovers after reset keys change', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const { rerender } = render(
      <ChartErrorBoundary title="Payoff timeline" resetKeys={['initial']}>
        <RecoverableChart shouldThrow />
      </ChartErrorBoundary>,
    )

    expect(
      screen.getByText('Payoff timeline chart is unavailable right now. Please try adjusting your inputs.'),
    ).toBeInTheDocument()

    rerender(
      <ChartErrorBoundary title="Payoff timeline" resetKeys={['updated']}>
        <RecoverableChart shouldThrow={false} />
      </ChartErrorBoundary>,
    )

    expect(screen.getByText('Recovered chart')).toBeInTheDocument()
  })
})
