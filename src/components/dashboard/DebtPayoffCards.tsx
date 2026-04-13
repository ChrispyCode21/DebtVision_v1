import type { DebtSummary } from '@/types'
import Card from '@/components/shared/Card'

interface DebtPayoffCardsProps {
  debtSummaries: DebtSummary[]
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatPayoffMonth(month: number): string {
  if (month < 12) return `Month ${month}`
  const years = Math.floor(month / 12)
  const rem = month % 12
  return rem === 0
    ? `Month ${month} (${years} yr)`
    : `Month ${month} (${years} yr ${rem} mo)`
}

export default function DebtPayoffCards({ debtSummaries }: DebtPayoffCardsProps) {
  if (debtSummaries.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-4">No debt summaries available.</p>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
      {debtSummaries.map((summary) => (
        <Card key={summary.debtId}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="text-base font-semibold text-gray-900 truncate">
                {summary.debtName}
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Original balance: {formatCurrency(summary.originalBalance)}
              </p>
            </div>
            {/* Payoff badge */}
            <span className="shrink-0 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
              Paid off
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-xs text-gray-500">Payoff</p>
              <p className="font-medium text-gray-800">
                {formatPayoffMonth(summary.payoffMonth)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Interest paid</p>
              <p className="font-medium text-red-500">
                {formatCurrency(summary.totalInterestPaid)}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
