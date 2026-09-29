'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { siteUrl } from '@/lib/utils'
import { safeNext } from '@/lib/safe-next'

const schema = z.object({
  email: z.string().trim().toLowerCase().email('Escribe un correo válido.'),
  next: z.string().optional(),
})

export type LoginState = { status: 'idle' | 'sent' | 'error'; message?: string; email?: string }

/** Un campo ausente llega como null desde FormData; zod espera undefined. */
function field(formData: FormData, name: string) {
  const value = formData.get(name)
  return typeof value === 'string' ? value : undefined
}

export async function sendMagicLink(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = schema.safeParse({
    email: field(formData, 'email') ?? '',
    next: field(formData, 'next'),
  })

  if (!parsed.success) {
    // Solo mostramos lo que el usuario puede corregir: el correo.
    const emailIssue = parsed.error.issues.find((i) => i.path[0] === 'email')
    return { status: 'error', message: emailIssue?.message ?? 'Escribe un correo válido.' }
  }

  const { email, next } = parsed.data
  const supabase = await createClient()

  // Solo rutas internas: evita que un ?next= externo convierta el login en un redirector abierto.
  const target = safeNext(next)
  const redirectTo = `${siteUrl()}/auth/callback?next=${encodeURIComponent(target)}`

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  })

  if (error) {
    return { status: 'error', message: error.message }
  }

  return { status: 'sent', email }
}
