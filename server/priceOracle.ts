/**
 * Price Oracle Service
 * Fetches real-time cryptocurrency prices from multiple sources
 */

interface TokenPrices {
  [token: string]: number;
}

interface PriceResponse {
  prices: TokenPrices;
  lastUpdated: Date;
}

class PriceOracleService {
  private prices: TokenPrices = {
    ETH: 3500,  // Reasonable fallback price
    USDC: 1,
    DAI: 1,
    WBTC: 95000, // Reasonable fallback price
  };
  private lastUpdated: Date = new Date();
  private updateInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize the price oracle and start automatic updates
   */
  async initialize() {
    console.log('🔮 Initializing Price Oracle...');
    await this.updatePrices();

    // Update prices every 30 seconds
    this.updateInterval = setInterval(() => {
      this.updatePrices().catch(console.error);
    }, 30000);

    console.log('✅ Price Oracle initialized with live prices');
  }

  /**
   * Fetch live prices from CoinGecko API (free, no API key needed)
   */
  async updatePrices(): Promise<void> {
    try {
      // CoinGecko API - Free tier, no authentication required
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin&vs_currencies=usd'
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();

      // Update prices
      this.prices.ETH = data.ethereum?.usd || this.prices.ETH;
      this.prices.WBTC = data.bitcoin?.usd || this.prices.WBTC;
      this.prices.USDC = 1; // Stablecoin
      this.prices.DAI = 1;  // Stablecoin
      this.lastUpdated = new Date();

      console.log('📊 Prices updated:', {
        ETH: `$${this.prices.ETH.toLocaleString()}`,
        WBTC: `$${this.prices.WBTC.toLocaleString()}`,
        timestamp: this.lastUpdated.toISOString(),
      });
    } catch (error) {
      console.error('❌ Failed to update prices from CoinGecko:', error);

      // Fallback: Try Binance API
      try {
        await this.updatePricesFromBinance();
      } catch (fallbackError) {
        console.error('❌ Fallback to Binance also failed:', fallbackError);
        // Keep last known prices
      }
    }
  }

  /**
   * Fallback: Fetch prices from Binance API
   */
  private async updatePricesFromBinance(): Promise<void> {
    const ethResponse = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT');
    const btcResponse = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');

    const ethData = await ethResponse.json();
    const btcData = await btcResponse.json();

    this.prices.ETH = parseFloat(ethData.price);
    this.prices.WBTC = parseFloat(btcData.price);
    this.lastUpdated = new Date();

    console.log('📊 Prices updated from Binance (fallback)');
  }

  /**
   * Get current price for a token in USD
   */
  getPrice(token: string): number {
    return this.prices[token] || 0;
  }

  /**
   * Get all current prices
   */
  getAllPrices(): PriceResponse {
    return {
      prices: { ...this.prices },
      lastUpdated: this.lastUpdated,
    };
  }

  /**
   * Calculate exchange rate between two tokens
   * @param tokenIn Input token
   * @param tokenOut Output token
   * @returns Exchange rate (how much tokenOut per 1 tokenIn)
   */
  getExchangeRate(tokenIn: string, tokenOut: string): number {
    const priceIn = this.getPrice(tokenIn);
    const priceOut = this.getPrice(tokenOut);

    if (priceOut === 0) return 0;

    return priceIn / priceOut;
  }

  /**
   * Calculate output amount for a swap
   * @param tokenIn Input token
   * @param tokenOut Output token
   * @param amountIn Input amount
   * @param fee Pool fee in basis points (e.g., 30 for 0.3%)
   * @returns Expected output amount
   */
  calculateSwapOutput(
    tokenIn: string,
    tokenOut: string,
    amountIn: number,
    fee: number = 30
  ): number {
    const exchangeRate = this.getExchangeRate(tokenIn, tokenOut);
    const feeMultiplier = (10000 - fee) / 10000;

    return amountIn * exchangeRate * feeMultiplier;
  }

  /**
   * Get price impact for a swap
   * @param amountIn Input amount
   * @param reserveIn Reserve of input token
   * @param reserveOut Reserve of output token
   * @returns Price impact as percentage
   */
  calculatePriceImpact(
    amountIn: number,
    reserveIn: number,
    reserveOut: number
  ): number {
    if (reserveIn === 0 || reserveOut === 0) return 0;

    const spotPrice = reserveOut / reserveIn;
    const newReserveIn = reserveIn + amountIn;
    const newReserveOut = (reserveIn * reserveOut) / newReserveIn;
    const executionPrice = (reserveOut - newReserveOut) / amountIn;

    const priceImpact = ((executionPrice - spotPrice) / spotPrice) * 100;

    return Math.abs(priceImpact);
  }

  /**
   * Stop the price update interval
   */
  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log('🛑 Price Oracle stopped');
    }
  }
}

// Export singleton instance
export const priceOracle = new PriceOracleService();
