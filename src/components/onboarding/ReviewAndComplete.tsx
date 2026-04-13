import type { BudgetContext, Debt, Strategy } from '@/types'
import { useMemo } from 'react'
import { toMonthlyIncome } from '@/services/income'
import Card from '@/components/shared/Card'
import Button from '@/components/shared/Button'

interface ReviewProps {
  budget: BudgetContext
  debts: Debt[]
  strategy: Strategy
  onComplete: () => void
  loading?: boolean
}

export default function ReviewAndComplete({ budget, debts, strategy, onComplete, loading }: ReviewProps) {
  const monthlyIncome = useMemo(
    () => toMonthlyIncome(budget.netIncome, budget.incomeFrequency),
    [budget.netIncome, budget.incomeFrequency],
  )
  const totalExpenses = budget.fixedExpenses.reduce((sum, e) => sum + e.amount, 0)
  const available = Math.max(0, monthlyIncome - totalExpenses)
  const totalBalance = debts.reduce((sum, d) => sum + d.balance, 0)
  const totalMinimums = debts.reduce((sum, d) => sum + d.minPayment, 0)

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Review Your Plan</h2>
        <p className="text-sm text-gray-500">Make sure everything looks right before we generate your optimized payment plan.</p>
      </div>

      <Card title="Budget Summary">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Monthly Income</dt>
            <dd className="font-medium text-gray-900">${monthlyIncome.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Fixed Expenses</dt>
            <dd className="font-medium text-gray-900">&minus;${totalExpenses.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-100">
            <dt className="text-gray-700 font-medium">Available for Debt</dt>
            <dd className="font-bold text-blue-600">${available.toFixed(2)}</dd>
          </div>
        </dl>
      </Card>

      <Card title={`${debts.length} Debt${debts.length !== 1 ? 's' : ''}`}>
        <dl className="space-y-2 text-sm">
          {debts.map(d => (
            <div key={d.id} className="flex justify-between">
              <dt className="text-gray-500">{d.name || 'Unnamed'} ({d.apr}%)</dt>
              <dd className="font-medium text-gray-900">${d.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</dd>
            </div>
          ))}
          <div className="flex justify-between pt-2 border-t border-gray-100">
            <dt className="text-gray-700 font-medium">Total Balance</dt>
            <dd className="font-bold text-gray-900">${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Total Minimums</dt>
            <dd className="font-medium text-gray-900">${totalMinimums.toFixed(2)}/mo</dd>
          </div>
        </dl>
      </Card>

      <Card title="Strategy">
        <p className="text-sm text-gray-700">
          {strategy === 'avalanche'
            ? 'Avalanche — Pay highest interest rate first (saves the most money)'
            : 'Snowball — Pay smallest balance first (fastest wins)'}
        </p>
      </Card>

      {available < totalMinimums && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            <strong>Heads up:</strong> Your available budget (${available.toFixed(2)}) is less than your
            total minimum payments (${totalMinimums.toFixed(2)}). The plan will allocate proportionally,
            but you may want to revisit your budget.
          </p>
        </div>
      )}

      <Button onClick={onComplete} loading={loading} className="w-full">
        Generate My Plan
      </Button>
    </div>
  )
}
