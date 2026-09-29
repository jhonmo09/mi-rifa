'use client'

import { useMemo, useState } from 'react'
import { cn, formatNumber } from '@/lib/utils'
import type { TicketStatus } from '@/lib/types'

const BLOCK = 100

export function NumberGrid({
  total,
  taken,
  selected,
  onToggle,
  readOnly = false,
}: {
  total: number
  taken: Map<number, TicketStatus>
  selected?: Set<number>
  onToggle?: (n: number) => void
  readOnly?: boolean
}) {
  const blocks = useMemo(() => {
    const out: { from: number; to: number }[] = []
    for (let from = 0; from < total; from += BLOCK) {
      out.push({ from, to: Math.min(from + BLOCK, total) - 1 })
    }
    return out
  }, [total])

  const [block, setBlock] = useState(0)
  const paginated = blocks.length > 2
  const range = paginated ? blocks[Math.min(block, blocks.length - 1)] : { from: 0, to: total - 1 }

  const numbers: number[] = []
  for (let n = range.from; n <= range.to; n++) numbers.push(n)

  return (
    <div>
      {paginated && (
        <div className="-mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {blocks.map((b, i) => {
            const libres = countFree(b.from, b.to, taken)
            return (
              <button
                key={b.from}
                type="button"
                onClick={() => setBlock(i)}
                className={cn(
                  'shrink-0 rounded-full border px-3 py-1.5 text-sm whitespace-nowrap transition',
                  i === block
                    ? 'border-brand-500 bg-brand-50 font-medium text-brand-700'
                    : 'border-line text-ink-soft hover:border-brand-300'
                )}
              >
                {formatNumber(b.from, total)}–{formatNumber(b.to, total)}
                <span className="ml-1.5 text-xs opacity-70">{libres}</span>
              </button>
            )
          })}
        </div>
      )}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(3.25rem,1fr))] gap-1.5">
        {numbers.map((n) => {
          const status = taken.get(n)
          const isSelected = selected?.has(n) ?? false
          const disabled = readOnly || !!status

          return (
            <button
              key={n}
              type="button"
              disabled={disabled}
              aria-pressed={isSelected}
              aria-label={
                status === 'paid'
                  ? `Número ${formatNumber(n, total)}, pagado`
                  : status === 'reserved'
                    ? `Número ${formatNumber(n, total)}, apartado`
                    : `Número ${formatNumber(n, total)}, libre`
              }
              onClick={() => onToggle?.(n)}
              className={cn(
                'rounded-lg border py-2.5 text-center font-mono text-sm tabular-nums transition',
                'disabled:cursor-not-allowed',
                status === 'paid' && 'border-sold-line bg-sold-bg text-sold-ink',
                status === 'reserved' && 'border-held-line bg-held-bg text-held-ink',
                !status && !isSelected && 'border-free-line bg-free-bg text-ink',
                !status && !readOnly && !isSelected && 'hover:border-brand-400 hover:bg-brand-50',
                isSelected && 'border-brand-600 bg-brand-600 text-white shadow-sm'
              )}
            >
              {formatNumber(n, total)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function countFree(from: number, to: number, taken: Map<number, TicketStatus>) {
  let free = 0
  for (let n = from; n <= to; n++) if (!taken.has(n)) free++
  return free
}

export function GridLegend({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-2 text-sm', className)}>
      <Dot className="border-free-line bg-free-bg" label="Libre" />
      <Dot className="border-held-line bg-held-bg" label="Apartado" />
      <Dot className="border-sold-line bg-sold-bg" label="Pagado" />
    </div>
  )
}

function Dot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-ink-soft">
      <span className={cn('size-3.5 rounded border', className)} />
      {label}
    </span>
  )
}
