// src/config.ts
import { createConfig, http } from 'wagmi'
import { etherlink } from 'wagmi/chains'
import { injectedWallet, metaMaskWallet, rainbowWallet } from '@rainbowkit/connectors'

export const config = createConfig({
  chains: [etherlink],
  connectors: [
    injectedWallet({ target: 'metaMask' }),
    metaMaskWallet(),
    rainbowWallet()
  ],
  transports: {
    [etherlink.id]: http(),
  },
})