import { ethers } from "hardhat";

async function main() {
  const LZ_OAPP = "0x137d4e9C2431A3DCBa6e615E9438F2c558353a17"; // Etherlink OApp
  const OPTIMISM_EXECUTOR = "PASTE_FROM_ABOVE";

  const Factory = await ethers.getContractFactory("CrossChainTWAP");
  const contract = await Factory.deploy(LZ_OAPP, OPTIMISM_EXECUTOR);
  await contract.waitForDeployment();

  console.log("CrossChainTWAP deployed to:", await contract.getAddress());
}

main().catch(console.error);