import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'
import type { MonthEntry } from '@/types'
import DashboardChartLegend from './DashboardChartLegend'

interface PayoffTimelineProps {
  schedule: MonthEntry[]
  debtNames: Record<string, string>
}

// Distinct color palette — Tailwind-equivalent hex values
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

export default function PayoffTimeline({ schedule, debtNames }: PayoffTimelineProps) {
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
      row[debtId] = snapshot ? Math.max(0, snapshot.balance) : 0
    }
    return row
  })

  return (
    <div className="h-[340px] min-h-[300px] sm:h-[280px] sm:min-h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 16, bottom: 0 }}>
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
            content={(props) => <DashboardChartLegend payload={props.payload} debtNames={debtNames} />}
            verticalAlign="bottom"
          />
          {debtIds.map((debtId, index) => (
            <Area
              key={debtId}
              type="monotone"
              dataKey={debtId}
              stackId="1"
              stroke={COLORS[index % COLORS.length]}
              fill={COLORS[index % COLORS.length]}
              fillOpacity={0.6}
              name={debtId}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
