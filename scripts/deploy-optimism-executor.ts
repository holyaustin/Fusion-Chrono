// scripts/deploy-optimism-executor.ts
import { ethers } from "hardhat";

async function main() {
  const LZ_ENDPOINT = "0x29864554C76b121cd2435962bfaF9AE72D2D5Aaf"; // Optimism Sepolia
  const ETHERLINK_TWAP = "PLACEHOLDER"; // Will fill after deployment

  const Factory = await ethers.getContractFactory("OptimismSwapExecutor");
  const contract = await Factory.deploy(LZ_ENDPOINT, ETHERLINK_TWAP);
  await contract.waitForDeployment();

  console.log("OptimismSwapExecutor deployed to:", await contract.getAddress());
  // ✅ Save this address
}