import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Historia de la Pedagogía Moderna',
  description: 'Abbagnano & Visalberghi — Del siglo XVII a la Ilustración',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
