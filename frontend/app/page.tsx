// app/page.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ClientOnlyConnectButton } from '@/components/ClientOnlyConnectButton'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-black via-red-950 to-black">
      {/* Header */}
      <header className="py-6 px-8 flex justify-between items-center border-b border-primary/30 backdrop-blur-sm bg-black/20">
        <Link href="/" className="flex items-center gap-4 group">
          <Image
            src="/logo.png"
            alt="Fusion Chrono"
            width={80}
            height={80}
            priority
            className=" border-2 border-secondary shadow-lg group-hover:shadow-xl transition"
          />
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent group-hover:opacity-80 transition">
              Fusion Chrono
            </h1>
            <p className="text-sm text-gray-400 ml-1">TWAP Aggregator</p>
          </div>
        </Link>

        {/* ✅ Client-only wallet button */}
        <ClientOnlyConnectButton />
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1639322537504-6427a16b0a28?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80)',
          }}
        ></div>

        <div className="max-w-4xl z-10">
          <h2 className="text-6xl font-extrabold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-primary via-red-500 to-secondary bg-clip-text text-transparent">
              Cross-Chain
            </span>
            <br />
            <span className="text-secondary">TWAP Swaps</span>
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Time-weighted average price swaps across Etherlink and Base.
            Powered by 1inch Fusion+.
          </p>
          <Link href="/twap">
            <button className="btn-gold text-2xl py-5 px-14 rounded-full shadow-2xl hover:shadow-secondary/30 transform hover:scale-110 transition-all">
              Start App
            </button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-8 text-center text-gray-500 border-t border-primary/20 backdrop-blur-sm bg-black/20 flex items-center justify-center gap-3">
        <Image
            src="/logo.png"
          alt="Fusion Chrono"
          width={60}
          height={60}
          className="rborder-2 border-secondary"
        />
        <div>
          <p className="text-secondary font-bold">Fusion Chrono</p>
          <p className="text-xs text-gray-500">© 2025 All rights reserved</p>
        </div>
      </footer>
    </div>
  )
}