import { ethers } from "hardhat";
import type { EthereumBridge, TWAPManager } from "../typechain-types";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with account:", deployer.address);
  
  // Use the provider from the hardhat runtime environment
  const provider = ethers.provider;
  const balance = await provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy Bridge
  const BridgeFactory = await ethers.getContractFactory("EthereumBridge");
  const bridge: EthereumBridge = await BridgeFactory.deploy() as unknown as EthereumBridge;
  await bridge.waitForDeployment();
  
  const bridgeAddress = await bridge.getAddress();
  console.log("Bridge deployed to:", bridgeAddress);
  
  // Deploy TWAP Manager
  const TWAPFactory = await ethers.getContractFactory("TWAPManager");
  const twap: TWAPManager = await TWAPFactory.deploy(bridgeAddress) as unknown as TWAPManager;
  await twap.waitForDeployment();
  
  const twapAddress = await twap.getAddress();
  console.log("TWAPManager deployed to:", twapAddress);
  
  // Grant TWAPManager access to bridge
  const EXECUTOR_ROLE = await bridge.EXECUTOR_ROLE();
  await bridge.grantRole(EXECUTOR_ROLE, twapAddress);
  console.log("Access granted to TWAPManager");

  // Output for Etherlink setup
  console.log("\nEtherlink Config:");
  console.log(`TWAP_MANAGER_ADDRESS="${twapAddress}"`);
  console.log(`ETHEREUM_BRIDGE_ADDRESS="${bridgeAddress}"`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});