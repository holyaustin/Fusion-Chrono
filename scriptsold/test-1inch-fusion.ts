import axios from "axios";
import { ethers } from "hardhat";

/**
 * ✅ 1inch Fusion+ Orders API Script
 * Fully compliant with Fusion+ sealed-bid auction system
 * Creates a real MEV-resistant order via Fusion+ Orders API
 * Docs: https://portal.1inch.dev/documentation/fusion-plus/orders/introduction
 */

const INFURA_KEY = process.env.INFURA_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ONEINCH_API_KEY = process.env.ONEINCH_API_KEY;

if (!INFURA_KEY) throw new Error("INFURA_KEY missing in .env");
if (!PRIVATE_KEY) throw new Error("PRIVATE_KEY missing in .env");
if (!ONEINCH_API_KEY) throw new Error("ONEINCH_API_KEY missing in .env");

// ✅ Fusion+ Orders API Base URL
const FUSION_PLUS_API = "https://api.1inch.dev/fusion-plus/orders/v1.0";

// Optimism Sepolia Chain ID
const CHAIN_ID = 11155420;

// Test Tokens
const WETH = "0x4200000000000000000000000000000000000006"; // WETH
const USDC = "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85"; // USDC

// Amount: 0.01 WETH
const AMOUNT_IN = ethers.parseUnits("0.01", 18).toString();

// Slippage tolerance (1%)
const SLIPPAGE = 1;

// Wallet
const wallet = new ethers.Wallet(PRIVATE_KEY);
const FROM_ADDRESS = wallet.address;

// Headers with API key
const HEADERS = {
  headers: {
    Authorization: `Bearer ${ONEINCH_API_KEY}`,
    "Content-Type": "application/json",
  },
};

async function main() {
  console.log("🔍 Creating 1inch Fusion+ sealed-bid auction order (MEV-resistant)...");

  // Step 1: Get Quote from Swap API (used in order)
  const quote = await getQuote();
  console.log("✅ Fusion+ quote obtained");

  // Step 2: Create Fusion+ Order
  const order = await createFusionPlusOrder(quote);
  console.log("✅ Fusion+ order created:", order.orderUid);

  // Step 3: Sign and send order transaction
  const txHash = await sendOrderTransaction(order);
  console.log(`🎉 Fusion+ order submitted! TX: https://sepolia-optimism.etherscan.io/tx/${txHash}`);

  // Step 4: Verify order is active
  await verifyActiveOrder(order.orderUid);
}

/**
 * Get quote from Swap API (required for Fusion+ order)
 * Fusion+ uses Swap API for pricing 
https://api.1inch.dev/swap/v6.1/10/quote
 */
async function getQuote() {
  try {
    const response = await axios.get("https://api.1inch.dev/swap/v6.1/11155420/quote", {
      params: {
        fromTokenAddress: WETH,
        toTokenAddress: USDC,
        amount: AMOUNT_IN,
        chainId: CHAIN_ID,
        // Fusion+ parameters
        fusion: 1,
        fusionForceGasPrice: "1000000000", // 1 gwei
      },
      headers: {
        Authorization: `Bearer ${ONEINCH_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error: any) {
    handleApiError(error, "Quote");
  }
}

/**
 * Create a Fusion+ order
 * POST /order
 */
async function createFusionPlusOrder(quote: any) {
  try {
    const response = await axios.post(
      `${FUSION_PLUS_API}/order`,
      {
        // Order Parameters
        fromTokenAddress: WETH,
        toTokenAddress: USDC,
        fromTokenAmount: AMOUNT_IN,
        slippage: SLIPPAGE,
        appData: "0x0000000000000000000000000000000000000000000000000000000000000000",
        fee: 0,
        donate: 0,

        // Auction Parameters
        fusion: {
          auctionPeriod: 30, // seconds (optional, default: 15-30s)
          forcedAuctionTrigger: "gasPrice", // or "time"
          fusionForceGasPrice: "1000000000", // 1 gwei
        },

        // Wallet
        fromAddress: FROM_ADDRESS,

        // Quote (from Swap API)
        quote: quote,
      },
      HEADERS
    );

    return response.data;
  } catch (error: any) {
    handleApiError(error, "Create Fusion+ Order");
  }
}

/**
 * Send the order's transaction (approve + swap)
 * The `order.tx` contains the calldata
 */
async function sendOrderTransaction(order: any) {
  const provider = new ethers.JsonRpcProvider(`https://sepolia.optimism.io`);
  const signer = new ethers.Wallet(PRIVATE_KEY!, provider);

  const tx = {
    to: order.tx.to,
    data: order.tx.data,
    value: BigInt(order.tx.value || 0),
    gasLimit: Math.floor(Number(order.tx.gas) * 1.3),
    gasPrice: order.tx.gasPrice ? BigInt(order.tx.gasPrice) : undefined,
    chainId: CHAIN_ID,
    nonce: await provider.getTransactionCount(FROM_ADDRESS),
  };

  console.log("📤 Broadcasting Fusion+ order transaction...");
  const sentTx = await signer.sendTransaction(tx);
  const receipt = await sentTx.wait();

  return receipt?.hash || sentTx.hash;
}

/**
 * Verify the order is active
 */
async function verifyActiveOrder(orderUid: string) {
  console.log("🔍 Verifying order is active...");

  try {
    const response = await axios.get(`${FUSION_PLUS_API}/order/active`, {
      params: { orderUids: orderUid },
      ...HEADERS,
    });

    const isActive = response.data.activeOrders.some((o: any) => o.orderUid === orderUid);
    console.log("✅ Order active:", isActive);
  } catch (error: any) {
    console.error("⚠️  Could not verify order status:", error.message);
  }
}

/**
 * Unified error handler
 */
function handleApiError(error: any, context: string) {
  console.error(`❌ ${context} failed:`);
  if (error.response) {
    console.error("Status:", error.response.status);
    console.error("Data:", error.response.data);
    if (error.response.status === 401) {
      console.error("🔧 Tip: Ensure API key has 'Fusion+' service enabled at https://portal.1inch.dev");
    }
    if (error.response.status === 404) {
      console.error("🔧 Tip: Check if Fusion+ is enabled for Optimism Sepolia");
    }
  } else {
    console.error("Network Error:", error.message);
  }
  process.exit(1);
}

// Run
main().catch((err) => {
  console.error("💀 Script failed:", err);
  process.exit(1);
});