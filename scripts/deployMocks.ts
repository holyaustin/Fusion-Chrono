import { ethers } from "hardhat";

async function main() {
  const USDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await USDC.deploy();
  console.log("MockUSDC deployed to:", usdc.address);
}