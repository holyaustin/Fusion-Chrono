import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.25",
    networks: {
    etherlinkTestnet: {
      url: process.env.ETHERLINK_RPC_URL,
      // url: "https://node.ghostnet.etherlink.com",
      accounts: [process.env.PRIVATE_KEY!],
      chainId: 128123,
    }
  }
};

export default config;
