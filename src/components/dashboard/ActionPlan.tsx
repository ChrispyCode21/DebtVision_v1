import type { MonthDirective } from '@/types'
import ExpandableSection from '@/components/shared/ExpandableSection'

interface ActionPlanProps {
  actionPlan: MonthDirective[]
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

function MonthDirectiveContent({ directive }: { directive: MonthDirective }) {
  return (
    <div className="space-y-3">
      {/* Payment list */}
      <ul className="space-y-2">
        {directive.payments.map((payment, index) => (
          <li
            key={`${payment.debtId}-${index}`}
            className="text-sm"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-800">{payment.debtName}</span>
              <span className="font-semibold text-blue-600">
                {formatCurrency(payment.amount)}
              </span>
            </div>
            {payment.reasoning && (
              <div className="mt-0.5 text-xs text-gray-500 italic">
                {payment.reasoning}
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* Milestones */}
      {directive.milestones.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-gray-100">
          {directive.milestones.map((milestone, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 text-sm text-green-700 font-medium"
            >
              {/* Checkmark icon */}
              <svg
                className="w-4 h-4 text-green-500 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {milestone}
            </div>
          ))}
        </div>
      )}

      {/* Inline directive warnings (e.g. "Promo expires soon") */}
      {directive.warnings.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-yellow-100">
          {directive.warnings.map((warning, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 text-xs text-yellow-700 bg-yellow-50 rounded px-2 py-1"
            >
              <svg
                className="w-3.5 h-3.5 text-yellow-500 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                />
              </svg>
              {warning}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ActionPlan({ actionPlan }: ActionPlanProps) {
  if (actionPlan.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        No payment directives available.
      </div>
    )
  }

  // Build a compact header label for each month
  function monthLabel(directive: MonthDirective): string {
    const total = directive.payments.reduce((sum, p) => sum + p.amount, 0)
    const suffix = directive.milestones.length > 0 ? ' — Payoff!' : ''
    return `Month ${directive.month}: ${formatCurrency(total)} total${suffix}`
  }

  return (
    <div className="space-y-2">
      {actionPlan.map((directive, index) => (
        <ExpandableSection
          key={directive.month}
          title={monthLabel(directive)}
          defaultOpen={index === 0}
        >
          <MonthDirectiveContent directive={directive} />
        </ExpandableSection>
      ))}
    </div>
  )
}
