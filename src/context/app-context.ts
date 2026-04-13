import { createContext, useContext } from 'react'
import type { AppState, BudgetContext, Debt, Strategy } from '@/types'

export type AppAction =
  | { type: 'SET_BUDGET'; payload: BudgetContext }
  | { type: 'SET_DEBTS'; payload: Debt[] }
  | { type: 'SET_STRATEGY'; payload: Strategy }
  | { type: 'COMPLETE_ONBOARDING' }
  | { type: 'LOAD_STATE'; payload: AppState }
  | { type: 'RESET' }

export interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<AppAction>
  derivedBudget: number
}

export const AppContext = createContext<AppContextValue | null>(null)

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return ctx
}
