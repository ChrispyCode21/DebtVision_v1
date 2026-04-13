import { type Debt } from '@/types'
import { createEmptyDebt } from '@/services/defaults'
import { getDebtValidationErrors, getTodayDateString } from '@/services/debtValidation'
import Button from '@/components/shared/Button'
import Card from '@/components/shared/Card'
import TrashIcon from '@/components/shared/TrashIcon'
import DebtFormFields from '@/components/shared/DebtFormFields'

interface DebtEntryProps {
  debts: Debt[]
  onChange: (debts: Debt[]) => void
  errors: Record<string, string>
}

export default function DebtEntry({ debts, onChange, errors }: DebtEntryProps) {
  const totalBalance = debts.reduce((sum, d) => sum + d.balance, 0)
  const todayDate = getTodayDateString()
  const localErrors = getDebtValidationErrors(debts, todayDate)

  const mergedErrors = { ...localErrors, ...errors }

  function updateDebt(id: string, updates: Partial<Debt>) {
    onChange(debts.map(d => (d.id === id ? { ...d, ...updates } : d)))
  }

  function addDebt() {
    onChange([...debts, createEmptyDebt()])
  }

  function removeDebt(id: string) {
    if (debts.length <= 1) return
    onChange(debts.filter(d => d.id !== id))
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Your Debts</h2>
        <p className="text-sm text-gray-500">Add all debts you want to include in your payoff plan.</p>
      </div>

      {errors.debts && <p className="text-sm text-red-600">{errors.debts}</p>}

      <Card className="!bg-gray-50">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">{debts.length} debt{debts.length !== 1 ? 's' : ''}</span>
          <span className="text-lg font-bold text-gray-900">
            Total: ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </Card>

      <div className="space-y-4">
        {debts.map((debt, index) => (
          <Card key={debt.id}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-800">
                {debt.name || `Debt ${index + 1}`}
              </h3>
              {debts.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDebt(debt.id)}
                  className="min-h-[44px] px-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  aria-label={`Remove ${debt.name || `Debt ${index + 1}`}`}
                >
                  <TrashIcon />
                </button>
              )}
            </div>

            <DebtFormFields
              debt={debt}
              todayDate={todayDate}
              errors={mergedErrors}
              onUpdate={updateDebt}
            />
          </Card>
        ))}
      </div>

      <Button variant="secondary" onClick={addDebt} className="w-full">
        + Add Another Debt
      </Button>
    </div>
  )
}
