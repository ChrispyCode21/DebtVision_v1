interface LegendEntry {
  value?: string | number
  color?: string
}

interface DashboardChartLegendProps {
  payload?: readonly LegendEntry[]
  debtNames: Record<string, string>
}

export default function DashboardChartLegend({
  payload,
  debtNames,
}: DashboardChartLegendProps) {
  return (
    <ul className="mt-2 flex max-h-20 flex-wrap gap-x-4 gap-y-1 overflow-y-auto pr-1 text-xs sm:max-h-none sm:text-sm">
      {(payload ?? []).map((entry) => {
        const debtId = String(entry.value ?? '')
        return (
          <li key={debtId} className="flex min-w-0 items-center gap-1">
            <span
              aria-hidden="true"
              className="inline-block h-2 w-2 shrink-0 rounded-sm"
              style={{ backgroundColor: entry.color ?? '#64748b' }}
            />
            <span className="min-w-0 truncate">{debtNames[debtId] ?? debtId}</span>
          </li>
        )
      })}
    </ul>
  )
}
