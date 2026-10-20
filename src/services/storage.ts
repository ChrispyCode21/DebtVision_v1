import type { AppState } from '@/types'
import { DEFAULT_APP_STATE } from './defaults'

const STORAGE_KEY = 'debtvision_v1'

function migrateState(parsed: Record<string, unknown>): AppState {
  const base = { ...DEFAULT_APP_STATE, ...parsed } as Record<string, unknown>

  // Ensure debts have all required fields
  if (Array.isArray(base.debts)) {
    base.debts = (base.debts as Record<string, unknown>[]).map(
      (d: Record<string, unknown>) => ({
        id: d.id ?? crypto.randomUUID(),
        name: d.name ?? '',
        balance: d.balance ?? 0,
        limit: d.limit ?? null,
        apr: d.apr ?? 0,
        minPayment: d.minPayment ?? 0,
        zeroMonthly: d.zeroMonthly ?? false,
        promoApr: d.promoApr ?? null,
        promoExpiration: d.promoExpiration ?? null,
        retroactiveInterest: d.retroactiveInterest ?? false,
      }),
    )
  }

  // Ensure budgetContext has all fields
  if (base.budgetContext && typeof base.budgetContext === 'object') {
    const bc = base.budgetContext as Record<string, unknown>
    base.budgetContext = {
      netIncome: bc.netIncome ?? 0,
      incomeFrequency: bc.incomeFrequency ?? 'monthly',
      fixedExpenses: Array.isArray(bc.fixedExpenses) ? bc.fixedExpenses : [],
    }
  }

  // Ensure strategy is valid
  if (base.strategy !== 'avalanche' && base.strategy !== 'snowball') {
    base.strategy = 'avalanche'
  }

  return base as unknown as AppState
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_APP_STATE }

    const parsed = JSON.parse(raw)
    if (!parsed.schemaVersion) return { ...DEFAULT_APP_STATE }

    return migrateState(parsed)
  } catch {
    return { ...DEFAULT_APP_STATE }
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY)
}
