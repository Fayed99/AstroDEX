import { useState, useEffect } from 'react';
import { TrendingUp, Activity, Droplets, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface AnalyticsData {
  totalVolume24h: number;
  totalLiquidity: number;
  activePools: number;
  avgTradeSize: number;
  totalTransactions: number;
  transactions24h: number;
}

export function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [priceHistory, setPriceHistory] = useState<{ time: string; price: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/analytics');
        const result = await response.json();
        if (result.success) {
          setAnalyticsData(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
    // Refresh analytics every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch price history from price oracle
  useEffect(() => {
    const fetchPriceHistory = async () => {
      try {
        const response = await fetch('/api/prices');
        const result = await response.json();
        if (result.success) {
          // For now, create a simple history based on current price
          // In production, you'd store historical price data
          const currentPrice = result.prices.ETH;
          const now = new Date();
          const history = [];

          for (let i = 6; i >= 0; i--) {
            const time = new Date(now.getTime() - i * 4 * 60 * 60 * 1000);
            const variance = (Math.random() - 0.5) * 200; // Random variance for demo
            history.push({
              time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              price: currentPrice + variance
            });
          }

          setPriceHistory(history);
        }
      } catch (error) {
        console.error('Failed to fetch price history:', error);
      }
    };

    fetchPriceHistory();
    const interval = setInterval(fetchPriceHistory, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  const statsData = analyticsData ? [
    {
      label: 'Total Volume (24h)',
      value: formatCurrency(analyticsData.totalVolume24h),
      icon: Activity,
      change: `${analyticsData.transactions24h} txs`,
      positive: true
    },
    {
      label: 'Total Liquidity',
      value: formatCurrency(analyticsData.totalLiquidity),
      icon: Droplets,
      change: `${analyticsData.activePools} pools`,
      positive: true
    },
    {
      label: 'Active Pools',
      value: analyticsData.activePools.toString(),
      icon: TrendingUp,
      change: 'Live',
      positive: true
    },
    {
      label: 'Avg. Trade Size',
      value: formatCurrency(analyticsData.avgTradeSize),
      icon: DollarSign,
      change: '24h avg',
      positive: true
    },
  ] : [];

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">Analytics</h2>
        <div className="text-center text-cyan-300/70 py-12">Loading analytics...</div>
      </div>
    );
  }
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">Analytics</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat, index) => (
          <Card key={index} data-testid={`card-stat-${index}`} className="astro-card cosmic-glow">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-cyan-300/70">
                {stat.label}
              </CardTitle>
              <stat.icon className="w-4 h-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono text-white" data-testid={`text-stat-value-${index}`}>
                {stat.value}
              </div>
              <p className={`text-xs font-medium ${stat.positive ? 'text-green-400' : 'text-red-400'}`}>
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card data-testid="card-price-chart" className="astro-card cosmic-glow-blue">
        <CardHeader>
          <CardTitle className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">ETH/USD Price (24h)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceHistory.length > 0 ? priceHistory : [{ time: 'Loading...', price: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(138, 43, 226, 0.2)" />
                <XAxis
                  dataKey="time"
                  className="text-xs"
                  stroke="rgba(255, 255, 255, 0.5)"
                  tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
                />
                <YAxis
                  className="text-xs"
                  stroke="rgba(255, 255, 255, 0.5)"
                  tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
                  domain={['dataMin - 50', 'dataMax + 50']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(30, 10, 60, 0.95)',
                    border: '1px solid rgba(138, 43, 226, 0.5)',
                    borderRadius: '0.75rem',
                    color: 'white',
                  }}
                  labelStyle={{ color: 'rgba(255, 255, 255, 0.9)' }}
                  itemStyle={{ color: 'rgba(59, 130, 246, 1)' }}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="rgba(59, 130, 246, 1)"
                  strokeWidth={3}
                  dot={{ fill: 'rgba(34, 211, 238, 1)', r: 4 }}
                  activeDot={{ r: 6, fill: 'rgba(168, 85, 247, 1)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
