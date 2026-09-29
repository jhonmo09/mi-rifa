'use client'

import { NumberGrid } from '@/components/number-grid'
import type { TicketStatus } from '@/lib/types'

export function TalonarioMap({
  total,
  taken,
}: {
  total: number
  taken: [number, TicketStatus][]
}) {
  return <NumberGrid total={total} taken={new Map(taken)} readOnly />
}
