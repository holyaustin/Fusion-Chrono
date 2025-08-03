# ✅ Final: `README.md` for **Fusion Chrono**  
With **Workflow Diagram**, **Slippage Page**, and Full Project Vision

---

# 🚀 Fusion Chrono  
### Cross-chain TWAP DEX Aggregator using 1inch Fusion+ on Etherlink

> **MEV-resistant, time-weighted swaps with real-time slippage analytics**  
> Bidirectional: **Etherlink ↔ Base**  
> Powered by **1inch Fusion+ Cross-Chain API**  
> Built for **low slippage, high security, and MEV protection**

---

## 🔍 Overview

**Fusion Chrono** enables users to execute **Time-Weighted Average Price (TWAP)** swaps across **Etherlink** and **Base**, leveraging **1inch Fusion+** sealed-bid auctions to **eliminate MEV** and **minimize slippage**.

Users schedule large swaps that are split into time-sliced executions, ensuring optimal price discovery without front-running.

---

### 2. Detailed Description  
**FusionChrono Router** is a decentralized exchange (DEX) aggregator that enables large-volume token swaps across Ethereum and Etherlink (Tezos L2) using Time-Weighted Average Price (TWAP) execution. It splits orders into smaller chunks executed over time to minimize slippage, while leveraging 1inch Fusion+ for MEV-resistant cross-chain routing. Key features include:  
- **Cross-Chain TWAP Engine**: Splits orders (e.g., $10k ETH→USDC into 4 chunks over 40 mins).  
- **1inch Fusion+ Integration**: Routes swaps through Etherlink’s L2 for low fees and intent-based settlement.  
- **Real-Time Slippage Analytics**: Compares savings vs. market orders using 1inch Data API.  
- **Decentralized Relayer Network**: Ensures secure Ethereum↔Etherlink message passing.  
Built for traders and institutions, FusionChrono eliminates front-running risks, reduces price impact, and provides institutional-grade execution on EVM-compatible chains.  

## 🌐 Key Features

| Feature | Description |
|--------|-------------|
| ✅ **MEV-Resistant Swaps** | Uses 1inch Fusion+ sealed-bid auctions |
| ✅ **Cross-Chain TWAP** | Splits large trades over time (e.g., 10 slices over 50 mins) |
| ✅ **Bi-Directional** | Etherlink ↔ Base (via Etherlink Bridge) |
| ✅ **Real-Time Slippage Analytics** | Live price impact & slippage tracking |
| ✅ **1inch Fusion+ API** | Cross-chain sealed-bid auction execution |
| ✅ **Smart Routing** | Best DEX path per slice via 1inch aggregation |
| ✅ **Gas-Optimized** | Low fees via Etherlink’s EVM + Tezos L1 security |

---

## 📦 Architecture Overview

```
+------------------+       +---------------------+
|                  |       |                     |
|   User Frontend  |<----->|  CrossChainTWAP.sol |
| (Next.js + Wagmi)|       | (Etherlink Mainnet) |
|                  |       |                     |
+--------+---------+       +----------+----------+
         |                            |
         | SwapScheduled Event        | Token Lock
         v                            v
+--------+---------+       +----------+----------+
|                  |       |                     |
|   Relayer        |<----->|  1inch Fusion+ API  |
| (Node.js + viem) |       | (Sealed-Bid Auctions)|
|                  |       |                     |
+--------+---------+       +----------+----------+
         |                            |
         | SliceExecuted (off-chain)  | Cross-Chain Swap
         v                            v
+--------+---------+       +----------+----------+
|                  |       |                     |
|   Analytics UI   |<------|  Slippage Dashboard  |
| (Real-Time Chart)|       | (Live Impact Data)  |
+------------------+       +---------------------+
```

---

## 🔗 Contracts & Addresses

