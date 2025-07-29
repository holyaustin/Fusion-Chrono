import { ethers } from "ethers";
import * as dotenv from 'dotenv';
dotenv.config();

// Config
const SEPOLIA_RPC = process.env.SEPOLIA_RPC_URL!;
const ETHEREUM_BRIDGE = "0xf96773998743b0bd985769f0eA249099C5939Dc8"; // From deployment
const EXECUTOR_ADDRESS = "0xA2Aea35523a71EFf81283E32F52151F12D5CBB7F"; // From deployment
const INCH_API_KEY = process.env.INCH_API_KEY!;

// Initialize providers
const sepoliaProvider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
const etherlinkProvider = new ethers.JsonRpcProvider(
  process.env.ETHERLINK_TESTNET_RPC_URL!
);

// Contract ABIs
const TWAP_ABI = [
  "event ChunkInitiated(bytes32 orderId, uint256 chunkIndex, address tokenIn, address tokenOut, uint256 amount)"
];

const BRIDGE_ABI = [
  "event CrossChainTransfer(bytes32 indexed orderId, uint256 chunkIndex, address token, uint256 amount, address recipient)"
];

// Initialize contracts
const twap = new ethers.Contract(
  "0x...", // TWAPManager address
  TWAP_ABI,
  sepoliaProvider
);

const bridge = new ethers.Contract(
  ETHEREUM_BRIDGE,
  BRIDGE_ABI,
  sepoliaProvider
);

// Listen to events
twap.on("ChunkInitiated", async (orderId, chunkIndex, tokenIn, tokenOut, amount) => {
  console.log(`Chunk initiated: ${orderId} ${chunkIndex}`);
  
  // Lock tokens on bridge
  const lockTx = await bridge.lockTokens(
    orderId,
    chunkIndex,
    tokenIn,
    amount,
    EXECUTOR_ADDRESS
  );
  await lockTx.wait();
  console.log("Tokens locked on bridge");
});

bridge.on("CrossChainTransfer", async (orderId, chunkIndex, token, amount) => {
  console.log(`Cross-chain transfer detected: ${orderId} ${chunkIndex}`);
  
  // Get 1inch swap data
  const swapData = await get1InchSwapData(
    token,
    "0x...", // Output token on Etherlink
    amount
  );
  
  // Execute on Etherlink
  await executeOnEtherlink(
    orderId,
    chunkIndex,
    token,
    "0x...", // Output token
    amount,
    swapData
  );
});

async function get1InchSwapData(
  tokenIn: string,
  tokenOut: string,
  amount: bigint
): Promise<string> {
  const response = await fetch(
    `https://api.1inch.io/v5.0/128123/swap?` +
    `fromTokenAddress=${tokenIn}&` +
    `toTokenAddress=${tokenOut}&` +
    `amount=${amount.toString()}&` +
    `fromAddress=${EXECUTOR_ADDRESS}&` +
    `slippage=1`,
    {
      headers: { Authorization: `Bearer ${INCH_API_KEY}` }
    }
  );
  
  const data = await response.json();
  return data.tx.data;
}

async function executeOnEtherlink(
  orderId: string,
  chunkIndex: number,
  tokenIn: string,
  tokenOut: string,
  amount: bigint,
  swapData: string
) {
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, etherlinkProvider);
  const executor = new ethers.Contract(
    EXECUTOR_ADDRESS,
    ["function executeSwap(bytes32,uint256,address,address,uint256,bytes)"],
    wallet
  );
  
  const tx = await executor.executeSwap(
    orderId,
    chunkIndex,
    tokenIn,
    tokenOut,
    amount,
    swapData
  );
  
  console.log(`Swap executed on Etherlink: ${tx.hash}`);
}

console.log("Relayer started. Listening for events...");