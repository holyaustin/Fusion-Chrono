// lib/wagmiConfig.ts
import { createConfig, http } from 'wagmi'
import { etherlink, base } from './chains'

export const config = createConfig({
  chains: [etherlink, base],
  transports: {
    [etherlink.id]: http(),
    [base.id]: http(),
  },
})