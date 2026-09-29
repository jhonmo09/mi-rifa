import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LogOut, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-paper-raised/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <Link href="/panel" className="font-semibold tracking-tight">
            Mi<span className="text-brand-600">Rifa</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/panel/nueva"
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
            >
              <Plus className="size-4" />
              <span className="hidden sm:inline">Nueva rifa</span>
            </Link>

            <form action="/auth/signout" method="post">
              <button
                type="submit"
                title={user.email ?? 'Cerrar sesión'}
                className="grid size-9 place-items-center rounded-full border border-line text-ink-soft transition hover:border-brand-300 hover:text-ink"
              >
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8">{children}</main>
    </div>
  )
}
