require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("dotenv/config");

const config = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
      evmVersion: "cancun",
    },
  },
  networks: {
    // Zama Devnet
    zama: {
      url: process.env.ZAMA_RPC_URL || "https://devnet.zama.ai",
      chainId: 8009,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto",
    },
    // Local development (optional)
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  etherscan: {
    apiKey: {
      zama: process.env.ZAMA_API_KEY || "not-needed",
    },
    customChains: [
      {
        network: "zama",
        chainId: 8009,
        urls: {
          apiURL: "https://explorer.zama.ai/api",
          browserURL: "https://explorer.zama.ai",
        },
      },
    ],
  },
};

module.exports = config;
