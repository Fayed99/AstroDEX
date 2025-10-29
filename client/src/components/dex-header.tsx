import { Wallet, Sparkles } from 'lucide-react';
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
    <header className="border-b border-purple-500/30 bg-gradient-to-r from-purple-900/40 via-blue-900/40 to-purple-900/40 backdrop-blur-md sticky top-0 z-50 shadow-lg shadow-purple-500/10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50 animate-pulse">
              <Sparkles className="w-7 h-7 text-white drop-shadow-lg" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(168,85,247,0.5)]">AstroDEX</h1>
              <p className="text-xs text-cyan-300/80 font-medium">Trade Among the Stars</p>
            </div>
          </div>
          
          {!isConnected ? (
            <Button
              data-testid="button-connect-wallet"
              onClick={onConnect}
              disabled={isProcessing}
              size="lg"
              className="font-semibold bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-500 hover:from-purple-500 hover:via-blue-400 hover:to-cyan-400 text-white shadow-lg shadow-purple-500/30 border-0"
            >
              <Wallet className="w-5 h-5 mr-2" />
              {isProcessing ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          ) : (
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 px-4 py-2 rounded-xl border border-purple-500/30 backdrop-blur-sm shadow-lg shadow-purple-500/20">
                <p className="text-xs text-cyan-300/70 font-medium">Connected</p>
                <p data-testid="text-wallet-address" className="font-mono text-sm font-semibold text-white">
                  {walletAddress}
                </p>
              </div>
              <Button
                data-testid="button-disconnect-wallet"
                variant="outline"
                onClick={onDisconnect}
                className="border-purple-500/50 text-purple-300 hover:bg-purple-900/30 hover:text-white"
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
