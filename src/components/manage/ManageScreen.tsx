import { useEffect, useState } from 'react'
import type { BudgetContext, Debt, Strategy } from '@/types'
import { useAppContext } from '@/context/AppContext'
import ManageBudget from './ManageBudget'
import ManageDebts from './ManageDebts'
import Button from '@/components/shared/Button'

export default function ManageScreen() {
  const { state, dispatch } = useAppContext()

  // Local draft copies — only committed to global state on "Save & Recalculate"
  const [draftBudget, setDraftBudget] = useState<BudgetContext>(state.budgetContext)
  const [draftDebts, setDraftDebts] = useState<Debt[]>(state.debts)
  const [draftStrategy, setDraftStrategy] = useState<Strategy>(state.strategy)

  const [savedMessage, setSavedMessage] = useState(false)

  // Sync drafts if parent state changes from outside (e.g., initial load)
  useEffect(() => {
    setDraftBudget(state.budgetContext)
    setDraftDebts(state.debts)
    setDraftStrategy(state.strategy)
  }, [state.budgetContext, state.debts, state.strategy])

  function handleSave() {
    dispatch({ type: 'SET_BUDGET', payload: draftBudget })
    dispatch({ type: 'SET_DEBTS', payload: draftDebts })
    dispatch({ type: 'SET_STRATEGY', payload: draftStrategy })

    setSavedMessage(true)
    const timer = setTimeout(() => setSavedMessage(false), 2500)
    return () => clearTimeout(timer)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-28 md:pb-6">

        {/* Page heading */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Manage</h1>
          <p className="text-sm text-gray-500 mt-1">
            Edit your budget, debts, and payoff strategy. Save when ready.
          </p>
        </div>

        {/* Strategy selector */}
        <section className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Payoff Strategy</h2>
          <div
            role="group"
            aria-label="Payoff strategy"
            className="grid grid-cols-2 gap-3"
          >
            <button
              type="button"
              onClick={() => setDraftStrategy('avalanche')}
              aria-pressed={draftStrategy === 'avalanche'}
              className={`min-h-[56px] rounded-xl border-2 px-4 py-3 text-left transition-colors
                ${draftStrategy === 'avalanche'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
            >
              <span className={`block text-sm font-semibold ${draftStrategy === 'avalanche' ? 'text-blue-700' : 'text-gray-800'}`}>
                Avalanche
              </span>
              <span className="block text-xs text-gray-500 mt-0.5">Pay highest APR first</span>
            </button>

            <button
              type="button"
              onClick={() => setDraftStrategy('snowball')}
              aria-pressed={draftStrategy === 'snowball'}
              className={`min-h-[56px] rounded-xl border-2 px-4 py-3 text-left transition-colors
                ${draftStrategy === 'snowball'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
            >
              <span className={`block text-sm font-semibold ${draftStrategy === 'snowball' ? 'text-blue-700' : 'text-gray-800'}`}>
                Snowball
              </span>
              <span className="block text-xs text-gray-500 mt-0.5">Pay lowest balance first</span>
            </button>
          </div>
        </section>

        {/* Divider */}
        <hr className="border-gray-200 mb-6" />

        {/* Budget section */}
        <section className="mb-6">
          <ManageBudget budget={draftBudget} onChange={setDraftBudget} />
        </section>

        {/* Divider */}
        <hr className="border-gray-200 mb-6" />

        {/* Debts section */}
        <section className="mb-8">
          <ManageDebts debts={draftDebts} onChange={setDraftDebts} />
        </section>

        {/* Save & Recalculate — sticky on mobile, inline on desktop */}
        <div className="fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-gray-200 px-4 py-3
          md:static md:bg-transparent md:border-0 md:px-0 md:py-0">
          <div className="max-w-2xl mx-auto flex items-center gap-4">
            <Button
              type="button"
              variant="primary"
              onClick={handleSave}
              className="flex-1 md:flex-none md:min-w-[200px]"
            >
              Save &amp; Recalculate
            </Button>

            {savedMessage && (
              <span
                role="status"
                aria-live="polite"
                className="text-sm font-medium text-green-700 animate-pulse"
              >
                Changes saved!
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
