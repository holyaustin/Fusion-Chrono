// components/ConnectWallet.tsx
'use client'

import { useConnect } from 'wagmi'

export function ConnectWallet() {
  const { connect, connectors } = useConnect()

  return (
    <button
      onClick={() => connect({ connector: connectors[0] })}
      className="btn-primary text-sm"
    >
      Connect Wallet
    </button>
  )
}