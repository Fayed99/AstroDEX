import type { Pool, InsertPool, Balance, InsertBalance, Transaction, InsertTransaction, LimitOrder, InsertLimitOrder } from "@shared/schema";
import { randomUUID } from "crypto";
import type { IStorage } from "./storage";

export class InMemoryStorage implements IStorage {
  private pools: Map<string, Pool> = new Map();
  private balances: Map<string, Balance> = new Map();
  private transactions: Transaction[] = [];
  private limitOrders: LimitOrder[] = [];
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    console.log('💾 Initializing in-memory storage...');
    await this.seedDefaultData();

    this.initialized = true;
    console.log('✅ In-memory storage initialized with default pools');
  }

  private async seedDefaultData() {
    const defaultPools = [
      { tokenA: 'ETH', tokenB: 'USDC', reserveA: '100.0', reserveB: '200000.0', fee: 30, totalLiquidity: '14142.135' },
      { tokenA: 'ETH', tokenB: 'DAI', reserveA: '50.0', reserveB: '100000.0', fee: 30, totalLiquidity: '7071.067' },
      { tokenA: 'USDC', tokenB: 'DAI', reserveA: '10000.0', reserveB: '10000.0', fee: 10, totalLiquidity: '10000.0' },
    ];

    for (const poolData of defaultPools) {
      await this.createPool(poolData);
    }
  }

  // Pool methods
  async createPool(pool: InsertPool): Promise<Pool> {
    const id = randomUUID();
    const newPool: Pool = {
      id,
      tokenA: pool.tokenA,
      tokenB: pool.tokenB,
      reserveA: pool.reserveA || "0",
      reserveB: pool.reserveB || "0",
      fee: pool.fee || 30,
      totalLiquidity: pool.totalLiquidity || "0",
      createdAt: new Date(),
    };
    this.pools.set(id, newPool);
    return newPool;
  }

  async getPool(tokenA: string, tokenB: string): Promise<Pool | undefined> {
    // Check both directions since pools can be queried either way
    const pools = Array.from(this.pools.values());
    return pools.find(pool =>
      (pool.tokenA === tokenA && pool.tokenB === tokenB) ||
      (pool.tokenA === tokenB && pool.tokenB === tokenA)
    );
  }

  async getAllPools(): Promise<Pool[]> {
    return Array.from(this.pools.values());
  }

  async updatePoolReserves(id: string, reserveA: string, reserveB: string): Promise<Pool> {
    const pool = this.pools.get(id);
    if (!pool) {
      throw new Error(`Pool with id ${id} not found`);
    }

    const updatedPool: Pool = {
      ...pool,
      reserveA,
      reserveB,
    };
    this.pools.set(id, updatedPool);
    return updatedPool;
  }

  // Balance methods
  private getBalanceKey(walletAddress: string, token: string): string {
    return `${walletAddress}:${token}`;
  }

  async getBalance(walletAddress: string, token: string): Promise<Balance | undefined> {
    const key = this.getBalanceKey(walletAddress, token);
    return this.balances.get(key);
  }

  async upsertBalance(balance: InsertBalance): Promise<Balance> {
    const key = this.getBalanceKey(balance.walletAddress, balance.token);
    const existing = this.balances.get(key);

    const newBalance: Balance = {
      id: existing?.id || randomUUID(),
      ...balance,
      lastUpdated: new Date(),
    };

    this.balances.set(key, newBalance);
    return newBalance;
  }

  // Transaction methods
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const newTransaction: Transaction = {
      id: randomUUID(),
      type: transaction.type,
      walletAddress: transaction.walletAddress,
      fromToken: transaction.fromToken,
      toToken: transaction.toToken,
      amount: transaction.amount,
      status: transaction.status || "pending",
      txHash: transaction.txHash || null,
      timestamp: new Date(),
      encrypted: transaction.encrypted !== undefined ? transaction.encrypted : true,
    };
    this.transactions.push(newTransaction);
    return newTransaction;
  }

  async getTransactionsByWallet(walletAddress: string): Promise<Transaction[]> {
    return this.transactions
      .filter((tx) => tx.walletAddress === walletAddress)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return [...this.transactions].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async updateTransactionStatus(id: string, status: string, txHash?: string): Promise<Transaction> {
    const index = this.transactions.findIndex((tx) => tx.id === id);
    if (index === -1) {
      throw new Error(`Transaction with id ${id} not found`);
    }

    const updatedTransaction: Transaction = {
      ...this.transactions[index],
      status,
      ...(txHash && { txHash }),
    };

    this.transactions[index] = updatedTransaction;
    return updatedTransaction;
  }

  // Limit Order methods
  async createLimitOrder(order: InsertLimitOrder): Promise<LimitOrder> {
    const newOrder: LimitOrder = {
      id: randomUUID(),
      walletAddress: order.walletAddress,
      tokenIn: order.tokenIn,
      tokenOut: order.tokenOut,
      amountIn: order.amountIn,
      limitPrice: order.limitPrice,
      status: order.status || "active",
      createdAt: new Date(),
      executedAt: null,
    };
    this.limitOrders.push(newOrder);
    return newOrder;
  }

  async getLimitOrdersByWallet(walletAddress: string): Promise<LimitOrder[]> {
    return this.limitOrders
      .filter((order) => order.walletAddress === walletAddress)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateLimitOrderStatus(id: string, status: string): Promise<LimitOrder> {
    const index = this.limitOrders.findIndex((order) => order.id === id);
    if (index === -1) {
      throw new Error(`Limit order with id ${id} not found`);
    }

    const updatedOrder: LimitOrder = {
      ...this.limitOrders[index],
      status,
      ...(status === 'executed' && { executedAt: new Date() }),
    };

    this.limitOrders[index] = updatedOrder;
    return updatedOrder;
  }
}
