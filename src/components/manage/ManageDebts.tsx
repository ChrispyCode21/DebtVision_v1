import { useMemo, useState } from 'react'
import type { Debt } from '@/types'
import { createEmptyDebt } from '@/services/defaults'
import { getDebtValidationErrors, getTodayDateString } from '@/services/debtValidation'
import Button from '@/components/shared/Button'
import Card from '@/components/shared/Card'
import TrashIcon from '@/components/shared/TrashIcon'
import DebtFormFields from '@/components/shared/DebtFormFields'

interface ManageDebtsProps {
  debts: Debt[]
  onChange: (debts: Debt[]) => void
}

export default function ManageDebts({ debts, onChange }: ManageDebtsProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const todayDate = getTodayDateString()
  const validationErrors = useMemo(() => getDebtValidationErrors(debts, todayDate), [debts, todayDate])

  const totalBalance = debts.reduce((sum, d) => sum + d.balance, 0)

  function updateDebt(id: string, updates: Partial<Debt>) {
    const updatedDebts = debts.map(d => (d.id === id ? { ...d, ...updates } : d))
    onChange(updatedDebts)
  }

  function addDebt() {
    const updatedDebts = [...debts, createEmptyDebt()]
    onChange(updatedDebts)
  }

  function confirmDelete(id: string) {
    // If only one debt, do nothing — can't delete last debt
    if (debts.length <= 1) return
    // If already pending this id, execute deletion
    if (pendingDeleteId === id) {
      const updatedDebts = debts.filter(d => d.id !== id)
      onChange(updatedDebts)
      setPendingDeleteId(null)
    } else {
      setPendingDeleteId(id)
    }
  }

  function cancelDelete() {
    setPendingDeleteId(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Debts</h2>
        <p className="text-sm text-gray-500">Edit your debts or add new ones to your payoff plan.</p>
      </div>

      <Card className="!bg-gray-50">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">
            {debts.length} debt{debts.length !== 1 ? 's' : ''}
          </span>
          <span className="text-lg font-bold text-gray-900">
            Total: ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </Card>

      <div className="space-y-4">
        {debts.map((debt, index) => (
          <Card key={debt.id}>
            {/* Card header: name + delete */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-800">
                {debt.name || `Debt ${index + 1}`}
              </h3>

              {debts.length > 1 && (
                <div className="flex items-center gap-2">
                  {pendingDeleteId === debt.id ? (
                    <>
                      <span className="text-sm text-red-600 font-medium">Remove?</span>
                      <button
                        type="button"
                        onClick={() => confirmDelete(debt.id)}
                        className="min-h-[44px] px-3 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                        aria-label={`Confirm remove ${debt.name || `Debt ${index + 1}`}`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={cancelDelete}
                        className="min-h-[44px] px-3 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        aria-label="Cancel remove"
                      >
                        No
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => confirmDelete(debt.id)}
                      className="min-h-[44px] px-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label={`Remove ${debt.name || `Debt ${index + 1}`}`}
                    >
                      <TrashIcon />
                    </button>
                  )}
                </div>
              )}
            </div>

            <DebtFormFields
              debt={debt}
              todayDate={todayDate}
              errors={validationErrors}
              onUpdate={updateDebt}
            />
          </Card>
        ))}
      </div>

      <Button type="button" variant="secondary" onClick={addDebt} className="w-full">
        + Add Another Debt
      </Button>
    </div>
  )
}
