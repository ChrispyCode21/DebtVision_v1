import { useMemo } from 'react'
import type { BudgetContext, FixedExpense, IncomeFrequency } from '@/types'
import { FREQUENCY_OPTIONS } from '@/services/defaults'
import { toMonthlyIncome } from '@/services/income'
import Input from '@/components/shared/Input'
import Select from '@/components/shared/Select'
import Button from '@/components/shared/Button'
import Card from '@/components/shared/Card'
import TrashIcon from '@/components/shared/TrashIcon'

interface ManageBudgetProps {
  budget: BudgetContext
  onChange: (budget: BudgetContext) => void
}

export default function ManageBudget({ budget, onChange }: ManageBudgetProps) {
  const monthlyIncome = useMemo(
    () => toMonthlyIncome(budget.netIncome, budget.incomeFrequency),
    [budget.netIncome, budget.incomeFrequency],
  )

  const totalExpenses = useMemo(
    () => budget.fixedExpenses.reduce((sum, e) => sum + e.amount, 0),
    [budget.fixedExpenses],
  )

  const availableBudget = Math.max(0, monthlyIncome - totalExpenses)

  function updateField<K extends keyof BudgetContext>(key: K, value: BudgetContext[K]) {
    onChange({ ...budget, [key]: value })
  }

  function updateExpense(id: string, field: keyof FixedExpense, value: string | number) {
    const updated = budget.fixedExpenses.map(e =>
      e.id === id ? { ...e, [field]: value } : e,
    )
    updateField('fixedExpenses', updated)
  }

  function addExpense() {
    const newExpense: FixedExpense = {
      id: crypto.randomUUID(),
      name: '',
      amount: 0,
    }
    updateField('fixedExpenses', [...budget.fixedExpenses, newExpense])
  }

  function removeExpense(id: string) {
    updateField('fixedExpenses', budget.fixedExpenses.filter(e => e.id !== id))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Budget</h2>
        <p className="text-sm text-gray-500">Update your income and monthly expenses.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Take-Home Pay"
          currency
          type="number"
          min={0}
          step="0.01"
          placeholder="0.00"
          value={budget.netIncome || ''}
          onChange={v => updateField('netIncome', parseFloat(v) || 0)}
        />
        <Select
          label="Pay Frequency"
          value={budget.incomeFrequency}
          options={FREQUENCY_OPTIONS}
          onChange={v => updateField('incomeFrequency', v as IncomeFrequency)}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-800">Fixed Monthly Expenses</h3>
          <Button
            type="button"
            variant="ghost"
            onClick={addExpense}
            className="text-sm !min-h-[36px] !px-3"
          >
            + Add Expense
          </Button>
        </div>

        {budget.fixedExpenses.length === 0 && (
          <p className="text-sm text-gray-400 italic">No fixed expenses added yet.</p>
        )}

        <div className="space-y-3">
          {budget.fixedExpenses.map(expense => (
            <Card key={expense.id} className="!p-3">
              <div className="flex items-end gap-3">
                <Input
                  label="Name"
                  placeholder="e.g., Rent"
                  value={expense.name}
                  onChange={v => updateExpense(expense.id, 'name', v)}
                  className="flex-1"
                />
                <Input
                  label="Amount"
                  currency
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  value={expense.amount || ''}
                  onChange={v => updateExpense(expense.id, 'amount', parseFloat(v) || 0)}
                  className="w-32"
                />
                <button
                  type="button"
                  onClick={() => removeExpense(expense.id)}
                  className="min-h-[44px] px-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  aria-label={`Remove ${expense.name || 'expense'}`}
                >
                  <TrashIcon />
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Card className="!bg-blue-50 !border-blue-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-blue-800">Available Monthly Budget</span>
          <span className="text-2xl font-bold text-blue-900">
            ${availableBudget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <p className="text-xs text-blue-600 mt-1">
          ${monthlyIncome.toFixed(2)}/mo income &minus; ${totalExpenses.toFixed(2)} expenses
        </p>
      </Card>
    </div>
  )
}
