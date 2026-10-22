import { render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { runSimulation } from '@/engine/simulate'
import type { Debt } from '@/types'
import Dashboard from './Dashboard'
import { hasNoPayments } from './useSimulation'

const START = new Date(2026, 0, 1)

function makeDebt(overrides: Partial<Debt> = {}): Debt {
  return {
    id: 'a',
    name: 'Test Card',
    balance: 1000,
    limit: null,
    apr: 12,
    minPayment: 50,
    zeroMonthly: false,
    promoApr: null,
    promoExpiration: null,
    retroactiveInterest: false,
    ...overrides,
  }
}

beforeAll(() => {
  // Recharts needs ResizeObserver, which jsdom lacks.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
})

describe('Dashboard with a zero or negative budget', () => {
  it('shows the shortfall warning and the no-payments card for a negative budget', () => {
    render(<Dashboard debts={[makeDebt()]} monthlyBudget={-100} strategy="avalanche" />)
    expect(screen.getAllByText(/-\$100/).length).toBeGreaterThan(0)
    expect(screen.getByText('No payments possible at this budget')).toBeTruthy()
    expect(screen.queryByText('Your Action Plan')).toBeNull()
    expect(screen.queryByText('Add debts and budget to see your plan')).toBeNull()
  })

  it('shows the same state for a budget of 0', () => {
    render(<Dashboard debts={[makeDebt()]} monthlyBudget={0} strategy="avalanche" />)
    expect(screen.getAllByText(/Monthly budget \(\$0\)/).length).toBeGreaterThan(0)
    expect(screen.getByText('No payments possible at this budget')).toBeTruthy()
    expect(screen.queryByText('Your Action Plan')).toBeNull()
  })

  it('keeps the empty state when there are no debts', () => {
    render(<Dashboard debts={[]} monthlyBudget={-100} strategy="avalanche" />)
    expect(screen.getByText('Add debts and budget to see your plan')).toBeTruthy()
    expect(screen.queryByText('No payments possible at this budget')).toBeNull()
  })

  it('shows the full plan for a short but positive budget', () => {
    render(<Dashboard debts={[makeDebt()]} monthlyBudget={20} strategy="avalanche" />)
    expect(screen.getAllByText(/Monthly budget \(\$20\)/).length).toBeGreaterThan(0)
    expect(screen.getByText('Your Action Plan')).toBeTruthy()
    expect(screen.queryByText('No payments possible at this budget')).toBeNull()
  })
})

describe('hasNoPayments', () => {
  it('is true for the WE-30a result (budget 0)', () => {
    expect(hasNoPayments(runSimulation([makeDebt()], 0, 'avalanche', START))).toBe(true)
  })

  it('is false for a normal result', () => {
    expect(hasNoPayments(runSimulation([makeDebt()], 100, 'avalanche', START))).toBe(false)
  })

  it('is false when every debt is zero-monthly (empty schedule)', () => {
    const result = runSimulation([makeDebt({ zeroMonthly: true })], 100, 'avalanche', START)
    expect(result.schedule).toHaveLength(0)
    expect(hasNoPayments(result)).toBe(false)
  })
})
