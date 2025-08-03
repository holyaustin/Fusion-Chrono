# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.ts
```
Etherlink ✅ CrossChainTWAP deployed to: 0xA2Aea35523a71EFf81283E32F52151F12D5CBB7F

Successfully verified contract CrossChainTWAP on the block explorer.
https://explorer.etherlink.com/address/0xA2Aea35523a71EFf81283E32F52151F12D5CBB7F#code



Base Deploy  CrossChainTWAP deployed to: 0xA2Aea35523a71EFf81283E32F52151F12D5CBB7F


Relayer Service (Node.js / TypeScript)
This relayer listens to SwapScheduled events from your CrossChainTWAP contract on Etherlink and Base, then uses 1inch Fusion+ API to execute cross-chain TWAP orders via Fusion auctions.

🧩 Relayer Responsibilities
Monitor both chains (Etherlink & Base) for SwapScheduled events.
Track order state (executed slices, timing).
Trigger 1inch Fusion+ auctions at each TWAP interval.
Submit winning quotes as transactions.
Update on-chain state via emitted SliceExecuted (off-chain only).
Handle cancellations and slippage checks.
Log, alert, retry on failure.