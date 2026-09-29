import { cn } from '@/lib/utils'

export function Field({
  label,
  hint,
  error,
  htmlFor,
  className,
  children,
}: {
  label: string
  hint?: string
  error?: string
  htmlFor?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {hint && <p className="mt-0.5 text-xs text-ink-soft">{hint}</p>}
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}

export const inputClass = (hasError?: boolean) =>
  cn(
    'w-full rounded-xl border bg-paper px-4 py-2.5 outline-none transition',
    'focus:border-brand-500 focus:ring-2 focus:ring-brand-100',
    hasError ? 'border-red-400' : 'border-line'
  )
