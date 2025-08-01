import axios from "axios";
import { ethers } from "hardhat";

/**
 * Script to test 1inch Fusion+ swap on Optimism Sepolia
 * This simulates what the relayer will do.
 */

const API_KEY = process.env.ONEINCH_API_KEY;
const URL = "https://api.1inch.dev/swap/v6.0/11155420"; // Optimism Sepolia

// Test tokens (use WETH, USDC)
const WETH = "0x4200000000000000000000000000000000000006";
const USDC = "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85";

/**
 * Get a quote for a Fusion+ swap
 */
async function getFusionQuote() {
  const response = await axios.get(`${URL}/quote`, {
    params: {
      fromTokenAddress: WETH,
      toTokenAddress: USDC,
      amount: ethers.parseUnits("0.1", 18), // 0.1 WETH
      chainId: 11155420,
      fusion: 1, // Enable Fusion+
      fusionForceGasPrice: "1000000000", // 1 gwei
    },
    headers: { Authorization: `Bearer ${API_KEY}` },
  });

  console.log("✅ Fusion Quote:", response.data);
  return response.data;
}

/**
 * Execute a Fusion+ swap
 */
async function executeFusionSwap() {
  const quote = await getFusionQuote();

  // Setup wallet
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, new ethers.JsonRpcProvider("https://sepolia.optimism.io"));

  const response = await axios.post(`${URL}/swap`, {
    fromAddress: await wallet.getAddress(),
    fromTokenAddress: WETH,
    toTokenAddress: USDC,
    amount: ethers.parseUnits("0.1", 18),
    quote: quote,
    slippage: 1, // 1%
    fusion: 1,
    senderAddress: await wallet.getAddress(),
  }, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });

  console.log("✅ Swap TX Data:", response.data.tx);
  return response.data.tx;
}

// Uncomment to test
// getFusionQuote();
// executeFusionSwap();

console.log("🔧 Script ready. Uncomment function calls to test.");