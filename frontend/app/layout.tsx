// app/layout.tsx
import { Providers } from './providers'
import './globals.css'

export const dynamic = 'force-static'
export const revalidate = 3600

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <title>Fusion Chrono – cross-chain TWAP Aggregator</title>
        <meta name="description" content="Cross-chain TWAP swaps on Etherlink and Base using 1inch Fusion+" />
      </head>
      <body className="bg-black text-white min-h-screen font-sans antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}