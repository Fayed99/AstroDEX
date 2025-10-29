import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying AstroDEX to Zama Network...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy encrypted ERC20 tokens
  console.log("📦 Deploying Encrypted Tokens...");

  const EncryptedERC20 = await ethers.getContractFactory("EncryptedERC20");

  // Deploy ETH token (wrapped)
  console.log("Deploying wETH...");
  const wETH = await EncryptedERC20.deploy(
    "Wrapped Ether",
    "wETH",
    ethers.parseEther("1000000") // 1M initial supply
  );
  await wETH.waitForDeployment();
  const wETHAddress = await wETH.getAddress();
  console.log("✅ wETH deployed to:", wETHAddress);

  // Deploy USDC
  console.log("Deploying USDC...");
  const USDC = await EncryptedERC20.deploy(
    "USD Coin",
    "USDC",
    ethers.parseUnits("10000000", 18) // 10M initial supply
  );
  await USDC.waitForDeployment();
  const USDCAddress = await USDC.getAddress();
  console.log("✅ USDC deployed to:", USDCAddress);

  // Deploy DAI
  console.log("Deploying DAI...");
  const DAI = await EncryptedERC20.deploy(
    "Dai Stablecoin",
    "DAI",
    ethers.parseUnits("10000000", 18) // 10M initial supply
  );
  await DAI.waitForDeployment();
  const DAIAddress = await DAI.getAddress();
  console.log("✅ DAI deployed to:", DAIAddress);

  // Deploy WBTC
  console.log("Deploying WBTC...");
  const WBTC = await EncryptedERC20.deploy(
    "Wrapped Bitcoin",
    "WBTC",
    ethers.parseUnits("100000", 18) // 100K initial supply
  );
  await WBTC.waitForDeployment();
  const WBTCAddress = await WBTC.getAddress();
  console.log("✅ WBTC deployed to:", WBTCAddress);

  console.log("\n🌟 Deploying AstroDEX Main Contract...");

  // Deploy AstroDEX
  const AstroDEX = await ethers.getContractFactory("AstroDEX");
  const dex = await AstroDEX.deploy();
  await dex.waitForDeployment();
  const dexAddress = await dex.getAddress();
  console.log("✅ AstroDEX deployed to:", dexAddress);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("\n📋 Contract Addresses:\n");
  console.log("AstroDEX:  ", dexAddress);
  console.log("wETH:      ", wETHAddress);
  console.log("USDC:      ", USDCAddress);
  console.log("DAI:       ", DAIAddress);
  console.log("WBTC:      ", WBTCAddress);
  console.log("\n" + "=".repeat(60));

  // Save addresses to file
  const fs = require("fs");
  const addresses = {
    network: "zama-devnet",
    chainId: 8009,
    contracts: {
      AstroDEX: dexAddress,
      tokens: {
        wETH: wETHAddress,
        USDC: USDCAddress,
        DAI: DAIAddress,
        WBTC: WBTCAddress,
      },
    },
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
  };

  fs.writeFileSync(
    "./deployed-addresses.json",
    JSON.stringify(addresses, null, 2)
  );

  console.log("\n✅ Contract addresses saved to deployed-addresses.json");

  // Update shared schema
  console.log("\n📝 Update your shared/schema.ts CONTRACTS object with these addresses:");
  console.log(`
export const CONTRACTS = {
  DEX_ADDRESS: '${dexAddress}',
  TOKENS: {
    ETH: '${wETHAddress}',
    USDC: '${USDCAddress}',
    DAI: '${DAIAddress}',
    WBTC: '${WBTCAddress}',
  },
  RPC_URL: 'https://devnet.zama.ai',
  CHAIN_ID: 8009,
} as const;
  `);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
