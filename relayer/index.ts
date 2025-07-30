import { ethers } from "ethers";
import * as dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

// Validate env vars
const requiredVars = ['SEPOLIA_RPC_URL','ETHERLINK_TESTNET_RPC_URL','ETHEREUM_BRIDGE_ADDRESS','TWAP_MANAGER_ADDRESS','EXECUTOR_ADDRESS','INCH_API_KEY','PRIVATE_KEY','DEFAULT_TOKEN_OUT'];
for (const envVar of requiredVars) if (!process.env[envVar]) throw new Error(`Missing ${envVar}`);

// Config
const SEPOLIA_RPC = process.env.SEPOLIA_RPC_URL!;
const ETHERLINK_RPC = process.env.ETHERLINK_TESTNET_RPC_URL!;
const ETH_BRIDGE_ADDR = process.env.ETHEREUM_BRIDGE_ADDRESS!;
const TWAP_MGR_ADDR = process.env.TWAP_MANAGER_ADDRESS!;
const EXEC_ADDR = process.env.EXECUTOR_ADDRESS!;
const INCH_API_KEY = process.env.INCH_API_KEY!;
const PRIV_KEY = process.env.PRIVATE_KEY!;
const DEF_TOKEN_OUT = process.env.DEFAULT_TOKEN_OUT!;

// Providers
const sepProvider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
const etlProvider = new ethers.JsonRpcProvider(ETHERLINK_RPC);

// ABIs
const TWAP_ABI = ["event ChunkInitiated(bytes32 orderId, uint256 chunkIndex, address tokenIn, address tokenOut, uint256 amount)"];
const BRIDGE_ABI = ["event CrossChainTransfer(bytes32 indexed orderId, uint256 chunkIndex, address token, uint256 amount, address recipient)","function lockTokens(bytes32 orderId, uint256 chunkIndex, address token, uint256 amount, address recipient)"];
const EXEC_ABI = ["event SwapExecuted(bytes32 indexed orderId, uint256 indexed chunkIndex, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut)","function executeSwap(bytes32 orderId, uint256 chunkIndex, address tokenIn, address tokenOut, uint256 amount, bytes calldata swapData) external"];

// Contracts
const twap = new ethers.Contract(TWAP_MGR_ADDR, TWAP_ABI, sepProvider);
const bridge = new ethers.Contract(ETH_BRIDGE_ADDR, BRIDGE_ABI, sepProvider);
const executor = new ethers.Contract(EXEC_ADDR, EXEC_ABI, etlProvider);

// Wallets
const sepWallet = new ethers.Wallet(PRIV_KEY, sepProvider);
const etlWallet = new ethers.Wallet(PRIV_KEY, etlProvider);

// Stores
const orderStore: Record<string, string> = {};
const processedEvents: Set<string> = new Set();

// Logging
function logTs(msg: string) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

// Get event topic
function getEventTopic(contract: ethers.Contract, eventName: string): string {
  return contract.interface.getEvent(eventName).topicHash;
}

// Poll events
async function pollEvents() {
  const INTERVAL = 15000;
  let lastBlock = await sepProvider.getBlockNumber() - 1;

  while (true) {
    try {
      const currentBlock = await sepProvider.getBlockNumber();
      if (currentBlock > lastBlock) {
        logTs(`Polling blocks ${lastBlock+1} to ${currentBlock}`);
        
        // Poll ChunkInitiated
        const chunkLogs = await sepProvider.getLogs({
          address: twap.target,
          topics: [getEventTopic(twap, "ChunkInitiated")],
          fromBlock: lastBlock + 1,
          toBlock: currentBlock
        });
        for (const log of chunkLogs) {
          const eventKey = `${log.transactionHash}-${log.index}`;
          if (processedEvents.has(eventKey)) continue;
          processedEvents.add(eventKey);
          const event = twap.interface.parseLog(log);
          handleChunkInitiated(event!.args[0], event!.args[1], event!.args[2], event!.args[3], event!.args[4]);
        }
        
        // Poll CrossChainTransfer
        const bridgeLogs = await sepProvider.getLogs({
          address: bridge.target,
          topics: [getEventTopic(bridge, "CrossChainTransfer")],
          fromBlock: lastBlock + 1,
          toBlock: currentBlock
        });
        for (const log of bridgeLogs) {
          const eventKey = `${log.transactionHash}-${log.index}`;
          if (processedEvents.has(eventKey)) continue;
          processedEvents.add(eventKey);
          const event = bridge.interface.parseLog(log);
          handleCrossChainTransfer(event!.args[0], event!.args[1], event!.args[2], event!.args[3], event!.args[4]);
        }
        
        lastBlock = currentBlock;
      }
      await new Promise(r => setTimeout(r, INTERVAL));
    } catch (error: any) {
      logTs(`Poll error: ${error.shortMessage || error.message}`);
      await new Promise(r => setTimeout(r, INTERVAL));
    }
  }
}

