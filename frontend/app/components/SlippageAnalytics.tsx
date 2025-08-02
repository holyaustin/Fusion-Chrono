// components/SlippageAnalytics.tsx
import { useState, useEffect } from 'react'

export function SlippageAnalytics() {
  const [twapSlippage, setTwapSlippage] = useState(0.5) // Mock
  const [instantSlippage, setInstantSlippage] = useState(2.1)

  // In production: fetch from 1inch API
  useEffect(() => {
    const interval = setInterval(() => {
      setTwapSlippage(prev => prev + (Math.random() - 0.5) * 0.1)
      setInstantSlippage(prev => prev + (Math.random() - 0.5) * 0.2)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-white p-6 rounded-xl shadow mt-6">
      <h3 className="text-lg font-semibold mb-4">Slippage Analytics</h3>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span>Time-Weighted (TWAP)</span>
          <span className="font-medium text-green-600">{twapSlippage.toFixed(2)}%</span>
        </div>
        <div className="flex justify-between">
          <span>Instant Swap</span>
          <span className="font-medium text-red-600">{instantSlippage.toFixed(2)}%</span>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          TWAP reduces slippage by averaging price over time.
        </p>
      </div>
    </div>
  )
}