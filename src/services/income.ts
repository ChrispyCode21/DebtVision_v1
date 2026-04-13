import type { IncomeFrequency } from '@/types'

const MONTHLY_MULTIPLIERS: Record<IncomeFrequency, number> = {
  weekly: 52 / 12,
  biweekly: 26 / 12,
  'semi-monthly': 2,
  monthly: 1,
  annually: 1 / 12,
}

export function toMonthlyIncome(amount: number, frequency: IncomeFrequency): number {
  return Math.round(amount * MONTHLY_MULTIPLIERS[frequency] * 100) / 100
}
