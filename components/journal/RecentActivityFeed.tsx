import { Trade } from '@/types/journal/trading';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { DisplayMode } from '@/lib/journal/settings';
import { useRouter } from 'next/navigation';
import { SetupBadge } from './SetupBadge';

interface RecentActivityFeedProps {
  trades: Trade[];
  displayMode: DisplayMode;
  limit?: number;
}

export function RecentActivityFeed({ trades, displayMode, limit = 4 }: RecentActivityFeedProps) {
  const router = useRouter();
  const formatCurrency = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 1000) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatRR = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '0.0R';
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}R`;
  };

  const formatValue = (pnl: number, rr: number) => {
    return displayMode === 'rr' ? formatRR(rr) : formatCurrency(pnl);
  };

  // Get recent trades sorted by date - only show closed trades
  const recentTrades = [...trades]
    .filter(t => t.status === 'closed' && t.exitPrice !== null && t.exitPrice !== undefined)
    .sort((a, b) => {
      const dateA = a.exitDate || a.date;
      const dateB = b.exitDate || b.date;
      return dateB.localeCompare(dateA);
    })
    .slice(0, limit);

  // Always show if we have any data (even if filtered out)
  if (trades.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Recent Activity</CardTitle>
          {recentTrades.length > 0 && (
            <Badge variant="outline" className="ml-auto text-xs">
              Last {recentTrades.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {recentTrades.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No recent closed trades
          </p>
        ) : (
          <div className="space-y-2">
            {recentTrades.map((trade) => {
              const displayDate = trade.exitDate || trade.date;
              return (
                <button
                  key={trade.id}
                  onClick={() => router.push(`/dashboard/trades/${encodeURIComponent(trade.id)}`)}
                  className="w-full flex items-center justify-between p-2 rounded-md hover:bg-accent/50 transition-colors text-left group"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className={`p-1 rounded ${trade.pnl >= 0 ? 'bg-green-100 dark:bg-green-950/30' : 'bg-red-100 dark:bg-red-950/30'}`}>
                      {trade.type === 'long' ? (
                        <TrendingUp className={`h-3 w-3 ${trade.pnl >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`} />
                      ) : (
                        <TrendingDown className={`h-3 w-3 ${trade.pnl >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{trade.symbol}</span>
                        {trade.setup && (
                          <SetupBadge setupName={trade.setup} className="text-xs px-1 h-4 hidden sm:inline-flex" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(displayDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm flex-shrink-0 ml-2 group-hover:scale-105 transition-transform ${trade.pnl >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                    {formatValue(trade.pnl, trade.rr || 0)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
