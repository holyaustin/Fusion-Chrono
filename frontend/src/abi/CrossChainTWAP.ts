// src/abi/CrossChainTWAP.ts
const CrossChainTWAPABI = [
  {
    "inputs": [
      { "name": "fromToken", "type": "address" },
      { "name": "toToken", "type": "address" },
      { "name": "totalAmount", "type": "uint256" },
      { "name": "numSlices", "type": "uint256" },
      { "name": "interval", "type": "uint256" },
      { "name": "minReturnAmount", "type": "uint256" },
      { "name": "isBaseToEtherlink", "type": "bool" }
    ],
    "name": "scheduleSwap",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "user", "type": "address" }],
    "name": "getOrderCount",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const

export default CrossChainTWAPABI