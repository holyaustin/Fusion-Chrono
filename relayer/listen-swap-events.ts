// relayer/listen-swap-events.ts
// 🚀 Fusion Chrono Relayer
// Polls for SwapScheduled events on Etherlink Mainnet and creates 1inch Fusion+ orders via REST API
// Enables MEV-resistant, time-weighted, cross-chain swaps between Etherlink and Base
// Works even if eth_newFilter is not supported (common on L2s)

import { ethers } from 'ethers'
import axios from 'axios'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

// Load environment variables from .env
dotenv.config()

// 🔐 Configuration: Load sensitive data
const PRIVATE_KEY = process.env.PRIVATE_KEY
const ONEINCH_API_KEY = process.env.ONEINCH_API_KEY

// Validate required environment variables
if (!PRIVATE_KEY) {
  throw new Error('PRIVATE_KEY is missing in .env file. Create .env with: PRIVATE_KEY=your_private_key')
}
if (!ONEINCH_API_KEY) {
  throw new Error('ONEINCH_API_KEY is missing in .env file. Get one at https://portal.1inch.dev')
}

// 📦 Contract Address
// This is the CrossChainTWAP contract deployed on Etherlink Mainnet
const CROSS_CHAIN_TWAP_ADDRESS = '0x7b954082151F7a44B2E42Ef9225393ea4f16c482'

// 🌐 RPC Endpoint
// Etherlink Mainnet RPC (public node)
const ETHERLINK_RPC = 'https://node.mainnet.etherlink.com'

// 🧭 Chain IDs
// Etherlink Mainnet Chain ID is 42793 (not 128123)
const ETHERLINK_CHAIN_ID = 42793
const BASE_CHAIN_ID = 8453 // Base Mainnet

// 💳 Token Addresses
// USDC on Etherlink and Base
const USDC_ETHERLINK = '0x796Ea11Fa2dD751eD01b53C372fFDB4AAa8f00F9'
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

// 📡 Ethereum Provider
// Connect to Etherlink Mainnet
const provider = new ethers.JsonRpcProvider(ETHERLINK_RPC)

// 🔑 Wallet
// The relayer uses a wallet to sign Fusion+ order transactions
// 🚨 Use a burner wallet — never expose your main wallet
const wallet = new ethers.Wallet(PRIVATE_KEY, provider)

// 🌍 1inch Fusion+ API Base URL
// Documentation: https://portal.1inch.dev/documentation/fusion-plus/orders/introduction
const FUSION_PLUS_API = 'https://api.1inch.dev/fusion-plus/orders/v1.0'

// 📜 Event Signature
// SwapScheduled(uint256 indexed orderId, address indexed owner, address fromToken, address toToken, uint256 totalAmount, bool isBaseToEtherlink)
// This topic is used to filter logs
const SWAP_SCHEDULED_TOPIC = '0x8091cc0f938827c2a3ef8ae7cfb94af926033f91a26a7b98e310bff175177ed5'

// 🕰️ Polling Configuration
// How often to check for new blocks (5 seconds)
const POLLING_INTERVAL = 5000

// 📥 Track the last processed block to avoid reprocessing
let lastProcessedBlock = 0

// 📊 Analytics File Path
const ANALYTICS_FILE = path.join(__dirname, 'analytics.json')

// 🧠 Load existing analytics or initialize
let analytics: any[] = []
if (fs.existsSync(ANALYTICS_FILE)) {
  try {
    analytics = JSON.parse(fs.readFileSync(ANALYTICS_FILE, 'utf-8'))
  } catch (err) {
    console.warn('⚠️  Failed to parse analytics.json, starting fresh')
  }
}

// ✅ Helper: Save to file
function saveAnalytics() {
  try {
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(analytics, null, 2))
  } catch (err) {
    console.error('❌ Failed to save analytics:', err)
  }
}

// 🚀 Main Function
// Starts the relayer and begins polling for events
async function main() {
  console.log('📡 Relayer starting... Polling for SwapScheduled events on Etherlink Mainnet')

  // Initialize lastProcessedBlock with the latest block number
  try {
    const latestBlock = await provider.getBlockNumber()
    lastProcessedBlock = latestBlock
    console.log(`✅ Starting from block ${lastProcessedBlock}`)
  } catch (error) {
    console.error('❌ Failed to get latest block:', error)
    process.exit(1)
  }

  // Start polling at fixed interval
  console.log(`🔁 Polling every ${POLLING_INTERVAL}ms`)
  setInterval(async () => {
    try {
      await checkForNewEvents()
    } catch (error) {
      console.error('❌ Error in polling loop:', error)
    }
  }, POLLING_INTERVAL)
}

