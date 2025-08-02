import { ethers } from "hardhat";

async function main() {
  const factory = await ethers.getContractFactory("CrossChainTWAP");
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  console.log("✅ CrossChainTWAP deployed to:", await contract.getAddress());
  // ✅ Save this address!
}

main().catch(console.error);