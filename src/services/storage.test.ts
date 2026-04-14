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

  describe('schema migration', () => {
    it('fills in missing boolean fields on debts with defaults', () => {
      const legacy = {
        schemaVersion: 1,
        budgetContext: { netIncome: 3000, incomeFrequency: 'monthly', fixedExpenses: [] },
        debts: [
          { id: 'd1', name: 'Card', balance: 500, apr: 18, minPayment: 25 },
        ],
        strategy: 'avalanche',
        onboardingComplete: false,
      }
      localStorage.setItem('debtvision_v1', JSON.stringify(legacy))
      const state = loadState()
      expect(state.debts[0].retroactiveInterest).toBe(false)
      expect(state.debts[0].zeroMonthly).toBe(false)
    })

    it('fills in missing limit field on debts with null', () => {
      const legacy = {
        schemaVersion: 1,
        budgetContext: { netIncome: 0, incomeFrequency: 'monthly', fixedExpenses: [] },
        debts: [
          { id: 'd1', name: 'Loan', balance: 1000, apr: 5, minPayment: 50 },
        ],
        strategy: 'snowball',
        onboardingComplete: false,
      }
      localStorage.setItem('debtvision_v1', JSON.stringify(legacy))
      const state = loadState()
      expect(state.debts[0].limit).toBeNull()
    })

    it('defaults invalid strategy to avalanche', () => {
      const legacy = {
        schemaVersion: 1,
        budgetContext: { netIncome: 0, incomeFrequency: 'monthly', fixedExpenses: [] },
        debts: [],
        strategy: 'bogus',
        onboardingComplete: false,
      }
      localStorage.setItem('debtvision_v1', JSON.stringify(legacy))
      const state = loadState()
      expect(state.strategy).toBe('avalanche')
    })

    it('defaults missing budgetContext.fixedExpenses to empty array', () => {
      const legacy = {
        schemaVersion: 1,
        budgetContext: { netIncome: 2000, incomeFrequency: 'biweekly' },
        debts: [],
        strategy: 'avalanche',
        onboardingComplete: false,
      }
      localStorage.setItem('debtvision_v1', JSON.stringify(legacy))
      const state = loadState()
      expect(state.budgetContext.fixedExpenses).toEqual([])
    })
  })
})
