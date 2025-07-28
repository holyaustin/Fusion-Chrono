import { FusionSDK } from '@1inch/fusion-sdk';
import { ethers } from 'ethers';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

// Configuration
const ETHERLINK_CHAIN_ID = 128123;
const INCH_API_URL = `https://api.1inch.io/v5.0/${ETHERLINK_CHAIN_ID}`;
const NATIVE_TOKEN = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

async function main() {
  // 1. Setup provider and signer
  const provider = new ethers.JsonRpcProvider(process.env.ETHERLINK_RPC_URL!);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  
  // 2. Get USDC balance
  const usdc = new ethers.Contract(
    process.env.MOCK_USDC_ADDRESS!,
    ['function balanceOf(address) view returns (uint256)'],
    signer
  );
  const balance = await usdc.balanceOf(signer.address);
  console.log(`mUSDC Balance: ${ethers.formatUnits(balance, 18)}`);

  // 3. Prepare reverse swap (USDC → XTZ)
  const swapData = await axios.get(`${INCH_API_URL}/swap`, {
    params: {
      fromTokenAddress: process.env.MOCK_USDC_ADDRESS,
      toTokenAddress: NATIVE_TOKEN,
      amount: ethers.parseUnits('1', 18).toString(), // 1 USDC
      fromAddress: signer.address,
      slippage: 1, // 1% slippage
      disableEstimate: true
    },
    headers: { Authorization: `Bearer ${process.env.INCH_API_KEY}` }
  });

  // 4. Execute swap using Fusion API
  const tx = await signer.sendTransaction({
    to: swapData.data.tx.to,
    data: swapData.data.tx.data,
    value: swapData.data.tx.value,
    gasLimit: 300000
  });

  console.log('Swap transaction sent:', tx.hash);
  const receipt = await tx.wait();
  console.log('Swap completed in block:', receipt.blockNumber);
  
  // 5. Verify new balance
  const newBalance = await usdc.balanceOf(signer.address);
  console.log(`New mUSDC Balance: ${ethers.formatUnits(newBalance, 18)}`);
}

main().catch(console.error);