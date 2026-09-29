import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { RaffleForm } from '@/components/raffle-form'
import { updateRaffle } from '@/actions/raffles'
import { createClient } from '@/lib/supabase/server'
import type { Raffle } from '@/lib/types'

export default async function EditarRifaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: raffle } = await supabase
    .from('raffles')
    .select('*')
    .eq('id', id)
    .maybeSingle<Raffle>()

  if (!raffle) notFound()

  const action = updateRaffle.bind(null, raffle.id)

  return (
    <>
      <Link
        href={`/panel/${raffle.id}`}
        className="inline-flex items-center gap-2 text-sm text-ink-soft transition hover:text-ink"
      >
        <ArrowLeft className="size-4" />
        {raffle.title}
      </Link>

      <h1 className="mt-4 mb-6 text-2xl font-semibold tracking-tight">Editar rifa</h1>

      <RaffleForm
        action={action}
        raffle={raffle}
        submitLabel="Guardar cambios"
        cancelHref={`/panel/${raffle.id}`}
      />
    </>
  )
}
