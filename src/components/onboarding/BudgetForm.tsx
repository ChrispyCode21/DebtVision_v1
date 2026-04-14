import { useEffect, useMemo, useState } from 'react'
import type { BudgetContext, FixedExpense, IncomeFrequency } from '@/types'
import { FREQUENCY_OPTIONS } from '@/services/defaults'
import { toMonthlyIncome } from '@/services/income'
import Input from '@/components/shared/Input'
import Select from '@/components/shared/Select'
import Button from '@/components/shared/Button'
import Card from '@/components/shared/Card'
import TrashIcon from '@/components/shared/TrashIcon'

interface BudgetFormProps {
  budget: BudgetContext
  onChange: (budget: BudgetContext) => void
  errors: Record<string, string>
  onUnsavedExpenseChange?: (dirty: boolean) => void
}

export default function BudgetForm({ budget, onChange, errors, onUnsavedExpenseChange }: BudgetFormProps) {
  const monthlyIncome = useMemo(
    () => toMonthlyIncome(budget.netIncome, budget.incomeFrequency),
    [budget.netIncome, budget.incomeFrequency],
  )

  const totalExpenses = useMemo(
    () => budget.fixedExpenses.reduce((sum, e) => sum + e.amount, 0),
    [budget.fixedExpenses],
  )

  const availableBudget = Math.max(0, monthlyIncome - totalExpenses)
  const expenseErrors = useMemo(
    () =>
      budget.fixedExpenses.reduce<Record<string, string>>((acc, expense) => {
        if (expense.amount < 0) {
          acc[expense.id] = 'Expense amount cannot be negative.'
        }
        return acc
      }, {}),
    [budget.fixedExpenses],
  )
  const netIncomeError = errors.netIncome ?? (budget.netIncome < 0 ? 'Take-home pay cannot be negative.' : undefined)

  function updateField<K extends keyof BudgetContext>(key: K, value: BudgetContext[K]) {
    onChange({ ...budget, [key]: value })
  }

  const [newExpenseName, setNewExpenseName] = useState('')
  const [newExpenseAmount, setNewExpenseAmount] = useState('')

  // Report to parent whether the expense inputs have unsaved content
  useEffect(() => {
    const dirty = newExpenseName.trim() !== '' || newExpenseAmount.trim() !== ''
    onUnsavedExpenseChange?.(dirty)
  }, [newExpenseName, newExpenseAmount, onUnsavedExpenseChange])

  function addExpense() {
    const name = newExpenseName.trim()
    const amount = parseFloat(newExpenseAmount) || 0
    if (!name || amount <= 0) return
    const newExpense: FixedExpense = {
      id: crypto.randomUUID(),
      name,
      amount,
    }
    updateField('fixedExpenses', [...budget.fixedExpenses, newExpense])
    setNewExpenseName('')
    setNewExpenseAmount('')
  }

  function removeExpense(id: string) {
    updateField('fixedExpenses', budget.fixedExpenses.filter(e => e.id !== id))
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Your Budget</h2>
        <p className="text-sm text-gray-500">Tell us about your income so we can calculate how much you have available for debt payments.</p>
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
          error={netIncomeError}
        />
        <Select
          label="Pay Frequency"
          value={budget.incomeFrequency}
          options={FREQUENCY_OPTIONS}
          onChange={v => updateField('incomeFrequency', v as IncomeFrequency)}
        />
      </div>

      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-3">Fixed Monthly Expenses</h3>

        {budget.fixedExpenses.length > 0 && (
          <div className="space-y-2 mb-4">
            {budget.fixedExpenses.map(expense => (
              <div
                key={expense.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5"
              >
                <span className="text-sm font-medium text-gray-800">{expense.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    ${expense.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeExpense(expense.id)}
                    className="min-h-[36px] px-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    aria-label={`Remove ${expense.name}`}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {budget.fixedExpenses.length === 0 && (
          <p className="text-sm text-gray-400 italic mb-4">No fixed expenses added yet.</p>
        )}

        <Card className="!p-3">
          <div className="flex items-end gap-3">
            <Input
              label="Name"
              placeholder="e.g., Rent"
              value={newExpenseName}
              onChange={setNewExpenseName}
              className="flex-1"
            />
            <Input
              label="Amount"
              currency
              type="number"
              min={0}
              step="0.01"
              placeholder="0.00"
              value={newExpenseAmount}
              onChange={setNewExpenseAmount}
              className="w-32"
            />
            <Button
              variant="primary"
              onClick={addExpense}
              disabled={!newExpenseName.trim() || !parseFloat(newExpenseAmount)}
              className="!min-h-[44px] !px-4 text-sm whitespace-nowrap"
            >
              Add
            </Button>
          </div>
        </Card>
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