| Contract | Chain | Address |
|--------|-------|---------|
| `CrossChainTWAP` | Etherlink Mainnet | [`0xA2Aea35523a71EFf81283E32F52151F12D5CBB7F`](https://explorer.etherlink.com/address/0xA2Aea35523a71EFf81283E32F52151F12D5CBB7F) |
| Etherlink Bridge | Etherlink Mainnet | `0x1f8E735f424B7A49A885571A2fA104E8C13C26c7` |
| 1inch Fusion+ API | Cross-Chain | [fusion.1inch.io](https://fusion.1inch.io) |


Etherlink ✅ CrossChainTWAP deployed to: 0xA2Aea35523a71EFf81283E32F52151F12D5CBB7F

Successfully verified contract CrossChainTWAP on the block explorer.
https://explorer.etherlink.com/address/0xA2Aea35523a71EFf81283E32F52151F12D5CBB7F#code
---

## 🧪 Workflow: How It Works

1. **User Schedules Swap**
   - Chooses: `fromToken`, `toToken`, `totalAmount`, `numSlices`, `interval`
   - Direction: `Etherlink → Base` or `Base → Etherlink`
   - Sets `minReturnAmount` (slippage tolerance)

2. **Frontend Locks Tokens**
   - `IERC20.transferFrom()` to `CrossChainTWAP` contract
   - Emits `SwapScheduled(orderId, owner, fromToken, toToken, totalAmount, isBaseToEtherlink)`

3. **Relayer Detects Event**
   - Listens via `viem.watchEvent()` on Etherlink
   - Fetches order details

4. **Relayer Triggers 1inch Fusion+ Auction**
   - Calls `POST /auction` with:
     - `fromChainId`, `toChainId`
     - `fromToken`, `toToken`, `amount`
     - `exclusiveRelayer`, `fusionMode: 'fusion'`
   - Sealed-bid auction prevents MEV

5. **Auction Settles**
   - 1inch executes swap via best DEX route
   - Funds bridged via Etherlink Bridge
   - Relayer logs `SliceExecuted` (off-chain)

6. **Slippage Analytics Updated**
   - Real-time comparison: `expected vs actual`
   - Price impact, volatility, gas cost per slice

---

## 📊 Slippage Analytics Dashboard

### Page: `/slippage`

> Real-time chart showing:
- ✅ **Slippage per slice**
- ✅ **Price impact**
- ✅ **Volatility index**
- ✅ **Gas cost trend**
- ✅ **Cumulative deviation**

### Features:
- 📈 Chart.js or Recharts visualization
- 🔁 Auto-refresh every 30s
- 📊 Export to CSV
- 🎯 Slippage tolerance alerts (toast/email)

### Sample Data:
| Slice | Expected (USDC) | Actual (USDC) | Slippage | Price Impact |
|------|------------------|---------------|--------|--------------|
| 1    | 100,000          | 99,850        | 0.15%  | 0.12%        |
| 2    | 100,000          | 99,900        | 0.10%  | 0.08%        |
| 3    | 100,000          | 99,700        | 0.30%  | 0.25%        |

> 🔍 Goal: Keep average slippage < 0.5%

---

## 🧩 Frontend Pages

| Page | Description |
|------|-------------|
| `/` | Landing: "Start App" + Connect Wallet |
| `/twap` | Schedule TWAP swap with token selector |
| `/orders` | View active/scheduled orders |
| `/slippage` | Real-time slippage analytics dashboard |
| `/relayer` | Relayer status & health (admin-only) |

---

## ⚙️ Relayer Service

### `listen-swap-events.ts`

- Listens to `SwapScheduled` on Etherlink
- Triggers 1inch Fusion+ cross-chain auction
- Tracks slice execution
- Updates off-chain analytics DB

## Relayer Service (Node.js / TypeScript)
This relayer listens to SwapScheduled events from your CrossChainTWAP contract on Etherlink and Base, then uses 1inch Fusion+ API to execute cross-chain TWAP orders via Fusion auctions.


### Run relayer 
npx ts-node listen-swap-events.ts

### Tech Stack:
- Node.js + `viem` + `axios`
- PostgreSQL (order tracking)
- Redis (caching)
- Cron (retry failed slices)

---

## 📦 Tech Stack

| Layer | Technology |
|------|------------|
| Frontend | Next.js 15, React, Tailwind CSS, Wagmi, RainbowKit |
| Smart Contract | Solidity, Hardhat, OpenZeppelin |
| Relayer | Node.js, viem, 1inch Fusion+ API |
| Analytics | Chart.js, Recharts, Socket.IO (real-time) |
| Hosting | Vercel (frontend), AWS EC2 (relayer) |
| Wallets | MetaMask (EVM), WalletConnect |

---

---

## 🚀 Run Locally

### 1. Clone Repo
```bash
git clone https://github.com/you/fusion-chrono.git
cd fusion-chrono
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Environment Variables
```env
# .env.local
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_w3id
ETHERLINK_RPC=https://node.mainnet.etherlink.com
BASE_RPC=https://mainnet.base.org
ONE_INCH_API_KEY=your_1inch_key
RELAYER_PRIVATE_KEY=0x...
```

### 4. Start Dev Server
```bash
npm run dev
```

Visit: `http://localhost:3000`

---

## 🌐 Deploy to Vercel

```bash
vercel
```

✅ Auto-deploys on push  
✅ Environment variables in dashboard  
✅ Custom domain support

---

## 📄 License

MIT

---

## 🙌 Acknowledgments

- [1inch Fusion+](https://fusion.1inch.io)
- [Etherlink](https://etherlink.com)
- [Base](https://base.org)
- [Wagmi](https://wagmi.sh)
- [RainbowKit](https://rainbowkit.com)

---



