// app/twap/page.tsx
'use client'

import { useState } from 'react'
import { useAccount, useWriteContract, useReadContract, useSwitchChain } from 'wagmi'
import { etherlink } from '@/lib/chains'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { CrossChainTWAPABI } from '@/lib/abi/CrossChainTWAPABI'
import Image from 'next/image'
import Link from 'next/link'

const CONTRACT_ADDRESS = '0xA2Aea35523a71EFf81283E32F52151F12D5CBB7F' as const

// ✅ NEW: Token List (Chain-aware)
const TOKENS = {
  etherlink: {
    WETH: '0xfc24f770F94edBca6D6f885E12d4317320BcB401', // Replace with real WETH on Etherlink
    USDC: '0x796Ea11Fa2dD751eD01b53C372fFDB4AAa8f00F9', // Real USDC Etherlink
  },
  base: {
    WETH: '0x4200000000000000000000000000000000000006', // Base WETH
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base USDC
  },
} as const

export default function TWAPPage() {
  const { address, chain } = useAccount()
  const { switchChain } = useSwitchChain()
  const { writeContract, isPending } = useWriteContract()

  // ✅ UPDATED: Form now uses token keys instead of raw addresses
  const [form, setForm] = useState({
    fromChain: 'etherlink' as 'etherlink' | 'base',
    toChain: 'base' as 'etherlink' | 'base',
    fromToken: 'USDC' as 'WETH' | 'USDC',
    toToken: 'USDC' as 'WETH' | 'USDC',
    totalAmount: '1000000',
    numSlices: '10',
    interval: '300',
    minReturn: '990000',
    direction: 'etherlinkToBase' as 'etherlinkToBase' | 'baseToEtherlink',
  })

  const { data: orderCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CrossChainTWAPABI,
    functionName: 'getOrderCount',
    args: [address!],
    query: { enabled: !!address },
  })

  // ✅ NEW: Derived addresses from token selection
  const fromTokenAddress = TOKENS[form.fromChain][form.fromToken]
  const toTokenAddress = TOKENS[form.toChain][form.toToken]

  // ✅ NEW: Update direction based on chains
  const updateDirection = (from: string, to: string) => {
    setForm((prev) => ({
      ...prev,
      fromChain: from as any,
      toChain: to as any,
      direction: from === 'etherlink' && to === 'base' ? 'etherlinkToBase' : 'baseToEtherlink',
    }))
  }

  const handleSchedule = () => {
    if (!address) return

    if (chain?.id !== etherlink.id) {
      switchChain({ chainId: etherlink.id })
      return
    }

    const totalAmount = BigInt(form.totalAmount || '0')
    const numSlices = BigInt(form.numSlices || '0')
    const interval = BigInt(form.interval || '0')
    const minReturn = BigInt(form.minReturn || '0')

    if (totalAmount === 0n) {
      alert('Amount must be > 0')
      return
    }
    if (numSlices === 0n) {
      alert('Slices must be > 0')
      return
    }
    if (interval < 60n) {
      alert('Interval must be at least 60 seconds')
      return
    }

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CrossChainTWAPABI,
      functionName: 'scheduleSwap',
      args: [
        fromTokenAddress as `0x${string}`,
        toTokenAddress as `0x${string}`,
        totalAmount,
        numSlices,
        interval,
        minReturn,
        form.direction === 'baseToEtherlink',
      ],
      chainId: etherlink.id,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-950 to-black">
      {/* Header */}
      <header className="py-6 px-8 flex justify-between items-center border-b border-primary/30 backdrop-blur-sm bg-black/20">
        <Link href="/" className="flex items-center gap-4 group">
          <Image
            src="/logo.png"
            alt="Fusion Chrono"
            width={40}
            height={40}
            priority
            className="rounded-full border-2 border-secondary shadow-lg group-hover:shadow-xl transition"
          />
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent group-hover:opacity-80 transition">
              Fusion Chrono
            </h1>
            <p className="text-sm text-gray-400 ml-1">TWAP Aggregator</p>
          </div>
        </Link>

        <ConnectButton.Custom>
          {({ openConnectModal, openAccountModal }) => {
            return address ? (
              <button
                onClick={openAccountModal}
                className="group flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black font-bold py-2.5 px-5 rounded-full text-sm shadow-md transition-all transform hover:scale-105"
              >
                <span className="font-mono text-sm">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
                <span className="text-xs bg-black/30 px-2 py-1 rounded group-hover:bg-black/50 transition">▼</span>
              </button>
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
      </header>

      {/* Main */}
      <main className="flex-1 p-6 grid md:grid-cols-2 gap-10 max-w-6xl mx-auto w-full">
        {/* ✅ UPDATED: Scheduler Form with Token Dropdowns */}
        <div className="bg-black/40 backdrop-blur-sm border border-primary/30 rounded-2xl p-6 shadow-lg">
          <h2 className="text-3xl font-bold mb-6 text-secondary">Schedule Swap</h2>

          {/* From Chain & Token */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">From Token</label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={form.fromChain}
                onChange={(e) => updateDirection(e.target.value, form.toChain)}
                className="p-3 bg-black border border-gray-600 rounded text-white"
              >
                <option value="etherlink">Etherlink</option>
                <option value="base">Base</option>
              </select>
              <select
                value={form.fromToken}
                onChange={(e) => setForm({ ...form, fromToken: e.target.value as any })}
                className="p-3 bg-black border border-gray-600 rounded text-white"
              >
                <option value="WETH">WETH</option>
                <option value="USDC">USDC</option>
              </select>
            </div>
          </div>

          {/* To Chain & Token */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">To Token</label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={form.toChain}
                onChange={(e) => updateDirection(form.fromChain, e.target.value)}
                className="p-3 bg-black border border-gray-600 rounded text-white"
              >
                <option value="base">Base</option>
                <option value="etherlink">Etherlink</option>
              </select>
              <select
                value={form.toToken}
                onChange={(e) => setForm({ ...form, toToken: e.target.value as any })}
                className="p-3 bg-black border border-gray-600 rounded text-white"
              >
                <option value="WETH">WETH</option>
                <option value="USDC">USDC</option>
              </select>
            </div>
          </div>

          {/* Amount */}
          <input
            type="number"
            placeholder="Total Amount"
            className="w-full p-3 mb-4 bg-black border border-gray-600 rounded text-white"
            value={form.totalAmount}
            onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
          />

          {/* Slices & Interval */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              type="number"
              placeholder="Slices"
              value={form.numSlices}
              onChange={(e) => setForm({ ...form, numSlices: e.target.value })}
              className="p-3 bg-black border border-gray-600 rounded text-white"
            />
            <input
              type="number"
              placeholder="Interval (sec)"
              value={form.interval}
              onChange={(e) => setForm({ ...form, interval: e.target.value })}
              className="p-3 bg-black border border-gray-600 rounded text-white"
            />
          </div>

          {/* Min Return */}
          <input
            type="number"
            placeholder="Min Return Amount"
            className="w-full p-3 mb-4 bg-black border border-gray-600 rounded text-white"
            value={form.minReturn}
            onChange={(e) => setForm({ ...form, minReturn: e.target.value })}
          />

          {/* Schedule Button */}
          <button
            onClick={handleSchedule}
            disabled={isPending}
            className="w-full bg-primary hover:bg-primary-light text-white font-bold py-3 rounded-lg transition shadow-lg"
          >
            {isPending ? 'Confirming...' : 'Schedule TWAP'}
          </button>
        </div>

        {/* Orders */}
        <div className="bg-black/40 backdrop-blur-sm border border-primary/30 rounded-2xl p-6 shadow-lg">
          <h2 className="text-3xl font-bold mb-6 text-secondary">Your Orders</h2>
          <div className="space-y-4">
            <div className="p-5 bg-black/60 rounded-xl border border-secondary/20">
              <p className="font-bold text-primary text-lg">Order #0</p>
              <p className="text-gray-300">{form.totalAmount} {form.fromToken} → {form.toToken}</p>
              <p className="text-sm text-gray-400">Direction: {form.direction}</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-6 px-8 text-center text-gray-500 border-t border-primary/20 backdrop-blur-sm bg-black/20">
        © 2025 Fusion Chrono. All rights reserved.
      </footer>
    </div>
  )
}