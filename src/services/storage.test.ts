import { describe, it, expect, beforeEach } from 'vitest'
import { loadState, saveState, clearState } from './storage'
import { DEFAULT_APP_STATE } from './defaults'
import type { AppState } from '@/types'

beforeEach(() => {
  localStorage.clear()
})

describe('storage service', () => {
  it('returns default state when nothing is stored', () => {
    expect(loadState()).toEqual(DEFAULT_APP_STATE)
  })

  it('round-trips state through save and load', () => {
    const state: AppState = {
      ...DEFAULT_APP_STATE,
      budgetContext: {
        netIncome: 5000,
        incomeFrequency: 'monthly',
        fixedExpenses: [{ id: '1', name: 'Rent', amount: 1500 }],
      },
      debts: [
        {
          id: 'debt-1',
          name: 'Visa',
          balance: 3000,
          limit: 5000,
          apr: 19.99,
          minPayment: 75,
          zeroMonthly: false,
          promoApr: null,
          promoExpiration: null,
          retroactiveInterest: false,
        },
      ],
      strategy: 'snowball',
      onboardingComplete: true,
    }

    saveState(state)
    expect(loadState()).toEqual(state)
  })

  it('returns default state for corrupted JSON', () => {
    localStorage.setItem('debtvision_v1', '{not valid json')
    expect(loadState()).toEqual(DEFAULT_APP_STATE)
  })

  it('returns default state when schemaVersion is missing', () => {
    localStorage.setItem('debtvision_v1', JSON.stringify({ foo: 'bar' }))
    expect(loadState()).toEqual(DEFAULT_APP_STATE)
  })

  it('clears stored state', () => {
    saveState({ ...DEFAULT_APP_STATE, onboardingComplete: true })
    clearState()
    expect(loadState()).toEqual(DEFAULT_APP_STATE)
  })
})
