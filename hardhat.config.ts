import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.24",
    networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY!]
    },
    etherlinkTestnet: {
      url: process.env.ETHERLINK_TESTNET_RPC_URL,
      accounts: [process.env.PRIVATE_KEY!],
      chainId: 128123
    },
    etherlinkMainnet: {
      url: "https://node.mainnet.etherlink.com",
      accounts: [process.env.PRIVATE_KEY!],
    },
    etherlinkTestnet2: {
      url: process.env.ETHERLINK_RPC_URL,
      // url: "https://node.ghostnet.etherlink.com",
      accounts: [process.env.PRIVATE_KEY!],
      chainId: 128123,
    }
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
