import { expect, jest } from '@jest/globals';
import { anvil } from 'prool/instances';
import Sdk from '@1inch/cross-chain-sdk';
import {
    computeAddress,
    ContractFactory,
    JsonRpcProvider,
    MaxUint256,
    parseEther,
    parseUnits,
    randomBytes,
    Wallet as SignerWallet
} from 'ethers';
import { uint8ArrayToHex, UINT_40_MAX } from '@1inch/byte-utils';
import assert from 'node:assert';
import { Address } from '@1inch/cross-chain-sdk';

// Load env
const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const INFURA_KEY = process.env.INFURA_KEY!;

// Chain IDs
const ETHERLINK_CHAIN_ID = 128123;
const BASE_CHAIN_ID = 8453;

// Tokens
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_ETHERLINK = "0x..."; // Mock or real

// Providers
const baseProvider = new JsonRpcProvider(`https://base-mainnet.infura.io/v3/${INFURA_KEY}`);
const etherlinkProvider = new JsonRpcProvider("https://node.mainnet.etherlink.com");

// Wallets
const userWallet = new SignerWallet(PRIVATE_KEY, etherlinkProvider);
const resolverWallet = new SignerWallet(PRIVATE_KEY, baseProvider);

async function createFusionPlusOrder() {
    console.log("🚀 Creating 1inch Fusion+ Cross-Chain Order");

    // Step 1: Create order
    const secret = uint8ArrayToHex(randomBytes(32));
    const order = Sdk.CrossChainOrder.new(
        new Address("0x..."), // EscrowFactory on Etherlink
        {
            salt: Sdk.randBigInt(1000n),
            maker: new Address(await userWallet.getAddress()),
            makingAmount: parseUnits("100", 6),
            takingAmount: parseUnits("99", 6),
            makerAsset: new Address(USDC_ETHERLINK),
            takerAsset: new Address(USDC_BASE)
        },
        {
            hashLock: Sdk.HashLock.forSingleFill(secret),
            timeLocks: Sdk.TimeLocks.new({
                srcWithdrawal: 10n,
                srcPublicWithdrawal: 120n,
                srcCancellation: 121n,
                dstWithdrawal: 10n,
                dstPublicWithdrawal: 100n,
                dstCancellation: 101n
            }),
            srcChainId: ETHERLINK_CHAIN_ID,
            dstChainId: BASE_CHAIN_ID,
            srcSafetyDeposit: parseEther("0.001"),
            dstSafetyDeposit: parseEther("0.001")
        },
        {
            auction: new Sdk.AuctionDetails({
                initialRateBump: 0,
                points: [],
                duration: 120n,
                startTime: BigInt(Math.floor(Date.now() / 1000))
            }),
            whitelist: [{ address: new Address(await resolverWallet.getAddress()), allowFrom: 0n }],
            resolvingStartTime: 0n
        },
        {
            nonce: Sdk.randBigInt(UINT_40_MAX),
            allowPartialFills: false,
            allowMultipleFills: false
        }
    );

    // Step 2: Sign order
    const signature = await userWallet.signMessage(order.getOrderHash(ETHERLINK_CHAIN_ID));
    console.log("✅ Order signed");

    // Step 3: Resolver fills order on Base
    // (In relayer)
    console.log("✅ Fusion+ order created and ready for resolver");
}

createFusionPlusOrder().catch(console.error);