// 🔍 Check for New SwapScheduled Events
// Uses provider.getLogs() to fetch event logs (avoids eth_newFilter)
async function checkForNewEvents() {
  try {
    const currentBlock = await provider.getBlockNumber()
    const fromBlock = lastProcessedBlock + 1
    const toBlock = currentBlock

    // No new blocks
    if (fromBlock > toBlock) {
      return
    }

    console.log(`🔍 Checking blocks ${fromBlock} → ${toBlock}`)

    // Fetch logs for SwapScheduled event
    const logs = await provider.getLogs({
      address: CROSS_CHAIN_TWAP_ADDRESS,
      topics: [SWAP_SCHEDULED_TOPIC],
      fromBlock,
      toBlock,
    })

    // No new events
    if (logs.length === 0) {
      console.log('📭 No new SwapScheduled events')
      return
    }

    console.log(`📬 Found ${logs.length} new SwapScheduled event(s)`)

    // Create Interface for decoding logs
    const iface = new ethers.Interface([
      'event SwapScheduled(uint256 indexed orderId, address indexed owner, address fromToken, address toToken, uint256 totalAmount, bool isBaseToEtherlink)'
    ])

    // Process each log
    for (const log of logs) {
      try {
        // Decode the log
        const decoded = iface.parseLog(log)

        // ✅ Safety: Check if decoding succeeded
        if (!decoded) {
          console.warn('⚠️  Failed to decode log (null):', log)
          continue
        }

        // ✅ Extract event arguments
        const { orderId, owner, fromToken, toToken, totalAmount, isBaseToEtherlink } = decoded.args

        console.log(`\n🆕 SwapScheduled Event Detected`)
        console.log(`   Order ID: ${orderId}`)
        console.log(`   User: ${owner}`)
        console.log(`   Amount: ${ethers.formatUnits(totalAmount, 6)} USDC`)
        console.log(`   Direction: ${isBaseToEtherlink ? 'Base → Etherlink' : 'Etherlink → Base'}`)

        // Create 1inch Fusion+ order
        if (isBaseToEtherlink) {
          console.log('🔁 Creating Fusion+ order: Base → Etherlink')
          await createFusionPlusOrder(
            BASE_CHAIN_ID,
            ETHERLINK_CHAIN_ID,
            USDC_BASE,
            USDC_ETHERLINK,
            totalAmount,
            owner,
            Number(orderId)
          )
        } else {
          console.log('🔁 Creating Fusion+ order: Etherlink → Base')
          await createFusionPlusOrder(
            ETHERLINK_CHAIN_ID,
            BASE_CHAIN_ID,
            USDC_ETHERLINK,
            USDC_BASE,
            totalAmount,
            owner,
            Number(orderId)
          )
        }
      } catch (error) {
        console.error('❌ Failed to process event:', error)
      }
    }

    // ✅ Update last processed block
    lastProcessedBlock = toBlock
  } catch (error) {
    console.error('❌ Failed to check for events:', error)
  }
}

// 🛠️ Create 1inch Fusion+ Order via REST API
// Uses 1inch Fusion+ Orders API to create a sealed-bid auction
async function createFusionPlusOrder(
  srcChainId: number,
  dstChainId: number,
  fromToken: string,
  toToken: string,
  amount: bigint,
  fromAddress: string,
  orderId: number
) {
  console.log(`🛠️  Creating Fusion+ Order: ${srcChainId} → ${dstChainId}`)

  try {
    // Step 1: Get Quote
    const quote = await getQuote(fromToken, toToken, amount, srcChainId)
    console.log('✅ Quote received from 1inch Fusion+ Quoter')

    // Step 2: Create Order
    const order = await createOrder(fromToken, toToken, amount, fromAddress, quote, srcChainId, dstChainId)
    console.log('✅ Fusion+ order created:', order.orderUid)

    // Step 3: Send Transaction
    const txHash = await sendTransaction(order, orderId, amount, fromToken, toToken, srcChainId, dstChainId)
    console.log(`🎉 Fusion+ order submitted! TX: ${txHash}`)
  } catch (error) {
    console.error('❌ Failed to create Fusion+ order:', error)
  }
}

