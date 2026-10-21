// === Input Types (Data Model) ===

export type IncomeFrequency = 'weekly' | 'biweekly' | 'semi-monthly' | 'monthly' | 'annually'

export type Strategy = 'avalanche' | 'snowball'

export interface FixedExpense {
  id: string
  name: string
  amount: number
}

export interface BudgetContext {
  netIncome: number
  incomeFrequency: IncomeFrequency
  fixedExpenses: FixedExpense[]
}

export interface Debt {
  id: string
  name: string
  balance: number
  limit: number | null
  apr: number              // e.g., 19.99 for 19.99%
  minPayment: number
  zeroMonthly: boolean
  promoApr: number | null
  promoExpiration: string | null  // ISO date string
  retroactiveInterest: boolean
}

// === Persisted App State ===

export interface AppState {
  schemaVersion: number
  budgetContext: BudgetContext
  debts: Debt[]
  strategy: Strategy
  onboardingComplete: boolean
}

// === Engine Output Types ===

export interface PaymentDirective {
  debtId: string
  debtName: string
  amount: number
  reasoning: string
}

export interface MonthDirective {
  month: number
  payments: PaymentDirective[]
  milestones: string[]
  warnings: string[]
}

export interface DebtMonthSnapshot {
  debtId: string
  balance: number
  interestCharged: number
  paymentMade: number
}

export interface MonthEntry {
  month: number
  totalBalance: number
  totalPayment: number
  totalInterest: number
  debts: DebtMonthSnapshot[]
}

export interface DebtSummary {
  debtId: string
  debtName: string
  originalBalance: number
  totalInterestPaid: number
  payoffMonth: number
}

export const WarningType = {
  NO_OPTIMIZABLE_DEBTS: 'NO_OPTIMIZABLE_DEBTS',
  BUDGET_SHORTFALL: 'BUDGET_SHORTFALL',
  MINIMUM_EXCEEDS_BUDGET: 'MINIMUM_EXCEEDS_BUDGET',
  NO_EXTRA_BUDGET: 'NO_EXTRA_BUDGET',
  RETROACTIVE_INTEREST_APPLIED: 'RETROACTIVE_INTEREST_APPLIED',
  RETROACTIVE_INTEREST_AT_RISK: 'RETROACTIVE_INTEREST_AT_RISK',
  SIMULATION_CAP_REACHED: 'SIMULATION_CAP_REACHED',
} as const

export type WarningType = (typeof WarningType)[keyof typeof WarningType]

export type WarningSeverity = 'info' | 'warning' | 'critical'

export interface Warning {
  type: WarningType
  debtId: string | null
  message: string
  severity: WarningSeverity
  month: number | null
  /** Dollar amount the warning is about (the deferred-interest charge). */
  amount?: number
}

export interface SimulationResult {
  actionPlan: MonthDirective[]
  schedule: MonthEntry[]
  debtSummaries: DebtSummary[]
  totalMonths: number
  totalInterestPaid: number
  interestSaved: number
  warnings: Warning[]
}
