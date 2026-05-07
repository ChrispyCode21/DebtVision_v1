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

interface LegendEntry {
  value?: string | number
  color?: string
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

  const renderLegend = (props: { payload?: readonly LegendEntry[] }) => (
    <ul className="mt-2 flex max-h-20 flex-wrap gap-x-4 gap-y-1 overflow-y-auto pr-1 text-xs sm:max-h-none sm:text-sm">
      {(props.payload ?? []).map((entry) => {
        const debtId = String(entry.value ?? '')
        return (
          <li key={debtId} className="flex items-center gap-1">
            <span
              aria-hidden="true"
              className="inline-block h-2 w-2 shrink-0 rounded-sm"
              style={{ backgroundColor: entry.color ?? '#64748b' }}
            />
            <span className="truncate">{debtNames[debtId] ?? debtId}</span>
          </li>
        )
      })}
    </ul>
  )

  return (
    <div className="h-[340px] min-h-[300px] sm:h-[280px] sm:min-h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
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
            content={renderLegend}
            verticalAlign="bottom"
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
