import { useState } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SUPPORTED_TOKENS, type TokenSymbol } from '@shared/schema';

interface CreatePoolModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreatePool: (tokenA: string, tokenB: string, amountA: string, amountB: string, fee: string) => Promise<void>;
  isProcessing: boolean;
}

export function CreatePoolModal({ open, onOpenChange, onCreatePool, isProcessing }: CreatePoolModalProps) {
  const [tokenA, setTokenA] = useState<TokenSymbol>('ETH');
  const [tokenB, setTokenB] = useState<TokenSymbol>('USDC');
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [fee, setFee] = useState('0.3');

  const handleCreate = async () => {
    if (!amountA || !amountB) return;
    await onCreatePool(tokenA, tokenB, amountA, amountB, fee);
    setAmountA('');
    setAmountB('');
    onOpenChange(false);
  };

  const initialPrice = amountB && amountA 
    ? (parseFloat(amountB) / parseFloat(amountA)).toFixed(4)
    : '0';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="modal-create-pool" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Create New Pool</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Select Token Pair</Label>
            <div className="grid grid-cols-2 gap-3">
              <Select value={tokenA} onValueChange={(value) => setTokenA(value as TokenSymbol)}>
                <SelectTrigger data-testid="select-pool-token-a">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_TOKENS.map(token => (
                    <SelectItem key={token} value={token}>{token}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={tokenB} onValueChange={(value) => setTokenB(value as TokenSymbol)}>
                <SelectTrigger data-testid="select-pool-token-b">
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

          <div className="space-y-2">
            <Label className="text-sm font-medium">Fee Tier</Label>
            <div className="grid grid-cols-3 gap-2">
              {['0.05', '0.3', '1.0'].map(feeVal => (
                <Button
                  key={feeVal}
                  data-testid={`button-fee-${feeVal}`}
                  variant={fee === feeVal ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFee(feeVal)}
                >
                  {feeVal}%
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Initial Liquidity</Label>
            <div className="space-y-3">
              <Input
                data-testid="input-pool-amount-a"
                type="number"
                value={amountA}
                onChange={(e) => setAmountA(e.target.value)}
                placeholder={`Amount of ${tokenA}`}
              />
              <Input
                data-testid="input-pool-amount-b"
                type="number"
                value={amountB}
                onChange={(e) => setAmountB(e.target.value)}
                placeholder={`Amount of ${tokenB}`}
              />
            </div>
          </div>

          <div className="bg-muted rounded-lg p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Initial Price</span>
              <span className="font-mono font-semibold" data-testid="text-initial-price">
                1 {tokenA} = {initialPrice} {tokenB}
              </span>
            </div>
          </div>

          <Button
            data-testid="button-submit-pool"
            onClick={handleCreate}
            disabled={!amountA || !amountB || isProcessing}
            size="lg"
            className="w-full font-bold"
          >
            {isProcessing ? 'Creating...' : 'Create Pool'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
