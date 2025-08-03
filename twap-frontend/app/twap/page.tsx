// app/twap/page.tsx
'use client'

import { useState } from 'react'
import { useAccount, useWriteContract, useReadContract, useSwitchChain } from 'wagmi' // ← Added useSwitchChain
import { etherlink } from '@/lib/chains'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { CrossChainTWAPABI } from '@/lib/abi/CrossChainTWAPABI'

const CONTRACT_ADDRESS = '0xA2Aea35523a71EFf81283E32F52151F12D5CBB7F' as const

export default function TWAPPage() {
  const { address, chain } = useAccount()
  const { switchChain } = useSwitchChain() // ✅ Hook for chain switching
  const { writeContract, isPending } = useWriteContract()

  const [form, setForm] = useState({
    fromToken: '',
    toToken: '',
    totalAmount: '',
    numSlices: '5',
    interval: '300',
    minReturn: '',
    direction: 'etherlinkToBase',
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

    // If not on Etherlink, switch
    if (chain?.id !== etherlink.id) {
      switchChain({ chainId: etherlink.id }) // ✅ This will prompt user to switch
      return
    }

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CrossChainTWAPABI,
      functionName: 'scheduleSwap',
      args: [
    form.fromToken as `0x${string}`,
    form.toToken as `0x${string}`,
    BigInt(form.totalAmount || '0'),        
    BigInt(form.numSlices || '0'),          
    BigInt(form.interval || '0'),          
    BigInt(form.minReturn || '0'),         
    form.direction === 'baseToEtherlink',
      ],
      chainId: etherlink.id,
    })
  }
  return (
    <div className="min-h-screen flex flex-col">
      <header className="py-6 px-8 flex justify-between items-center border-b border-primary/30">
        <h1 className="text-2xl font-bold text-primary">TWAP Dashboard</h1>
        <ConnectButton />
      </header>

      <main className="flex-1 p-6 grid md:grid-cols-2 gap-8 max-w-6xl mx-auto w-full">
        <div className="bg-[#111] p-6 rounded-2xl border border-border-dark">
          <h2 className="text-2xl font-bold mb-6 text-secondary">Schedule Swap</h2>
          <input
            placeholder="From Token (address)"
            className="w-full p-3 mb-4 bg-black rounded border border-gray-600 text-white"
            value={form.fromToken}
            onChange={(e) => setForm({ ...form, fromToken: e.target.value })}
          />
          <input
            placeholder="To Token (address)"
            className="w-full p-3 mb-4 bg-black rounded border border-gray-600 text-white"
            value={form.toToken}
            onChange={(e) => setForm({ ...form, toToken: e.target.value })}
          />
          <input
            type="number"
            placeholder="Amount"
            className="w-full p-3 mb-4 bg-black rounded border border-gray-600 text-white"
            value={form.totalAmount}
            onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              type="number"
              placeholder="Slices"
              value={form.numSlices}
              onChange={(e) => setForm({ ...form, numSlices: e.target.value })}
              className="p-3 bg-black rounded border border-gray-600 text-white"
            />
            <input
              type="number"
              placeholder="Interval (sec)"
              value={form.interval}
              onChange={(e) => setForm({ ...form, interval: e.target.value })}
              className="p-3 bg-black rounded border border-gray-600 text-white"
            />
          </div>
          <input
            type="number"
            placeholder="Min Return"
            className="w-full p-3 mb-4 bg-black rounded border border-gray-600 text-white"
            value={form.minReturn}
            onChange={(e) => setForm({ ...form, minReturn: e.target.value })}
          />
          <select
            className="w-full p-3 mb-4 bg-black rounded border border-gray-600 text-white"
            value={form.direction}
            onChange={(e) => setForm({ ...form, direction: e.target.value })}
          >
            <option value="etherlinkToBase">Etherlink → Base</option>
            <option value="baseToEtherlink">Base → Etherlink</option>
          </select>
          <button
            onClick={handleSchedule}
            disabled={isPending}
            className="w-full bg-primary hover:bg-primary-light text-white font-bold py-3 rounded-lg transition"
          >
            {isPending ? 'Confirming...' : 'Schedule TWAP'}
          </button>
        </div>

        <div className="bg-[#111] p-6 rounded-2xl border border-border-dark">
          <h2 className="text-2xl font-bold mb-6 text-secondary">Your Orders</h2>
          {orderCount ? (
            <div>
              {Array.from({ length: Number(orderCount) }, (_, i) => (
                <div key={i} className="p-3 bg-black rounded mb-2">
                  Order #{i} ({i * 2}/{5} slices)
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No orders yet.</p>
          )}
        </div>
      </main>

      <footer className="py-6 px-8 text-center text-gray-500 border-t border-border-dark">
        © 2025 Cross-chain TWAP Aggregator
      </footer>
    </div>
  )
}