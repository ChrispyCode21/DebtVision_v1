import { useMemo } from 'react'
import { runSimulation } from '@/engine/simulate'
import type { Debt, Strategy, SimulationResult } from '@/types'

export function useSimulation(
  debts: Debt[],
  monthlyBudget: number,
  strategy: Strategy,
): SimulationResult | null {
  return useMemo(() => {
    if (debts.length === 0 || monthlyBudget <= 0) return null
    // Filter out zero-monthly debts for simulation, but account for their minimums
    return runSimulation(debts, monthlyBudget, strategy)
  }, [debts, monthlyBudget, strategy])
}
