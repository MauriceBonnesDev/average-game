import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    sepolia: {
      url: "https://ethereum-sepolia-rpc.publicnode.com",
      accounts: [
        "91bdcd57bc7bb18114c37b781bfb16ea2b3aee55d075e2d7229620c00de753ce",
      ],
    },
    hardhat: {
      forking: {
        url: "https://ethereum.publicnode.com",
      },
    },
  },
};

export default config;
