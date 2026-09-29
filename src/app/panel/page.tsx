import Link from 'next/link'
import { ArrowUpRight, Ticket } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { RAFFLE_STATUS_LABEL, type Raffle, type RaffleStatus } from '@/lib/types'
import { formatDate, formatMoney } from '@/lib/utils'

const statusStyle: Record<RaffleStatus, string> = {
  draft: 'bg-paper text-ink-soft border-line',
  active: 'bg-sold-bg text-sold-ink border-sold-line',
  closed: 'bg-held-bg text-held-ink border-held-line',
}

export default async function PanelPage() {
  const supabase = await createClient()

  const { data: raffles } = await supabase
    .from('raffles')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<Raffle[]>()

  const ids = (raffles ?? []).map((r) => r.id)
  const { data: tickets } = await supabase
    .from('tickets')
    .select('raffle_id, status')
    .in('raffle_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])

  const counts = new Map<string, { reserved: number; paid: number }>()
  for (const t of tickets ?? []) {
    const c = counts.get(t.raffle_id) ?? { reserved: 0, paid: 0 }
    if (t.status === 'paid') c.paid += 1
    else c.reserved += 1
    counts.set(t.raffle_id, c)
  }

  if (!raffles?.length) {
    return (
      <div className="rounded-card border border-dashed border-line bg-paper-raised p-10 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-brand-50 text-brand-700">
          <Ticket className="size-5" />
        </span>
        <h1 className="mt-4 text-xl font-semibold">Todavía no tienes rifas</h1>
        <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">
          Crea la primera, publícala y comparte el link para que empiecen a apartar números.
        </p>
        <Link
          href="/panel/nueva"
          className="mt-5 inline-flex rounded-full bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
        >
          Crear mi primera rifa
        </Link>
      </div>
    )
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Mis rifas</h1>

      <div className="mt-5 grid gap-3">
        {raffles.map((raffle) => {
          const c = counts.get(raffle.id) ?? { reserved: 0, paid: 0 }
          const taken = c.reserved + c.paid
          const pct = Math.round((taken / raffle.total_numbers) * 100)

          return (
            <Link
              key={raffle.id}
              href={`/panel/${raffle.id}`}
              className="group rounded-card border border-line bg-paper-raised p-5 transition hover:border-brand-300"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-lg font-semibold">{raffle.title}</h2>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${statusStyle[raffle.status]}`}
                    >
                      {RAFFLE_STATUS_LABEL[raffle.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink-soft">
                    {raffle.prize ? `${raffle.prize} · ` : ''}
                    {raffle.draw_date
                      ? `Sorteo ${formatDate(raffle.draw_date)}`
                      : 'Sin fecha de sorteo'}
                  </p>
                </div>
                <ArrowUpRight className="size-5 shrink-0 text-ink-soft transition group-hover:text-brand-600" />
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-paper">
                <div
                  className="h-full rounded-full bg-brand-500 transition-[width]"
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-soft">
                <span>
                  <strong className="text-ink">{taken}</strong> de {raffle.total_numbers} tomados
                </span>
                <span>
                  <strong className="text-sold-ink">{c.paid}</strong> pagados
                </span>
                <span>
                  <strong className="text-held-ink">{c.reserved}</strong> apartados
                </span>
                {raffle.price > 0 && (
                  <span className="ml-auto">
                    Recaudado{' '}
                    <strong className="text-ink">
                      {formatMoney(c.paid * raffle.price, raffle.currency)}
                    </strong>
                  </span>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </>
  )
}
