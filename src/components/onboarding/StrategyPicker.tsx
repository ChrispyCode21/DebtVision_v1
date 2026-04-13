import type { Strategy } from '@/types'

interface StrategyPickerProps {
  strategy: Strategy
  onChange: (strategy: Strategy) => void
}

const strategies: { value: Strategy; title: string; description: string; icon: string }[] = [
  {
    value: 'avalanche',
    title: 'Avalanche',
    description: 'Pay highest interest rate first — saves the most money over time',
    icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  },
  {
    value: 'snowball',
    title: 'Snowball',
    description: 'Pay smallest balance first — fastest psychological wins to build momentum',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
]

export default function StrategyPicker({ strategy, onChange }: StrategyPickerProps) {
  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Payment Strategy</h2>
        <p className="text-sm text-gray-500">
          Choose how you'd like to prioritize your payments. Both strategies pay off all
          debt — they just order payments differently.
        </p>
      </div>

      <div className="space-y-3">
        {strategies.map(s => {
          const selected = strategy === s.value
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => onChange(s.value)}
              className={`w-full text-left p-5 rounded-xl border-2 transition-all
                ${selected
                  ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                  : 'border-gray-200 bg-white hover:border-gray-300'}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0
                  ${selected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                  </svg>
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${selected ? 'text-blue-900' : 'text-gray-900'}`}>
                    {s.title}
                  </h3>
                  <p className={`text-sm mt-1 ${selected ? 'text-blue-700' : 'text-gray-500'}`}>
                    {s.description}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
