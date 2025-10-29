import { TrendingUp, Activity, Droplets, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const priceData = [
  { time: '00:00', price: 2000 },
  { time: '04:00', price: 2050 },
  { time: '08:00', price: 1980 },
  { time: '12:00', price: 2100 },
  { time: '16:00', price: 2080 },
  { time: '20:00', price: 2150 },
  { time: '24:00', price: 2200 }
];

const statsData = [
  { label: 'Total Volume (24h)', value: '$12.5M', icon: Activity, change: '+15.3%', positive: true },
  { label: 'Total Liquidity', value: '$45.2M', icon: Droplets, change: '+5.1%', positive: true },
  { label: 'Active Pools', value: '247', icon: TrendingUp, change: '+12', positive: true },
  { label: 'Avg. Trade Size', value: '$8,450', icon: DollarSign, change: '-2.3%', positive: false },
];

export function AnalyticsDashboard() {
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
          <CardTitle className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">ETH/USDC Price (24h)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceData}>
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
