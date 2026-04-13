import { useEffect, useState } from 'react'
import type { Debt } from '@/types'
import Input from '@/components/shared/Input'
import Button from '@/components/shared/Button'
import Card from '@/components/shared/Card'
import Toggle from '@/components/shared/Toggle'
import ExpandableSection from '@/components/shared/ExpandableSection'

interface ManageDebtsProps {
  debts: Debt[]
  onChange: (debts: Debt[]) => void
}

function createEmptyDebt(): Debt {
  return {
    id: crypto.randomUUID(),
    name: '',
    balance: 0,
    limit: null,
    apr: 0,
    minPayment: 0,
    zeroMonthly: false,
    promoApr: null,
    promoExpiration: null,
    retroactiveInterest: false,
  }
}

function getTodayDateString(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getDebtValidationErrors(debts: Debt[]): Record<string, string> {
  const todayDate = getTodayDateString()

  return debts.reduce<Record<string, string>>((acc, debt) => {
    if (debt.balance < 0) {
      acc[`${debt.id}-balance`] = 'Balance cannot be negative.'
    }

    if (debt.apr < 0) {
      acc[`${debt.id}-apr`] = 'APR cannot be negative.'
    } else if (debt.apr > 100) {
      acc[`${debt.id}-apr`] = 'APR cannot exceed 100%.'
    }

    if (debt.minPayment < 0) {
      acc[`${debt.id}-minPayment`] = 'Minimum payment cannot be negative.'
    } else if (debt.balance > 0 && debt.minPayment > debt.balance) {
      acc[`${debt.id}-minPayment`] = 'Minimum payment cannot exceed the current balance.'
    }

    if (debt.promoApr !== null) {
      if (debt.promoApr < 0) {
        acc[`${debt.id}-promoApr`] = 'Promo APR cannot be negative.'
      } else if (debt.promoApr > 100) {
        acc[`${debt.id}-promoApr`] = 'Promo APR cannot exceed 100%.'
      }
    }

    if (debt.promoExpiration && debt.promoExpiration < todayDate) {
      acc[`${debt.id}-promoExpiration`] = 'Promo expiration cannot be in the past.'
    }

    return acc
  }, {})
}

export default function ManageDebts({ debts, onChange }: ManageDebtsProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>(() => getDebtValidationErrors(debts))
  const todayDate = getTodayDateString()

  const totalBalance = debts.reduce((sum, d) => sum + d.balance, 0)

  useEffect(() => {
    setValidationErrors(getDebtValidationErrors(debts))
  }, [debts])

  function updateDebt(id: string, updates: Partial<Debt>) {
    const updatedDebts = debts.map(d => (d.id === id ? { ...d, ...updates } : d))
    setValidationErrors(getDebtValidationErrors(updatedDebts))
    onChange(updatedDebts)
  }

  function addDebt() {
    const updatedDebts = [...debts, createEmptyDebt()]
    setValidationErrors(getDebtValidationErrors(updatedDebts))
    onChange(updatedDebts)
  }

  function confirmDelete(id: string) {
    // If only one debt, do nothing — can't delete last debt
    if (debts.length <= 1) return
    // If already pending this id, execute deletion
    if (pendingDeleteId === id) {
      const updatedDebts = debts.filter(d => d.id !== id)
      setValidationErrors(getDebtValidationErrors(updatedDebts))
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
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Core fields — always visible */}
            <div className="space-y-4">
              <Input
                label="Debt Name"
                placeholder="e.g., Chase Visa"
                value={debt.name}
                onChange={v => updateDebt(debt.id, { name: v })}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Balance"
                  currency
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  value={debt.balance || ''}
                  onChange={v => updateDebt(debt.id, { balance: parseFloat(v) || 0 })}
                  error={validationErrors[`${debt.id}-balance`]}
                />
                <Input
                  label="APR %"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  placeholder="0.00"
                  value={debt.apr || ''}
                  onChange={v => updateDebt(debt.id, { apr: parseFloat(v) || 0 })}
                  error={validationErrors[`${debt.id}-apr`]}
                />
              </div>

              <Input
                label="Minimum Payment"
                currency
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={debt.minPayment || ''}
                onChange={v => updateDebt(debt.id, { minPayment: parseFloat(v) || 0 })}
                error={validationErrors[`${debt.id}-minPayment`]}
              />

              {/* Advanced / promo fields */}
              <ExpandableSection title="Advanced Options">
                <div className="space-y-4">
                  <Input
                    label="Promo APR %"
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    placeholder="Leave blank if none"
                    value={debt.promoApr ?? ''}
                    onChange={v =>
                      updateDebt(debt.id, { promoApr: v ? parseFloat(v) : null })
                    }
                    error={validationErrors[`${debt.id}-promoApr`]}
                  />
                  <Input
                    label="Promo Expiration"
                    type="date"
                    min={todayDate}
                    value={debt.promoExpiration ?? ''}
                    onChange={v =>
                      updateDebt(debt.id, { promoExpiration: v || null })
                    }
                    error={validationErrors[`${debt.id}-promoExpiration`]}
                  />
                  <Toggle
                    label="Retroactive Interest"
                    description="Interest charged on full original balance if not paid off before promo ends"
                    checked={debt.retroactiveInterest}
                    onChange={v => updateDebt(debt.id, { retroactiveInterest: v })}
                  />
                  <Toggle
                    label="Zero Monthly Payment"
                    description="No monthly payment required (e.g., buy-now-pay-later)"
                    checked={debt.zeroMonthly}
                    onChange={v => updateDebt(debt.id, { zeroMonthly: v })}
                  />
                </div>
              </ExpandableSection>
            </div>
          </Card>
        ))}
      </div>

      <Button type="button" variant="secondary" onClick={addDebt} className="w-full">
        + Add Another Debt
      </Button>
    </div>
  )
}
