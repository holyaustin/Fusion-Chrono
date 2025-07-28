import { FusionSDK, NetworkEnum } from '@1inch/fusion-sdk';
import { ethers } from 'hardhat';
import dotenv from 'dotenv';
dotenv.config();

const chainId = 128123; // Etherlink testnet

const sdk = new FusionSDK({
  url: 'https://fusion.1inch.io',
  network: NetworkEnum.ETHEREUM,
  authKey: process.env.INCH_API_KEY,
  chainId,
});

async function main() {
  const [signer] = await ethers.getSigners();
  console.log(`Using wallet: ${signer.address}`);

  // Use Etherlink native token (XTZ) address
  const nativeTokenAddress = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'; 
  
  // Swap 0.01 XTZ to mUSDC
  const quote = await sdk.getQuote({
    fromTokenAddress: nativeTokenAddress,
    toTokenAddress: '0x6e8238346D3336B205d2A6Ae360DC6D9B561e69d', // Replace with actual contract
    amount: ethers.parseEther('0.01').toString(),
    walletAddress: signer.address,
  });

  console.log('Quote received:', quote);
  
  // Place fusion order
  const { orderHash } = await sdk.placeOrder({
    fromTokenAddress: nativeTokenAddress,
    toTokenAddress: '0x6e8238346D3336B205d2A6Ae360DC6D9B561e69d',
    amount: ethers.parseEther('0.01').toString(),
    walletAddress: signer.address,
  }, {
    onOrder: (order) => order
  });

  console.log('Fusion order placed. Hash:', orderHash);

  // For ERC20 swaps
const approval = await sdk.approveTokenSpender(
  '0x6e8238346D3336B205d2A6Ae360DC6D9B561e69d',
  '1000000',
  signer
);
if (approval) await approval.wait();

}


main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

