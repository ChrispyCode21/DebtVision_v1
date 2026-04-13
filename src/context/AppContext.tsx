import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import type { AppState, BudgetContext, Debt, Strategy } from '@/types'
import { loadState, saveState } from '@/services/storage'
import { DEFAULT_APP_STATE } from '@/services/defaults'
import { toMonthlyIncome } from '@/services/income'

// ─── Actions ────────────────────────────────────────────────────────────────

type AppAction =
  | { type: 'SET_BUDGET'; payload: BudgetContext }
  | { type: 'SET_DEBTS'; payload: Debt[] }
  | { type: 'SET_STRATEGY'; payload: Strategy }
  | { type: 'COMPLETE_ONBOARDING' }
  | { type: 'LOAD_STATE'; payload: AppState }
  | { type: 'RESET' }

// ─── Reducer ─────────────────────────────────────────────────────────────────

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_BUDGET':
      return { ...state, budgetContext: action.payload }
    case 'SET_DEBTS':
      return { ...state, debts: action.payload }
    case 'SET_STRATEGY':
      return { ...state, strategy: action.payload }
    case 'COMPLETE_ONBOARDING':
      return { ...state, onboardingComplete: true }
    case 'LOAD_STATE':
      return action.payload
    case 'RESET':
      return { ...DEFAULT_APP_STATE }
    default:
      return state
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<AppAction>
  derivedBudget: number
}

const AppContext = createContext<AppContextValue | null>(null)

// ─── Provider ────────────────────────────────────────────────────────────────

interface AppProviderProps {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, undefined, () => loadState())

  // Auto-save to localStorage on every state change
  useEffect(() => {
    saveState(state)
  }, [state])

  // Compute derived monthly budget: monthly income minus total fixed expenses
  const derivedBudget = useMemo(() => {
    const { budgetContext } = state
    const monthlyIncome = toMonthlyIncome(
      budgetContext.netIncome,
      budgetContext.incomeFrequency,
    )
    const totalExpenses = budgetContext.fixedExpenses.reduce(
      (sum, e) => sum + e.amount,
      0,
    )
    return Math.max(0, monthlyIncome - totalExpenses)
  }, [state.budgetContext])

  return (
    <AppContext.Provider value={{ state, dispatch, derivedBudget }}>
      {children}
    </AppContext.Provider>
  )
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return ctx
}
