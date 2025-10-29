import { Eye, EyeOff, Lock, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SUPPORTED_TOKENS } from '@shared/schema';

interface Balance {
  encrypted: boolean;
  value: string | null;
  decrypted: string | null;
}

interface PortfolioBalancesProps {
  balances: Record<string, Balance>;
  onDecrypt: (token: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  isProcessing: boolean;
}

export function PortfolioBalances({ balances, onDecrypt, onRefresh, isProcessing }: PortfolioBalancesProps) {
  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">Your Portfolio</h2>
        <Button
          data-testid="button-refresh-balances"
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isProcessing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {SUPPORTED_TOKENS.map((token) => {
          const balance = balances[token];
          const showDecrypted = balance?.decrypted !== null;

          return (
            <Card key={token} data-testid={`card-balance-${token.toLowerCase()}`} className="hover-elevate astro-card cosmic-glow">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-bold uppercase text-cyan-400">{token}</CardTitle>
                <Button
                  data-testid={`button-decrypt-${token.toLowerCase()}`}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onDecrypt(token)}
                  disabled={isProcessing || !balance?.value}
                >
                  {showDecrypted ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {showDecrypted ? (
                  <>
                    <p data-testid={`text-balance-${token.toLowerCase()}`} className="text-3xl font-bold font-mono tabular-nums">
                      {parseFloat(balance.decrypted || '0').toFixed(4)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ≈ ${(parseFloat(balance.decrypted || '0') * (token === 'ETH' ? 2000 : token === 'WBTC' ? 40000 : 1)).toFixed(2)}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Lock className="w-4 h-4" />
                      <p className="text-sm font-mono truncate">
                        {balance?.value || '0x...'}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">Click eye to decrypt</p>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
