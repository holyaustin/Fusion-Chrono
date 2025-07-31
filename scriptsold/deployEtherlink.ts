import { ethers } from "hardhat";
import type { EtherlinkExecutor } from "../typechain-types";

// Config from Ethereum deployment
const ETHEREUM_BRIDGE = "0xf96773998743b0bd985769f0eA249099C5939Dc8";
const AGGREGATOR_PROXY = "0x1111111254EEB25477B68fb85Ed929f73A960582";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying with account:", deployer.address);
  
  const provider = ethers.provider;
  const balance = await provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  try {
    // Get current gas data with 50% premium
    const feeData = await provider.getFeeData();
    const baseGasPrice = feeData.gasPrice || ethers.parseUnits("40", "gwei");
    const gasPrice = (baseGasPrice * 15n) / 10n;
    console.log(`Using gas price: ${ethers.formatUnits(gasPrice, "gwei")} gwei`);

    // Deploy Executor
    const ExecutorFactory = await ethers.getContractFactory("EtherlinkExecutor");
    console.log("Getting Contract factory ...");
    
    // Calculate gas with buffer
    const deploymentTx = await ExecutorFactory.getDeployTransaction(
      AGGREGATOR_PROXY,
      ETHEREUM_BRIDGE
    );
    
    const estimatedGas = await provider.estimateGas(deploymentTx);
    const gasLimit = (estimatedGas * 12n) / 10n;
    console.log(`Estimated gas: ${estimatedGas.toString()}, Using: ${gasLimit.toString()}`);

    const executor = await ExecutorFactory.deploy(
      AGGREGATOR_PROXY,
      ETHEREUM_BRIDGE,
      {
        gasPrice,
        gasLimit
      }
    ) as unknown as EtherlinkExecutor;
    
    // Monitor deployment
    const tx = executor.deploymentTransaction();
    console.log("Transaction hash:", tx?.hash);
    console.log("Awaiting deployment (this may take 2-5 minutes)...");
    
    await executor.waitForDeployment();
    
    const executorAddress = await executor.getAddress();
    console.log("Executor deployed to:", executorAddress);
    
    // Output final config
    console.log("\nFinal Config:");
    console.log(`EXECUTOR_ADDRESS="${executorAddress}"`);

    // Wait for confirmations
    console.log("Waiting for 3 confirmations...");
    await tx?.wait(3);
    console.log("Deployment confirmed!");

  } catch (error: any) {
    console.error("Deployment failed:", error.message);
    
    if (error?.transactionHash) {
      console.log("Check transaction on explorer:");
      console.log(`https://testnet.explorer.etherlink.com/tx/${error.transactionHash}`);
    }
    
    process.exit(1);
  }
}

// Proper async handling
(async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.error("Unexpected error:", error);
    process.exit(2);
  }
})();