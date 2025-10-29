# Zama DEX - Confidential Decentralized Exchange

## Overview

Zama DEX is a fully confidential decentralized exchange built on Zama's FHEVM (Fully Homomorphic Encryption Virtual Machine) technology. The platform enables private cryptocurrency trading where all transaction amounts, balances, and trading activity remain encrypted end-to-end. Users can perform token swaps, provide liquidity to pools, create limit orders, and manage portfolios while maintaining complete privacy through homomorphic encryption.

The application implements a modern DeFi interface inspired by leading DEX platforms (Uniswap, Curve Finance, 1inch) with a focus on trust, precision, and clarity for encrypted financial transactions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript and Vite as the build tool

**UI Component System**: 
- Shadcn/ui component library built on Radix UI primitives
- "New York" style variant with custom theming
- Tailwind CSS for styling with custom design tokens
- Material Design principles adapted for DeFi interfaces

**Design System**:
- Typography: Inter font for UI, JetBrains Mono for numeric/address displays
- Custom color palette supporting light/dark modes via CSS variables
- Responsive grid layout (mobile-first, max-width 7xl container)
- Component spacing using Tailwind's standardized units (2, 4, 6, 8, 12, 16)

**State Management**:
- TanStack Query (React Query) for server state and API caching
- Local component state via React hooks
- Custom toast notifications for user feedback

**Routing**: Wouter for lightweight client-side routing

**Key UI Sections**:
- Swap interface for token exchanges (market and limit orders)
- Liquidity management for pool creation and LP token operations
- Portfolio view with encrypted balance display and decryption controls
- Analytics dashboard with trading volume and pool statistics
- Transaction history with filtering and export capabilities

### Backend Architecture

**Server Framework**: Express.js with TypeScript

**Development Setup**:
- Hot module replacement via Vite middleware in development
- Separate build process for production (esbuild for server, Vite for client)
- Single-server architecture serving both API and static frontend

**API Design**:
- RESTful endpoints under `/api` prefix
- JSON request/response format
- Session-based state management

**Core API Endpoints**:
- `POST /api/swap` - Execute token swaps (market/limit orders)
- `POST /api/liquidity/add` - Add liquidity to pools
- `POST /api/liquidity/remove` - Remove liquidity from pools
- `POST /api/pool/create` - Create new trading pools
- `GET /api/transactions/:walletAddress` - Fetch transaction history
- `POST /api/balance/decrypt` - Decrypt encrypted balance values

### Data Storage Solutions

**Current Implementation**: In-memory storage via custom `MemStorage` class
- Stores pools, balances, transactions, and limit orders in Map structures
- Provides type-safe interface through `IStorage` contract
- Initializes with default seed data (3 pools, sample balances)

**Database Schema (Drizzle ORM)**:
- **pools**: Trading pair reserves, fees, total liquidity
- **balances**: Encrypted user balances per token
- **transactions**: Trade history with encryption status
- **limitOrders**: Pending limit orders with execution tracking

**Configured for PostgreSQL**:
- Connection via `@neondatabase/serverless` driver
- Drizzle Kit for schema migrations
- Environment variable for database URL (`DATABASE_URL`)

**Data Types**:
- High-precision decimals (36 digits, 18 decimal places) for token amounts
- UUID-based primary keys
- Timestamp tracking for all entities

### Encryption & Privacy Layer

**FHEVM Integration**:
- Client-side encryption service (`FHEVMService`) for value encryption
- Server-side mock encryption for development/testing
- Planned integration with Zama's fhevmjs library for production

**Privacy Features**:
- All balance amounts stored as encrypted values
- Optional client-side decryption for user viewing
- Transaction amounts remain encrypted on-chain
- Support for confidential limit orders

**Encryption Flow**:
1. User initiates transaction with plaintext amount
2. Frontend encrypts value using FHEVM SDK
3. Encrypted handle and proof sent to backend
4. Smart contract operations performed on encrypted values
5. Results remain encrypted until user requests decryption

### Authentication & Wallet Integration

**MetaMask Integration**:
- Web3 wallet connection via `window.ethereum`
- Automatic network switching to Zama Devnet (Chain ID: 8009)
- Network addition flow for first-time users
- Wallet address persistence across sessions

**Security Considerations**:
- No backend authentication system (wallet-based identity)
- Client-side address shortening for UI display
- Session validation through wallet signature (planned)

## External Dependencies

### Blockchain & Web3
- **Zama Devnet**: Target blockchain network (RPC: https://devnet.zama.ai, Chain ID: 8009)
- **MetaMask**: Browser wallet for transaction signing and account management
- **FHEVM SDK**: Homomorphic encryption library for confidential computations (fhevmjs - to be integrated)

### Database
- **Neon Database**: Serverless PostgreSQL provider (via `@neondatabase/serverless`)
- **Drizzle ORM**: Type-safe database toolkit for schema and queries

### UI & Visualization
- **Recharts**: Chart library for analytics dashboard (line charts, tooltips)
- **Radix UI**: Headless component primitives (dialogs, dropdowns, tooltips, etc.)
- **Lucide React**: Icon library for UI elements

### Development Tools
- **Vite**: Build tool and development server
- **Replit Plugins**: Runtime error overlay, cartographer, dev banner
- **React Hook Form**: Form state management with Zod validation

### Styling
- **Tailwind CSS**: Utility-first CSS framework
- **class-variance-authority**: Type-safe variant management for components
- **Google Fonts**: Inter and JetBrains Mono font families

### Smart Contracts (Planned)
- **ConfidentialERC20**: Encrypted token standard
- **ConfidentialDEX**: Encrypted swap and liquidity pool logic
- Contract deployment via Hardhat (configuration present)