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
MockUSDC is deployed to: 0x6e8238346D3336B205d2A6Ae360DC6D9B561e69d
or
MockUSDC is deployed to: 0xe779d84204c509ed345C3a6E5Efd5dBB2B849E99


Bridge deployed to: 0xf96773998743b0bd985769f0eA249099C5939Dc8
TWAPManager deployed to: 0xEcbA90B3c6CD139919A76FfF6b5e6185931F1e3B
Access granted to TWAPManager

Etherlink Config:
TWAP_MANAGER_ADDRESS="0xEcbA90B3c6CD139919A76FfF6b5e6185931F1e3B"
ETHEREUM_BRIDGE_ADDRESS="0xf96773998743b0bd985769f0eA249099C5939Dc8"


Executor deployed to: 0xA2Aea35523a71EFf81283E32F52151F12D5CBB7F
Final Config:
EXECUTOR_ADDRESS="0xA2Aea35523a71EFf81283E32F52151F12D5CBB7F"

// Full Contract ABIs including function signatures
const TWAP_ABI = [
  // Events
  "event ChunkInitiated(bytes32 orderId, uint256 chunkIndex, address tokenIn, address tokenOut, uint256 amount)",
  
  // Functions (if needed)
];

const BRIDGE_ABI = [
  // Events
  "event CrossChainTransfer(bytes32 indexed orderId, uint256 chunkIndex, address token, uint256 amount, address recipient)",
  
  // Functions - ADDED TO FIX ERROR
  "function lockTokens(bytes32 orderId, uint256 chunkIndex, address token, uint256 amount, address recipient)"
];

const EXECUTOR_ABI = [
  // Events
  "event SwapExecuted(bytes32 indexed orderId, uint256 indexed chunkIndex, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut)",
  
  // Functions - ADDED TO FIX ERROR
  "function executeSwap(bytes32 orderId, uint256 chunkIndex, address tokenIn, address tokenOut, uint256 amount, bytes calldata swapData) external"
];
