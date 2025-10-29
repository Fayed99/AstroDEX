import { pgTable, text, varchar, decimal, integer, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const pools = pgTable("pools", {
  id: varchar("id").primaryKey(),
  tokenA: text("token_a").notNull(),
  tokenB: text("token_b").notNull(),
  reserveA: decimal("reserve_a", { precision: 36, scale: 18 }).notNull().default("0"),
  reserveB: decimal("reserve_b", { precision: 36, scale: 18 }).notNull().default("0"),
  fee: integer("fee").notNull().default(30),
  totalLiquidity: decimal("total_liquidity", { precision: 36, scale: 18 }).notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  tokenPairIdx: index("pools_token_pair_idx").on(table.tokenA, table.tokenB),
}));

export const balances = pgTable("balances", {
  id: varchar("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  token: text("token").notNull(),
  encryptedValue: text("encrypted_value").notNull(),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
}, (table) => ({
  walletIdx: index("balances_wallet_idx").on(table.walletAddress),
  walletTokenIdx: index("balances_wallet_token_idx").on(table.walletAddress, table.token),
}));

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  type: text("type").notNull(),
  fromToken: text("from_token").notNull(),
  toToken: text("to_token").notNull(),
  amount: text("amount").notNull(),
  status: text("status").notNull().default("pending"),
  txHash: text("tx_hash"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  encrypted: boolean("encrypted").notNull().default(true),
}, (table) => ({
  walletIdx: index("transactions_wallet_idx").on(table.walletAddress),
  timestampIdx: index("transactions_timestamp_idx").on(table.timestamp),
}));

export const limitOrders = pgTable("limit_orders", {
  id: varchar("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  tokenIn: text("token_in").notNull(),
  tokenOut: text("token_out").notNull(),
  amountIn: decimal("amount_in", { precision: 36, scale: 18 }).notNull(),
  limitPrice: decimal("limit_price", { precision: 36, scale: 18 }).notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  executedAt: timestamp("executed_at"),
}, (table) => ({
  walletIdx: index("limit_orders_wallet_idx").on(table.walletAddress),
  statusIdx: index("limit_orders_status_idx").on(table.status),
  createdAtIdx: index("limit_orders_created_at_idx").on(table.createdAt),
}));

export const insertPoolSchema = createInsertSchema(pools).omit({ id: true, createdAt: true });
export const insertBalanceSchema = createInsertSchema(balances).omit({ id: true, lastUpdated: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, timestamp: true });
export const insertLimitOrderSchema = createInsertSchema(limitOrders).omit({ id: true, createdAt: true, executedAt: true });

export type InsertPool = z.infer<typeof insertPoolSchema>;
export type Pool = typeof pools.$inferSelect;
export type InsertBalance = z.infer<typeof insertBalanceSchema>;
export type Balance = typeof balances.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertLimitOrder = z.infer<typeof insertLimitOrderSchema>;
export type LimitOrder = typeof limitOrders.$inferSelect;

// Network configurations
export const NETWORKS = {
  SEPOLIA: {
    chainId: 11155111,
    chainName: 'Sepolia Testnet',
    rpcUrl: 'https://rpc.sepolia.org',
    blockExplorer: 'https://sepolia.etherscan.io',
    nativeCurrency: {
      name: 'Sepolia ETH',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  BASE_SEPOLIA: {
    chainId: 84532,
    chainName: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia.basescan.org',
    nativeCurrency: {
      name: 'Base Sepolia ETH',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  ZAMA: {
    chainId: 9000,
    chainName: 'Zama Devnet',
    rpcUrl: 'https://devnet.zama.ai',
    blockExplorer: 'https://explorer.devnet.zama.ai',
    nativeCurrency: {
      name: 'ZAMA',
      symbol: 'ZAMA',
      decimals: 18,
    },
  },
} as const;

export type NetworkType = keyof typeof NETWORKS;

export const CONTRACTS = {
  DEX_ADDRESS: '0x0000000000000000000000000000000000000000',
  TOKENS: {
    ETH: '0x0000000000000000000000000000000000000000',
    USDC: '0x0000000000000000000000000000000000000001',
    DAI: '0x0000000000000000000000000000000000000002',
    WBTC: '0x0000000000000000000000000000000000000003',
  },
  // Default to Sepolia
  RPC_URL: NETWORKS.SEPOLIA.rpcUrl,
  CHAIN_ID: NETWORKS.SEPOLIA.chainId,
} as const;

export const SUPPORTED_TOKENS = ['ETH', 'USDC', 'DAI', 'WBTC'] as const;
export type TokenSymbol = typeof SUPPORTED_TOKENS[number];
