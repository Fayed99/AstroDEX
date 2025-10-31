# AstroDEX - Confidential Decentralized Exchange

A fully confidential decentralized exchange (DEX) built on Zama's FHEVM (Fully Homomorphic Encryption Virtual Machine) technology. Trade cryptocurrencies with complete privacy - all transaction amounts, balances, and trading activity remain encrypted end-to-end.

**GitHub:** https://github.com/Fayed99/AstroDEX

> **⚠️ Project Status:** This is a proof-of-concept/educational implementation demonstrating FHEVM concepts. See [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md) for details on current limitations and production readiness.

## Recent Updates

### FHE Contract Migration (Latest)
- ✅ Migrated to `@fhevm/solidity` v0.7+ (latest stable API)
- ✅ Fixed critical TFHE.decrypt() pattern issues
- ✅ Implemented proper FHE.select() conditional logic
- ✅ Updated to new encrypted input types (externalEuint64)
- ✅ Added IR-based compilation for complex FHE operations
- ✅ Documented FHE limitations (division constraints)

### Features
- ✅ Added CSV export for transaction history
- ✅ Fixed export button functionality

## Features

- **Fully Encrypted Trading**: All balances and transaction amounts are encrypted using homomorphic encryption
- **Token Swaps**: Perform confidential token swaps with automated market maker (AMM) pricing
- **Liquidity Pools**: Create and manage encrypted liquidity pools
- **Portfolio Management**: View your encrypted balances with optional decryption
- **Analytics Dashboard**: Track trading volume, pool statistics, and market trends
- **Transaction History**: Monitor your trading activity with filtering and CSV export
- **MEV Protection**: Transaction amounts remain hidden, protecting against front-running
- **Modern UI**: Sleek, responsive interface built with React and Tailwind CSS

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast builds and development
- **Tailwind CSS** for styling
- **Shadcn/ui** component library (Radix UI primitives)
- **TanStack Query** for server state management
- **Wouter** for client-side routing
- **Recharts** for analytics visualization

### Backend
- **Express.js** with TypeScript
- **Drizzle ORM** for database operations
- **PostgreSQL** (via Neon serverless)
- RESTful API architecture

### Blockchain
- **@fhevm/solidity** (v0.7+) for homomorphic encryption
- **@zama-fhe/oracle-solidity** for decryption oracle integration
- **Solidity 0.8.24** smart contracts
- **Hardhat** for contract compilation and deployment
- **MetaMask** for wallet integration

## Project Structure

```
AstroDEX/
├── client/                # Frontend React application
│   ├── public/           # Static assets
│   └── src/
│       ├── components/   # React components
│       ├── lib/          # Utilities and services
│       └── pages/        # Page components
├── contracts/            # Solidity smart contracts
│   ├── AstroDEX.sol     # Main DEX contract
│   └── EncryptedERC20.sol # Encrypted token standard
├── scripts/              # Deployment scripts
│   └── deploy.ts        # Contract deployment
├── server/               # Backend Express server
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Data storage layer
│   ├── fhevm.ts         # FHEVM integration
│   └── priceOracle.ts   # Price fetching service
└── shared/               # Shared types and schemas
```

## Installation

