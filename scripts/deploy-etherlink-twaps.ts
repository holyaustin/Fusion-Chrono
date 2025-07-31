// scripts/deploy-etherlink-twaps.ts
import { ethers } from "hardhat";

async function main() {
  const LZ_ENDPOINT = "0x137d4e9C2431A3DCBa6e615E9438F2c558353a17"; // Etherlink
  const OPTIMISM_EXECUTOR = "**FROM_ABOVE**"; // Paste address

  const Factory = await ethers.getContractFactory("CrossChainTWAP");
  const contract = await Factory.deploy(LZ_ENDPOINT, OPTIMISM_EXECUTOR);
  await contract.waitForDeployment();

  console.log("CrossChainTWAP deployed to:", await contract.getAddress());
}