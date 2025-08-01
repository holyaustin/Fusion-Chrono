import { ethers } from "hardhat";

async function main() {
  const LZ_OAPP = "0x29864554C76b121cd2435962bfaF9AE72D2D5Aaf"; // Optimism Sepolia OApp
  const ETHERLINK_TWAP = "PLACEHOLDER";

  const Factory = await ethers.getContractFactory("OptimismSwapExecutor");
  const contract = await Factory.deploy(LZ_OAPP, ETHERLINK_TWAP);
  await contract.waitForDeployment();

  console.log("OptimismSwapExecutor deployed to:", await contract.getAddress());
}

main().catch(console.error);