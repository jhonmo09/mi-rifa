import Link from 'next/link'
import { Suspense } from 'react'
import { ArrowLeft } from 'lucide-react'
import { LoginForm } from './login-form'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm text-ink-soft transition hover:text-ink"
      >
        <ArrowLeft className="size-4" />
        Volver
      </Link>

      <div className="rounded-card border border-line bg-paper-raised p-6 shadow-[0_1px_0_rgba(23,20,31,0.04)]">
        <h1 className="text-2xl font-semibold tracking-tight">Entrar a tu panel</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Te enviamos un enlace al correo. No necesitas contraseña.
        </p>

        <Suspense>
          <LoginForm next={next} />
        </Suspense>
      </div>

      <p className="mt-6 text-center text-xs text-ink-soft">
        Quien compra números no necesita cuenta. Esto es solo para quien organiza la rifa.
      </p>
    </main>
  )
}