function handleChunkInitiated(orderId: string, chunkIndex: bigint, tokenIn: string, tokenOut: string, amount: bigint) {
  logTs(`Chunk initiated: ${orderId} [${chunkIndex}]`);
  orderStore[orderId] = tokenOut;
  (async () => {
    try {
      logTs("Locking tokens...");
      const bridgeWithSigner = bridge.connect(sepWallet);
      const tx = await bridgeWithSigner.lockTokens(orderId, chunkIndex, tokenIn, amount, EXEC_ADDR);
      await tx.wait();
      logTs(`✅ Tokens locked: ${tx.hash}`);
    } catch (error: any) {
      logTs(`Lock failed: ${error.shortMessage || error.message}`);
    }
  })();
}

function handleCrossChainTransfer(orderId: string, chunkIndex: bigint, token: string, amount: bigint, recipient: string) {
  logTs(`Cross-chain: ${orderId} [${chunkIndex}]`);
  (async () => {
    try {
      const tokenOut = orderStore[orderId] || DEF_TOKEN_OUT;
      if (!orderStore[orderId]) logTs("⚠️ Using default tokenOut");
      const swapData = await get1InchSwapData(token, tokenOut, amount);
      await executeOnEtherlink(orderId, chunkIndex, token, tokenOut, amount, swapData);
    } catch (error: any) {
      logTs(`Exec failed: ${error.shortMessage || error.message}`);
    }
  })();
}

// Listen to swap execution
executor.on("SwapExecuted", (orderId, chunkIndex, tokenIn, tokenOut, amountIn, amountOut) => {
  logTs(`✅ Swap executed: ${orderId} [${chunkIndex}]`);
  logTs(`   In: ${ethers.formatUnits(amountIn, 18)} ${tokenIn}`);
  logTs(`  Out: ${ethers.formatUnits(amountOut, 6)} ${tokenOut}`);
});

async function get1InchSwapData(tokenIn: string, tokenOut: string, amount: bigint): Promise<string> {
  try {
    logTs("Fetching 1inch data...");
    const res = await axios.get(`https://api.1inch.dev/swap/v5.2/128123/swap`, {
      params: {src: tokenIn, dst: tokenOut, amount: amount.toString(), from: EXEC_ADDR, slippage: '1', disableEstimate: 'true'},
      headers: {'Authorization': `Bearer ${INCH_API_KEY}`, 'Accept': 'application/json'}
    });
    return res.data.tx.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) throw new Error(`1inch error: ${error.response?.data?.description || error.message}`);
    throw new Error(`Error: ${error.message}`);
  }
}

async function executeOnEtherlink(orderId: string, chunkIndex: bigint, tokenIn: string, tokenOut: string, amount: bigint, swapData: string) {
  try {
    logTs(`Executing on Etherlink: ${orderId} [${chunkIndex}]`);
    const executorWithSigner = executor.connect(etlWallet);
    const tx = await executorWithSigner.executeSwap(orderId, chunkIndex, tokenIn, tokenOut, amount, swapData, {gasLimit: 3_000_000n});
    logTs(`TX submitted: ${tx.hash}`);
    const receipt = await tx.wait();
    receipt?.status === 1 
      ? logTs(`✅ Confirmed in block ${receipt.blockNumber}`)
      : logTs(`❌ Failed in block ${receipt?.blockNumber}`);
  } catch (error: any) {
    logTs(`Exec error: ${error.shortMessage || error.message}`);
    logTs("⚠️ Retrying in 15s...");
    await new Promise(r => setTimeout(r, 15000));
    return executeOnEtherlink(orderId, chunkIndex, tokenIn, tokenOut, amount, swapData);
  }
}

// Startup
logTs("🚀 Relayer started. Polling events...");
logTs(`Sepolia: ${SEPOLIA_RPC}`);
logTs(`Etherlink: ${ETHERLINK_RPC}`);
logTs(`TWAP: ${TWAP_MGR_ADDR}`);
logTs(`Bridge: ${ETH_BRIDGE_ADDR}`);
logTs(`Executor: ${EXEC_ADDR}`);
logTs(`Def Token: ${DEF_TOKEN_OUT}`);
pollEvents();

// Exit handlers
process.on('SIGINT', () => { logTs("🛑 SIGINT received"); process.exit(0); });
process.on('SIGTERM', () => { logTs("🛑 SIGTERM received"); process.exit(0); });