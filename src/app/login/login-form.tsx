'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Loader2, MailCheck } from 'lucide-react'
import { sendMagicLink, type LoginState } from './actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
    >
      {pending && <Loader2 className="size-4 animate-spin" />}
      {pending ? 'Enviando…' : 'Enviarme el enlace'}
    </button>
  )
}

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState<LoginState, FormData>(sendMagicLink, {
    status: 'idle',
  })
  // Controlado: React 19 limpia los campos sin control al terminar una server action.
  const [email, setEmail] = useState('')

  if (state.status === 'sent') {
    return (
      <div className="mt-6 rounded-xl border border-sold-line bg-sold-bg p-4 text-sold-ink">
        <MailCheck className="size-5" />
        <p className="mt-2 font-medium">Revisa tu correo</p>
        <p className="mt-1 text-sm">
          Enviamos un enlace a <strong>{state.email}</strong>. Ábrelo en este mismo dispositivo.
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} className="mt-6">
      {next && <input type="hidden" name="next" value={next} />}
      <label htmlFor="email" className="text-sm font-medium">
        Tu correo
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tucorreo@ejemplo.com"
        className="mt-1.5 w-full rounded-xl border border-line bg-paper px-4 py-3 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />

      {state.status === 'error' && (
        <p className="mt-2 text-sm text-red-600">{state.message}</p>
      )}

      <SubmitButton />
    </form>
  )
}
