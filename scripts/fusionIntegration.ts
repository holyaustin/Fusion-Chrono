import { FusionSDK, NetworkEnum, OrderInfo } from '@1inch/fusion-sdk';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
dotenv.config();

// Custom Etherlink network configuration
const ETHERLINK_CONFIG = {
  chainId: 128123,
  nativeToken: {
    symbol: 'XTZ',
    name: 'Tezos',
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    decimals: 18,
    wrapAddress: '0xB1Ea698633d57705e93b0E40c1077d46CD6A51d8' // Replace with actual
  },
  rpcUrl: process.env.ETHERLINK_RPC_URL!,
  explorerUrl: 'https://testnet-explorer.etherlink.com'
};

async function main() {
  // 1. Initialize Etherlink provider
  const provider = new ethers.JsonRpcProvider(ETHERLINK_CONFIG.rpcUrl);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  console.log(`Using wallet: ${signer.address}`);

  // 2. Initialize Fusion SDK with custom network
  const sdk = new FusionSDK({
    url: 'https://fusion.1inch.io',
    network: NetworkEnum.ETHEREUM,
    authKey: process.env.INCH_API_KEY,
    chainId: ETHERLINK_CONFIG.chainId
  });

  // Add Etherlink network support
  //(sdk as any).config.setNetworkConfiguration(ETHERLINK_CONFIG);

  // 3. Prepare swap parameters
  const swapParams = {
    fromTokenAddress: ETHERLINK_CONFIG.nativeToken.address, // XTZ
    toTokenAddress: process.env.MOCK_USDC_ADDRESS!, // USDC
    amount: ethers.parseEther('0.01').toString(), // 0.01 XTZ
    walletAddress: signer.address,
    preset: 'fast', // Execution priority
    fee: '1', // 1% fee
    disableEstimate: false
  };

  // 4. Get swap quote
  const quote = await sdk.getQuote(swapParams);
  console.log('1inch Fusion Quote:');
  console.log(`- From: ${quote.fromToken.symbol} ${quote.fromTokenAmount}`);
  console.log(`- To: ${quote.toToken.symbol} ${quote.toTokenAmount}`);
  console.log(`- Estimated Gas: ${quote.estimatedGas}`);

  // 5. Place Fusion order
  console.log('Placing Fusion order...');
  const orderResponse = await sdk.placeOrder(
    swapParams,
    {
      onOrder: (order: OrderInfo) => {
        console.log('Order created:', order.orderHash);
        return order;
      }
    }
  );

  console.log('Order placed successfully!');
  console.log('Order Hash:', orderResponse.orderHash);
  console.log('Monitor at: https://fusion.1inch.io/#/128123/order/' + orderResponse.orderHash);

  // 6. Check order status periodically
  let orderStatus = await sdk.getOrderStatus(orderResponse.orderHash);
  console.log('Initial Status:', orderStatus.status);

  const checkStatus = async () => {
    orderStatus = await sdk.getOrderStatus(orderResponse.orderHash);
    console.log(`[${new Date().toLocaleTimeString()}] Status: ${orderStatus.status}`);
    
    if (orderStatus.status === 'filled') {
      console.log('✅ Swap completed successfully!');
      console.log('Transaction Hash:', orderStatus.txHash);
      clearInterval(interval);
    } else if (orderStatus.status === 'cancelled' || orderStatus.status === 'expired') {
      console.log('❌ Order failed:', orderStatus.status);
      clearInterval(interval);
    }
  };

  // Check every 15 seconds
  const interval = setInterval(checkStatus, 15000);
}

main().catch(console.error);