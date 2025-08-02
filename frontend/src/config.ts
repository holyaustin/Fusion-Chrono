// src/config.ts
import { createConfig, http } from 'wagmi'
import { etherlink } from 'wagmi/chains'

export const config = createConfig({
  chains: [etherlink],
  transports: {
    [etherlink.id]: http(),
  },
})