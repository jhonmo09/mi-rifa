'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { randomSuffix, slugify } from '@/lib/utils'
import type { RaffleStatus } from '@/lib/types'

export type FormState = {
  error?: string
  fieldErrors?: Record<string, string>
  ok?: boolean
}

/** Un campo ausente llega como null desde FormData. */
const str = (v: FormDataEntryValue | null) => (typeof v === 'string' ? v : '')

const emptyToNull = (v: unknown) => {
  const s = typeof v === 'string' ? v.trim() : v
  return s === '' ? null : s
}

const raffleSchema = z.object({
  title: z.string().trim().min(3, 'Ponle un nombre de al menos 3 letras.').max(120),
  description: z.preprocess(emptyToNull, z.string().max(600).nullable()),
  draw_rules: z.preprocess(emptyToNull, z.string().max(800).nullable()),
  prize: z.preprocess(emptyToNull, z.string().max(200).nullable()),
  price: z.coerce.number().min(0, 'El precio no puede ser negativo.').max(99999999),
  currency: z.string().trim().length(3).default('COP'),
  total_numbers: z.coerce
    .number()
    .int()
    .min(10, 'Mínimo 10 números.')
    .max(10000, 'Máximo 10.000 números.'),
  draw_date: z.preprocess(emptyToNull, z.string().nullable()),
  contact_name: z.preprocess(emptyToNull, z.string().max(80).nullable()),
  contact_whatsapp: z.preprocess(emptyToNull, z.string().max(25).nullable()),
  payment_info: z.preprocess(emptyToNull, z.string().max(400).nullable()),
  max_per_person: z.coerce.number().int().min(1).max(100),
})

function parse(formData: FormData) {
  return raffleSchema.safeParse({
    title: str(formData.get('title')),
    description: formData.get('description'),
    draw_rules: formData.get('draw_rules'),
    prize: formData.get('prize'),
    price: formData.get('price') || 0,
    currency: formData.get('currency') || 'COP',
    total_numbers: str(formData.get('total_numbers')) || Number.NaN,
    draw_date: formData.get('draw_date'),
    contact_name: formData.get('contact_name'),
    contact_whatsapp: formData.get('contact_whatsapp'),
    payment_info: formData.get('payment_info'),
    max_per_person: formData.get('max_per_person') || 5,
  })
}

function fieldErrorsOf(error: z.ZodError) {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    if (!out[key]) out[key] = issue.message
  }
  return out
}

export async function createRaffle(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parse(formData)
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const base = slugify(parsed.data.title) || 'rifa'
  let createdId: string | null = null

  // El slug es unico: reintenta con otro sufijo si choca.
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = `${base}-${randomSuffix()}`
    const { data, error } = await supabase
      .from('raffles')
      .insert({ ...parsed.data, slug, owner_id: user.id })
      .select('id')
      .single()

    if (!error && data) {
      createdId = data.id
      break
    }
    if (error && error.code !== '23505') {
      return { error: error.message }
    }
  }

  if (!createdId) return { error: 'No pudimos crear la rifa. Inténtalo de nuevo.' }

  revalidatePath('/panel')
  redirect(`/panel/${createdId}`)
}

export async function updateRaffle(
  id: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = parse(formData)
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) }

  const supabase = await createClient()

  // No permitas encoger el talonario por debajo del numero mas alto ya vendido.
  const { data: highest } = await supabase
    .from('tickets')
    .select('number')
    .eq('raffle_id', id)
    .order('number', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (highest && parsed.data.total_numbers <= highest.number) {
    return {
      fieldErrors: {
        total_numbers: `Ya hay boletas hasta el número ${highest.number}. El talonario no puede ser más pequeño que eso.`,
      },
    }
  }

  const { error } = await supabase.from('raffles').update(parsed.data).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/panel')
  revalidatePath(`/panel/${id}`)
  redirect(`/panel/${id}`)
}

export async function setRaffleStatus(id: string, status: RaffleStatus) {
  const supabase = await createClient()
  const { error } = await supabase.from('raffles').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/panel')
  revalidatePath(`/panel/${id}`)
}

export async function deleteRaffle(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('raffles').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/panel')
  redirect('/panel')
}
