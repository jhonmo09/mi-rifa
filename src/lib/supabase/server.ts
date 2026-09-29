import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseEnv } from '@/lib/env'

export async function createClient() {
  const { url, anonKey } = supabaseEnv()
  const cookieStore = await cookies()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Llamado desde un Server Component: el middleware ya refresca la sesion.
        }
      },
    },
  })
}
