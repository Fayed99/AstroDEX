# 🚀 AstroDEX Deployment Guide for Zama Protocol

This guide will help you deploy your fully encrypted DEX on Zama's blockchain.

## 📋 Prerequisites

1. **Node.js & npm** (v18+)
2. **Zama Testnet Tokens** - Get from [Zama Faucet](https://faucet.zama.ai)
3. **MetaMask** configured for Zama Devnet
4. **Private Key** for deployment account

## 🛠️ Installation

### 1. Install Hardhat Dependencies

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @nomicfoundation/hardhat-verify dotenv
```

### 2. Install Zama FHEVM Library

```bash
npm install fhevm
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Deployment
PRIVATE_KEY=your_private_key_here

# Zama Network
ZAMA_RPC_URL=https://devnet.zama.ai
ZAMA_API_KEY=not-needed

# Database (for backend)
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
```

⚠️ **IMPORTANT:** Never commit your `.env` file!

## 🌐 Network Configuration

### Zama Devnet Details:
- **RPC URL:** https://devnet.zama.ai
- **Chain ID:** 8009
- **Block Explorer:** https://explorer.zama.ai
- **Faucet:** https://faucet.zama.ai

### Add Zama Network to MetaMask:

The app will automatically prompt you, but manual config:
- Network Name: Zama Devnet
- RPC URL: https://devnet.zama.ai
- Chain ID: 8009
- Currency Symbol: ZAMA
- Block Explorer: https://explorer.zama.ai

## 📦 Smart Contracts

### Contracts Included:

1. **AstroDEX.sol** - Main DEX contract with:
   - Encrypted swaps using TFHE
   - Liquidity pools with encrypted reserves
   - Confidential balance management
   - AMM (Automated Market Maker) logic

2. **EncryptedERC20.sol** - Token contract with:
   - Fully encrypted balances
   - Encrypted transfers
   - Encrypted allowances
   - Compatible with DEX

## 🚀 Deployment Steps

### Step 1: Get Testnet Tokens

Visit the [Zama Faucet](https://faucet.zama.ai) and get testnet tokens for deployment.

### Step 2: Compile Contracts

```bash
npx hardhat compile
```

### Step 3: Deploy to Zama Devnet

```bash
npx hardhat run scripts/deploy.ts --network zama
```

This will deploy:
- ✅ AstroDEX main contract
- ✅ wETH (Wrapped Ether) token
- ✅ USDC token
- ✅ DAI token
- ✅ WBTC token

### Step 4: Save Contract Addresses

After deployment, copy the addresses from `deployed-addresses.json` and update:

**File:** `shared/schema.ts`

```typescript
export const CONTRACTS = {
  DEX_ADDRESS: '0x...', // Your deployed AstroDEX address
  TOKENS: {
    ETH: '0x...',  // wETH address
    USDC: '0x...', // USDC address
    DAI: '0x...',  // DAI address
    WBTC: '0x...', // WBTC address
  },
  RPC_URL: 'https://devnet.zama.ai',
  CHAIN_ID: 8009,
} as const;
```

### Step 5: Verify Contracts (Optional)

```bash
npx hardhat verify --network zama <CONTRACT_ADDRESS>
```

## 🔗 Integrate Frontend with Contracts

### 1. Update FHEVM Client

**File:** `client/src/lib/fhevm.ts`

The FHEVM service is already configured to use Zama's new relayer SDK (`@zama-fhe/relayer-sdk`).

```typescript
import { createInstance, initSDK, FhevmInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk/web';

export class FHEVMService {
  private static instance: FHEVMService | null = null;
  private fhevmClient: FhevmInstance | null = null;

  static async init(provider: any, chainId: number): Promise<FHEVMService> {
    if (!this.instance) {
      this.instance = new FHEVMService();
    }

    // Initialize the SDK
    await initSDK();

    // Configure for Zama devnet or use SepoliaConfig
    const config = chainId === 8009 ? {
      // Update these addresses with your deployed contract addresses
      verifyingContractAddressDecryption: '0x...',
      verifyingContractAddressInputVerification: '0x...',
      kmsContractAddress: '0x...',
      inputVerifierContractAddress: '0x...',
      aclContractAddress: '0x...',
      gatewayChainId: chainId,
      chainId: chainId,
      network: provider,
      relayerUrl: 'https://gateway.devnet.zama.ai',
    } : SepoliaConfig;

    this.instance.fhevmClient = await createInstance(config);
    return this.instance;
  }

  async encrypt(value: number, contractAddress: string, userAddress: string) {
    const encryptedInput = this.fhevmClient.createEncryptedInput(contractAddress, userAddress);
    encryptedInput.add64(BigInt(value));
    const encrypted = await encryptedInput.encrypt();

    // Convert Uint8Array to hex strings
    return {
      handle: '0x' + Array.from(encrypted.handles[0]).map(b => b.toString(16).padStart(2, '0')).join(''),
      proof: '0x' + Array.from(encrypted.inputProof).map(b => b.toString(16).padStart(2, '0')).join(''),
    };
  }

  async decrypt(encryptedValue: string, contractAddress: string) {
    const results = await this.fhevmClient.publicDecrypt([encryptedValue]);
    return Number(Object.values(results)[0]);
  }
}
```

**Important:** Before using the FHEVM service on Zama devnet, you must:
1. Deploy your contracts to Zama devnet
2. Update the contract addresses in `client/src/lib/fhevm.ts` (lines 23-27)
3. The system contracts (KMS, ACL, InputVerifier) addresses can be found in Zama's documentation

### 2. Relayer SDK Package

The project uses `@zama-fhe/relayer-sdk` (already installed). The old `fhevmjs` package is deprecated.

**Note:** The FHEVM client is automatically initialized when you connect your wallet in the DEX interface.

### 3. Add Contract ABIs

Copy generated ABIs from `artifacts/contracts/` to `client/src/contracts/`

## 📊 Testing Your DEX

### 1. Connect Wallet
- Open your DEX at http://localhost:5000
- Click "Connect Wallet"
- Approve Zama Devnet network
- Confirm connection

### 2. Get Test Tokens
You need to mint tokens to your wallet first:

```bash
npx hardhat run scripts/mint-tokens.ts --network zama
```

### 3. Create a Pool
- Go to "Liquidity" tab
- Click "Create Pool"
- Select two tokens (e.g., ETH/USDC)
- Enter amounts
- Approve transactions

### 4. Make a Swap
- Go to "Swap" tab
- Select tokens to swap
- Enter amount
- Click "Swap"
- Confirm transaction

### 5. View Encrypted Balances
- Go to "Portfolio" tab
- See your encrypted balances
- Click decrypt icon to view actual amounts

## 🔐 Security Features

### Fully Encrypted:
- ✅ All balances are encrypted on-chain
- ✅ Swap amounts remain confidential
- ✅ Pool reserves are encrypted
- ✅ Only you can decrypt your balances
- ✅ MEV protection (amounts hidden)

## 🐛 Troubleshooting

### Problem: "Insufficient balance" error
**Solution:** Make sure you've minted tokens to your wallet first

### Problem: "Pool does not exist"
**Solution:** Create the pool first via the UI or deployment script

### Problem: Transaction reverts
**Solution:** Check you have enough ZAMA for gas fees

### Problem: Can't decrypt balance
**Solution:** Ensure FHEVM client is properly initialized

## 📚 Additional Resources

- [Zama Documentation](https://docs.zama.ai)
- [FHEVM Docs](https://docs.zama.ai/fhevm)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Solidity Documentation](https://docs.soliditylang.org)

## 🎯 Next Steps

1. ✅ Deploy contracts
2. ✅ Update contract addresses
3. ✅ Mint test tokens
4. ✅ Create initial liquidity pools
5. ✅ Test swaps
6. ✅ Monitor transactions on Zama Explorer

## 💡 Pro Tips

- Always test on devnet first before mainnet
- Keep your private keys secure
- Use hardware wallets for production
- Monitor gas prices on Zama network
- Test all functions thoroughly
- Keep backups of contract addresses

## 🆘 Support

If you encounter issues:
- Check [Zama Discord](https://discord.gg/zama)
- Review [Zama GitHub Issues](https://github.com/zama-ai/fhevm)
- Open an issue in your repository

---

## 🌟 Your AstroDEX is Ready for Zama!

Once deployed, you'll have a **fully functional encrypted DEX** with:
- 🔐 Confidential trades
- 💧 Encrypted liquidity pools
- 📊 Private portfolio
- 🚀 MEV protection
- ✨ Beautiful cosmic UI

**Happy Trading Among the Stars!** 🌌✨
