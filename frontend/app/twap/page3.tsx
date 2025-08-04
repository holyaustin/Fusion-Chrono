// app/twap/page.tsx
'use client'

import { useState } from 'react'
import { useAccount, useWriteContract, useReadContract, useSwitchChain } from 'wagmi'
import { etherlink } from '@/lib/chains'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { CrossChainTWAPABI } from '@/lib/abi/CrossChainTWAPABI'
import { ERC20_ABI } from '@/lib/abi/ERC20_ABI'
import Image from 'next/image'
import Link from 'next/link'

const CONTRACT_ADDRESS = '0xA2Aea35523a71EFf81283E32F52151F12D5CBB7F' as const

// ✅ Token addresses
const TOKENS: Record<string, `0x${string}`> = {
  'USDC.e': '0x796Ea11Fa2dD751eD01b53C372fFDB4AAa8f00F9',
  'USDC': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
}

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

  const fromTokenAddress = TOKENS[form.fromToken]
  const toTokenAddress = TOKENS[form.toToken]

  // ✅ Read allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: fromTokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address!, CONTRACT_ADDRESS],
    query: { enabled: !!address && !!fromTokenAddress },
  })

  const { data: orderCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CrossChainTWAPABI,
    functionName: 'getOrderCount',
    args: [address!],
    query: { enabled: !!address },
  })

  const needsApproval = BigInt(form.totalAmount || '0') > (allowance ? BigInt(allowance.toString()) : 0n)

  const handleApprove = () => {
    if (!address) return
    if (chain?.id !== etherlink.id) {
      switchChain({ chainId: etherlink.id })
      return
    }

    writeContract({
      address: fromTokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [CONTRACT_ADDRESS, BigInt(form.totalAmount || '0')],
      chainId: etherlink.id,
    })
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
      alert('Interval >= 60s')
      return
    }

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CrossChainTWAPABI,
      functionName: 'scheduleSwap',
      args: [
        fromTokenAddress,
        toTokenAddress,
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
            width={80}
            height={80}
            priority
            className=" border-2 border-secondary shadow-lg group-hover:shadow-xl transition"
          />
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Fusion Chrono
            </h1>
            <p className="text-sm text-gray-400 ml-1">TWAP Aggregator</p>
          </div>
        </Link>

        <Link href="/slippage" className="full-round text-2xl text-secondary px-8 py-2 bg-red-700 font-bold hover:bg-red-500 ">
          Slippage Analytics
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

      <main className="flex-1 p-6 grid md:grid-cols-2 gap-10 max-w-6xl mx-auto w-full">
        <div className="bg-black/40 backdrop-blur-sm border border-primary/30 rounded-2xl p-6 shadow-lg">
          <h2 className="text-3xl font-bold mb-6 text-secondary">Schedule Swap</h2>

          {/* From Token */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">From Token</label>
            <select
              value={form.fromToken}
              onChange={(e) => setForm({ ...form, fromToken: e.target.value as any })}
              className="input"
            >
              <option value="USDC.e">USDC (Etherlink)</option>
              <option value="USDC">USDC (Base)</option>
            </select>
          </div>

          {/* To Token */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">To Token</label>
            <select
              value={form.toToken}
              onChange={(e) => setForm({ ...form, toToken: e.target.value as any })}
              className="input"
            >
              <option value="USDC">USDC (Base)</option>
              <option value="USDC.e">USDC.e (Etherlink)</option>
            </select>
          </div>

          {/* Amount */}
          <input
            type="number"
            placeholder="Amount"
            className="input mb-4"
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
              className="input"
            />
            <input
              type="number"
              placeholder="Interval (sec)"
              value={form.interval}
              onChange={(e) => setForm({ ...form, interval: e.target.value })}
              className="input"
            />
          </div>

          {/* Min Return */}
          <input
            type="number"
            placeholder="Min Return"
            className="input mb-6"
            value={form.minReturn}
            onChange={(e) => setForm({ ...form, minReturn: e.target.value })}
          />

          {/* Approval or Schedule */}
          {needsApproval ? (
            <button
              onClick={handleApprove}
              disabled={isPending}
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-lg transition"
            >
              {isPending ? 'Confirming...' : 'Approve USDC'}
            </button>
          ) : (
            <button
              onClick={handleSchedule}
              disabled={isPending}
              className="w-full bg-primary hover:bg-primary-light text-white font-bold py-3 rounded-lg transition"
            >
              {isPending ? 'Confirming...' : 'Schedule TWAP'}
            </button>
          )}

          {/* Debug: Show allowance */}
          <p className="text-xs text-gray-500 mt-2">
            Allowance: {allowance ? (allowance as any).toString() : '0'} {form.fromToken}
          </p>
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