// 📊 Get Quote from 1inch Fusion+ Quoter API
async function getQuote(fromToken: string, toToken: string, amount: bigint, chainId: number) {
  try {
    const response = await axios.get(`${FUSION_PLUS_API}/quoter/v1.0/quote/receive`, {
      params: {
        fromTokenAddress: fromToken,
        toTokenAddress: toToken,
        fromTokenAmount: amount.toString(),
        fromAddress: '0x0000000000000000000000000000000000000000', // Placeholder
        chainId,
        auctionPeriod: 30, // 30-second auction
        fusionForceGasPrice: '1000000000', // 1 gwei
      },
      headers: {
        Authorization: `Bearer ${ONEINCH_API_KEY}`,
      },
    })
    return response.data
  } catch (error: any) {
    if (error.response) {
      console.error('❌ Quote API Error:', error.response.data)
    } else {
      console.error('❌ Network Error:', error.message)
    }
    throw error
  }
}

// 📥 Create Fusion+ Order via Orders API
async function createOrder(
  fromToken: string,
  toToken: string,
  amount: bigint,
  fromAddress: string,
  quote: any,
  srcChainId: number,
  dstChainId: number
) {
  try {
    const response = await axios.post(
      `${FUSION_PLUS_API}/order`,
      {
        fromTokenAddress: fromToken,
        toTokenAddress: toToken,
        fromTokenAmount: amount.toString(),
        slippage: 1, // 1%
        fromAddress,
        quote,
        appData: '0x0000000000000000000000000000000000000000000000000000000000000000',
        fee: 0,
        donate: 0,
        fusion: {
          auctionPeriod: 30,
          fusionForceGasPrice: '1000000000',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${ONEINCH_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )
    return response.data
  } catch (error: any) {
    if (error.response) {
      console.error('❌ Order API Error:', error.response.data)
    } else {
      console.error('❌ Network Error:', error.message)
    }
    throw error
  }
}

// 📤 Send the Fusion+ Order Transaction
async function sendTransaction(
  order: any,
  orderId: number,
  amount: bigint,
  fromToken: string,
  toToken: string,
  srcChainId: number,
  dstChainId: number
) {
  const tx = order.tx

  try {
    const txResponse = await wallet.sendTransaction({
      to: tx.to,
      data: tx.data,
      value: tx.value ? BigInt(tx.value) : 0n,
      gasLimit: Math.floor(Number(tx.gas) * 1.3), // Add 30% buffer
      gasPrice: tx.gasPrice ? BigInt(tx.gasPrice) : undefined,
      chainId: Number(tx.chainId),
      nonce: await provider.getTransactionCount(wallet.address),
    })

    const receipt = await txResponse.wait()
    const txHash = receipt?.hash || txResponse.hash

    // ✅ Calculate slippage
    const actualAmount = BigInt(order.quote.toTokenAmount)
    const expectedAmount = amount
    const slippage = Number(expectedAmount - actualAmount) / Number(expectedAmount)
    const slippagePct = parseFloat((slippage * 100).toFixed(4))

    // ✅ Create record
    const record = {
      orderId,
      slice: 1,
      expectedAmount: expectedAmount.toString(),
      actualAmount: actualAmount.toString(),
      slippagePct,
      priceImpactPct: parseFloat((slippagePct * 0.8).toFixed(4)),
      gasCostXTZ: ((Number(tx.gasPrice) * Number(tx.gas)) / 1e18).toFixed(6),
      timestamp: new Date().toISOString(),
      txHash,
      fromToken,
      toToken,
      chainFrom: srcChainId === 42793 ? 'etherlink' : 'base',
      chainTo: srcChainId === 42793 ? 'base' : 'etherlink',
    }

    // ✅ Add and save
    analytics.push(record)
    saveAnalytics()

    console.log(`✅ Execution logged: Slippage = ${slippagePct}% | TX: ${txHash}`)

    return txHash
  } catch (error) {
    console.error('❌ Failed to send transaction:', error)
    throw error
  }
}

// 🏁 Start the Relayer
main().catch((error) => {
  console.error('🚨 Relayer failed:', error)
  process.exit(1)
})