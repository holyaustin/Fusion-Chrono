import { ethers } from "ethers";
import * as dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

// Validate environment variables
const requiredEnvVars = [
  'SEPOLIA_RPC_URL',
  'ETHERLINK_TESTNET_RPC_URL',
  'ETHEREUM_BRIDGE_ADDRESS',
  'TWAP_MANAGER_ADDRESS',
  'EXECUTOR_ADDRESS',
  'INCH_API_KEY',
  'PRIVATE_KEY',
  'DEFAULT_TOKEN_OUT'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Configuration from environment
const SEPOLIA_RPC = process.env.SEPOLIA_RPC_URL!;
const ETHERLINK_RPC = process.env.ETHERLINK_TESTNET_RPC_URL!;
const ETHEREUM_BRIDGE_ADDRESS = process.env.ETHEREUM_BRIDGE_ADDRESS!;
const TWAP_MANAGER_ADDRESS = process.env.TWAP_MANAGER_ADDRESS!;
const EXECUTOR_ADDRESS = process.env.EXECUTOR_ADDRESS!;
const INCH_API_KEY = process.env.INCH_API_KEY!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const DEFAULT_TOKEN_OUT = process.env.DEFAULT_TOKEN_OUT!;

// Initialize providers
const sepoliaProvider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
const etherlinkProvider = new ethers.JsonRpcProvider(ETHERLINK_RPC);

// Full Contract ABIs including function signatures
const TWAP_ABI = [
  // Events
  "event ChunkInitiated(bytes32 orderId, uint256 chunkIndex, address tokenIn, address tokenOut, uint256 amount)",
  
  // Functions (if needed)
];

const BRIDGE_ABI = [
  // Events
  "event CrossChainTransfer(bytes32 indexed orderId, uint256 chunkIndex, address token, uint256 amount, address recipient)",
  
  // Functions - ADDED TO FIX ERROR
  "function lockTokens(bytes32 orderId, uint256 chunkIndex, address token, uint256 amount, address recipient)"
];

const EXECUTOR_ABI = [
  // Events
  "event SwapExecuted(bytes32 indexed orderId, uint256 indexed chunkIndex, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut)",
  
  // Functions - ADDED TO FIX ERROR
  "function executeSwap(bytes32 orderId, uint256 chunkIndex, address tokenIn, address tokenOut, uint256 amount, bytes calldata swapData) external"
];

// Initialize contracts
const twap = new ethers.Contract(
  TWAP_MANAGER_ADDRESS,
  TWAP_ABI,
  sepoliaProvider
);

const bridge = new ethers.Contract(
  ETHEREUM_BRIDGE_ADDRESS,
  BRIDGE_ABI,
  sepoliaProvider
);

const executor = new ethers.Contract(
  EXECUTOR_ADDRESS,
  EXECUTOR_ABI,
  etherlinkProvider
);

// Wallet for signing transactions
const sepoliaWallet = new ethers.Wallet(PRIVATE_KEY, sepoliaProvider);
const etherlinkWallet = new ethers.Wallet(PRIVATE_KEY, etherlinkProvider);

// In-memory order store
const orderStore: Record<string, { tokenOut: string }> = {};

// Enhanced logging with timestamp
function logWithTimestamp(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

// Listen to events
twap.on("ChunkInitiated", async (orderId, chunkIndex, tokenIn, tokenOut, amount) => {
  logWithTimestamp(`Chunk initiated: ${orderId} [Chunk ${chunkIndex}]`);
  
  // Store tokenOut for this order
  orderStore[orderId] = { tokenOut };
  
  try {
    logWithTimestamp("Locking tokens on Ethereum bridge...");
    
    // Create type-safe contract with signer
    const bridgeWithSigner = bridge.connect(sepoliaWallet) as ethers.Contract & {
      lockTokens: (
        orderId: string,
        chunkIndex: bigint,
        token: string,
        amount: bigint,
        recipient: string
      ) => Promise<ethers.ContractTransactionResponse>;
    };
    
    const tx = await bridgeWithSigner.lockTokens(
      orderId,
      chunkIndex,
      tokenIn,
      amount,
      EXECUTOR_ADDRESS
    );
    
    await tx.wait();
    logWithTimestamp(`✅ Tokens locked: ${tx.hash}`);
  } catch (error: any) {
    logWithTimestamp(`❌ Lock tokens failed: ${error.shortMessage || error.message}`);
  }
});

bridge.on("CrossChainTransfer", async (orderId, chunkIndex, token, amount, recipient) => {
  logWithTimestamp(`Cross-chain transfer: ${orderId} [Chunk ${chunkIndex}]`);
  
  try {
    // Get tokenOut from store or fallback to default
    let tokenOut = orderStore[orderId]?.tokenOut;
    if (!tokenOut) {
      logWithTimestamp("⚠️ Using default tokenOut from .env");
      tokenOut = DEFAULT_TOKEN_OUT;
    }
    
    // Get 1inch swap data
    const swapData = await get1InchSwapData(token, tokenOut, amount);
    
    // Execute on Etherlink
    await executeOnEtherlink(orderId, chunkIndex, token, tokenOut, amount, swapData);
  } catch (error: any) {
    logWithTimestamp(`❌ Cross-chain execution failed: ${error.shortMessage || error.message}`);
  }
});

// Listen to swap execution events
executor.on("SwapExecuted", (orderId, chunkIndex, tokenIn, tokenOut, amountIn, amountOut) => {
  logWithTimestamp(`✅ Swap executed: ${orderId} [Chunk ${chunkIndex}]`);
  logWithTimestamp(`   Input: ${ethers.formatUnits(amountIn, 18)} ${tokenIn}`);
  logWithTimestamp(`  Output: ${ethers.formatUnits(amountOut, 6)} ${tokenOut}`);
});

async function get1InchSwapData(
  tokenIn: string,
  tokenOut: string,
  amount: bigint
): Promise<string> {
  try {
    logWithTimestamp("Fetching 1inch swap data...");
    const response = await axios.get(
      `https://api.1inch.dev/swap/v5.2/128123/swap`,
      {
        params: {
          src: tokenIn,
          dst: tokenOut,
          amount: amount.toString(),
          from: EXECUTOR_ADDRESS,
          slippage: '1',
          disableEstimate: 'true'
        },
        headers: { 
          'Authorization': `Bearer ${INCH_API_KEY}`,
          'Accept': 'application/json'
        }
      }
    );
    
    return response.data.tx.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      throw new Error(`1inch API error: ${error.response?.data?.description || error.message}`);
    }
    throw new Error(`Unknown error: ${error.message}`);
  }
}

async function executeOnEtherlink(
  orderId: string,
  chunkIndex: bigint,
  tokenIn: string,
  tokenOut: string,
  amount: bigint,
  swapData: string
) {
  try {
    logWithTimestamp(`Executing swap on Etherlink: ${orderId} [Chunk ${chunkIndex}]`);
    
    // Create type-safe contract with signer
    const executorWithSigner = executor.connect(etherlinkWallet) as ethers.Contract & {
      executeSwap: (
        orderId: string,
        chunkIndex: bigint,
        tokenIn: string,
        tokenOut: string,
        amount: bigint,
        swapData: string,
        overrides?: ethers.ContractMethodArgs<any>[0]
      ) => Promise<ethers.ContractTransactionResponse>;
      
      estimateGas?: {
        executeSwap: (
          orderId: string,
          chunkIndex: bigint,
          tokenIn: string,
          tokenOut: string,
          amount: bigint,
          swapData: string
        ) => Promise<bigint>;
      };
    };
    
    // Prepare transaction parameters with default gas limit
    const txParams = {
      gasLimit: 3_000_000n // Sufficient for most Etherlink swaps
    };
    
    // Attempt gas estimation
    try {
      if (executorWithSigner.estimateGas?.executeSwap) {
        const estimatedGas = await executorWithSigner.estimateGas.executeSwap(
          orderId,
          chunkIndex,
          tokenIn,
          tokenOut,
          amount,
          swapData
        );
        txParams.gasLimit = estimatedGas * 120n / 100n; // 20% buffer
        logWithTimestamp(`Estimated gas: ${txParams.gasLimit.toString()}`);
      }
    } catch (estError) {
      logWithTimestamp(`⚠️ Gas estimation failed: ${(estError as Error).message}`);
    }
    
    // Execute transaction
    const tx = await executorWithSigner.executeSwap(
      orderId,
      chunkIndex,
      tokenIn,
      tokenOut,
      amount,
      swapData,
      txParams  // Transaction overrides as 7th argument
    );
    
    logWithTimestamp(`Transaction submitted: ${tx.hash}`);
    const receipt = await tx.wait();
    
    if (receipt?.status === 1) {
      logWithTimestamp(`✅ Execution confirmed in block ${receipt.blockNumber}`);
    } else {
      logWithTimestamp(`❌ Execution failed in block ${receipt?.blockNumber}`);
    }
  } catch (error: any) {
    logWithTimestamp(`❌ Execution error: ${error.shortMessage || error.message}`);
    
    // Implement retry logic
    logWithTimestamp("⚠️ Retrying swap execution in 15 seconds...");
    await new Promise(resolve => setTimeout(resolve, 15000));
    return executeOnEtherlink(orderId, chunkIndex, tokenIn, tokenOut, amount, swapData);
  }
}

// Startup log
logWithTimestamp("🚀 Relayer started. Listening for events...");
logWithTimestamp(`Sepolia RPC: ${SEPOLIA_RPC}`);
logWithTimestamp(`Etherlink RPC: ${ETHERLINK_RPC}`);
logWithTimestamp(`TWAP Manager: ${TWAP_MANAGER_ADDRESS}`);
logWithTimestamp(`Ethereum Bridge: ${ETHEREUM_BRIDGE_ADDRESS}`);
logWithTimestamp(`Executor: ${EXECUTOR_ADDRESS}`);
logWithTimestamp(`Default Token Out: ${DEFAULT_TOKEN_OUT}`);
logWithTimestamp("--------------------------------------------");