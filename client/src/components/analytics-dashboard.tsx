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
      <h2 className="text-2xl font-bold">Analytics</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat, index) => (
          <Card key={index} data-testid={`card-stat-${index}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono" data-testid={`text-stat-value-${index}`}>
                {stat.value}
              </div>
              <p className={`text-xs font-medium ${stat.positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card data-testid="card-price-chart">
        <CardHeader>
          <CardTitle>ETH/USDC Price (24h)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="time" 
                  className="text-xs"
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis 
                  className="text-xs"
                  stroke="hsl(var(--muted-foreground))"
                  domain={['dataMin - 50', 'dataMax + 50']}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                  }}
                  labelStyle={{ color: 'hsl(var(--card-foreground))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
