import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Cuantos digitos necesita el talonario: 100 -> 2, 1000 -> 3 */
export function padWidth(totalNumbers: number) {
  return String(Math.max(totalNumbers - 1, 0)).length
}

export function formatNumber(n: number, totalNumbers: number) {
  return String(n).padStart(padWidth(totalNumbers), '0')
}

export function formatMoney(value: number, currency = 'COP') {
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${currency} ${value.toLocaleString('es-CO')}`
  }
}

export function formatDate(value: string | null) {
  if (!value) return null
  const d = new Date(`${value}T12:00:00`)
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

/** Deja solo digitos y prefijo internacional, listo para wa.me */
export function waDigits(phone: string) {
  return phone.replace(/[^0-9]/g, '')
}

export function waLink(phone: string, message?: string) {
  const digits = waDigits(phone)
  const base = `https://wa.me/${digits}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

export function slugify(input: string) {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

export function randomSuffix(len = 4) {
  const alphabet = 'abcdefghijkmnpqrstuvwxyz23456789'
  let out = ''
  for (let i = 0; i < len; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return out
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
}
