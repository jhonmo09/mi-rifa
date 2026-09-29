import Link from 'next/link'
import { SearchX } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 text-center">
      <SearchX className="mx-auto size-8 text-ink-soft" />
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">No encontramos esta página</h1>
      <p className="mt-2 text-ink-soft">
        Puede que el link esté mal copiado o que la rifa todavía no se haya publicado.
      </p>
      <Link
        href="/"
        className="mx-auto mt-6 rounded-full bg-brand-600 px-5 py-2.5 font-medium text-white transition hover:bg-brand-700"
      >
        Ir al inicio
      </Link>
    </main>
  )
}
