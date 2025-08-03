// app/slippage/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts'
import { useAccount } from 'wagmi'
import { ClientOnlyConnectButton } from '@/components/ClientOnlyConnectButton'
import Image from 'next/image'
import Link from 'next/link'

// Mock API: Fetch slippage data
async function fetchSlippageData(orderId: number) {
  // Simulate API delay
  await new Promise(r => setTimeout(r, 800))

  // Real data would come from relayer or DB
  return Array.from({ length: 10 }, (_, i) => {
    const expected = 100000
    const deviation = (Math.random() - 0.5) * 0.6 // ±0.3%
    const actual = expected * (1 - deviation / 100)
    const slippage = Number((expected - actual).toFixed(2))
    return {
      slice: i + 1,
      expected,
      actual: Number(actual.toFixed(2)),
      slippage: Number(((slippage / expected) * 100).toFixed(3)),
      priceImpact: Number(((Math.abs(deviation) * 0.8) / 100).toFixed(3)),
      gasCostXTZ: (0.00018 + Math.random() * 0.00004).toFixed(6),
      timestamp: new Date(Date.now() - (10 - i) * 300 * 1000).toISOString(),
    }
  })
}

export default function SlippagePage() {
  const { address } = useAccount()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<number>(0)
  const [tokenPair, setTokenPair] = useState('USDC.e → USDC')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const result = await fetchSlippageData(selectedOrder)
      setData(result)
      setLoading(false)
    }
    load()

    const interval = setInterval(load, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [selectedOrder])

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
            className="rounded-full border-2 border-secondary shadow-lg"
          />
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Fusion Chrono
            </h1>
            <p className="text-sm text-gray-400 ml-1">Slippage Analytics</p>
          </div>
        </Link>

        <Link href="/twap" className="full-round text-2xl text-secondary px-8 py-2 bg-red-700 font-bold hover:bg-red-500 ">
            TWAP
        </Link>

        <ClientOnlyConnectButton />
      </header>

      {/* Main */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <div className="mb-8 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <h2 className="text-3xl font-bold text-secondary">Slippage Dashboard</h2>

          {/* Token Pair Selector */}
          <div className="flex gap-4 flex-wrap">
            <select
              value={tokenPair}
              onChange={(e) => setTokenPair(e.target.value)}
              className="p-3 bg-black border border-gray-600 rounded-lg text-white"
            >
              <option value="USDC.e → USDC">USDC.e → USDC</option>
              <option value="WETH → WETH">WETH → WETH</option>
              <option value="USDC → USDC.e">USDC → USDC.e</option>
            </select>

            <select
              value={selectedOrder}
              onChange={(e) => setSelectedOrder(Number(e.target.value))}
              className="p-3 bg-black border border-gray-600 rounded-lg text-white"
            >
              <option value={0}>Order #0 (Active)</option>
              <option value={1}>Order #1 (Completed)</option>
              <option value={2}>Order #2 (Pending)</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-gray-400">Loading slippage data...</div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-black/40 p-6 rounded-2xl border border-primary/20 text-center">
                <p className="text-gray-400 text-sm">Avg. Slippage</p>
                <p className="text-2xl font-bold text-secondary">
                  {(data.reduce((a, b) => a + b.slippage, 0) / data.length).toFixed(3)}%
                </p>
              </div>
              <div className="bg-black/40 p-6 rounded-2xl border border-primary/20 text-center">
                <p className="text-gray-400 text-sm">Max Deviation</p>
                <p className="text-2xl font-bold text-red-400">
                  {Math.max(...data.map(d => d.slippage)).toFixed(3)}%
                </p>
              </div>
              <div className="bg-black/40 p-6 rounded-2xl border border-primary/20 text-center">
                <p className="text-gray-400 text-sm">Price Impact</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {(data.reduce((a, b) => a + b.priceImpact, 0) / data.length * 100).toFixed(3)}%
                </p>
              </div>
              <div className="bg-black/40 p-6 rounded-2xl border border-primary/20 text-center">
                <p className="text-gray-400 text-sm">Total Slices</p>
                <p className="text-2xl font-bold text-primary">{data.length}</p>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-black/40 p-6 rounded-2xl border border-primary/20 mb-8">
              <h3 className="text-xl font-bold text-secondary mb-4">Slippage Per Slice</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="slice" stroke="#888" />
                  <YAxis domain={['dataMin - 0.1', 'dataMax + 0.1']} stroke="#888" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="slippage" stroke="#d4af37" name="Slippage %" dot={true} />
                  <Line type="monotone" dataKey="priceImpact" stroke="#b30000" name="Price Impact %" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Data Table */}
            <div className="bg-black/40 p-6 rounded-2xl border border-primary/20">
              <h3 className="text-xl font-bold text-secondary mb-4">Execution Details</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2">Slice</th>
                      <th className="text-left py-2">Expected</th>
                      <th className="text-left py-2">Actual</th>
                      <th className="text-left py-2">Slippage</th>
                      <th className="text-left py-2">Price Impact</th>
                      <th className="text-left py-2">Gas (XTZ)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((d, i) => (
                      <tr key={i} className="border-b border-gray-800 hover:bg-gray-900/50">
                        <td className="py-2">{d.slice}</td>
                        <td>{d.expected.toLocaleString()}</td>
                        <td>{d.actual.toLocaleString()}</td>
                        <td className={d.slippage > 0.3 ? 'text-red-400' : 'text-green-400'}>
                          {d.slippage}%
                        </td>
                        <td>{d.priceImpact}%</td>
                        <td className="text-xs">{d.gasCostXTZ}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 px-8 text-center text-gray-500 border-t border-primary/20 backdrop-blur-sm bg-black/20">
        <p>© 2025 Fusion Chrono. All rights reserved. Data refreshes every 30 seconds.</p>
      </footer>
    </div>
  )
}