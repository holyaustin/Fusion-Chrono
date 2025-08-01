import { ethers } from "hardhat";
import * as fs from "fs";

// Load ABI from artifacts
const TWAP_ABI = JSON.parse(
  fs.readFileSync("artifacts/contracts/CrossChainTWAP.sol/CrossChainTWAP.json", "utf8")
).abi;

// Etherlink RPC
const ETHERLINK_RPC = "https://node.ghostnet.etherlink.com";

// Replace with your deployed contract address
const TWAP_ADDRESS = "**DEPLOYED_CROSSCHAIN_TWAP_ADDRESS**";

// Function to trigger 1inch swap (import from test script)
async function executeFusionSwap(amount: string) {
  // (Same logic as above)
  console.log(`🔁 Triggering 1inch Fusion+ swap for ${amount} tokens...`);
  // In production: call real API
}

async function startRelayer() {
  console.log("📡 Relayer starting...");

  const provider = new ethers.JsonRpcProvider(ETHERLINK_RPC);
  const contract = new ethers.Contract(TWAP_ADDRESS, TWAP_ABI, provider);

  console.log("✅ Relayer connected to Etherlink. Listening for SwapScheduled events...");

  // Listen for new swap orders
  contract.on("SwapScheduled", async (orderId, owner, fromToken, toToken, totalAmount) => {
    console.log(`🆕 SwapScheduled: ID ${orderId}, Owner: ${owner}, Amount: ${ethers.formatUnits(totalAmount)} tokens`);

    // Fetch full order details
    const order = await contract.getOrder(owner, (await contract.userOrders(owner)).indexOf(orderId));
    const sliceAmount = order.totalAmount / order.numSlices;

    // Execute each slice at interval
    for (let i = 0; i < Number(order.numSlices); i++) {
      const waitTime = Number(order.interval) * 1000;
      console.log(`⏳ Waiting ${order.interval} seconds before slice ${i + 1}...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));

      if (order.canceled) {
        console.log("❌ Swap was canceled. Stopping.");
        break;
      }

      console.log(`🚀 Executing slice ${i + 1}/${order.numSlices}...`);
      await executeFusionSwap(sliceAmount.toString());
    }

    console.log("✅ Swap completed.");
  });
}

startRelayer().catch(err => {
  console.error("❌ Relayer error:", err);
});