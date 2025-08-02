import axios from "axios";
import { ethers } from "hardhat";

const API_KEY = process.env.ONEINCH_API_KEY;
const URL = "https://api.1inch.dev/swap/v6.0/11155420"; // Optimism Sepolia

// Test tokens (use WETH, USDC, etc.)
const WETH = "0x4200000000000000000000000000000000000006";
const USDC = "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85"; // 0x5fd84259d66Cd46123540766Be93DFE6D43130D7

async function getFusionQuote() {
  const response = await axios.get(`${URL}/quote`, {
    params: {
      fromTokenAddress: WETH,
      toTokenAddress: USDC,
      amount: ethers.parseUnits("0.1", 18),
      chainId: 11155420,
      fusion: 1,
      fusionForceGasPrice: "1000000000",
    },
    headers: { Authorization: `Bearer ${API_KEY}` },
  });

  console.log("Fusion Quote:", response.data);
  return response.data;
}

async function postFusionSwap() {
  const quote = await getFusionQuote();

  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, new ethers.JsonRpcProvider("https://sepolia.optimism.io"));

  const response = await axios.post(`${URL}/swap`, {
    fromAddress: await wallet.getAddress(),
    fromTokenAddress: WETH,
    toTokenAddress: USDC,
    amount: ethers.parseUnits("0.1", 18),
    quote: quote,
    slippage: 1,
    fusion: 1,
    senderAddress: await wallet.getAddress(),
  }, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });

  console.log("Swap TX:", response.data.tx);
  return response.data.tx;
}

// Run test
getFusionQuote();
// postFusionSwap();