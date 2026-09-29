import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { RaffleForm } from '@/components/raffle-form'
import { createRaffle } from '@/actions/raffles'

export default function NuevaRifaPage() {
  return (
    <>
      <Link
        href="/panel"
        className="inline-flex items-center gap-2 text-sm text-ink-soft transition hover:text-ink"
      >
        <ArrowLeft className="size-4" />
        Mis rifas
      </Link>

      <h1 className="mt-4 mb-6 text-2xl font-semibold tracking-tight">Nueva rifa</h1>

      <RaffleForm action={createRaffle} submitLabel="Crear rifa" cancelHref="/panel" />
    </>
  )
}
