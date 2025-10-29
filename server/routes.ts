import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { FHEVMService } from "./fhevm";
import { priceOracle } from "./priceOracle";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get live prices from oracle
  app.get('/api/prices', async (req, res) => {
    try {
      const priceData = priceOracle.getAllPrices();
      res.json({
        success: true,
        ...priceData,
      });
    } catch (error: any) {
      console.error('Get prices error:', error);
      res.status(500).json({ error: error.message || 'Failed to get prices' });
    }
  });

  // Get exchange rate between two tokens
  app.get('/api/exchange-rate', async (req, res) => {
    try {
      const { tokenIn, tokenOut } = req.query;
      if (!tokenIn || !tokenOut) {
        return res.status(400).json({ error: 'Missing tokenIn or tokenOut' });
      }

      const rate = priceOracle.getExchangeRate(tokenIn as string, tokenOut as string);
      res.json({
        success: true,
        tokenIn,
        tokenOut,
        rate,
        priceIn: priceOracle.getPrice(tokenIn as string),
        priceOut: priceOracle.getPrice(tokenOut as string),
      });
    } catch (error: any) {
      console.error('Get exchange rate error:', error);
      res.status(500).json({ error: error.message || 'Failed to get exchange rate' });
    }
  });


  app.post('/api/swap', async (req, res) => {
    try {
      const { walletAddress, tokenIn, tokenOut, amountIn, minAmountOut, orderType, limitPrice } = req.body;

      if (!walletAddress || !tokenIn || !tokenOut || !amountIn) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (orderType === 'limit') {
        if (!limitPrice) {
          return res.status(400).json({ error: 'Limit price required for limit orders' });
        }

        const order = await storage.createLimitOrder({
          walletAddress,
          tokenIn,
          tokenOut,
          amountIn: amountIn.toString(),
          limitPrice: limitPrice.toString(),
          status: 'active'
        });

        const txHash = FHEVMService.generateTxHash();
        const transaction = await storage.createTransaction({
          walletAddress,
          type: 'swap',
          fromToken: tokenIn,
          toToken: tokenOut,
          amount: amountIn.toString(),
          status: 'pending',
          txHash,
          encrypted: true
        });

        return res.json({ 
          success: true, 
          message: 'Limit order created',
          orderId: order.id,
          txHash,
          transaction
        });
      }

      const pool = await storage.getPool(tokenIn, tokenOut);
      if (!pool) {
        return res.status(404).json({ error: 'Pool not found' });
      }

      const amountInNum = parseFloat(amountIn);
      const reserveIn = parseFloat(pool.tokenA === tokenIn ? pool.reserveA : pool.reserveB);
      const reserveOut = parseFloat(pool.tokenA === tokenIn ? pool.reserveB : pool.reserveA);
      
      const amountInWithFee = amountInNum * (10000 - pool.fee) / 10000;
      const amountOut = (amountInWithFee * reserveOut) / (reserveIn + amountInWithFee);

      if (minAmountOut && amountOut < parseFloat(minAmountOut)) {
        return res.status(400).json({ error: 'Insufficient output amount' });
      }

      const newReserveIn = reserveIn + amountInNum;
      const newReserveOut = reserveOut - amountOut;

      if (pool.tokenA === tokenIn) {
        await storage.updatePoolReserves(pool.id, newReserveIn.toString(), newReserveOut.toString());
      } else {
        await storage.updatePoolReserves(pool.id, newReserveOut.toString(), newReserveIn.toString());
      }

      // Get current balances and adjust them (subtract input, add output)
      const currentBalanceIn = await storage.getBalance(walletAddress, tokenIn);
      const currentBalanceOut = await storage.getBalance(walletAddress, tokenOut);

      const currentAmountIn = currentBalanceIn ? await FHEVMService.decrypt(currentBalanceIn.encryptedValue) : 0;
      const currentAmountOut = currentBalanceOut ? await FHEVMService.decrypt(currentBalanceOut.encryptedValue) : 0;

      const newBalanceIn = Math.max(0, currentAmountIn - amountInNum);
      const newBalanceOut = currentAmountOut + amountOut;

      const encryptedBalanceIn = await FHEVMService.encrypt(newBalanceIn);
      await storage.upsertBalance({
        walletAddress,
        token: tokenIn,
        encryptedValue: encryptedBalanceIn
      });

      const encryptedBalanceOut = await FHEVMService.encrypt(newBalanceOut);
      await storage.upsertBalance({
        walletAddress,
        token: tokenOut,
        encryptedValue: encryptedBalanceOut
      });

      const txHash = FHEVMService.generateTxHash();
      const transaction = await storage.createTransaction({
        walletAddress,
        type: 'swap',
        fromToken: tokenIn,
        toToken: tokenOut,
        amount: amountIn.toString(),
        status: 'completed',
        txHash,
        encrypted: true
      });

      res.json({ 
        success: true, 
        txHash,
        amountOut: amountOut.toFixed(6),
        transaction 
      });
    } catch (error: any) {
      console.error('Swap error:', error);
      res.status(500).json({ error: error.message || 'Swap failed' });
    }
  });

  app.post('/api/pool/create', async (req, res) => {
    try {
      const { walletAddress, tokenA, tokenB, amountA, amountB, fee } = req.body;

      if (!walletAddress || !tokenA || !tokenB || !amountA || !amountB) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const existingPool = await storage.getPool(tokenA, tokenB);
      if (existingPool) {
        return res.status(400).json({ error: 'Pool already exists' });
      }

      const amountANum = parseFloat(amountA);
      const amountBNum = parseFloat(amountB);
      const totalLiquidity = Math.sqrt(amountANum * amountBNum);

      const pool = await storage.createPool({
        tokenA,
        tokenB,
        reserveA: amountA.toString(),
        reserveB: amountB.toString(),
        fee: parseInt(fee) || 30,
        totalLiquidity: totalLiquidity.toString()
      });

      // Deduct tokens from user balance when creating pool
      const currentBalanceA = await storage.getBalance(walletAddress, tokenA);
      const currentBalanceB = await storage.getBalance(walletAddress, tokenB);

      const currentAmountA = currentBalanceA ? await FHEVMService.decrypt(currentBalanceA.encryptedValue) : 0;
      const currentAmountB = currentBalanceB ? await FHEVMService.decrypt(currentBalanceB.encryptedValue) : 0;

      const newBalanceA = Math.max(0, currentAmountA - amountANum);
      const newBalanceB = Math.max(0, currentAmountB - amountBNum);

      const encryptedBalanceA = await FHEVMService.encrypt(newBalanceA);
      await storage.upsertBalance({
        walletAddress,
        token: tokenA,
        encryptedValue: encryptedBalanceA
      });

      const encryptedBalanceB = await FHEVMService.encrypt(newBalanceB);
      await storage.upsertBalance({
        walletAddress,
        token: tokenB,
        encryptedValue: encryptedBalanceB
      });

      const txHash = FHEVMService.generateTxHash();
      const transaction = await storage.createTransaction({
        walletAddress,
        type: 'liquidity',
        fromToken: tokenA,
        toToken: tokenB,
        amount: amountA.toString(),
        status: 'completed',
        txHash,
        encrypted: true
      });

      res.json({ 
        success: true, 
        txHash,
        pool,
        transaction 
      });
    } catch (error: any) {
      console.error('Create pool error:', error);
      res.status(500).json({ error: error.message || 'Failed to create pool' });
    }
  });

  app.post('/api/liquidity/add', async (req, res) => {
    try {
      const { walletAddress, tokenA, tokenB, amountA, amountB } = req.body;

      if (!walletAddress || !tokenA || !tokenB || !amountA || !amountB) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const pool = await storage.getPool(tokenA, tokenB);
      if (!pool) {
        return res.status(404).json({ error: 'Pool not found' });
      }

      const amountANum = parseFloat(amountA);
      const amountBNum = parseFloat(amountB);
      
      const currentReserveA = parseFloat(pool.tokenA === tokenA ? pool.reserveA : pool.reserveB);
      const currentReserveB = parseFloat(pool.tokenA === tokenA ? pool.reserveB : pool.reserveA);

      const newReserveA = currentReserveA + amountANum;
      const newReserveB = currentReserveB + amountBNum;

      if (pool.tokenA === tokenA) {
        await storage.updatePoolReserves(pool.id, newReserveA.toString(), newReserveB.toString());
      } else {
        await storage.updatePoolReserves(pool.id, newReserveB.toString(), newReserveA.toString());
      }

      // Deduct tokens from user balance when adding liquidity
      const currentBalanceA = await storage.getBalance(walletAddress, tokenA);
      const currentBalanceB = await storage.getBalance(walletAddress, tokenB);

      const currentAmountA = currentBalanceA ? await FHEVMService.decrypt(currentBalanceA.encryptedValue) : 0;
      const currentAmountB = currentBalanceB ? await FHEVMService.decrypt(currentBalanceB.encryptedValue) : 0;

      const newBalanceA = Math.max(0, currentAmountA - amountANum);
      const newBalanceB = Math.max(0, currentAmountB - amountBNum);

      const encryptedBalanceA = await FHEVMService.encrypt(newBalanceA);
      await storage.upsertBalance({
        walletAddress,
        token: tokenA,
        encryptedValue: encryptedBalanceA
      });

      const encryptedBalanceB = await FHEVMService.encrypt(newBalanceB);
      await storage.upsertBalance({
        walletAddress,
        token: tokenB,
        encryptedValue: encryptedBalanceB
      });

      const txHash = FHEVMService.generateTxHash();
      const transaction = await storage.createTransaction({
        walletAddress,
        type: 'liquidity',
        fromToken: tokenA,
        toToken: tokenB,
        amount: amountA.toString(),
        status: 'completed',
        txHash,
        encrypted: true
      });

      res.json({ 
        success: true, 
        txHash,
        transaction 
      });
    } catch (error: any) {
      console.error('Add liquidity error:', error);
      res.status(500).json({ error: error.message || 'Failed to add liquidity' });
    }
  });

  app.get('/api/balance/:token', async (req, res) => {
    try {
      const { token } = req.params;
      const { address } = req.query;

      if (!address) {
        return res.status(400).json({ error: 'Wallet address required' });
      }

      let balance = await storage.getBalance(address as string, token);
      
      if (!balance) {
        const defaultAmount = Math.random() * 100 + 10;
        const encryptedValue = await FHEVMService.encrypt(defaultAmount);
        balance = await storage.upsertBalance({
          walletAddress: address as string,
          token,
          encryptedValue
        });
      }

      res.json({ 
        success: true, 
        encryptedBalance: balance.encryptedValue,
        token 
      });
    } catch (error: any) {
      console.error('Get balance error:', error);
      res.status(500).json({ error: error.message || 'Failed to get balance' });
    }
  });

  app.get('/api/transactions', async (req, res) => {
    try {
      const { address } = req.query;
      if (!address) {
        return res.status(400).json({ error: 'Wallet address required' });
      }
      const transactions = await storage.getTransactionsByWallet(address as string);
      res.json(transactions);
    } catch (error: any) {
      console.error('Get transactions error:', error);
      res.status(500).json({ error: error.message || 'Failed to get transactions' });
    }
  });

  app.post('/api/order/limit', async (req, res) => {
    try {
      const { walletAddress, tokenIn, tokenOut, amountIn, limitPrice } = req.body;

      if (!walletAddress || !tokenIn || !tokenOut || !amountIn || !limitPrice) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const order = await storage.createLimitOrder({
        walletAddress,
        tokenIn,
        tokenOut,
        amountIn: amountIn.toString(),
        limitPrice: limitPrice.toString(),
        status: 'active'
      });

      res.json({ 
        success: true, 
        orderId: order.id,
        order 
      });
    } catch (error: any) {
      console.error('Create limit order error:', error);
      res.status(500).json({ error: error.message || 'Failed to create limit order' });
    }
  });

  app.get('/api/pools', async (req, res) => {
    try {
      const pools = await storage.getAllPools();
      res.json(pools);
    } catch (error: any) {
      console.error('Get pools error:', error);
      res.status(500).json({ error: error.message || 'Failed to get pools' });
    }
  });

  app.get('/api/analytics', async (req, res) => {
    try {
      // Get all transactions
      const transactions = await storage.getAllTransactions();

      // Get all pools
      const pools = await storage.getAllPools();

      // Calculate 24h volume (sum of all swap transactions)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentTransactions = transactions.filter(tx =>
        tx.type === 'swap' && new Date(tx.createdAt) > oneDayAgo
      );

      let totalVolume24h = 0;
      for (const tx of recentTransactions) {
        const amount = parseFloat(tx.amount);
        // Convert to USD using price oracle
        const tokenPrice = priceOracle.getPrice(tx.fromToken);
        totalVolume24h += amount * tokenPrice;
      }

      // Calculate total liquidity (sum of all pool reserves in USD)
      let totalLiquidity = 0;
      for (const pool of pools) {
        const tokenAPrice = priceOracle.getPrice(pool.tokenA);
        const tokenBPrice = priceOracle.getPrice(pool.tokenB);
        const reserveAValue = parseFloat(pool.reserveA) * tokenAPrice;
        const reserveBValue = parseFloat(pool.reserveB) * tokenBPrice;
        totalLiquidity += reserveAValue + reserveBValue;
      }

      // Calculate average trade size
      const avgTradeSize = recentTransactions.length > 0
        ? totalVolume24h / recentTransactions.length
        : 0;

      // Get active pools count
      const activePools = pools.length;

      res.json({
        success: true,
        data: {
          totalVolume24h,
          totalLiquidity,
          activePools,
          avgTradeSize,
          totalTransactions: transactions.length,
          transactions24h: recentTransactions.length
        }
      });
    } catch (error: any) {
      console.error('Get analytics error:', error);
      res.status(500).json({ error: error.message || 'Failed to get analytics' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
