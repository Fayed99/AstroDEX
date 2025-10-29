import { Wallet, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DexHeaderProps {
  isConnected: boolean;
  walletAddress: string;
  onConnect: () => Promise<void>;
  onDisconnect: () => void;
  isProcessing: boolean;
}

export function DexHeader({ isConnected, walletAddress, onConnect, onDisconnect, isProcessing }: DexHeaderProps) {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center">
              <Lock className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Zama DEX</h1>
              <p className="text-xs text-muted-foreground">Fully Confidential Trading</p>
            </div>
          </div>
          
          {!isConnected ? (
            <Button
              data-testid="button-connect-wallet"
              onClick={onConnect}
              disabled={isProcessing}
              size="lg"
              className="font-semibold"
            >
              <Wallet className="w-5 h-5 mr-2" />
              {isProcessing ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          ) : (
            <div className="flex items-center gap-4">
              <div className="bg-muted px-4 py-2 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground">Connected</p>
                <p data-testid="text-wallet-address" className="font-mono text-sm font-semibold">
                  {walletAddress}
                </p>
              </div>
              <Button
                data-testid="button-disconnect-wallet"
                variant="outline"
                onClick={onDisconnect}
              >
                Disconnect
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
