// app/twap/page.tsx
'use client'

import { useState } from 'react'
import { useAccount, useWriteContract, useReadContract, useSwitchChain } from 'wagmi'
import { etherlink } from '@/lib/chains'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { CrossChainTWAPABI } from '@/lib/abi/CrossChainTWAPABI'
import Image from 'next/image'

const CONTRACT_ADDRESS = '0xA2Aea35523a71EFf81283E32F52151F12D5CBB7F' as const

export default function TWAPPage() {
  const { address, chain } = useAccount()
  const { switchChain } = useSwitchChain()
  const { writeContract, isPending } = useWriteContract()

  const [form, setForm] = useState({
    fromToken: '',
    toToken: '',
    totalAmount: '',
    numSlices: '5',
    interval: '300',
    minReturn: '',
    direction: 'etherlinkToBase' as 'etherlinkToBase' | 'baseToEtherlink',
  })

  const { data: orderCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CrossChainTWAPABI,
    functionName: 'getOrderCount',
    args: [address!],
    query: { enabled: !!address },
  })

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
        form.fromToken as `0x${string}`,
        form.toToken as `0x${string}`,
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
      <header className="py-6 px-8 flex justify-between items-center border-b border-primary/30 backdrop-blur-sm bg-black/20">
               <div className="flex items-center gap-4">
          {/* Logo using next/image */}
          <Image
            src="/logo.png"
            alt="Fusion Chrono Logo"
            width={80}
            height={80}
            priority
            className="border-2 border-secondary shadow-lg"
          />
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Fusion Chrono
          </h1>
          <p className="text-sm text-gray-400 ml-1">TWAP Aggregator</p>
        </div>
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

      <main className="flex-1 p-6 grid md:grid-cols-2 gap-10 max-w-6xl mx-auto w-full">
        <div className="card">
          <h2 className="text-3xl font-bold mb-6 text-secondary">Schedule Swap</h2>
          <input placeholder="From Token" className="input mb-4" value={form.fromToken} onChange={(e) => setForm({ ...form, fromToken: e.target.value })} />
          <input placeholder="To Token" className="input mb-4" value={form.toToken} onChange={(e) => setForm({ ...form, toToken: e.target.value })} />
          <input type="number" placeholder="Amount" className="input mb-4" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} />

          <div className="grid grid-cols-2 gap-4 mb-4">
            <input type="number" placeholder="Slices" className="input" value={form.numSlices} onChange={(e) => setForm({ ...form, numSlices: e.target.value })} />
            <input type="number" placeholder="Interval (sec)" className="input" value={form.interval} onChange={(e) => setForm({ ...form, interval: e.target.value })} />
          </div>

          <input type="number" placeholder="Min Return" className="input mb-4" value={form.minReturn} onChange={(e) => setForm({ ...form, minReturn: e.target.value })} />

          <select
            className="input mb-6"
            value={form.direction}
            onChange={(e) => setForm({ ...form, direction: e.target.value as any })}
          >
            <option value="etherlinkToBase">Etherlink → Base</option>
            <option value="baseToEtherlink">Base → Etherlink</option>
          </select>

          <button
            onClick={handleSchedule}
            disabled={isPending}
            className="btn-primary w-full py-4 text-lg"
          >
            {isPending ? 'Confirming...' : 'Schedule TWAP'}
          </button>
        </div>

        <div className="card">
          <h2 className="text-3xl font-bold mb-6 text-secondary">Your Orders</h2>
          {orderCount && orderCount > 0n ? (
            <div className="space-y-4">
              {Array.from({ length: Number(orderCount) }, (_, i) => (
                <div key={i} className="p-5 bg-black/60 rounded-xl border border-secondary/20">
                  <p className="font-bold text-primary text-lg">Order #{i}</p>
                  <p className="text-gray-300">Status: <span className="text-secondary">Scheduled</span></p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No orders yet.</p>
          )}
        </div>
      </main>

      <footer className="py-6 px-8 text-center text-gray-500 border-t border-primary/20 backdrop-blur-sm bg-black/20">
        © 2025 Fusion Chrono. Secure. Decentralized. Efficient.
      </footer>
    </div>
  )
}