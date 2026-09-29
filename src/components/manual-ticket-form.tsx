'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Loader2, Plus } from 'lucide-react'
import { Field, inputClass } from '@/components/field'
import type { FormState } from '@/actions/raffles'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-[46px] items-center justify-center gap-1.5 rounded-xl bg-ink px-4 font-medium text-white transition hover:opacity-90 disabled:opacity-60"
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
      Anotar
    </button>
  )
}

export function ManualTicketForm({
  action,
  totalNumbers,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>
  totalNumbers: number
}) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {})
  // Controlados: si la validacion falla no queremos borrar lo que ya escribio.
  const [values, setValues] = useState({ number: '', buyer_name: '', buyer_whatsapp: '' })
  const err = state.fieldErrors ?? {}

  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }))

  useEffect(() => {
    if (state.ok) setValues({ number: '', buyer_name: '', buyer_whatsapp: '' })
  }, [state])

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-[6rem_1fr_1fr_auto]">
      <Field label="Número" htmlFor="number" error={err.number}>
        <input
          id="number"
          name="number"
          type="number"
          min={0}
          max={totalNumbers - 1}
          required
          value={values.number}
          onChange={set('number')}
          className={inputClass(!!err.number)}
        />
      </Field>

      <Field label="Nombre" htmlFor="buyer_name" error={err.buyer_name}>
        <input
          id="buyer_name"
          name="buyer_name"
          required
          value={values.buyer_name}
          onChange={set('buyer_name')}
          placeholder="María Gómez"
          className={inputClass(!!err.buyer_name)}
        />
      </Field>

      <Field label="WhatsApp" htmlFor="buyer_whatsapp" error={err.buyer_whatsapp}>
        <input
          id="buyer_whatsapp"
          name="buyer_whatsapp"
          inputMode="tel"
          required
          value={values.buyer_whatsapp}
          onChange={set('buyer_whatsapp')}
          placeholder="+573001234567"
          className={inputClass(!!err.buyer_whatsapp)}
        />
      </Field>

      <div className="flex items-end gap-2">
        <input type="hidden" name="status" value="paid" />
        <SubmitButton />
      </div>

      {state.error && <p className="text-sm text-red-600 sm:col-span-4">{state.error}</p>}
    </form>
  )
}
