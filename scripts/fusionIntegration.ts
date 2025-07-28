import {
  FusionSDK,
  NetworkEnum,
  OrderStatus,
  PrivateKeyProviderConnector,
  type Web3Like
} from "@1inch/fusion-sdk";
import { Wallet, formatUnits, JsonRpcProvider } from "ethers";
import * as dotenv from 'dotenv';

dotenv.config();

// Validate environment variables
const validateEnv = () => {
  const requiredVars = [
    'ETHERLINK_RPC_URL', 
    'PRIVATE_KEY', 
    'INCH_API_KEY',
    'USDC_ADDRESS',
    'WXTZ_ADDRESS'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
  
  // Validate private key format
  if (!process.env.PRIVATE_KEY!.startsWith('0x')) {
    throw new Error('PRIVATE_KEY must start with 0x');
  }
};

class EtherlinkProviderConnector implements Web3Like {
  private provider: JsonRpcProvider;

  constructor(rpcUrl: string) {
    this.provider = new JsonRpcProvider(rpcUrl);
  }

  eth = {
    call: (transactionConfig: any) => this.provider.call(transactionConfig)
  };

  extend() {}
}

async function main() {
  validateEnv();
  
  // Create wallet from private key
  const wallet = new Wallet(process.env.PRIVATE_KEY!);
  const walletAddress = wallet.address;
  console.log(`Using wallet: ${walletAddress}`);
  
  // Initialize provider connector
  const connector = new PrivateKeyProviderConnector(
    process.env.PRIVATE_KEY!,
    new EtherlinkProviderConnector(process.env.ETHERLINK_RPC_URL!)
  );

  // Initialize Fusion SDK
  const sdk = new FusionSDK({
    url: "https://api.1inch.dev/fusion",
    network: NetworkEnum.ETHEREUM,
    blockchainProvider: connector,
    authKey: process.env.INCH_API_KEY!,
  });

  // Swap parameters: wXTZ to USDC
  const params = {
    fromTokenAddress: process.env.WXTZ_ADDRESS!,
    toTokenAddress: process.env.MUSDC_ADDRESS!,
    amount: "1000000000000000", // 0.001 wXTZ (18 decimals)
    walletAddress: walletAddress,
    source: "fusion-chrono"
  };

  try {
    console.log('Fetching quote...');
    const quote = await sdk.getQuote(params);
    
    console.log('\nQuote Received:');
    console.log(`  From: ${formatUnits(quote.fromTokenAmount, 18)} wXTZ`);
    console.log(`  To: ${formatUnits(quote.toTokenAmount, 6)} USDC`);
    console.log(`  Recommended preset: ${quote.recommendedPreset}`);

    console.log('\nCreating order...');
    const preparedOrder = await sdk.createOrder(params);
    const orderInfo = await sdk.submitOrder(
      preparedOrder.order,
      preparedOrder.quoteId
    );
    
    console.log('\nOrder Submitted:');
    console.log(`  Order Hash: ${orderInfo.orderHash}`);
    console.log(`  Monitor: https://fusion.1inch.io/#/128123/order/${orderInfo.orderHash}`);

    // Monitor order status
    console.log('\nMonitoring order status...');
    const startTime = Date.now();
    let orderStatus;
    let attempts = 0;
    const maxAttempts = 20; // 5 minutes timeout
    
    while (attempts < maxAttempts) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 15000));
      
      try {
        orderStatus = await sdk.getOrderStatus(orderInfo.orderHash);
        console.log(`[Attempt ${attempts}] Status: ${orderStatus.status}`);
        
        if (orderStatus.status === OrderStatus.Filled) {
          console.log('\n✅ Swap successful!');
          console.log(`  Transaction Hash: ${orderStatus.txHash}`);
          console.log(`  Execution Time: ${(Date.now() - startTime)/1000} seconds`);
          return;
        }
        
        if ([OrderStatus.Expired, OrderStatus.Cancelled].includes(orderStatus.status)) {
          console.log(`\n❌ Order failed: ${orderStatus.status}`);
          return;
        }
      } catch (error) {
        console.error(`Status check error (attempt ${attempts}):`, error);
      }
    }
    
    console.log('\n⚠️ Order monitoring timed out after 5 minutes');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
  }
}

main().catch(console.error);