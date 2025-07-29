import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@typechain/hardhat";
import dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6"
  },
  networks: {
    hardhat: {
      chainId: 31337,
      gasPrice: "auto",
      mining: {
        auto: true,
        interval: 5000
      }
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY!]
    },
    etherlinkTestnet: {
      url: process.env.ETHERLINK_RPC_URL,
      accounts: [process.env.PRIVATE_KEY!],
      chainId: 128123,
      gasPrice: 40000000000, // 40 Gwei (higher than recommended min)
      gasMultiplier: 1.5, // 50% buffer for estimation errors
      timeout: 180000 // 3 minutes timeout
    },
    etherlinkMainnet: {
      url: "https://node.mainnet.etherlink.com",
      accounts: [process.env.PRIVATE_KEY!],
      gasPrice: "auto",
      gasMultiplier: 1.2
    },
  },
  etherscan: {
    apiKey: {
      etherlinkMainnet: "DUMMY",
      etherlinkTestnet: "DUMMY",
    },
    customChains: [
      {
        network: "etherlinkMainnet",
        chainId: 42793,
        urls: {
          apiURL: "https://explorer.etherlink.com/api",
          browserURL: "https://explorer.etherlink.com",
        },
      },
      {
        network: "etherlinkTestnet",
        chainId: 128123,
        urls: {
          apiURL: "https://testnet.explorer.etherlink.com/api",
          browserURL: "https://testnet.explorer.etherlink.com",
        },
      },
    ],
  }
};

export default config;