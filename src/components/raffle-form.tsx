'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { Field, inputClass } from '@/components/field'
import type { FormState } from '@/actions/raffles'
import type { Raffle } from '@/lib/types'

const PRESETS = [50, 100, 500, 1000]

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
    >
      {pending && <Loader2 className="size-4 animate-spin" />}
      {pending ? 'Guardando…' : label}
    </button>
  )
}

export function RaffleForm({
  action,
  raffle,
  submitLabel,
  cancelHref,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>
  raffle?: Raffle
  submitLabel: string
  cancelHref: string
}) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {})
  const [total, setTotal] = useState(String(raffle?.total_numbers ?? 100))
  const err = state.fieldErrors ?? {}

  return (
    <form action={formAction} className="grid gap-8">
      <section className="grid gap-5 rounded-card border border-line bg-paper-raised p-5 sm:p-6">
        <h2 className="font-semibold">Lo básico</h2>

        <Field label="Nombre de la rifa" htmlFor="title" error={err.title}>
          <input
            id="title"
            name="title"
            required
            defaultValue={raffle?.title}
            placeholder="Rifa pro viaje de grado"
            className={inputClass(!!err.title)}
          />
        </Field>

        <Field label="Premio" htmlFor="prize" hint="Lo que se lleva el ganador." error={err.prize}>
          <input
            id="prize"
            name="prize"
            defaultValue={raffle?.prize ?? ''}
            placeholder="Una moto AKT 125 modelo 2024"
            className={inputClass(!!err.prize)}
          />
        </Field>

        <Field
          label="Descripción"
          htmlFor="description"
          hint="Opcional. Aparece debajo del premio en la página pública."
          error={err.description}
        >
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={raffle?.description ?? ''}
            placeholder="El sorteo se juega con las tres últimas cifras de la Lotería de Medellín."
            className={inputClass(!!err.description)}
          />
        </Field>

        <Field
          label="Fecha del sorteo"
          htmlFor="draw_date"
          error={err.draw_date}
          className="sm:max-w-56"
        >
          <input
            id="draw_date"
            name="draw_date"
            type="date"
            defaultValue={raffle?.draw_date ?? ''}
            className={inputClass(!!err.draw_date)}
          />
        </Field>

        <Field
          label="Dinámica del sorteo"
          htmlFor="draw_rules"
          hint="Cómo se elige al ganador. Es lo que más preguntan, así que entre más claro, mejor."
          error={err.draw_rules}
        >
          <textarea
            id="draw_rules"
            name="draw_rules"
            rows={4}
            defaultValue={raffle?.draw_rules ?? ''}
            placeholder={
              'Gana quien tenga las tres últimas cifras del premio mayor de la Lotería de Medellín del viernes 30.\nSi ese número no se vendió, se corre al siguiente número vendido hacia arriba.\nEl resultado se publica el mismo viernes en el grupo de WhatsApp.'
            }
            className={inputClass(!!err.draw_rules)}
          />
        </Field>
      </section>

      <section className="grid gap-5 rounded-card border border-line bg-paper-raised p-5 sm:p-6">
        <h2 className="font-semibold">El talonario</h2>

        <Field
          label="¿Cuántos números?"
          htmlFor="total_numbers"
          hint={`Se numeran desde el 0 hasta el ${Math.max(Number(total) - 1, 0)}.`}
          error={err.total_numbers}
        >
          <div className="flex flex-wrap items-center gap-2">
            <input
              id="total_numbers"
              name="total_numbers"
              type="number"
              min={10}
              max={10000}
              required
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              className={`${inputClass(!!err.total_numbers)} sm:max-w-36`}
            />
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setTotal(String(p))}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  total === String(p)
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-line text-ink-soft hover:border-brand-300'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid gap-5 sm:grid-cols-[1fr_7rem_1fr] sm:items-end">
          <Field label="Precio por número" htmlFor="price" error={err.price}>
            <input
              id="price"
              name="price"
              type="number"
              min={0}
              step="any"
              defaultValue={raffle?.price ?? 0}
              className={inputClass(!!err.price)}
            />
          </Field>

          <Field label="Moneda" htmlFor="currency" error={err.currency}>
            <select
              id="currency"
              name="currency"
              defaultValue={raffle?.currency ?? 'COP'}
              className={inputClass(!!err.currency)}
            >
              <option value="COP">COP</option>
              <option value="MXN">MXN</option>
              <option value="ARS">ARS</option>
              <option value="PEN">PEN</option>
              <option value="CLP">CLP</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </Field>

          <Field
            label="Máx. por persona"
            htmlFor="max_per_person"
            hint="De una sola vez."
            error={err.max_per_person}
          >
            <input
              id="max_per_person"
              name="max_per_person"
              type="number"
              min={1}
              max={100}
              defaultValue={raffle?.max_per_person ?? 5}
              className={inputClass(!!err.max_per_person)}
            />
          </Field>
        </div>
      </section>

      <section className="grid gap-5 rounded-card border border-line bg-paper-raised p-5 sm:p-6">
        <div>
          <h2 className="font-semibold">Cómo te contactan</h2>
          <p className="mt-0.5 text-sm text-ink-soft">
            Esto sí lo ve todo el mundo en la página pública de la rifa.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Tu nombre" htmlFor="contact_name" error={err.contact_name}>
            <input
              id="contact_name"
              name="contact_name"
              defaultValue={raffle?.contact_name ?? ''}
              placeholder="Jhon"
              className={inputClass(!!err.contact_name)}
            />
          </Field>

          <Field
            label="Tu WhatsApp"
            htmlFor="contact_whatsapp"
            hint="Con indicativo del país. Ej: +57 300 123 4567"
            error={err.contact_whatsapp}
          >
            <input
              id="contact_whatsapp"
              name="contact_whatsapp"
              inputMode="tel"
              defaultValue={raffle?.contact_whatsapp ?? ''}
              placeholder="+573001234567"
              className={inputClass(!!err.contact_whatsapp)}
            />
          </Field>
        </div>

        <Field
          label="Datos para pagar"
          htmlFor="payment_info"
          hint="Nequi, Daviplata, transferencia… Se muestran justo después de apartar el número."
          error={err.payment_info}
        >
          <textarea
            id="payment_info"
            name="payment_info"
            rows={3}
            defaultValue={raffle?.payment_info ?? ''}
            placeholder={'Nequi 300 123 4567 a nombre de Jhon M.\nBancolombia ahorros 123-456789-00'}
            className={inputClass(!!err.payment_info)}
          />
        </Field>
      </section>

      {state.error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <SubmitButton label={submitLabel} />
        <Link href={cancelHref} className="text-sm text-ink-soft transition hover:text-ink">
          Cancelar
        </Link>
      </div>
    </form>
  )
}
