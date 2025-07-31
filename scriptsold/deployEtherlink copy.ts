import { ethers } from "hardhat";
import type { EtherlinkExecutor } from "../typechain-types";

// Config from Ethereum deployment
const ETHEREUM_BRIDGE = "0xf96773998743b0bd985769f0eA249099C5939Dc8"; // From previous output
const AGGREGATOR_PROXY = "0x1111111254EEB25477B68fb85Ed929f73A960582";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying with account:", deployer.address);
  
  const provider = ethers.provider;
  const balance = await provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy Executor
  const ExecutorFactory = await ethers.getContractFactory("EtherlinkExecutor");
  console.log("Getting Contract factory ...")
  const executor: EtherlinkExecutor = await ExecutorFactory.deploy(
    AGGREGATOR_PROXY,
    ETHEREUM_BRIDGE
  ) as unknown as EtherlinkExecutor;
    console.log("Awaiting Contract deployment ...")
  await executor.waitForDeployment();
  
  const executorAddress = await executor.getAddress();
  console.log("Executor deployed to:", executorAddress);
  
  // Output final config
  console.log("\nFinal Config:");
  console.log(`EXECUTOR_ADDRESS="${executorAddress}"`);

  // Properly close the Hardhat Runtime Environment
 // await hre.network.provider.send("hardhat_reset");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });


