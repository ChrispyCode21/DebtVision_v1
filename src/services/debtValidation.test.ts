import { describe, it, expect } from 'vitest'
import type { Debt } from '@/types'
import { getDebtValidationErrors } from './debtValidation'

function createDebt(overrides: Partial<Debt> = {}): Debt {
  return {
    id: 'debt-1',
    name: 'Credit Card',
    balance: 1000,
    limit: null,
    apr: 19.99,
    minPayment: 50,
    zeroMonthly: false,
    promoApr: null,
    promoExpiration: null,
    retroactiveInterest: false,
    ...overrides,
  }
}

describe('getDebtValidationErrors', () => {
  it('returns no errors for a valid debt', () => {
    const errors = getDebtValidationErrors([createDebt()], '2026-04-13')
    expect(errors).toEqual({})
  })

  it('flags non-finite numeric values', () => {
    const errors = getDebtValidationErrors(
      [
        createDebt({
          balance: Number.NaN,
          apr: Number.POSITIVE_INFINITY,
          minPayment: Number.NEGATIVE_INFINITY,
          promoApr: Number.NaN,
        }),
      ],
      '2026-04-13',
    )

    expect(errors).toEqual({
      'debt-1-balance': 'Balance must be a valid number.',
      'debt-1-apr': 'APR must be a valid number.',
      'debt-1-minPayment': 'Minimum payment must be a valid number.',
      'debt-1-promoApr': 'Promo APR must be a valid number.',
    })
  })

  it('flags min payment above balance when values are finite', () => {
    const errors = getDebtValidationErrors(
      [createDebt({ balance: 250, minPayment: 300 })],
      '2026-04-13',
    )

    expect(errors).toEqual({
      'debt-1-minPayment': 'Minimum payment cannot exceed the current balance.',
    })
  })

  it('flags promo expiration dates in the past', () => {
    const errors = getDebtValidationErrors(
      [createDebt({ promoExpiration: '2026-04-12' })],
      '2026-04-13',
    )

    expect(errors).toEqual({
      'debt-1-promoExpiration': 'Promo expiration cannot be in the past.',
    })
  })

  it('does not flag promo expiration when date is today', () => {
    const errors = getDebtValidationErrors(
      [createDebt({ promoExpiration: '2026-04-13' })],
      '2026-04-13',
    )

    expect(errors).toEqual({})
  })
})
