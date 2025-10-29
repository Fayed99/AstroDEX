import { useState } from 'react';
import { Droplets, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SUPPORTED_TOKENS, type TokenSymbol } from '@shared/schema';

interface LiquidityCardProps {
  isConnected: boolean;
  onAddLiquidity: (tokenA: string, tokenB: string, amountA: string, amountB: string) => Promise<void>;
  onCreatePool: () => void;
  isProcessing: boolean;
}

export function LiquidityCard({ isConnected, onAddLiquidity, onCreatePool, isProcessing }: LiquidityCardProps) {
  const [tokenA, setTokenA] = useState<TokenSymbol>('ETH');
  const [tokenB, setTokenB] = useState<TokenSymbol>('USDC');
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');

  const handleAddLiquidity = async () => {
    if (!amountA || !amountB) return;
    await onAddLiquidity(tokenA, tokenB, amountA, amountB);
    setAmountA('');
    setAmountB('');
  };

  const estimatedShare = amountA && amountB 
    ? ((parseFloat(amountA) * parseFloat(amountB)) / 100).toFixed(4)
    : '0';

  return (
    <Card data-testid="card-liquidity" className="max-w-md mx-auto astro-card cosmic-glow-blue">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
        <CardTitle className="text-2xl font-bold flex items-center gap-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          <Droplets className="w-6 h-6 text-blue-400" />
          Add Liquidity
        </CardTitle>
        <Button
          data-testid="button-create-pool"
          variant="outline"
          size="sm"
          onClick={onCreatePool}
        >
          <Plus className="w-4 h-4 mr-1" />
          Create Pool
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="bg-muted rounded-xl p-4 space-y-2">
          <Label className="text-sm text-muted-foreground">First Token</Label>
          <div className="flex gap-3">
            <Input
              data-testid="input-liquidity-amount-a"
              type="number"
              value={amountA}
              onChange={(e) => setAmountA(e.target.value)}
              placeholder="0.0"
              className="flex-1 text-2xl font-bold font-mono bg-transparent border-0 p-0 h-auto focus-visible:ring-0"
            />
            <Select value={tokenA} onValueChange={(value) => setTokenA(value as TokenSymbol)}>
              <SelectTrigger data-testid="select-liquidity-token-a" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_TOKENS.map(token => (
                  <SelectItem key={token} value={token}>{token}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-center -my-2">
          <div className="bg-secondary p-2 rounded-lg">
            <Plus className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-muted rounded-xl p-4 space-y-2">
          <Label className="text-sm text-muted-foreground">Second Token</Label>
          <div className="flex gap-3">
            <Input
              data-testid="input-liquidity-amount-b"
              type="number"
              value={amountB}
              onChange={(e) => setAmountB(e.target.value)}
              placeholder="0.0"
              className="flex-1 text-2xl font-bold font-mono bg-transparent border-0 p-0 h-auto focus-visible:ring-0"
            />
            <Select value={tokenB} onValueChange={(value) => setTokenB(value as TokenSymbol)}>
              <SelectTrigger data-testid="select-liquidity-token-b" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_TOKENS.map(token => (
                  <SelectItem key={token} value={token}>{token}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Estimated Pool Share</span>
            <span className="font-mono font-semibold">{estimatedShare}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Exchange Rate</span>
            <span className="font-mono">
              1 {tokenA} = {amountB && amountA ? (parseFloat(amountB) / parseFloat(amountA)).toFixed(4) : '0'} {tokenB}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Privacy</span>
            <span className="font-semibold flex items-center gap-1">
              <Droplets className="w-3 h-3" />
              Fully Encrypted
            </span>
          </div>
        </div>

        <Button
          data-testid="button-add-liquidity"
          onClick={handleAddLiquidity}
          disabled={!isConnected || !amountA || !amountB || isProcessing}
          size="lg"
          className="w-full text-lg font-bold"
        >
          {!isConnected ? 'Connect Wallet' : isProcessing ? 'Adding...' : 'Add Liquidity'}
        </Button>
      </CardContent>
    </Card>
  );
}
