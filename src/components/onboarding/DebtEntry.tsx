import { useState, useCallback } from 'react'
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

  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [editingIds, setEditingIds] = useState<Set<string>>(() => new Set(debts.map(d => d.id)))

  const isDebtValid = useCallback((debt: Debt) => {
    return debt.name.trim() !== '' && debt.balance > 0
  }, [])

  function saveDebt(id: string) {
    setSavedIds(prev => new Set(prev).add(id))
    setEditingIds(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  function editDebt(id: string) {
    setEditingIds(prev => new Set(prev).add(id))
    setSavedIds(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  function updateDebt(id: string, updates: Partial<Debt>) {
    onChange(debts.map(d => (d.id === id ? { ...d, ...updates } : d)))
  }

  function addDebt() {
    const newDebt = createEmptyDebt()
    setEditingIds(prev => new Set(prev).add(newDebt.id))
    onChange([...debts, newDebt])
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
        {debts.map((debt, index) => {
          const isEditing = editingIds.has(debt.id)
          const isSaved = savedIds.has(debt.id)

          return (
            <Card key={debt.id}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-gray-800">
                    {debt.name || `Debt ${index + 1}`}
                  </h3>
                  {isSaved && (
                    <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                      Saved
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {!isEditing && (
                    <Button
                      variant="ghost"
                      onClick={() => editDebt(debt.id)}
                      className="!min-h-[36px] !px-3 text-sm"
                    >
                      Edit
                    </Button>
                  )}
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
              </div>

              {isEditing ? (
                <>
                  <DebtFormFields
                    debt={debt}
                    todayDate={todayDate}
                    errors={mergedErrors}
                    onUpdate={updateDebt}
                  />
                  <div className="mt-4">
                    <Button
                      variant="primary"
                      onClick={() => saveDebt(debt.id)}
                      disabled={!isDebtValid(debt)}
                      className="w-full"
                    >
                      Save Debt
                    </Button>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div className="text-gray-500">Balance</div>
                  <div className="text-gray-900 font-medium">
                    ${debt.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-gray-500">APR</div>
                  <div className="text-gray-900 font-medium">{debt.apr}%</div>
                  <div className="text-gray-500">Min Payment</div>
                  <div className="text-gray-900 font-medium">
                    ${debt.minPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      <Button variant="secondary" onClick={addDebt} className="w-full">
        + Add Another Debt
      </Button>
    </div>
  )
}
