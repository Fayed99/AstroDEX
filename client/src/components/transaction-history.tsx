import { useState } from 'react';
import { Clock, ArrowDownUp, Droplets, Filter, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Transaction } from '@shared/schema';

interface TransactionHistoryProps {
  transactions: Transaction[];
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  const [filterType, setFilterType] = useState<string>('all');

  const filteredTransactions = filterType === 'all'
    ? transactions
    : transactions.filter(tx => tx.type === filterType);

  const getTypeIcon = (type: string) => {
    return type === 'swap' ? ArrowDownUp : Droplets;
  };

  const getStatusColor = (status: string) => {
    return status === 'completed' ? 'default' : status === 'pending' ? 'secondary' : 'destructive';
  };

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      return;
    }

    // Create CSV header
    const headers = ['Date', 'Type', 'From Token', 'To Token', 'Amount', 'Status', 'Transaction Hash'];

    // Create CSV rows
    const rows = filteredTransactions.map(tx => [
      new Date(tx.timestamp).toISOString(),
      tx.type,
      tx.fromToken,
      tx.toToken,
      tx.amount,
      tx.status,
      tx.txHash || 'N/A'
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `astrodex-transactions-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2 bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
          <Clock className="w-6 h-6 text-purple-400" />
          Transaction History
        </h2>
        <div className="flex items-center gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger data-testid="select-filter-type" className="w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Transactions</SelectItem>
              <SelectItem value="swap">Swaps Only</SelectItem>
              <SelectItem value="liquidity">Liquidity Only</SelectItem>
            </SelectContent>
          </Select>
          <Button
            data-testid="button-export"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={filteredTransactions.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card data-testid="card-transactions" className="astro-card cosmic-glow-cyan">
        <CardContent className="p-0">
          {filteredTransactions.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No transactions yet</p>
              <p className="text-sm">Your transaction history will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredTransactions.map((tx) => {
                const TypeIcon = getTypeIcon(tx.type);
                return (
                  <div
                    key={tx.id}
                    data-testid={`row-transaction-${tx.id}`}
                    className="flex flex-wrap items-center justify-between gap-4 p-4 hover-elevate"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <TypeIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold capitalize">{tx.type}</p>
                        <p className="text-sm text-muted-foreground">
                          {tx.fromToken} → {tx.toToken}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-mono font-semibold" data-testid={`text-amount-${tx.id}`}>
                        {parseFloat(tx.amount).toFixed(4)} {tx.fromToken}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(tx.timestamp).toLocaleString()}
                      </p>
                    </div>

                    <Badge 
                      data-testid={`badge-status-${tx.id}`}
                      variant={getStatusColor(tx.status)}
                      className="capitalize"
                    >
                      {tx.status}
                    </Badge>

                    {tx.txHash && (
                      <Button
                        data-testid={`button-view-tx-${tx.id}`}
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a 
                          href={`https://explorer.zama.ai/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-mono"
                        >
                          {tx.txHash.slice(0, 6)}...{tx.txHash.slice(-4)}
                        </a>
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
