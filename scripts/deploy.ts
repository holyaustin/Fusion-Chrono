import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Starting deployment of CrossChainTWAP...");

  // Get deployer info
  const [deployer] = await ethers.getSigners();
  console.log("🔑 Deployer address:", await deployer.getAddress());
  console.log("💰 Deployer balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy contract
  const TWAP = await ethers.getContractFactory("CrossChainTWAP");
  const twap = await TWAP.deploy();
  await twap.waitForDeployment();

  console.log("✅ CrossChainTWAP deployed to:", await twap.getAddress());

  // Optional: Print Etherscan verification command
  console.log("\n📝 To verify on Etherlink Explorer:");
  console.log(`npx hardhat verify --network etherlink ${await twap.getAddress()}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });