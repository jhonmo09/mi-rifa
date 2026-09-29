/**
 * Acepta solo rutas internas ("/panel/abc"). Cualquier otra cosa
 * —URL absoluta, "//host", basura— cae al destino por defecto.
 */
export function safeNext(value: string | null | undefined, fallback = '/panel') {
  if (!value) return fallback
  if (!value.startsWith('/')) return fallback
  if (value.startsWith('//')) return fallback
  return value
}
