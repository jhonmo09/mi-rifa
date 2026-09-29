import Link from 'next/link'
import { ArrowRight, Check, Share2, Smartphone, WalletMinimal } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

const pasos = [
  {
    icon: WalletMinimal,
    title: 'Configura tu rifa',
    text: 'Premio, fecha del sorteo, precio de la boleta y cuántos números va a tener el talonario.',
  },
  {
    icon: Share2,
    title: 'Comparte el link',
    text: 'Cada rifa tiene su propia dirección para pegar en el estado de WhatsApp o en un grupo.',
  },
  {
    icon: Smartphone,
    title: 'Cada quien escoge',
    text: 'La gente entra, toca el número libre que quiere y lo aparta con su nombre y su WhatsApp.',
  },
  {
    icon: Check,
    title: 'Tú confirmas el pago',
    text: 'Desde tu panel marcas quién ya pagó. El número pasa de amarillo a verde.',
  },
]

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-5 py-8 sm:px-8">
      <header className="flex items-center justify-between">
        <span className="text-lg font-semibold tracking-tight">
          Mi<span className="text-brand-600">Rifa</span>
        </span>
        <Link
          href={user ? '/panel' : '/login'}
          className="rounded-full border border-line bg-paper-raised px-4 py-2 text-sm font-medium transition hover:border-brand-300 hover:text-brand-700"
        >
          {user ? 'Ir a mi panel' : 'Entrar'}
        </Link>
      </header>

      <section className="flex flex-1 flex-col justify-center py-16">
        <p className="text-sm font-medium tracking-wide text-brand-600 uppercase">
          Talonario digital
        </p>
        <h1 className="mt-3 max-w-2xl text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-6xl">
          Se acabó el cuaderno de los números vendidos.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-ink-soft">
          Publica tu rifa, comparte un link y cada persona aparta su número desde el celular. Sin
          cuentas, sin descargar nada: solo el nombre y el WhatsApp.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href={user ? '/panel/nueva' : '/login'}
            className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 font-medium text-white transition hover:bg-brand-700"
          >
            Crear mi rifa
            <ArrowRight className="size-4" />
          </Link>
          <span className="text-sm text-ink-soft">Gratis y en un par de minutos.</span>
        </div>
      </section>

      <section className="grid gap-4 pb-16 sm:grid-cols-2">
        {pasos.map(({ icon: Icon, title, text }, i) => (
          <article
            key={title}
            className="rounded-card border border-line bg-paper-raised p-5 shadow-[0_1px_0_rgba(23,20,31,0.04)]"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-full bg-brand-50 text-brand-700">
                <Icon className="size-4.5" />
              </span>
              <span className="text-xs font-semibold tracking-widest text-ink-soft">
                PASO {i + 1}
              </span>
            </div>
            <h2 className="mt-3 font-semibold">{title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">{text}</p>
          </article>
        ))}
      </section>
    </main>
  )
}
