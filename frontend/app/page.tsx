// app/page.tsx
'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-black via-red-950 to-black">
      <header className="py-6 px-8 flex justify-between items-center border-b border-primary/30 backdrop-blur-sm bg-black/20">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Fusion Chrono
          </h1>
          <p className="text-sm text-gray-400 ml-1">TWAP Aggregator</p>
        </div>
        <ConnectButton.Custom>
          {({ account, openConnectModal }) => (
            <button
              onClick={openConnectModal}
              className="btn-gold text-sm px-4 py-2 rounded-full"
            >
              {account ? (
                <span>{account.address.slice(0, 6)}...{account.address.slice(-4)}</span>
              ) : (
                <span>Connect Wallet</span>
              )}
            </button>
          )}
        </ConnectButton.Custom>
      </header>

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

      <footer className="py-6 px-8 text-center text-gray-500 border-t border-primary/20 backdrop-blur-sm bg-black/20">
        © 2025 Fusion Chrono. All rights reserved.
      </footer>
    </div>
  )
}