import { useState, useEffect } from 'react';
import { ArrowDownUp, Droplets, TrendingUp, Activity, Clock, Lock } from 'lucide-react';
import { DexHeader } from '@/components/dex-header';
import { SwapCard } from '@/components/swap-card';
import { LiquidityCard } from '@/components/liquidity-card';
import { PortfolioBalances } from '@/components/portfolio-balances';
import { AnalyticsDashboard } from '@/components/analytics-dashboard';
import { TransactionHistory } from '@/components/transaction-history';
import { SettingsModal } from '@/components/settings-modal';
import { CreatePoolModal } from '@/components/create-pool-modal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FHEVMService } from '@/lib/fhevm';
import { connectMetaMask, shortenAddress } from '@/lib/wallet';
import { SUPPORTED_TOKENS } from '@shared/schema';
import type { Transaction } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useMutation, useQuery } from '@tanstack/react-query';

type TabType = 'swap' | 'liquidity' | 'portfolio' | 'analytics' | 'history';

interface Balance {
  encrypted: boolean;
  value: string | null;
  decrypted: string | null;
}

export default function DexPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('swap');
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showCreatePool, setShowCreatePool] = useState(false);
  const [slippage, setSlippage] = useState('0.5');
  const [deadline, setDeadline] = useState('20');
  const [balances, setBalances] = useState<Record<string, Balance>>({
    ETH: { encrypted: true, value: null, decrypted: null },
    USDC: { encrypted: true, value: null, decrypted: null },
    DAI: { encrypted: true, value: null, decrypted: null },
    WBTC: { encrypted: true, value: null, decrypted: null }
  });

  useEffect(() => {
    FHEVMService.init().catch(console.error);
  }, []);

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions', fullAddress],
    enabled: isConnected && !!fullAddress,
    queryFn: async () => {
      const response = await fetch(`/api/transactions?address=${fullAddress}`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
  });

  const handleConnect = async () => {
    try {
      const address = await connectMetaMask();
      setIsConnected(true);
      setFullAddress(address);
      setWalletAddress(shortenAddress(address));
      await loadBalances(address);
      toast({
        title: 'Wallet Connected',
        description: `Connected to ${shortenAddress(address)}`,
      });
    } catch (error: any) {
      toast({
        title: 'Connection Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setWalletAddress('');
    setFullAddress('');
    setBalances({
      ETH: { encrypted: true, value: null, decrypted: null },
      USDC: { encrypted: true, value: null, decrypted: null },
      DAI: { encrypted: true, value: null, decrypted: null },
      WBTC: { encrypted: true, value: null, decrypted: null }
    });
    toast({
      title: 'Wallet Disconnected',
      description: 'Your wallet has been disconnected',
    });
  };

  const loadBalances = async (address: string) => {
    try {
      for (const token of SUPPORTED_TOKENS) {
        const result = await fetch(`/api/balance/${token}?address=${address}`).then(r => r.json());
        if (result.encryptedBalance) {
          setBalances(prev => ({
            ...prev,
            [token]: { 
              encrypted: true, 
              value: result.encryptedBalance, 
              decrypted: null 
            }
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load balances:', error);
    }
  };

  const handleDecryptBalance = async (token: string) => {
    if (!balances[token]?.value) return;
    
    try {
      const decrypted = await FHEVMService.decrypt(
        balances[token].value!,
        '0x0000000000000000000000000000000000000000'
      );
      
      setBalances(prev => ({
        ...prev,
        [token]: { ...prev[token], decrypted: decrypted.toString() }
      }));
      
      toast({
        title: 'Balance Decrypted',
        description: `${token} balance revealed`,
      });
    } catch (error) {
      toast({
        title: 'Decryption Failed',
        description: 'Failed to decrypt balance',
        variant: 'destructive',
      });
    }
  };

  const swapMutation = useMutation({
    mutationFn: async (params: { tokenIn: string; tokenOut: string; amountIn: string; minAmountOut: string; orderType: string; limitPrice?: string }) => {
      return apiRequest('POST', '/api/swap', {
        walletAddress: fullAddress,
        ...params
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Swap Successful',
        description: `Transaction hash: ${data.txHash}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      loadBalances(fullAddress);
    },
    onError: (error: any) => {
      toast({
        title: 'Swap Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const addLiquidityMutation = useMutation({
    mutationFn: async (params: { tokenA: string; tokenB: string; amountA: string; amountB: string }) => {
      return apiRequest('POST', '/api/liquidity/add', {
        walletAddress: fullAddress,
        ...params
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Liquidity Added',
        description: `Transaction hash: ${data.txHash}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      loadBalances(fullAddress);
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to Add Liquidity',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const createPoolMutation = useMutation({
    mutationFn: async (params: { tokenA: string; tokenB: string; amountA: string; amountB: string; fee: string }) => {
      return apiRequest('POST', '/api/pool/create', {
        walletAddress: fullAddress,
        ...params
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Pool Created',
        description: `Transaction hash: ${data.txHash}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      loadBalances(fullAddress);
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to Create Pool',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const tabs = [
    { id: 'swap' as const, label: 'Swap', icon: ArrowDownUp },
    { id: 'liquidity' as const, label: 'Liquidity', icon: Droplets },
    { id: 'portfolio' as const, label: 'Portfolio', icon: TrendingUp },
    { id: 'analytics' as const, label: 'Analytics', icon: Activity },
    { id: 'history' as const, label: 'History', icon: Clock }
  ];

  return (
    <div className="min-h-screen bg-background">
      <DexHeader
        isConnected={isConnected}
        walletAddress={walletAddress}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        isProcessing={false}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="flex gap-2 mb-8 bg-muted/50 p-1 rounded-xl w-fit mx-auto backdrop-blur-sm flex-wrap justify-center">
          {tabs.map(tab => (
            <Button
              key={tab.id}
              data-testid={`button-tab-${tab.id}`}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2"
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </Button>
          ))}
        </div>

        {activeTab === 'swap' && (
          <SwapCard
            isConnected={isConnected}
            onSwap={async (fromToken, toToken, fromAmount, minAmountOut, orderType, limitPrice) => {
              await swapMutation.mutateAsync({ 
                tokenIn: fromToken, 
                tokenOut: toToken, 
                amountIn: fromAmount, 
                minAmountOut, 
                orderType,
                limitPrice 
              });
            }}
            onOpenSettings={() => setShowSettings(true)}
            isProcessing={swapMutation.isPending}
          />
        )}

        {activeTab === 'liquidity' && (
          <LiquidityCard
            isConnected={isConnected}
            onAddLiquidity={async (tokenA, tokenB, amountA, amountB) => {
              await addLiquidityMutation.mutateAsync({ tokenA, tokenB, amountA, amountB });
            }}
            onCreatePool={() => setShowCreatePool(true)}
            isProcessing={addLiquidityMutation.isPending}
          />
        )}

        {activeTab === 'portfolio' && (
          <PortfolioBalances
            balances={balances}
            onDecrypt={handleDecryptBalance}
            onRefresh={() => loadBalances(fullAddress)}
            isProcessing={false}
          />
        )}

        {activeTab === 'analytics' && <AnalyticsDashboard />}

        {activeTab === 'history' && <TransactionHistory transactions={transactions} />}

        <div className="max-w-4xl mx-auto mt-12 grid gap-4 md:grid-cols-3">
          <Card className="hover-elevate">
            <CardContent className="p-6 space-y-3">
              <Lock className="w-8 h-8 text-primary" />
              <h3 className="font-bold text-lg">Fully Encrypted</h3>
              <p className="text-sm text-muted-foreground">
                All transactions and balances are encrypted end-to-end using Zama's FHE technology
              </p>
            </CardContent>
          </Card>
          
          <Card className="hover-elevate">
            <CardContent className="p-6 space-y-3">
              <ArrowDownUp className="w-8 h-8 text-primary" />
              <h3 className="font-bold text-lg">Private Trading</h3>
              <p className="text-sm text-muted-foreground">
                Trade any token pair without revealing amounts or positions to anyone
              </p>
            </CardContent>
          </Card>
          
          <Card className="hover-elevate">
            <CardContent className="p-6 space-y-3">
              <Droplets className="w-8 h-8 text-primary" />
              <h3 className="font-bold text-lg">Confidential Pools</h3>
              <p className="text-sm text-muted-foreground">
                Provide liquidity with encrypted reserves, protecting your positions from MEV
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <SettingsModal
        open={showSettings}
        onOpenChange={setShowSettings}
        slippage={slippage}
        setSlippage={setSlippage}
        deadline={deadline}
        setDeadline={setDeadline}
      />

      <CreatePoolModal
        open={showCreatePool}
        onOpenChange={setShowCreatePool}
        onCreatePool={async (tokenA, tokenB, amountA, amountB, fee) => {
          await createPoolMutation.mutateAsync({ tokenA, tokenB, amountA, amountB, fee });
        }}
        isProcessing={createPoolMutation.isPending}
      />
    </div>
  );
}
