// app/components/ConnectWallet.tsx
'use client'

import { useConnect } from 'wagmi'

export function ConnectWallet() {
  const { connect, connectors } = useConnect()

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-sm mx-auto">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Connect Your Wallet</h2>
      <div className="space-y-3">
        {connectors.map((connector) => (
          <button
            key={connector.id}
            onClick={() => connect({ connector })}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition"
          >
            {connector.name}
          </button>
        ))}
      </div>
    </div>
  )
}