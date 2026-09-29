'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CircleAlert,
  Dices,
  Loader2,
  MessageCircle,
  PartyPopper,
  Ticket,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { GridLegend, NumberGrid } from '@/components/number-grid'
import { Field, inputClass } from '@/components/field'
import type { Raffle, TicketStatus } from '@/lib/types'
import { formatMoney, formatNumber, waLink } from '@/lib/utils'

type Entry = [number, TicketStatus]

const ERRORS: Record<string, string> = {
  not_found: 'No encontramos esta rifa.',
  closed: 'La rifa ya está cerrada, no se pueden apartar más números.',
  invalid_name: 'Escribe tu nombre completo.',
  invalid_whatsapp: 'Revisa tu número de WhatsApp.',
  no_numbers: 'Escoge al menos un número.',
  out_of_range: 'Alguno de los números no existe en este talonario.',
}

export function Talonario({ raffle, taken: initialTaken }: { raffle: Raffle; taken: Entry[] }) {
  const supabase = useMemo(() => createClient(), [])
  const [taken, setTaken] = useState<Map<number, TicketStatus>>(new Map(initialTaken))
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [sheetOpen, setSheetOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<number[] | null>(null)
  // Controlados: React 19 limpia los campos sin control al terminar una form action.
  const [nombre, setNombre] = useState('')
  const [whatsapp, setWhatsapp] = useState('+57')

  const abierta = raffle.status === 'active'

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from('public_tickets')
      .select('number, status')
      .eq('raffle_id', raffle.id)
    if (data) {
      setTaken(new Map(data.map((t) => [t.number as number, t.status as TicketStatus])))
    }
  }, [supabase, raffle.id])

  // Mantén el talonario al día mientras la pestaña está visible.
  useEffect(() => {
    if (!abierta || done) return
    const tick = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    const id = window.setInterval(tick, 20000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [abierta, done, refresh])

  const toggle = (n: number) => {
    setError(null)
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(n)) next.delete(n)
      else if (next.size >= raffle.max_per_person) {
        setError(`Puedes apartar máximo ${raffle.max_per_person} números a la vez.`)
        return prev
      } else next.add(n)
      return next
    })
  }

  const sorpresa = () => {
    const libres: number[] = []
    for (let n = 0; n < raffle.total_numbers; n++) {
      if (!taken.has(n) && !selected.has(n)) libres.push(n)
    }
    if (!libres.length) return
    toggle(libres[Math.floor(Math.random() * libres.length)])
  }

  const ordenados = [...selected].sort((a, b) => a - b)
  const total = ordenados.length * raffle.price

  async function submit(formData: FormData) {
    setSubmitting(true)
    setError(null)

    const { data, error: rpcError } = await supabase.rpc('reserve_numbers', {
      p_slug: raffle.slug,
      p_numbers: ordenados,
      p_name: String(formData.get('name') ?? ''),
      p_whatsapp: String(formData.get('whatsapp') ?? ''),
    })

    setSubmitting(false)

    if (rpcError) {
      setError('No pudimos guardar tu reserva. Revisa tu conexión e inténtalo otra vez.')
      return
    }

    const res = data as
      | { ok: true; numbers: number[] }
      | { ok: false; error: string; max?: number; numbers?: number[] }

    if (res.ok) {
      setDone(ordenados)
      setSelected(new Set())
      setNombre('')
      setWhatsapp('+57')
      setSheetOpen(false)
      void refresh()
      return
    }

    if (res.error === 'taken') {
      const ocupados = res.numbers ?? []
      await refresh()
      setSelected((prev) => new Set([...prev].filter((n) => !ocupados.includes(n))))
      setError(
        `Alguien se adelantó con ${ocupados.length === 1 ? 'el número' : 'los números'} ${ocupados
          .map((n) => formatNumber(n, raffle.total_numbers))
          .join(', ')}. Escoge ${ocupados.length === 1 ? 'otro' : 'otros'}.`
      )
      setSheetOpen(false)
      return
    }

    if (res.error === 'too_many') {
      setError(`Puedes apartar máximo ${res.max} números a la vez.`)
      return
    }

    setError(ERRORS[res.error] ?? 'Algo salió mal. Inténtalo de nuevo.')
  }

  // ---------- confirmación ----------
  if (done) {
    const lista = done.map((n) => formatNumber(n, raffle.total_numbers))
    const mensaje = `Hola${raffle.contact_name ? ` ${raffle.contact_name}` : ''}, aparté ${
      lista.length === 1 ? 'el número' : 'los números'
    } ${lista.join(', ')} de "${raffle.title}". Te paso el comprobante del pago.`

    return (
      <section className="mt-6 rounded-card border border-sold-line bg-sold-bg p-6 text-sold-ink sm:p-8">
        <PartyPopper className="size-7" />
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">
          ¡Listo! {lista.length === 1 ? 'Tu número quedó apartado' : 'Tus números quedaron apartados'}
        </h2>

        <div className="mt-4 flex flex-wrap gap-2">
          {lista.map((n) => (
            <span
              key={n}
              className="rounded-lg border border-sold-line bg-white px-3 py-2 font-mono text-xl font-semibold tabular-nums"
            >
              {n}
            </span>
          ))}
        </div>

        <p className="mt-5">
          {raffle.price > 0
            ? 'Ahora confirma el pago con quien organiza la rifa para que tu número pase a pagado.'
            : 'Ya quedaste registrado. Pendiente del sorteo.'}
        </p>

        {raffle.payment_info && (
          <div className="mt-4 rounded-xl border border-sold-line bg-white/70 p-4">
            <p className="text-xs font-semibold tracking-wide uppercase">Datos para pagar</p>
            <p className="mt-1.5 leading-relaxed whitespace-pre-line">{raffle.payment_info}</p>
          </div>
        )}

        {raffle.contact_whatsapp && (
          <a
            href={waLink(raffle.contact_whatsapp, mensaje)}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-sold-ink px-5 py-3 font-medium text-white transition hover:opacity-90"
          >
            <MessageCircle className="size-4" />
            Escribirle a {raffle.contact_name || 'quien organiza'}
          </a>
        )}

        <button
          type="button"
          onClick={() => setDone(null)}
          className="mt-4 block text-sm underline underline-offset-4 opacity-80 hover:opacity-100"
        >
          Apartar otro número
        </button>
      </section>
    )
  }

  // ---------- talonario ----------
  return (
    <>
      <section className="mt-6 rounded-card border border-line bg-paper-raised p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">
            {abierta ? 'Toca el número que quieres' : 'Números del talonario'}
          </h2>
          <GridLegend />
        </div>

        {abierta && (
          <button
            type="button"
            onClick={sorpresa}
            className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm text-ink-soft transition hover:border-brand-300 hover:text-brand-700"
          >
            <Dices className="size-4" />
            Sorpréndeme
          </button>
        )}

        <NumberGrid
          total={raffle.total_numbers}
          taken={taken}
          selected={selected}
          onToggle={toggle}
          readOnly={!abierta}
        />
      </section>

      {error && !sheetOpen && (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-held-line bg-held-bg px-4 py-3 text-sm text-held-ink">
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}

      {/* Barra fija */}
      {abierta && ordenados.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper-raised/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-3xl items-center gap-4 px-4 py-3 sm:px-6">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-ink-soft">
                {ordenados.length} {ordenados.length === 1 ? 'número' : 'números'}:{' '}
                <span className="font-mono text-ink">
                  {ordenados.map((n) => formatNumber(n, raffle.total_numbers)).join(', ')}
                </span>
              </p>
              {raffle.price > 0 && (
                <p className="font-semibold tabular-nums">
                  {formatMoney(total, raffle.currency)}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setError(null)
                setSheetOpen(true)
              }}
              className="shrink-0 rounded-xl bg-brand-600 px-5 py-3 font-medium text-white transition hover:bg-brand-700"
            >
              Apartar
            </button>
          </div>
        </div>
      )}

      {/* Formulario */}
      {sheetOpen && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sheet-title"
          onClick={(e) => {
            if (e.target === e.currentTarget && !submitting) setSheetOpen(false)
          }}
        >
          <div className="w-full max-w-md rounded-t-2xl bg-paper-raised p-6 sm:rounded-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="sheet-title" className="text-xl font-semibold tracking-tight">
                  Tus datos
                </h2>
                <p className="mt-1 text-sm text-ink-soft">
                  Sin cuenta ni contraseña. Solo para saber de quién es el número.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                disabled={submitting}
                aria-label="Cerrar"
                className="grid size-8 shrink-0 place-items-center rounded-full border border-line text-ink-soft transition hover:text-ink"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-1.5 rounded-xl border border-brand-100 bg-brand-50 px-3 py-2.5">
              <Ticket className="size-4 text-brand-700" />
              {ordenados.map((n) => (
                <span
                  key={n}
                  className="rounded-md bg-white px-2 py-0.5 font-mono text-sm font-semibold tabular-nums text-brand-700"
                >
                  {formatNumber(n, raffle.total_numbers)}
                </span>
              ))}
              {raffle.price > 0 && (
                <span className="ml-auto text-sm font-semibold text-brand-700">
                  {formatMoney(total, raffle.currency)}
                </span>
              )}
            </div>

            <form action={submit} className="mt-5 grid gap-4">
              <Field label="Tu nombre" htmlFor="name">
                <input
                  id="name"
                  name="name"
                  required
                  minLength={3}
                  autoComplete="name"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="María Gómez"
                  className={inputClass()}
                />
              </Field>

              <Field
                label="Tu WhatsApp"
                htmlFor="whatsapp"
                hint="Con indicativo del país. Así te contactan por el pago y si ganas."
              >
                <input
                  id="whatsapp"
                  name="whatsapp"
                  required
                  inputMode="tel"
                  autoComplete="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+573001234567"
                  className={inputClass()}
                />
              </Field>

              {error && (
                <p className="flex items-start gap-2 text-sm text-red-600">
                  <CircleAlert className="mt-0.5 size-4 shrink-0" />
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3.5 font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
              >
                {submitting && <Loader2 className="size-4 animate-spin" />}
                {submitting
                  ? 'Apartando…'
                  : `Apartar ${ordenados.length === 1 ? 'mi número' : `mis ${ordenados.length} números`}`}
              </button>

              <p className="text-center text-xs text-ink-soft">
                Tu nombre y tu WhatsApp los ve solo quien organiza la rifa.
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
