import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CalendarDays, Gift, ScrollText, Ticket } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { PublicTicket, Raffle } from '@/lib/types'
import { formatDate, formatMoney } from '@/lib/utils'
import { Talonario } from './talonario'

export const revalidate = 0

async function getRaffle(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('raffles')
    .select('*')
    .eq('slug', slug)
    .maybeSingle<Raffle>()
  return data
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const raffle = await getRaffle(slug)
  if (!raffle) return { title: 'Rifa no encontrada' }

  return {
    title: `${raffle.title} · Escoge tu número`,
    description: raffle.prize ?? raffle.description ?? 'Escoge tu número y apártalo.',
  }
}

export default async function PublicRafflePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const raffle = await getRaffle(slug)
  if (!raffle) notFound()

  const supabase = await createClient()
  const { data: taken } = await supabase
    .from('public_tickets')
    .select('number, status')
    .eq('raffle_id', raffle.id)
    .returns<Pick<PublicTicket, 'number' | 'status'>[]>()

  const tomados = taken ?? []
  const libres = raffle.total_numbers - tomados.length

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pt-6 pb-40 sm:px-6">
      <article className="ticket-edge rounded-card border border-line bg-paper-raised p-6 sm:p-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold tracking-wide text-brand-700 uppercase">
          <Ticket className="size-3.5" />
          Talonario digital
        </span>

        <h1 className="mt-4 text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
          {raffle.title}
        </h1>

        {raffle.prize && (
          <p className="mt-3 flex items-start gap-2 text-lg">
            <Gift className="mt-1 size-5 shrink-0 text-brand-600" />
            <span>{raffle.prize}</span>
          </p>
        )}

        {raffle.description && (
          <p className="mt-3 leading-relaxed whitespace-pre-line text-ink-soft">
            {raffle.description}
          </p>
        )}

        <dl className="mt-6 grid gap-3 border-t border-dashed border-line pt-5 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-medium tracking-wide text-ink-soft uppercase">
              Valor del número
            </dt>
            <dd className="mt-0.5 text-lg font-semibold">
              {raffle.price > 0 ? formatMoney(raffle.price, raffle.currency) : 'Gratis'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium tracking-wide text-ink-soft uppercase">Sorteo</dt>
            <dd className="mt-0.5 flex items-center gap-1.5 text-lg font-semibold">
              {raffle.draw_date ? (
                <>
                  <CalendarDays className="size-4 text-ink-soft" />
                  {formatDate(raffle.draw_date)}
                </>
              ) : (
                'Por definir'
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium tracking-wide text-ink-soft uppercase">
              Números libres
            </dt>
            <dd className="mt-0.5 text-lg font-semibold tabular-nums">
              {libres} <span className="font-normal text-ink-soft">de {raffle.total_numbers}</span>
            </dd>
          </div>
        </dl>

        {raffle.draw_rules && (
          <section className="mt-5 rounded-xl border border-line bg-paper p-4 sm:p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide uppercase">
              <ScrollText className="size-4 text-brand-600" />
              Cómo se juega
            </h2>
            <p className="mt-2 leading-relaxed whitespace-pre-line text-ink-soft">
              {raffle.draw_rules}
            </p>
          </section>
        )}
      </article>

      {raffle.status === 'closed' && (
        <p className="mt-6 rounded-card border border-held-line bg-held-bg p-5 text-held-ink">
          <strong>Esta rifa ya está cerrada.</strong> Ya no se pueden apartar más números. Si
          alcanzaste a apartar el tuyo, sigue pendiente del sorteo.
        </p>
      )}

      {raffle.status === 'draft' && (
        <p className="mt-6 rounded-card border border-brand-300 bg-brand-50 p-5 text-brand-700">
          <strong>Así se va a ver tu rifa.</strong> Todavía está en borrador, así que solo tú
          puedes abrir este link. Publícala desde tu panel para que los demás puedan apartar.
        </p>
      )}

      <Talonario raffle={raffle} taken={tomados.map((t) => [t.number, t.status])} />
    </main>
  )
}
