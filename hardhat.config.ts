import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.25",
    networks: {
    etherlinkTestnet: {
      url: "https://node.ghostnet.etherlink.com",
      accounts: ["e14d8ec28319e6529455e87a7bb4d158d06e3b6038bdf6962364c2073b1bb75b"]
    }
  }
};

export default config;
