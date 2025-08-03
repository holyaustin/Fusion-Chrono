// lib/chains.ts
import { Chain } from 'wagmi'

export const etherlink = {
  id: 10208,
  name: 'Etherlink',
  network: 'etherlink',
  nativeCurrency: {
    decimals: 18,
    name: 'Tez',
    symbol: 'XTZ',
  },
  rpcUrls: {
    default: { http: ['https://node.mainnet.etherlink.com'] },
    public: { http: ['https://node.mainnet.etherlink.com'] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://explorer.etherlink.com' },
  },
} as const

export const base = {
  id: 8453,
  name: 'Base',
  network: 'base',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['https://mainnet.base.org'] },
    public: { http: ['https://mainnet.base.org'] },
  },
  blockExplorers: {
    default: { name: 'Basescan', url: 'https://basescan.org' },
  },
} as const