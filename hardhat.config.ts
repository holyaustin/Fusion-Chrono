import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@typechain/hardhat";
import dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  /**
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6"
  },
   */
  networks: {
    hardhat: {
      chainId: 31337,
      gasPrice: "auto",
      mining: {
        auto: true,
        interval: 5000
      }
    },

        // Base Mainnet
    base: {
      url: "https://base-mainnet.infura.io/v3/" + process.env.INFURA_KEY, //https://mainnet.base.org
      accounts: [process.env.PRIVATE_KEY || ""],
      chainId: 8453,
    },

    // Etherlink Mainnet
    etherlink: {
      url: "https://rpc.ankr.com/etherlink_mainnet",
      accounts: [process.env.PRIVATE_KEY || ""],
      chainId: 42793,
      timeout: 100000, // 100 seconds
      httpHeaders: { "User-Agent": "Hardhat/1.0" },
      // Add retry logic
      gasPrice: "auto",
      gasMultiplier: 1.2,
    },
  },
  etherscan: {
    apiKey: {
      etherlink: "abc",
      base: "abc",
    },
    customChains: [
      {
        network: "etherlink",
        chainId: 42793,
        urls: {
          apiURL: "https://explorer.etherlink.com/api",
          browserURL: "https://explorer.etherlink.com",
        },
      },
    {
      network: "base",
      chainId: 8453,
      urls: {
        apiURL: "https://base-mainnet.infura.io/v3/" + process.env.INFURA_KEY, //https://mainnet.base.org
        browserURL: "https://basescan.org/",
      },
    },
    ],
  },
    mocha: {
    timeout: 300000,
  },
};

export default config;