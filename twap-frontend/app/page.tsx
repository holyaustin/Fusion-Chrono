// app/page.tsx
'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="py-6 px-8 flex justify-between items-center border-b border-primary/30">
        <h1 className="text-2xl font-bold text-primary">TWAP Aggregator</h1>
        <ConnectButton />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <div className="max-w-3xl">
          <h2 className="text-5xl font-extrabold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Cross-Chain TWAP Swaps
          </h2>
          <p className="text-xl text-gray-300 mb-10">
            Trade large amounts across Etherlink and Base with minimal slippage.
            Powered by 1inch Fusion+.
          </p>
          <Link href="/twap">
            <button className="bg-secondary text-black font-bold py-4 px-12 rounded-lg text-xl hover:bg-gold-light transition transform hover:scale-105">
              Start App
            </button>
          </Link>
        </div>
      </main>

      <footer className="py-6 px-8 text-center text-gray-500 border-t border-border-dark">
        © 2025 Cross-chain TWAP Aggregator
      </footer>
    </div>
  )
}