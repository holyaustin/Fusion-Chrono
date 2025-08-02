// components/Header.tsx
'use client'

import { useAccount } from 'wagmi'
import { ConnectWallet } from './ConnectWallet'

export function Header() {
  const { isConnected } = useAccount()

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg"></div>
            <h1 className="text-xl font-bold text-gray-800">Fusion Chrono</h1>
          </div>

          <nav className="hidden md:flex space-x-8">
            <a href="#about" className="text-gray-600 hover:text-blue-600 transition">About Us</a>
            <a href="#partners" className="text-gray-600 hover:text-blue-600 transition">Partners</a>
            <a href="#join" className="text-gray-600 hover:text-blue-600 transition">Join Us</a>
          </nav>

          <div className="flex items-center space-x-4">
            {isConnected ? (
              <span className="text-sm text-gray-600">Connected</span>
            ) : null}
            <ConnectWallet />
          </div>
        </div>
      </div>
    </header>
  )
}