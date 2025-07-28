import { FusionSDK, NetworkEnum } from '@1inch/fusion-sdk';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
dotenv.config();

// Correct Etherlink configuration
const ETHERLINK_CONFIG = {
  chainId: 128123,
  nativeToken: {
    symbol: 'XTZ',
    name: 'Tezos',
    address: '0x0000000000000000000000000000000000000000', // Use zero address for native token
    decimals: 18,
    wrapAddress: '0x169Ff9e0e8e0b1E054586aBea7Bd4fC1b4B6cC52' // Actual wXTZ on Ghostnet
  },
  rpcUrl: process.env.ETHERLINK_RPC_URL!,
  explorerUrl: 'https://testnet-explorer.etherlink.com'
};

async function main() {
  // 1. Initialize Etherlink provider
  const provider = new ethers.JsonRpcProvider(ETHERLINK_CONFIG.rpcUrl);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  console.log(`Using wallet: ${signer.address}`);

  // 2. Initialize Fusion SDK - no need for custom network config
  const sdk = new FusionSDK({
    url: 'https://fusion.1inch.io',
    network: NetworkEnum.ETHEREUM, // Works for EVM-compatible chains
    authKey: process.env.INCH_API_KEY,
    chainId: ETHERLINK_CONFIG.chainId
  });

  // 3. Prepare swap parameters (use wrapped token for native currency)
  const swapParams = {
    fromTokenAddress: ETHERLINK_CONFIG.nativeToken.wrapAddress, // Use wXTZ address
    toTokenAddress: process.env.MOCK_USDC_ADDRESS!,
    amount: ethers.parseEther('0.01').toString(),
    walletAddress: signer.address,
    preset: 'fast',
    fee: '1'
  };

  // 4. Check allowance and approve if needed
  const allowance = await sdk.getAllowance({
    tokenAddress: swapParams.fromTokenAddress,
    walletAddress: signer.address
  });
  
  if (BigInt(allowance) < BigInt(swapParams.amount)) {
    console.log('Approving token spend...');
    const approvalTx = await sdk.approveTokenSpender(
      swapParams.fromTokenAddress,
      swapParams.amount,
      signer
    );
    await approvalTx?.wait();
    console.log('Approval confirmed!');
  }

  // 5. Get swap quote
  const quote = await sdk.getQuote(swapParams);
  console.log('Fusion Quote:');
  console.log(`  From: ${quote.fromToken.symbol} ${ethers.formatUnits(quote.fromTokenAmount, quote.fromToken.decimals)}`);
  console.log(`  To: ${quote.toToken.symbol} ${ethers.formatUnits(quote.toTokenAmount, quote.toToken.decimals)}`);
  console.log(`  Estimated Gas: ${quote.estimatedGas}`);

  // 6. Place fusion order
  console.log('Placing Fusion order...');
  const orderResponse = await sdk.placeOrder(swapParams, {
    onOrder: (order) => order
  });

  console.log('Order placed!');
  console.log(`Order Hash: ${orderResponse.orderHash}`);
  console.log(`Monitor: https://fusion.1inch.io/#/${ETHERLINK_CONFIG.chainId}/order/${orderResponse.orderHash}`);

  // 7. Monitor order status
  const checkStatus = async () => {
    const status = await sdk.getOrderStatus(orderResponse.orderHash);
    console.log(`[${new Date().toLocaleTimeString()}] Status: ${status.status}`);
    
    if (status.status === 'filled') {
      console.log('✅ Swap successful!');
      console.log(`TX Hash: ${status.txHash}`);
      clearInterval(interval);
    } else if (status.status === 'cancelled' || status.status === 'expired') {
      console.log('❌ Order failed');
      clearInterval(interval);
    }
  };

  // Check every 20 seconds
  const interval = setInterval(checkStatus, 20000);
  checkStatus(); // Initial check
}

main().catch(console.error);