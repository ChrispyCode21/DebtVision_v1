interface ToggleProps {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export default function Toggle({ label, description, checked, onChange }: ToggleProps) {
  return (
    <label className="flex items-center justify-between gap-3 min-h-[44px] cursor-pointer">
      <div>
        <span className="text-base font-medium text-gray-700">{label}</span>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors
          ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5
            ${checked ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'}`}
        />
      </button>
    </label>
  )
}
