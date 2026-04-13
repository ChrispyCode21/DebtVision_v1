import { useState } from 'react'
import type { BudgetContext, Debt, Strategy, AppState } from '@/types'
import { DEFAULT_APP_STATE, createEmptyDebt } from '@/services/defaults'
import { saveState } from '@/services/storage'
import Stepper from '@/components/shared/Stepper'
import Button from '@/components/shared/Button'
import Welcome from './Welcome'
import BudgetForm from './BudgetForm'
import DebtEntry from './DebtEntry'
import StrategyPicker from './StrategyPicker'
import ReviewAndComplete from './ReviewAndComplete'

const STEPS = [
  { label: 'Welcome' },
  { label: 'Budget' },
  { label: 'Debts' },
  { label: 'Strategy' },
  { label: 'Review' },
]

interface OnboardingFlowProps {
  onComplete: () => void
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(1)
  const [budget, setBudget] = useState<BudgetContext>(DEFAULT_APP_STATE.budgetContext)
  const [debts, setDebts] = useState<Debt[]>([createEmptyDebt()])
  const [strategy, setStrategy] = useState<Strategy>('avalanche')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  function validateBudget(): boolean {
    const errs: Record<string, string> = {}
    if (budget.netIncome <= 0) errs.netIncome = 'Income must be greater than 0'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function validateDebts(): boolean {
    const errs: Record<string, string> = {}
    if (debts.length === 0) errs.debts = 'Add at least one debt'
    debts.forEach(d => {
      if (!d.name.trim()) errs[`${d.id}-name`] = 'Name required'
      if (d.balance <= 0) errs[`${d.id}-balance`] = 'Balance must be > 0'
    })
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function goNext() {
    if (step === 2 && !validateBudget()) return
    if (step === 3 && !validateDebts()) return
    setErrors({})
    setStep(s => Math.min(s + 1, 5))
  }

  function goBack() {
    setErrors({})
    setStep(s => Math.max(s - 1, 1))
  }

  function handleComplete() {
    setSaving(true)
    const state: AppState = {
      schemaVersion: 1,
      budgetContext: budget,
      debts,
      strategy,
      onboardingComplete: true,
    }
    saveState(state)
    onComplete()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {step > 1 && (
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <Stepper steps={STEPS} currentStep={step} />
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-6">
        {step === 1 && <Welcome onNext={goNext} />}
        {step === 2 && <BudgetForm budget={budget} onChange={setBudget} errors={errors} />}
        {step === 3 && <DebtEntry debts={debts} onChange={setDebts} errors={errors} />}
        {step === 4 && <StrategyPicker strategy={strategy} onChange={setStrategy} />}
        {step === 5 && (
          <ReviewAndComplete
            budget={budget}
            debts={debts}
            strategy={strategy}
            onComplete={handleComplete}
            loading={saving}
          />
        )}
      </div>

      {step > 1 && step < 5 && (
        <div className="bg-white border-t border-gray-200 px-4 py-3 flex gap-3">
          <Button variant="secondary" onClick={goBack} className="flex-1">
            Back
          </Button>
          <Button onClick={goNext} className="flex-1">
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
