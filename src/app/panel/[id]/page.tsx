import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  CircleCheck,
  ExternalLink,
  MessageCircle,
  Pencil,
  RotateCcw,
  Send,
  Trash2,
  Undo2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { deleteRaffle, setRaffleStatus } from '@/actions/raffles'
import { addTicketManually, markPaid, markReserved, releaseTicket } from '@/actions/tickets'
import { CopyButton } from '@/components/copy-button'
import { ConfirmButton } from '@/components/confirm-button'
import { GridLegend } from '@/components/number-grid'
import { ManualTicketForm } from '@/components/manual-ticket-form'
import { RAFFLE_STATUS_LABEL, type Raffle, type Ticket } from '@/lib/types'
import { formatDate, formatMoney, formatNumber, siteUrl, waLink } from '@/lib/utils'
import { TalonarioMap } from './talonario-map'

export default async function RaffleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: raffle } = await supabase
    .from('raffles')
    .select('*')
    .eq('id', id)
    .maybeSingle<Raffle>()

  if (!raffle) notFound()

  const { data: ticketsData } = await supabase
    .from('tickets')
    .select('*')
    .eq('raffle_id', raffle.id)
    .order('number')
    .returns<Ticket[]>()

  const tickets = ticketsData ?? []
  const paid = tickets.filter((t) => t.status === 'paid')
  const reserved = tickets.filter((t) => t.status === 'reserved')
  const free = raffle.total_numbers - tickets.length

  const publicUrl = `${siteUrl()}/r/${raffle.slug}`
  const shareText = `¡Participa en "${raffle.title}"! Escoge tu número aquí: ${publicUrl}`

  return (
    <>
      <Link
        href="/panel"
        className="inline-flex items-center gap-2 text-sm text-ink-soft transition hover:text-ink"
      >
        <ArrowLeft className="size-4" />
        Mis rifas
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{raffle.title}</h1>
            <span className="rounded-full border border-line bg-paper px-2 py-0.5 text-xs font-medium text-ink-soft">
              {RAFFLE_STATUS_LABEL[raffle.status]}
            </span>
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            {raffle.prize ? `${raffle.prize} · ` : ''}
            {raffle.draw_date ? `Sorteo ${formatDate(raffle.draw_date)}` : 'Sin fecha de sorteo'}
            {raffle.price > 0 ? ` · ${formatMoney(raffle.price, raffle.currency)} por número` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {raffle.status !== 'active' && (
            <ConfirmButton
              action={setRaffleStatus.bind(null, raffle.id, 'active')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
            >
              <Send className="size-4" />
              {raffle.status === 'draft' ? 'Publicar' : 'Reabrir'}
            </ConfirmButton>
          )}

          {raffle.status === 'active' && (
            <ConfirmButton
              action={setRaffleStatus.bind(null, raffle.id, 'closed')}
              confirmText="¿Cerrar la rifa? Nadie más va a poder apartar números."
            >
              <RotateCcw className="size-4" />
              Cerrar
            </ConfirmButton>
          )}

          <Link
            href={`/panel/${raffle.id}/editar`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-sm transition hover:border-brand-300"
          >
            <Pencil className="size-4" />
            Editar
          </Link>

          <ConfirmButton
            action={deleteRaffle.bind(null, raffle.id)}
            confirmText="Esto borra la rifa y todas sus boletas. ¿Seguro?"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-sm text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="size-4" />
          </ConfirmButton>
        </div>
      </header>

      {/* Link publico */}
      <section className="mt-6 rounded-card border border-line bg-paper-raised p-5">
        <h2 className="font-semibold">Link del talonario</h2>
        {raffle.status === 'draft' ? (
          <p className="mt-1.5 text-sm text-ink-soft">
            La rifa está en borrador: el link todavía no funciona para nadie más. Dale a{' '}
            <strong>Publicar</strong> cuando esté lista.
          </p>
        ) : (
          <p className="mt-1.5 text-sm text-ink-soft">
            Compártelo por WhatsApp. Quien lo abra puede escoger su número sin crear cuenta.
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <code className="flex-1 truncate rounded-lg border border-line bg-paper px-3 py-2 text-sm">
            {publicUrl}
          </code>
          <CopyButton value={publicUrl} />
          <Link
            href={`/r/${raffle.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-sm transition hover:border-brand-300"
          >
            <ExternalLink className="size-4" />
            Ver
          </Link>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-sold-line bg-sold-bg px-2.5 py-1.5 text-sm text-sold-ink transition hover:brightness-97"
          >
            <MessageCircle className="size-4" />
            Compartir
          </a>
        </div>
      </section>

      {/* Numeros */}
      <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Libres" value={free} />
        <Stat label="Apartados" value={reserved.length} tone="held" />
        <Stat label="Pagados" value={paid.length} tone="sold" />
        <Stat
          label="Recaudado"
          value={formatMoney(paid.length * raffle.price, raffle.currency)}
          sub={
            reserved.length > 0 && raffle.price > 0
              ? `Faltan ${formatMoney(reserved.length * raffle.price, raffle.currency)}`
              : undefined
          }
        />
      </section>

      {/* Mapa */}
      <section className="mt-4 rounded-card border border-line bg-paper-raised p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Mapa del talonario</h2>
          <GridLegend />
        </div>
        <TalonarioMap
          total={raffle.total_numbers}
          taken={tickets.map((t) => [t.number, t.status] as [number, Ticket['status']])}
        />
      </section>

      {/* Boletas */}
      <section className="mt-4 rounded-card border border-line bg-paper-raised p-5">
        <h2 className="font-semibold">
          Boletas <span className="font-normal text-ink-soft">({tickets.length})</span>
        </h2>

        {tickets.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">
            Todavía nadie ha apartado un número. Comparte el link para empezar.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {tickets.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                <span
                  className={`grid min-w-14 shrink-0 place-items-center rounded-lg border px-2 py-1.5 font-mono tabular-nums ${
                    t.status === 'paid'
                      ? 'border-sold-line bg-sold-bg text-sold-ink'
                      : 'border-held-line bg-held-bg text-held-ink'
                  }`}
                >
                  {formatNumber(t.number, raffle.total_numbers)}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{t.buyer_name}</p>
                  <a
                    href={waLink(
                      t.buyer_whatsapp,
                      `Hola ${t.buyer_name.split(' ')[0]}, te escribo por el número ${formatNumber(t.number, raffle.total_numbers)} de "${raffle.title}".`
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-ink-soft transition hover:text-sold-ink"
                  >
                    <MessageCircle className="size-3.5" />
                    {t.buyer_whatsapp}
                  </a>
                </div>

                <div className="flex items-center gap-1.5">
                  {t.status === 'reserved' ? (
                    <ConfirmButton
                      action={markPaid.bind(null, t.id, raffle.id, raffle.slug)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-sold-line bg-sold-bg px-2.5 py-1.5 text-sm font-medium text-sold-ink transition hover:brightness-97 disabled:opacity-50"
                    >
                      <CircleCheck className="size-4" />
                      Pagó
                    </ConfirmButton>
                  ) : (
                    <ConfirmButton
                      action={markReserved.bind(null, t.id, raffle.id, raffle.slug)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-sm text-ink-soft transition hover:border-held-line disabled:opacity-50"
                    >
                      <Undo2 className="size-4" />
                      Deshacer
                    </ConfirmButton>
                  )}

                  <ConfirmButton
                    action={releaseTicket.bind(null, t.id, raffle.id, raffle.slug)}
                    confirmText={`Liberar el número ${formatNumber(t.number, raffle.total_numbers)}. Quedará disponible otra vez. ¿Seguro?`}
                    className="grid size-8 place-items-center rounded-lg border border-line text-ink-soft transition hover:border-red-300 hover:text-red-600 disabled:opacity-50"
                  >
                    <Trash2 className="size-4" />
                  </ConfirmButton>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 border-t border-line pt-5">
          <h3 className="text-sm font-semibold">Anotar una boleta a mano</h3>
          <p className="mt-0.5 mb-3 text-sm text-ink-soft">
            Para quien te pagó en efectivo y no pasó por el link.
          </p>
          <ManualTicketForm
            action={addTicketManually.bind(null, raffle.id, raffle.slug, raffle.total_numbers)}
            totalNumbers={raffle.total_numbers}
          />
        </div>
      </section>
    </>
  )
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string
  value: string | number
  sub?: string
  tone?: 'held' | 'sold'
}) {
  const color =
    tone === 'held' ? 'text-held-ink' : tone === 'sold' ? 'text-sold-ink' : 'text-ink'
  return (
    <div className="rounded-card border border-line bg-paper-raised p-4">
      <p className="text-xs font-medium tracking-wide text-ink-soft uppercase">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${color}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-ink-soft">{sub}</p>}
    </div>
  )
}
