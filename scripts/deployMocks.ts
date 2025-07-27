import { ethers } from "hardhat";

async function main() {
  const USDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await USDC.deploy();
  await usdc.waitForDeployment();
  const receipt = await ethers.provider.getTransactionReceipt(usdc.deploymentTransaction()?.hash!);
  console.log('MockUSDC is deployed to:', receipt?.contractAddress);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });