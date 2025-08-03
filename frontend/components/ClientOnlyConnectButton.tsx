// components/ClientOnlyConnectButton.tsx
'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useEffect, useState } from 'react'
import Image from 'next/image'

export function ClientOnlyConnectButton() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold py-2.5 px-5 rounded-full text-sm transition">
        Connect Wallet
      </button>
    )
  }

  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, openChainModal, openAccountModal }) => {
        return account ? (
          <div className="group relative">
            <button
              type="button"
              onClick={openAccountModal}
              className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black font-bold py-2.5 px-5 rounded-full text-sm shadow-md transition-all transform hover:scale-105"
            >
              {/* Chain Badge */}
              {chain && (
                <span
                  className="w-2 h-2 rounded-full border border-white"
                  style={{ backgroundColor: '#000' }}
                  title={chain.name}
                ></span>
              )}

              {/* Address */}
              <span className="font-mono text-sm">
                {account.address.slice(0, 6)}...{account.address.slice(-4)}
              </span>

              {/* Dropdown Arrow */}
              <span className="text-xs bg-black/30 px-2 py-1 rounded group-hover:bg-black/50 transition">
                ▼
              </span>
            </button>

            {/* Chain Switcher Tooltip (on hover) */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition pointer-events-none">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  openChainModal()
                }}
                className="px-3 py-1 bg-gray-800 text-white text-xs rounded-lg border border-gray-600 hover:bg-gray-700 transition"
              >
                {chain ? `Switch Network (${chain.name})` : 'Select Network'}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={openConnectModal}
            className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black font-bold py-2.5 px-5 rounded-full text-sm shadow-md transition-all transform hover:scale-105"
          >
            Connect Wallet
          </button>
        )
      }}
    </ConnectButton.Custom>
  )
}