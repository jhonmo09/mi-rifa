import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mi Rifa · Talonario digital',
  description:
    'Crea tu rifa, comparte el link y deja que cada persona escoja su número desde el celular.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  )
}
