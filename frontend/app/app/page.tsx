// app/app/page.tsx
'use client'

import { useAccount, useWriteContract } from 'wagmi'
import { parseUnits } from 'viem'
import { useState } from 'react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

const CROSS_CHAIN_TWAP_ADDRESS = '0xA2Aea35523a71EFf81283E32F52151F12D5CBB7F'

const CrossChainTWAPABI = [
  {
    name: 'scheduleSwap',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { type: 'address', name: 'fromToken' },
      { type: 'address', name: 'toToken' },
      { type: 'uint256', name: 'totalAmount' },
      { type: 'uint256', name: 'numSlices' },
      { type: 'uint256', name: 'interval' },
      { type: 'uint256', name: 'minReturnAmount' },
      { type: 'bool', name: 'isBaseToEtherlink' },
    ],
    outputs: [],
  },
] as const

// 🔁 Replace with real addresses
const USDC_ETHERLINK = '0x...' // Etherlink USDC
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' // Base USDC

export default function TWAPPage() {
  const { address, isConnected } = useAccount()
  const { writeContract, isPending } = useWriteContract()

  const [amount, setAmount] = useState('')
  const [numSlices, setNumSlices] = useState('5')
  const [interval, setInterval] = useState('300')
  const [minReturn, setMinReturn] = useState('')
  const [direction, setDirection] = useState<'etherlinkToBase' | 'baseToEtherlink'>('etherlinkToBase')

  const fromToken = direction === 'etherlinkToBase' ? USDC_ETHERLINK : USDC_BASE
  const toToken = direction === 'etherlinkToBase' ? USDC_BASE : USDC_ETHERLINK
  const isBaseToEtherlink = direction === 'baseToEtherlink'

  const scheduleSwap = () => {
    if (!amount || !minReturn) return

    writeContract({
      address: CROSS_CHAIN_TWAP_ADDRESS,
      abi: CrossChainTWAPABI,
      functionName: 'scheduleSwap',
      args: [
        fromToken,
        toToken,
        parseUnits(amount, 6),
        BigInt(numSlices),
        BigInt(interval),
        parseUnits(minReturn, 6),
        isBaseToEtherlink,
      ],
    })
  }

  if (!isConnected) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Connect Wallet to Continue</h2>
            <p className="text-gray-600 mb-6">Schedule MEV-resistant TWAP swaps on Etherlink & Base</p>
            <button
              onClick={() => {}}
              className="btn-primary"
            >
              Connect Wallet
            </button>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-12 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="card">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Schedule TWAP Swap</h1>
            <p className="text-gray-600 mb-6">Split your swap into time-weighted slices to reduce slippage and avoid MEV.</p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (USDC)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="100.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Direction</label>
                <select
                  value={direction}
                  onChange={(e) => setDirection(e.target.value as any)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                >
                  <option value="etherlinkToBase">Etherlink → Base</option>
                  <option value="baseToEtherlink">Base → Etherlink</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Slices</label>
                  <input
                    type="number"
                    value={numSlices}
                    onChange={(e) => setNumSlices(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Interval (sec)</label>
                  <input
                    type="number"
                    value={interval}
                    onChange={(e) => setInterval(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Return (USDC)</label>
                <input
                  type="number"
                  value={minReturn}
                  onChange={(e) => setMinReturn(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="98.00"
                />
              </div>

              <button
                onClick={scheduleSwap}
                disabled={isPending}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-xl transition transform hover:scale-[1.01] disabled:opacity-60 disabled:transform-none"
              >
                {isPending ? 'Confirming...' : 'Schedule Swap'}
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}