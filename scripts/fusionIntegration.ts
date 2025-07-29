import {
  FusionSDK,
  OrderStatus,
  PrivateKeyProviderConnector,
  type Web3Like
} from "@1inch/fusion-sdk";
import { Wallet, formatUnits, JsonRpcProvider, getAddress } from "ethers";
import * as dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

// Validate environment variables
const validateEnv = () => {
  const requiredVars = [
    'ETHERLINK_RPC_URL', 
    'PRIVATE_KEY', 
    'INCH_API_KEY',
    'MOCK_USDC_ADDRESS',
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

// Verify token addresses with 1inch API
async function verifyTokenAddresses(chainId: number, tokenAddresses: string[]) {
  try {
    const response = await axios.get(
      `https://api.1inch.dev/token/v1.2/${chainId}/token-list`,
      {
        headers: {
          Authorization: `Bearer ${process.env.INCH_API_KEY}`
        }
      }
    );
    
    const tokenList = response.data.tokens.map((t: any) => t.address.toLowerCase());
    
    return tokenAddresses.every(addr => 
      tokenList.includes(getAddress(addr).toLowerCase())
    );
  } catch (error) {
    console.error('Token verification failed:', error);
    return false;
  }
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

  // Initialize Fusion SDK with Etherlink chain ID
  const chainId = 128123; // Etherlink Ghostnet
  const sdk = new FusionSDK({
    url: "https://api.1inch.dev/fusion",
    network: chainId as any, // Bypass type check for custom chain
    blockchainProvider: connector,
    authKey: process.env.INCH_API_KEY!,
    chainId: chainId
  });

  // Verify token addresses
  const tokenAddresses = [
    process.env.WXTZ_ADDRESS!,
    process.env.MOCK_USDC_ADDRESS!
  ];
  
  if (!(await verifyTokenAddresses(chainId, tokenAddresses))) {
    throw new Error('One or more token addresses are not recognized by 1inch');
  }

  // Swap parameters: wXTZ to USDC
  const params = {
    fromTokenAddress: getAddress(process.env.WXTZ_ADDRESS!),
    toTokenAddress: getAddress(process.env.MOCK_USDC_ADDRESS!),
    amount: "10000000000000000", // 0.01 wXTZ (18 decimals)
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
    console.log(`  Monitor: https://fusion.1inch.io/#/${chainId}/order/${orderInfo.orderHash}`);

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
    
    // Detailed error diagnostics
    if (error.response) {
      console.error('API Response Data:', error.response.data);
      console.error('API Request Config:', {
        url: error.config.url,
        method: error.config.method,
        headers: error.config.headers,
        params: error.config.params
      });
    }
  }
}

main().catch(console.error);