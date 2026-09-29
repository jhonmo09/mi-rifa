'use client'

import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'

function Inner({
  children,
  className,
  confirmText,
}: {
  children: React.ReactNode
  className: string
  confirmText?: string
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (confirmText && !window.confirm(confirmText)) e.preventDefault()
      }}
      className={className}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : children}
    </button>
  )
}

export function ConfirmButton({
  action,
  children,
  className = 'inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-sm transition hover:border-brand-300 disabled:opacity-50',
  confirmText,
}: {
  action: () => Promise<void>
  children: React.ReactNode
  className?: string
  confirmText?: string
}) {
  return (
    <form action={action} className="contents">
      <Inner className={className} confirmText={confirmText}>
        {children}
      </Inner>
    </form>
  )
}
