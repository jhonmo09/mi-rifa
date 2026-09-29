'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

export function CopyButton({ value, className }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setCopied(true)
          setTimeout(() => setCopied(false), 1800)
        } catch {
          // clipboard bloqueado: el usuario puede seleccionar el texto a mano
        }
      }}
      className={
        className ??
        'inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-sm transition hover:border-brand-300'
      }
    >
      {copied ? <Check className="size-4 text-sold-ink" /> : <Copy className="size-4" />}
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  )
}
