import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.25",
    networks: {
    etherlinkTestnet: {
      url: "https://node.ghostnet.etherlink.com",
      accounts: [process.env.PRIVATE_KEY!]
    }
  }
};

export default config;
