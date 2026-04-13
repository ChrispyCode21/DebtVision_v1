import type { InputHTMLAttributes } from 'react'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string
  error?: string
  currency?: boolean
  onChange?: (value: string) => void
}

export default function Input({
  label,
  error,
  currency = false,
  onChange,
  id,
  className = '',
  ...rest
}: InputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        {currency && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-base">$</span>
        )}
        <input
          id={inputId}
          className={`w-full min-h-[44px] px-3 py-2 rounded-lg border text-base
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${currency ? 'pl-7' : ''}
            ${error ? 'border-red-500' : 'border-gray-300'}`}
          onChange={e => onChange?.(e.target.value)}
          {...rest}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
