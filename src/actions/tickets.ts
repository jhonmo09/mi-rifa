'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { FormState } from '@/actions/raffles'

function refresh(raffleId: string, slug?: string) {
  revalidatePath(`/panel/${raffleId}`)
  revalidatePath('/panel')
  if (slug) revalidatePath(`/r/${slug}`)
}

export async function markPaid(ticketId: string, raffleId: string, slug: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('tickets')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', ticketId)
  if (error) throw new Error(error.message)
  refresh(raffleId, slug)
}

export async function markReserved(ticketId: string, raffleId: string, slug: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('tickets')
    .update({ status: 'reserved', paid_at: null })
    .eq('id', ticketId)
  if (error) throw new Error(error.message)
  refresh(raffleId, slug)
}

export async function releaseTicket(ticketId: string, raffleId: string, slug: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('tickets').delete().eq('id', ticketId)
  if (error) throw new Error(error.message)
  refresh(raffleId, slug)
}

/** Un campo ausente llega como null desde FormData. */
const str = (v: FormDataEntryValue | null) => (typeof v === 'string' ? v : '')

const manualSchema = z.object({
  number: z.coerce.number({ error: 'Escribe el número.' }).int().min(0),
  buyer_name: z.string().trim().min(3, 'Escribe el nombre completo.').max(80),
  buyer_whatsapp: z
    .string()
    .trim()
    .min(7, 'El WhatsApp se ve muy corto.')
    .max(25)
    .transform((v) => v.replace(/[^0-9+]/g, '')),
  status: z.enum(['reserved', 'paid']),
})

/** Para cuando alguien paga en efectivo y el organizador lo anota a mano. */
export async function addTicketManually(
  raffleId: string,
  slug: string,
  totalNumbers: number,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = manualSchema.safeParse({
    number: str(formData.get('number')) || Number.NaN,
    buyer_name: str(formData.get('buyer_name')),
    buyer_whatsapp: str(formData.get('buyer_whatsapp')),
    status: str(formData.get('status')) || 'paid',
  })

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? 'form')
      if (!fieldErrors[key]) fieldErrors[key] = issue.message
    }
    return { fieldErrors }
  }

  if (parsed.data.number >= totalNumbers) {
    return { fieldErrors: { number: `Este talonario llega hasta el ${totalNumbers - 1}.` } }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('tickets').insert({
    raffle_id: raffleId,
    ...parsed.data,
    paid_at: parsed.data.status === 'paid' ? new Date().toISOString() : null,
  })

  if (error) {
    if (error.code === '23505') return { fieldErrors: { number: 'Ese número ya está ocupado.' } }
    return { error: error.message }
  }

  refresh(raffleId, slug)
  return { ok: true }
}
