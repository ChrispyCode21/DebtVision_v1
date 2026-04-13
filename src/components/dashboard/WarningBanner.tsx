import type { Warning, WarningSeverity } from '@/types'

interface WarningBannerProps {
  warnings: Warning[]
}

interface SeverityStyle {
  container: string
  icon: string
  text: string
}

const severityStyles: Record<WarningSeverity, SeverityStyle> = {
  critical: {
    container: 'bg-red-50 border border-red-200',
    icon: 'text-red-500',
    text: 'text-red-800',
  },
  warning: {
    container: 'bg-yellow-50 border border-yellow-200',
    icon: 'text-yellow-500',
    text: 'text-yellow-800',
  },
  info: {
    container: 'bg-blue-50 border border-blue-200',
    icon: 'text-blue-500',
    text: 'text-blue-800',
  },
}

function WarningIcon({ severity }: { severity: WarningSeverity }) {
  if (severity === 'info') {
    return (
      <svg
        className="w-5 h-5 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z"
        />
      </svg>
    )
  }
  // Triangle warning for 'warning' and 'critical'
  return (
    <svg
      className="w-5 h-5 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
      />
    </svg>
  )
}

export default function WarningBanner({ warnings }: WarningBannerProps) {
  if (warnings.length === 0) return null

  return (
    <div className="space-y-2" role="alert" aria-live="polite">
      {warnings.map((warning, index) => {
        const styles = severityStyles[warning.severity]
        return (
          <div
            key={`${warning.type}-${warning.debtId ?? 'global'}-${index}`}
            className={`flex items-start gap-3 rounded-lg px-4 py-3 ${styles.container}`}
          >
            <span className={styles.icon}>
              <WarningIcon severity={warning.severity} />
            </span>
            <p className={`text-sm leading-snug ${styles.text}`}>{warning.message}</p>
          </div>
        )
      })}
    </div>
  )
}
