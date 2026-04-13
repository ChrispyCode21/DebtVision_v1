import type { AppState } from '@/types'

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
