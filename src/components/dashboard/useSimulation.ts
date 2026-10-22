import { useMemo } from 'react'
import { runSimulation } from '@/engine/simulate'
import type { Debt, Strategy, SimulationResult } from '@/types'

/**
 * True when the engine made no payment in any month and debt remains (SPEC 3.3).
 * Derived from the result only, so the budget formula lives in the engine alone.
 * An empty schedule (all debts zero-monthly) is not a no-payments state.
 */
export function hasNoPayments(result: SimulationResult): boolean {
  const { schedule } = result
  if (schedule.length === 0) return false
  return (
    schedule.every(entry => entry.totalPayment === 0) &&
    schedule[schedule.length - 1].totalBalance > 0
  )
}

export function useSimulation(
  debts: Debt[],
  monthlyBudget: number,
  strategy: Strategy,
): SimulationResult | null {
  return useMemo(() => {
    // Null only when there are no debts; a zero or negative budget still runs so the
    // shortfall warnings show (the engine allocates nothing in that case).
    if (debts.length === 0) return null
    return runSimulation(debts, monthlyBudget, strategy)
  }, [debts, monthlyBudget, strategy])
}
