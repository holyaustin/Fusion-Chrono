// app/layout.tsx
import { Providers } from './providers'
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Fusion Chrono",
  description: "Cross-chain TWAP DEX Aggregator using 1inch Fusion+",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}