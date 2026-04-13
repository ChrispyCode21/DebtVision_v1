import type { Debt, Strategy } from '@/types'
import { useSimulation } from './useSimulation'
import WarningBanner from './WarningBanner'
import SummaryStats from './SummaryStats'
import ActionPlan from './ActionPlan'
import PayoffTimeline from './PayoffTimeline'
import PaymentAllocation from './PaymentAllocation'
import DebtPayoffCards from './DebtPayoffCards'

interface DashboardProps {
  debts: Debt[]
  monthlyBudget: number
  strategy: Strategy
}

export default function Dashboard({ debts, monthlyBudget, strategy }: DashboardProps) {
  const result = useSimulation(debts, monthlyBudget, strategy)

  // Build a map of debt ID → name for the chart components
  const debtNames: Record<string, string> = {}
  for (const debt of debts) {
    debtNames[debt.id] = debt.name
  }

  // Total current balance for the summary stats card
  const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0)

  if (result === null) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <svg
          className="w-12 h-12 text-gray-300 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 17v-2m3 2v-4m3 4v-6M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H9a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <h2 className="text-lg font-semibold text-gray-500 mb-1">
          Add debts and budget to see your plan
        </h2>
        <p className="text-sm text-gray-400 max-w-xs">
          Once you enter your debts and a monthly payment budget, your personalised payoff
          plan will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* 1. Warning banners */}
      {result.warnings.length > 0 && <WarningBanner warnings={result.warnings} />}

      {/* 2. Summary stats */}
      <section aria-label="Summary statistics">
        <SummaryStats result={result} totalDebt={totalDebt} />
      </section>

      {/* 3. Action plan — hero content */}
      <section aria-label="Month-by-month action plan">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Your Action Plan</h2>
        <ActionPlan actionPlan={result.actionPlan} />
      </section>

      {/* 4. Payoff timeline chart */}
      <section aria-label="Debt balance over time">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Payoff Timeline</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <PayoffTimeline schedule={result.schedule} debtNames={debtNames} />
        </div>
      </section>

      {/* 5. Payment allocation chart */}
      <section aria-label="Monthly payment allocation">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Payment Allocation</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <PaymentAllocation schedule={result.schedule} debtNames={debtNames} />
        </div>
      </section>

      {/* 6. Per-debt summary cards */}
      <section aria-label="Per-debt payoff summary">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Debt Breakdown</h2>
        <DebtPayoffCards debtSummaries={result.debtSummaries} />
      </section>
    </div>
  )
}
