import type { AppState, Debt } from '@/types'

export const DEFAULT_APP_STATE: AppState = {
  schemaVersion: 1,
  budgetContext: {
    netIncome: 0,
    incomeFrequency: 'monthly',
    fixedExpenses: [],
  },
  debts: [],
  strategy: 'avalanche',
  onboardingComplete: false,
}

export function createEmptyDebt(): Debt {
  return {
    id: crypto.randomUUID(),
    name: '',
    balance: 0,
    limit: null,
    apr: 0,
    minPayment: 0,
    zeroMonthly: false,
    promoApr: null,
    promoExpiration: null,
    retroactiveInterest: false,
  }
}

export const FREQUENCY_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every Two Weeks' },
  { value: 'semi-monthly', label: 'Twice a Month' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'annually', label: 'Annually' },
]
