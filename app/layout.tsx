import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Portal SST | Quattro Construtora',
  description: 'Portal Privado de Gestão de Segurança e Saúde no Trabalho',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  )
}