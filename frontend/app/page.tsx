// app/page.tsx
'use client'

import { useAccount, useConnect, useWriteContract } from 'wagmi'
import { parseUnits } from 'viem'
import { useState } from 'react'

// 🔁 Replace with real token addresses
const USDC_ETHERLINK = '0x...' // Get from Etherlink Explorer
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' // Base USDC

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

export default function Home() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
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
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <h2 className="text-2xl font-semibold mb-4">Connect Your Wallet</h2>
          {connectors.map((connector) => (
            <button
              key={connector.id}
              onClick={() => connect({ connector })}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg mt-2"
            >
              {connector.name}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Fusion Chrono</h1>
        <p className="text-center text-gray-600 mb-8">MEV-resistant time-weighted swaps</p>

        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4">Schedule Swap</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Amount (USDC)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Direction</label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as any)}
                className="w-full p-2 border rounded"
              >
                <option value="etherlinkToBase">Etherlink → Base</option>
                <option value="baseToEtherlink">Base → Etherlink</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">Slices</label>
              <input
                type="number"
                value={numSlices}
                onChange={(e) => setNumSlices(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Interval (seconds)</label>
              <input
                type="number"
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Min Return (USDC)</label>
              <input
                type="number"
                value={minReturn}
                onChange={(e) => setMinReturn(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="98"
              />
            </div>

            <button
              onClick={scheduleSwap}
              disabled={isPending}
              className="w-full bg-blue-600 text-white p-3 rounded font-semibold disabled:opacity-50"
            >
              {isPending ? 'Confirming...' : 'Schedule Swap'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}