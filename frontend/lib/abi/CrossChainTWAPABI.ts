// lib/abi/CrossChainTWAPABI.ts
export const CrossChainTWAPABI = [
  {
    inputs: [
      { name: 'fromToken', type: 'address' },
      { name: 'toToken', type: 'address' },
      { name: 'totalAmount', type: 'uint256' },
      { name: 'numSlices', type: 'uint256' },
      { name: 'interval', type: 'uint256' },
      { name: 'minReturnAmount', type: 'uint256' },
      { name: 'isBaseToEtherlink', type: 'bool' },
    ],
    name: 'scheduleSwap',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getOrderCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'index', type: 'uint256' },
    ],
    name: 'getOrder',
    outputs: [
      { name: 'owner', type: 'address' },
      { name: 'fromToken', type: 'address' },
      { name: 'toToken', type: 'address' },
      { name: 'totalAmount', type: 'uint256' },
      { name: 'numSlices', type: 'uint256' },
      { name: 'interval', type: 'uint256' },
      { name: 'startTime', type: 'uint256' },
      { name: 'executedSlices', type: 'uint256' },
      { name: 'minReturnAmount', type: 'uint256' },
      { name: 'canceled', type: 'bool' },
      { name: 'isBaseToEtherlink', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'orderId', type: 'uint256' }],
    name: 'cancelSwap',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const