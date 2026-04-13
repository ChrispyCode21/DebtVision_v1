import type { SimulationResult } from '@/types'
import Card from '@/components/shared/Card'

interface SummaryStatsProps {
  result: SimulationResult
  totalDebt: number
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatMonths(months: number): string {
  if (months < 12) return `${months} mo`
  const years = Math.floor(months / 12)
  const rem = months % 12
  return rem === 0 ? `${years} yr` : `${years} yr ${rem} mo`
}

export default function SummaryStats({ result, totalDebt }: SummaryStatsProps) {
  const stats = [
    {
      label: 'Time to Debt-Free',
      value: formatMonths(result.totalMonths),
      sub: `${result.totalMonths} months`,
      color: 'text-blue-600',
    },
    {
      label: 'Total Interest',
      value: formatCurrency(result.totalInterestPaid),
      sub: 'interest you will pay',
      color: 'text-red-500',
    },
    {
      label: 'Interest Saved',
      value: formatCurrency(result.interestSaved),
      sub: 'vs. minimum payments',
      color: 'text-green-600',
    },
    {
      label: 'Current Debt',
      value: formatCurrency(totalDebt),
      sub: 'total balance today',
      color: 'text-gray-700',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="text-center">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            {stat.label}
          </p>
          <p className={`text-xl font-bold sm:text-2xl ${stat.color}`}>{stat.value}</p>
          <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
        </Card>
      ))}
    </div>
  )
}
