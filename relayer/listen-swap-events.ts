// relayer/listen-swap-events.ts
import { ethers } from 'ethers'
import { parseUnits } from 'viem'

// 🔁 Replace with your RPC
const ETHERLINK_RPC = 'https://node.mainnet.etherlink.com'
const provider = new ethers.JsonRpcProvider(ETHERLINK_RPC)

// 🔁 Replace with your contract address
const CONTRACT_ADDRESS = '0xA2Aea35523a71EFf81283E32F52151F12D5CBB7F'

// ABI fragment for event
const CONTRACT_ABI = [
  "event SwapScheduled(uint256 indexed orderId, address indexed owner, address fromToken, address toToken, uint256 totalAmount, bool isBaseToEtherlink)"
]

async function main() {
  console.log('📡 Relayer starting... Listening for SwapScheduled events')

  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)

  contract.on('SwapScheduled', async (orderId, owner, fromToken, toToken, totalAmount, isBaseToEtherlink) => {
    console.log(`🆕 SwapScheduled: ID ${orderId}, Owner: ${owner}, Amount: ${ethers.formatUnits(totalAmount, 6)} USDC`)

    // 🔁 In production: call 1inch Fusion+ SDK here
    console.log('🔁 Triggering 1inch Fusion+ cross-chain order creation...')
    console.log('⚠️  Mock: Replace with real @1inch/cross-chain-sdk logic')

    // Example: You would pass:
    // - fromToken, toToken
    // - totalAmount
    // - direction (isBaseToEtherlink)
    // - secrets, escrows, etc.
  })

  console.log('✅ Listening for events...')
}

main().catch(console.error)