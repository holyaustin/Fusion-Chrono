import {
  FusionSDK,
  NetworkEnum,
  PrivateKeyProviderConnector,
  Web3Like,
  AuctionDetails,
  FusionOrder,
  Whitelist,
  Address,
  now
} from "@1inch/fusion-sdk";
import { computeAddress, JsonRpcProvider } from "ethers";
import dotenv from 'dotenv';
dotenv.config();

// Configuration
const ETHERLINK_RPC_URL = process.env.ETHERLINK_RPC_URL!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const INCH_API_KEY = process.env.INCH_API_KEY!;
const MOCK_USDC_ADDRESS = process.env.MOCK_USDC_ADDRESS!;
const WXTZ_ADDRESS = '0x169Ff9e0e8e0b1E054586aBea7Bd4fC1b4B6cC52'; // wXTZ on Ghostnet

// Etherlink provider setup
const ethersRpcProvider = new JsonRpcProvider(ETHERLINK_RPC_URL);

const ethersProviderConnector: Web3Like = {
  eth: {
    call(transactionConfig): Promise<string> {
      return ethersRpcProvider.call(transactionConfig);
    },
  },
  extend(): void {},
};

const connector = new PrivateKeyProviderConnector(
  PRIVATE_KEY,
  ethersProviderConnector,
);

const sdk = new FusionSDK({
  url: "https://api.1inch.dev/fusion",
  network: NetworkEnum.ETHEREUM,
  blockchainProvider: connector,
  authKey: INCH_API_KEY,
});

async function main() {
  const walletAddress = computeAddress(PRIVATE_KEY);
  console.log(`Using wallet: ${walletAddress}`);
  
  // 1. Create custom Fusion order (USDC to wXTZ)
  const resolvingStartAt = now();
  
  const order = FusionOrder.new(
    new Address("0x0000000000000000000000000000000000000000"), // No extension
    {
      makerAsset: new Address(MOCK_USDC_ADDRESS),
      takerAsset: new Address(WXTZ_ADDRESS),
      makingAmount: "1000000", // 1 USDC (6 decimals)
      takingAmount: "10000000000000000", // 0.01 wXTZ
      maker: new Address(walletAddress),
      salt: BigInt(Date.now()).toString(),
    },
    {
      auction: new AuctionDetails({
        duration: 180n, // 3 minutes
        startTime: BigInt(resolvingStartAt),
        initialRateBump: 30000, // 30% initial bonus
        points: [
          {
            coefficient: 20000,
            delay: 60, // After 1 minute
          },
        ],
      }),
      whitelist: Whitelist.new(resolvingStartAt, [
        {
          address: new Address(walletAddress),
          delay: 0n,
        },
      ]),
    },
  );

  // 2. Build and submit order
  const builtOrder = order.build();
  console.log('Built order:', builtOrder);
  
  const extension = order.extension.encode();
  console.log('Order extension:', extension);
  
  try {
    console.log('Submitting custom order...');
    const orderInfo = await sdk.submitOrder(builtOrder, undefined, extension);
    console.log('Order submitted!');
    console.log('Order Hash:', orderInfo.orderHash);
    
    // 3. Monitor order status
    console.log('Waiting for order execution...');
    const startTime = Date.now();
    let orderStatus;
    
    do {
      await new Promise(resolve => setTimeout(resolve, 15000));
      orderStatus = await sdk.getOrderStatus(orderInfo.orderHash);
      console.log(`[${new Date().toLocaleTimeString()}] Status: ${orderStatus.status}`);
      
      if (orderStatus.status === OrderStatus.Filled) {
        console.log('✅ Swap successful!');
        console.log('Transaction Hash:', orderStatus.txHash);
        break;
      }
      
      if ([OrderStatus.Expired, OrderStatus.Cancelled].includes(orderStatus.status)) {
        console.log(`❌ Order failed: ${orderStatus.status}`);
        break;
      }
    } while (orderStatus.status === OrderStatus.Pending || orderStatus.status === OrderStatus.Verifying);

    console.log(`Order processed in ${(Date.now() - startTime)/1000} seconds`);
    
  } catch (error) {
    console.error('Order submission failed:', error);
  }
}

main();