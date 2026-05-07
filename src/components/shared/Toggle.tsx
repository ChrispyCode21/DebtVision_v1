import { useId } from 'react'

interface ToggleProps {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export default function Toggle({ label, description, checked, onChange }: ToggleProps) {
  const inputId = useId()
  const descriptionId = description ? `${inputId}-description` : undefined

  return (
    <label className="flex items-center justify-between gap-3 min-h-[44px] cursor-pointer">
      <div>
        <span className="text-base font-medium text-gray-700">{label}</span>
        {description && (
          <p id={descriptionId} className="text-sm text-gray-500">
            {description}
          </p>
        )}
      </div>
      <input
        id={inputId}
        type="checkbox"
        role="switch"
        checked={checked}
        aria-checked={checked}
        aria-describedby={descriptionId}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="relative inline-flex h-6 w-11 shrink-0 rounded-full bg-gray-300 transition-colors peer-checked:bg-blue-600 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-600"
      >
        <span
          className={`mt-0.5 inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
        />
      </span>
    </label>
  )
}
