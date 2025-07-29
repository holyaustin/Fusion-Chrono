import { ethers } from "hardhat";

// Config from Ethereum deployment
const ETHEREUM_BRIDGE = "0x..."; // From previous output
const AGGREGATOR_PROXY = "0x1111111254EEB25477B68fb85Ed929f73A960582"; // 1inch universal

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with account:", deployer.address);
  
  // Deploy Executor
  const Executor = await ethers.getContractFactory("EtherlinkExecutor");
  const executor = await Executor.deploy(AGGREGATOR_PROXY, ETHEREUM_BRIDGE);
  await executor.waitForDeployment();
  
  console.log("Executor deployed to:", await executor.getAddress());
  
  console.log("\nFinal Config:");
  console.log(`EXECUTOR_ADDRESS="${await executor.getAddress()}"`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});