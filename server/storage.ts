import type { Pool, InsertPool, Balance, InsertBalance, Transaction, InsertTransaction, LimitOrder, InsertLimitOrder } from "@shared/schema";
import { pools, balances, transactions, limitOrders } from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { eq, and, or, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import ws from "ws";
import { InMemoryStorage } from "./memoryStorage";

neonConfig.webSocketConstructor = ws;

export interface IStorage {
  createPool(pool: InsertPool): Promise<Pool>;
  getPool(tokenA: string, tokenB: string): Promise<Pool | undefined>;
  getAllPools(): Promise<Pool[]>;
  updatePoolReserves(id: string, reserveA: string, reserveB: string): Promise<Pool>;

  getBalance(walletAddress: string, token: string): Promise<Balance | undefined>;
  upsertBalance(balance: InsertBalance): Promise<Balance>;

  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionsByWallet(walletAddress: string): Promise<Transaction[]>;
  getAllTransactions(): Promise<Transaction[]>;
  updateTransactionStatus(id: string, status: string, txHash?: string): Promise<Transaction>;

  createLimitOrder(order: InsertLimitOrder): Promise<LimitOrder>;
  getLimitOrdersByWallet(walletAddress: string): Promise<LimitOrder[]>;
  updateLimitOrderStatus(id: string, status: string): Promise<LimitOrder>;
}

const pool = new NeonPool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool);

export class DbStorage implements IStorage {
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    
    const existingPools = await this.getAllPools();
    if (existingPools.length === 0) {
      await this.seedDefaultData();
    }
    
    this.initialized = true;
  }

  private async seedDefaultData() {
    const defaultPools = [
      { tokenA: 'ETH', tokenB: 'USDC', reserveA: '100.0', reserveB: '200000.0', fee: 30, totalLiquidity: '14142.135' },
      { tokenA: 'ETH', tokenB: 'DAI', reserveA: '50.0', reserveB: '100000.0', fee: 30, totalLiquidity: '7071.067' },
      { tokenA: 'USDC', tokenB: 'DAI', reserveA: '50000.0', reserveB: '50000.0', fee: 5, totalLiquidity: '50000.0' },
    ];

    for (const poolData of defaultPools) {
      await db.insert(pools).values({
        id: randomUUID(),
        ...poolData
      });
    }
  }

  async createPool(insertPool: InsertPool): Promise<Pool> {
    const id = randomUUID();
    const [pool] = await db.insert(pools).values({
      id,
      ...insertPool
    }).returning();
    return pool!;
  }

  async getPool(tokenA: string, tokenB: string): Promise<Pool | undefined> {
    const [pool] = await db.select()
      .from(pools)
      .where(
        or(
          and(eq(pools.tokenA, tokenA), eq(pools.tokenB, tokenB)),
          and(eq(pools.tokenA, tokenB), eq(pools.tokenB, tokenA))
        )
      )
      .limit(1);
    return pool;
  }

  async getAllPools(): Promise<Pool[]> {
    return await db.select().from(pools);
  }

  async updatePoolReserves(id: string, reserveA: string, reserveB: string): Promise<Pool> {
    const [updated] = await db.update(pools)
      .set({ reserveA, reserveB })
      .where(eq(pools.id, id))
      .returning();
    
    if (!updated) throw new Error('Pool not found');
    return updated;
  }

  async getBalance(walletAddress: string, token: string): Promise<Balance | undefined> {
    const [balance] = await db.select()
      .from(balances)
      .where(
        and(
          eq(balances.walletAddress, walletAddress),
          eq(balances.token, token)
        )
      )
      .limit(1);
    return balance;
  }

  async upsertBalance(insertBalance: InsertBalance): Promise<Balance> {
    const existing = await this.getBalance(insertBalance.walletAddress, insertBalance.token);
    
    if (existing) {
      const [updated] = await db.update(balances)
        .set({
          encryptedValue: insertBalance.encryptedValue,
          lastUpdated: new Date()
        })
        .where(eq(balances.id, existing.id))
        .returning();
      return updated!;
    } else {
      const [balance] = await db.insert(balances)
        .values({
          id: randomUUID(),
          ...insertBalance
        })
        .returning();
      return balance!;
    }
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db.insert(transactions)
      .values({
        id: randomUUID(),
        ...insertTransaction
      })
      .returning();
    return transaction!;
  }

  async getTransactionsByWallet(walletAddress: string): Promise<Transaction[]> {
    return await db.select()
      .from(transactions)
      .where(eq(transactions.walletAddress, walletAddress))
      .orderBy(desc(transactions.timestamp));
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return await db.select()
      .from(transactions)
      .orderBy(desc(transactions.timestamp));
  }

  async updateTransactionStatus(id: string, status: string, txHash?: string): Promise<Transaction> {
    const [updated] = await db.update(transactions)
      .set({ 
        status, 
        ...(txHash && { txHash })
      })
      .where(eq(transactions.id, id))
      .returning();
    
    if (!updated) throw new Error('Transaction not found');
    return updated;
  }

  async createLimitOrder(insertOrder: InsertLimitOrder): Promise<LimitOrder> {
    const [order] = await db.insert(limitOrders)
      .values({
        id: randomUUID(),
        ...insertOrder
      })
      .returning();
    return order!;
  }

  async getLimitOrdersByWallet(walletAddress: string): Promise<LimitOrder[]> {
    return await db.select()
      .from(limitOrders)
      .where(eq(limitOrders.walletAddress, walletAddress))
      .orderBy(desc(limitOrders.createdAt));
  }

  async updateLimitOrderStatus(id: string, status: string): Promise<LimitOrder> {
    const [updated] = await db.update(limitOrders)
      .set({ 
        status,
        ...(status === 'executed' && { executedAt: new Date() })
      })
      .where(eq(limitOrders.id, id))
      .returning();
    
    if (!updated) throw new Error('Limit order not found');
    return updated;
  }
}

// Initialize storage with fallback logic
let storageInstance: IStorage;

async function initializeStorage() {
  if (process.env.DATABASE_URL) {
    console.log('📦 Using PostgreSQL database storage');
    try {
      const dbStorage = new DbStorage();
      await dbStorage.initialize();
      storageInstance = dbStorage;
    } catch (err) {
      console.error('❌ Database initialization failed:', err);
      console.log('⚠️  Falling back to in-memory storage');
      const memStorage = new InMemoryStorage();
      await memStorage.initialize();
      storageInstance = memStorage;
    }
  } else {
    console.log('💾 Using in-memory storage (no DATABASE_URL configured)');
    const memStorage = new InMemoryStorage();
    await memStorage.initialize();
    storageInstance = memStorage;
  }
}

// Initialize immediately
initializeStorage().catch(console.error);

// Export a proxy that ensures storage is initialized
export const storage = new Proxy({} as IStorage, {
  get(target, prop) {
    if (!storageInstance) {
      throw new Error('Storage not initialized yet');
    }
    return (storageInstance as any)[prop];
  }
});
