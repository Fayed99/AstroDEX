import { useState, useEffect } from 'react';
import { ArrowDownUp, Lock, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SUPPORTED_TOKENS, type TokenSymbol } from '@shared/schema';

interface SwapCardProps {
  isConnected: boolean;
  onSwap: (fromToken: string, toToken: string, fromAmount: string, minAmountOut: string, orderType: string, limitPrice?: string) => Promise<void>;
  onOpenSettings: () => void;
  isProcessing: boolean;
}

export function SwapCard({ isConnected, onSwap, onOpenSettings, isProcessing }: SwapCardProps) {
  const [fromToken, setFromToken] = useState<TokenSymbol>('ETH');
  const [toToken, setToToken] = useState<TokenSymbol>('USDC');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState('');

  useEffect(() => {
    if (fromAmount && !isNaN(parseFloat(fromAmount))) {
      const rate = fromToken === 'ETH' ? 2000 : fromToken === 'WBTC' ? 40000 : fromToken === 'USDC' ? 1 : 1;
      const toRate = toToken === 'ETH' ? 2000 : toToken === 'WBTC' ? 40000 : toToken === 'USDC' ? 1 : 1;
      setToAmount((parseFloat(fromAmount) * rate / toRate).toFixed(6));
    } else {
      setToAmount('');
    }
  }, [fromAmount, fromToken, toToken]);

  const handleSwap = async () => {
    if (!fromAmount || !toAmount) return;
    const minOutput = parseFloat(toAmount) * 0.995;
    await onSwap(fromToken, toToken, fromAmount, minOutput.toString(), orderType, orderType === 'limit' ? limitPrice : undefined);
    setFromAmount('');
    setToAmount('');
    setLimitPrice('');
  };

  const handleFlipTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
  };

  return (
    <Card data-testid="card-swap" className="max-w-md mx-auto">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
        <CardTitle className="text-2xl font-bold">Swap Tokens</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            data-testid="button-settings"
            variant="ghost"
            size="icon"
            onClick={onOpenSettings}
          >
            <Settings className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="w-4 h-4" />
            <span>Encrypted</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex gap-2 bg-muted p-1 rounded-lg">
          <Button
            data-testid="button-market-order"
            variant={orderType === 'market' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setOrderType('market')}
            className="flex-1"
          >
            Market
          </Button>
          <Button
            data-testid="button-limit-order"
            variant={orderType === 'limit' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setOrderType('limit')}
            className="flex-1"
          >
            Limit
          </Button>
        </div>

        <div className="bg-muted rounded-xl p-4 space-y-2">
          <Label className="text-sm text-muted-foreground">From</Label>
          <div className="flex gap-3">
            <Input
              data-testid="input-from-amount"
              type="number"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              placeholder="0.0"
              className="flex-1 text-2xl font-bold font-mono bg-transparent border-0 p-0 h-auto focus-visible:ring-0"
            />
            <Select value={fromToken} onValueChange={(value) => setFromToken(value as TokenSymbol)}>
              <SelectTrigger data-testid="select-from-token" className="w-32">
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

        {orderType === 'limit' && (
          <div className="bg-muted rounded-xl p-4 space-y-2">
            <Label className="text-sm text-muted-foreground">Limit Price</Label>
            <div className="flex gap-3">
              <Input
                data-testid="input-limit-price"
                type="number"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                placeholder="Enter price"
                className="flex-1 text-2xl font-bold font-mono bg-transparent border-0 p-0 h-auto focus-visible:ring-0"
              />
              <div className="bg-secondary rounded-lg px-4 py-2 font-semibold flex items-center">
                {toToken}/{fromToken}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-center -my-2 relative z-10">
          <Button
            data-testid="button-flip-tokens"
            variant="secondary"
            size="icon"
            onClick={handleFlipTokens}
            className="rounded-lg"
          >
            <ArrowDownUp className="w-5 h-5" />
          </Button>
        </div>

        <div className="bg-muted rounded-xl p-4 space-y-2">
          <Label className="text-sm text-muted-foreground">
            To {orderType === 'market' ? '(estimated)' : '(minimum)'}
          </Label>
          <div className="flex gap-3">
            <Input
              data-testid="text-to-amount"
              type="text"
              value={toAmount}
              readOnly
              placeholder="0.0"
              className="flex-1 text-2xl font-bold font-mono bg-transparent border-0 p-0 h-auto focus-visible:ring-0"
            />
            <Select value={toToken} onValueChange={(value) => setToToken(value as TokenSymbol)}>
              <SelectTrigger data-testid="select-to-token" className="w-32">
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

        <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {orderType === 'market' ? 'Current Rate' : 'Target Rate'}
            </span>
            <span className="font-mono">
              1 {fromToken} ≈ {orderType === 'limit' && limitPrice ? limitPrice : (parseFloat(toAmount || '0') / parseFloat(fromAmount || '1')).toFixed(4)} {toToken}
            </span>
          </div>
          {orderType === 'limit' && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order Type</span>
              <span className="font-semibold">Limit Order</span>
            </div>
          )}
        </div>

        <Button
          data-testid="button-swap"
          onClick={handleSwap}
          disabled={!isConnected || !fromAmount || isProcessing || (orderType === 'limit' && !limitPrice)}
          size="lg"
          className="w-full text-lg font-bold"
        >
          {!isConnected ? 'Connect Wallet' : isProcessing ? 'Processing...' : orderType === 'limit' ? 'Place Limit Order' : 'Swap'}
        </Button>
      </CardContent>
    </Card>
  );
}
