import { type Debt } from '@/types'
import Input from '@/components/shared/Input'
import Button from '@/components/shared/Button'
import Card from '@/components/shared/Card'
import Toggle from '@/components/shared/Toggle'
import ExpandableSection from '@/components/shared/ExpandableSection'

interface DebtEntryProps {
  debts: Debt[]
  onChange: (debts: Debt[]) => void
  errors: Record<string, string>
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

export default function DebtEntry({ debts, onChange, errors }: DebtEntryProps) {
  const totalBalance = debts.reduce((sum, d) => sum + d.balance, 0)

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
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>

            <div className="space-y-4">
              <Input
                label="Debt Name"
                placeholder="e.g., Chase Visa"
                value={debt.name}
                onChange={v => updateDebt(debt.id, { name: v })}
                error={errors[`${debt.id}-name`]}
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
                  error={errors[`${debt.id}-balance`]}
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
                  error={errors[`${debt.id}-apr`]}
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
                error={errors[`${debt.id}-minPayment`]}
              />

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
                    onChange={v => updateDebt(debt.id, { promoApr: v ? parseFloat(v) : null })}
                  />
                  <Input
                    label="Promo Expiration"
                    type="date"
                    value={debt.promoExpiration ?? ''}
                    onChange={v => updateDebt(debt.id, { promoExpiration: v || null })}
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

      <Button variant="secondary" onClick={addDebt} className="w-full">
        + Add Another Debt
      </Button>
    </div>
  )
}
