/**
 * Lee las variables de Supabase y falla con un mensaje entendible.
 * Sin esto, una URL de ejemplo se manifiesta como un críptico "fetch failed".
 * Se llama en tiempo de petición, no al importar, para no romper el build.
 */
export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL y/o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local'
    )
  }

  if (url.includes('xxxxxxxxxxxx') || anonKey.startsWith('eyJhbGciOi...')) {
    throw new Error(
      '.env.local todavía tiene los valores de ejemplo. Ponle la URL y la anon key reales de tu proyecto de Supabase (Project Settings > API).'
    )
  }

  return { url, anonKey }
}
