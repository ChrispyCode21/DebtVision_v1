import type { Debt } from '@/types'
import { parseOptionalNumber } from '@/services/debtValidation'
import Input from '@/components/shared/Input'
import Toggle from '@/components/shared/Toggle'
import ExpandableSection from '@/components/shared/ExpandableSection'

interface DebtFormFieldsProps {
  debt: Debt
  todayDate: string
  errors: Record<string, string>
  onUpdate: (id: string, updates: Partial<Debt>) => void
}

export default function DebtFormFields({ debt, todayDate, errors, onUpdate }: DebtFormFieldsProps) {
  return (
    <div className="space-y-4">
      <Input
        label="Debt Name"
        placeholder="e.g., Chase Visa"
        value={debt.name}
        onChange={v => onUpdate(debt.id, { name: v })}
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
          onChange={v => onUpdate(debt.id, { balance: parseFloat(v) || 0 })}
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
          onChange={v => onUpdate(debt.id, { apr: parseFloat(v) || 0 })}
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
        onChange={v => onUpdate(debt.id, { minPayment: parseFloat(v) || 0 })}
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
            onChange={v => onUpdate(debt.id, { promoApr: parseOptionalNumber(v) })}
            error={errors[`${debt.id}-promoApr`]}
          />
          <Input
            label="Promo Expiration"
            type="date"
            min={todayDate}
            value={debt.promoExpiration ?? ''}
            onChange={v => onUpdate(debt.id, { promoExpiration: v || null })}
            error={errors[`${debt.id}-promoExpiration`]}
          />
          <Toggle
            label="Retroactive Interest"
            description="Interest charged on full original balance if not paid off before promo ends"
            checked={debt.retroactiveInterest}
            onChange={v => onUpdate(debt.id, { retroactiveInterest: v })}
          />
          <Toggle
            label="Zero Monthly Payment"
            description="No monthly payment required (e.g., buy-now-pay-later)"
            checked={debt.zeroMonthly}
            onChange={v => onUpdate(debt.id, { zeroMonthly: v })}
          />
        </div>
      </ExpandableSection>
    </div>
  )
}
