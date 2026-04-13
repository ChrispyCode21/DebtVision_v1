import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'
import type { MonthEntry } from '@/types'

interface PaymentAllocationProps {
  schedule: MonthEntry[]
  debtNames: Record<string, string>
}

// Same color palette as PayoffTimeline
const COLORS = [
  '#3b82f6', // blue-500
  '#22c55e', // green-500
  '#f97316', // orange-500
  '#a855f7', // purple-500
  '#ef4444', // red-500
  '#14b8a6', // teal-500
]

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export default function PaymentAllocation({ schedule, debtNames }: PaymentAllocationProps) {
  if (schedule.length === 0) return null

  // Collect all unique debt IDs across the schedule
  const debtIds = Array.from(
    new Set(schedule.flatMap((entry) => entry.debts.map((d) => d.debtId))),
  )

  // Transform schedule entries into flat chart data rows keyed by debt ID
  const chartData = schedule.map((entry) => {
    const row: Record<string, number> = { month: entry.month }
    for (const debtId of debtIds) {
      const snapshot = entry.debts.find((d) => d.debtId === debtId)
      row[debtId] = snapshot ? Math.max(0, snapshot.paymentMade) : 0
    }
    return row
  })

  return (
    <div style={{ minHeight: 250 }}>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 8, right: 16, left: 16, bottom: 0 }}>
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11 }}
            label={{ value: 'Month', position: 'insideBottomRight', offset: -4, fontSize: 11 }}
          />
          <YAxis
            tickFormatter={(v: number) => formatCurrency(v)}
            tick={{ fontSize: 11 }}
            width={72}
          />
          <Tooltip
            formatter={(value, name) => [
              formatCurrency(Number(value)),
              debtNames[String(name)] ?? String(name),
            ]}
            labelFormatter={(label) => `Month ${label}`}
          />
          <Legend
            formatter={(value: string) => debtNames[value] ?? value}
            wrapperStyle={{ fontSize: 12 }}
          />
          {debtIds.map((debtId, index) => (
            <Bar
              key={debtId}
              dataKey={debtId}
              stackId="payments"
              fill={COLORS[index % COLORS.length]}
              name={debtId}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
