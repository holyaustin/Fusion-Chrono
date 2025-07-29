import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with account:", deployer.address);
  
  // Deploy Bridge
  const Bridge = await ethers.getContractFactory("EthereumBridge");
  const bridge = await Bridge.deploy();
  await bridge.waitForDeployment();
  
  console.log("Bridge deployed to:", await bridge.getAddress());
  
  // Deploy TWAP Manager
  const TWAPManager = await ethers.getContractFactory("TWAPManager");
  const twap = await TWAPManager.deploy(await bridge.getAddress());
  await twap.waitForDeployment();
  
  console.log("TWAPManager deployed to:", await twap.getAddress());
  
  // Output for Etherlink setup
  console.log("\nEtherlink Config:");
  console.log(`TWAP_MANAGER_ADDRESS="${await twap.getAddress()}"`);
  console.log(`ETHEREUM_BRIDGE_ADDRESS="${await bridge.getAddress()}"`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});