### Prerequisites
- Node.js v18 or higher
- npm or yarn
- MetaMask browser extension
- Zama Devnet testnet tokens ([Get from faucet](https://faucet.zama.ai))

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Fayed99/AstroDEX.git
   cd AstroDEX
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the project root:
   ```env
   # Database
   DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

   # Zama Network
   ZAMA_RPC_URL=https://devnet.zama.ai
   PRIVATE_KEY=your_private_key_here
   ```

4. **Initialize the database** (optional)
   ```bash
   npm run db:push
   ```

## Development

### Run the development server

**Option 1: Direct (works on all platforms)**
```bash
npx tsx server/index.ts
```

**Option 2: Using npm script (Mac/Linux)**
```bash
npm run dev
```

**Note for Windows users:** The `npm run dev` script uses Unix-style environment variables. Use Option 1, or install `cross-env` to fix the script.

The application will be available at `http://localhost:5000`

### Build for production
```bash
npm run build
npm start
```

### Type checking
```bash
npm run check
```

## Smart Contracts

### FHEVM Integration (Updated)

**⚠️ Important:** The contracts have been updated to use the latest `@fhevm/solidity` package (v0.7+). Key changes:

#### Migration from Deprecated API
- **Old:** `import "fhevm/lib/TFHE.sol"` → **New:** `import "@fhevm/solidity/lib/FHE.sol"`
- **Old:** `einput` type → **New:** `externalEuint64`
- **Old:** `TFHE.asEuint64()` → **New:** `FHE.fromExternal()`
- **Old:** `contract extends SepoliaZamaFHEVMConfig` → **New:** `contract extends SepoliaConfig`

#### Critical FHE Pattern: No Synchronous Decryption!

**❌ WRONG (Old Pattern):**
```solidity
euint64 balance = encryptedBalances[user];
require(TFHE.decrypt(TFHE.ge(balance, amount)), "Insufficient balance");
```

**✅ CORRECT (New Pattern):**
```solidity
euint64 balance = encryptedBalances[user];
ebool hasEnough = FHE.ge(balance, amount);
euint64 transferValue = FHE.select(hasEnough, amount, FHE.asEuint64(0));
// Transfer happens without decryption!
```

**Why?** Decryption in transactions is:
- Asynchronous (requires off-chain KMS)
- Expensive (gas costs)
- Breaks privacy (reveals encrypted values)
- Not supported in fhevm transaction logic

Use `FHE.select()` for conditional logic on encrypted values!

#### FHE Limitations

**Division:** Only plaintext divisors supported
```solidity
✅ FHE.div(encryptedValue, 100)  // OK - plaintext divisor
❌ FHE.div(encrypted1, encrypted2) // ERROR - encrypted divisor
```

This limits AMM implementations. The swap function uses a simplified approximation due to this constraint.

### AstroDEX Contract

The main DEX contract (`contracts/AstroDEX.sol`) provides:
- **Encrypted token swaps** using simplified AMM (due to FHE division limitations)
- **Liquidity pool creation and management**
- **Encrypted balance tracking**
- **Confidential reserve management**
- **FHE.select() pattern for conditional operations**

Key functions:
- `createPool()` - Create a new liquidity pool with encrypted reserves
- `swap()` - Execute encrypted token swaps (simplified AMM formula)
- `addLiquidity()` - Add liquidity to pools with encrypted amounts
- `deposit()` - Deposit tokens for encrypted balance
- `getBalance()` - Retrieve encrypted balance (user can decrypt client-side)

### EncryptedERC20 Contract

Implements ERC20-like functionality with fully encrypted balances:
- `transfer()` - Transfer encrypted amounts
- `approve()` - Approve encrypted allowances
- `transferFrom()` - Transfer with encrypted allowance checking
- Uses `FHE.select()` for balance validation without decryption

### Compilation Requirements

The contracts use the IR-based compiler pipeline for optimization:

```javascript
// hardhat.config.cjs
settings: {
  optimizer: { enabled: true, runs: 200 },
  viaIR: true,  // Required for complex FHE operations
  evmVersion: "cancun"
}
```

### Deployment

1. **Compile contracts**
   ```bash
   npm run compile
   ```

2. **Deploy to Zama Devnet**
   ```bash
   npx hardhat run scripts/deploy.ts --network zama
   ```

3. **Update contract addresses**

   After deployment, update the contract addresses in `shared/schema.ts`

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

## API Endpoints

### Swap
```
POST /api/swap
Body: { fromToken, toToken, amount, orderType, limitPrice? }
```

### Liquidity Management
```
POST /api/liquidity/add
Body: { tokenA, tokenB, amountA, amountB }

POST /api/liquidity/remove
Body: { tokenA, tokenB, lpTokens }
```

### Pool Management
```
POST /api/pool/create
Body: { tokenA, tokenB, amountA, amountB, fee }

GET /api/pools
Returns: List of all liquidity pools
```

### Portfolio
```
GET /api/transactions/:walletAddress
Returns: Transaction history for wallet

POST /api/balance/decrypt
Body: { encryptedBalance, token }
Returns: Decrypted balance
```

### Analytics
```
GET /api/analytics
Returns: Trading volume and pool statistics

GET /api/prices
Returns: Current token prices
```

## Zama Network Configuration

### Devnet Details
- **Network Name**: Zama Devnet
- **RPC URL**: https://devnet.zama.ai
- **Chain ID**: 8009
- **Currency Symbol**: ZAMA
- **Block Explorer**: https://explorer.zama.ai
- **Faucet**: https://faucet.zama.ai

The application will automatically prompt you to add the Zama network to MetaMask on first connection.

## Features in Detail

### Confidential Swaps
All swap amounts are encrypted using FHEVM's FHE library. The swap calculations use encrypted values with the `FHE.select()` pattern for conditional logic. Due to FHE division limitations, the implementation uses a simplified AMM formula rather than the full constant-product formula.

### Encrypted Balances
User balances are stored as encrypted values (`euint64`) on-chain. Users can optionally decrypt their own balances for viewing via `FHE.allow()`, but all other users and external observers see only encrypted values.

### Privacy-Preserving Liquidity
Liquidity providers can add funds to pools without revealing the exact amounts. Pool reserves remain encrypted, providing MEV protection. All balance checks use `FHE.select()` for conditional transfers without decryption.

### Transaction Export
Export your complete transaction history to CSV format for record-keeping, tax reporting, or analysis. The export includes timestamps, transaction types, token pairs, amounts, and status.

## Design System

The UI follows Material Design principles adapted for DeFi interfaces. For detailed design guidelines, typography, spacing, and component specifications, see [design_guidelines.md](./design_guidelines.md)

## Security Considerations

- All sensitive balances are encrypted using FHEVM
- Transaction amounts remain confidential on-chain
- MEV protection through encrypted order flow
- Client-side wallet authentication via MetaMask
- Secure gateway integration for authorized decryption

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Resources

- [Known Limitations](./KNOWN_LIMITATIONS.md) - Current project status and limitations
- [Deployment Guide](./DEPLOYMENT.md) - How to deploy contracts to Zama
- [Design Guidelines](./design_guidelines.md) - UI/UX specifications
- [Zama Documentation](https://docs.zama.ai)
- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Zama Discord](https://discord.gg/zama)

## Support

For issues and questions:
- Open an issue in this repository
- Join the [Zama Discord](https://discord.gg/zama)
- Check [Zama GitHub Issues](https://github.com/zama-ai/fhevm)

---

**Built with privacy-first principles using Zama's FHEVM technology**
