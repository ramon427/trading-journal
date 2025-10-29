import { useMemo } from 'react';
import { Trade } from '@/types/journal/trading';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { TrendingUp, TrendingDown, Calendar, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface AdvancedStatisticsProps {
  trades: Trade[];
}

export function AdvancedStatistics({ trades }: AdvancedStatisticsProps) {
  const statistics = useMemo(() => {
    if (trades.length === 0) {
      return {
        maxConsecutiveWins: 0,
        maxConsecutiveLosses: 0,
        bestDay: null as string | null,
        worstDay: null as string | null,
        dayOfWeekStats: [] as Array<{ day: string; pnl: number; trades: number }>,
        monthlyStats: [] as Array<{ month: string; pnl: number; trades: number }>,
      };
    }

    // Sort trades by date
    const sortedTrades = [...trades].sort((a, b) => a.date.localeCompare(b.date));

    // Calculate consecutive wins/losses
    let maxConsecutiveWins = 0;
    let maxConsecutiveLosses = 0;
    let currentWins = 0;
    let currentLosses = 0;

    sortedTrades.forEach(trade => {
      if (trade.pnl > 0) {
        currentWins++;
        currentLosses = 0;
        maxConsecutiveWins = Math.max(maxConsecutiveWins, currentWins);
      } else if (trade.pnl < 0) {
        currentLosses++;
        currentWins = 0;
        maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentLosses);
      }
    });

    // Calculate PnL by date
    const pnlByDate = new Map<string, number>();
    trades.forEach(trade => {
      pnlByDate.set(trade.date, (pnlByDate.get(trade.date) || 0) + trade.pnl);
    });

    // Find best and worst days
    let bestDay: string | null = null;
    let bestDayPnl = -Infinity;
    let worstDay: string | null = null;
    let worstDayPnl = Infinity;

    pnlByDate.forEach((pnl, date) => {
      if (pnl > bestDayPnl) {
        bestDayPnl = pnl;
        bestDay = date;
      }
      if (pnl < worstDayPnl) {
        worstDayPnl = pnl;
        worstDay = date;
      }
    });

    // Calculate day of week statistics
    const dayOfWeekMap = new Map<number, { pnl: number; trades: number }>();
    trades.forEach(trade => {
      const date = new Date(trade.date);
      const dayOfWeek = date.getDay();
      const current = dayOfWeekMap.get(dayOfWeek) || { pnl: 0, trades: 0 };
      dayOfWeekMap.set(dayOfWeek, {
        pnl: current.pnl + trade.pnl,
        trades: current.trades + 1,
      });
    });

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayOfWeekStats = Array.from({ length: 7 }, (_, i) => {
      const stats = dayOfWeekMap.get(i) || { pnl: 0, trades: 0 };
      return {
        day: dayNames[i],
        pnl: stats.pnl,
        trades: stats.trades,
      };
    });

    // Calculate monthly statistics (last 6 months)
    const monthlyMap = new Map<string, { pnl: number; trades: number }>();
    trades.forEach(trade => {
      const date = new Date(trade.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const current = monthlyMap.get(monthKey) || { pnl: 0, trades: 0 };
      monthlyMap.set(monthKey, {
        pnl: current.pnl + trade.pnl,
        trades: current.trades + 1,
      });
    });

    const monthlyStats = Array.from(monthlyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([month, stats]) => {
        const [year, monthNum] = month.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return {
          month: `${monthNames[parseInt(monthNum) - 1]} ${year.slice(2)}`,
          pnl: stats.pnl,
          trades: stats.trades,
        };
      });

    return {
      maxConsecutiveWins,
      maxConsecutiveLosses,
      bestDay,
      worstDay,
      bestDayPnl,
      worstDayPnl,
      dayOfWeekStats,
      monthlyStats,
    };
  }, [trades]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (trades.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No trades data available for advanced statistics</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Consecutive Wins/Losses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Max Consecutive Wins</CardTitle>
              <TrendingUp className="h-4 w-4 text-chart-2" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-3xl">{statistics.maxConsecutiveWins}</div>
              <p className="text-muted-foreground text-sm">
                Longest winning streak
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Max Consecutive Losses</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-3xl">{statistics.maxConsecutiveLosses}</div>
              <p className="text-muted-foreground text-sm">
                Longest losing streak
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Best/Worst Days */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Best Trading Day</CardTitle>
              <Calendar className="h-4 w-4 text-chart-2" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl text-chart-2">
                {statistics.bestDay && formatCurrency(statistics.bestDayPnl!)}
              </div>
              <p className="text-muted-foreground text-sm">
                {statistics.bestDay ? formatDate(statistics.bestDay) : 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Worst Trading Day</CardTitle>
              <Calendar className="h-4 w-4 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl text-destructive">
                {statistics.worstDay && formatCurrency(statistics.worstDayPnl!)}
              </div>
              <p className="text-muted-foreground text-sm">
                {statistics.worstDay ? formatDate(statistics.worstDay) : 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Day of Week Performance */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Performance by Day of Week</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={statistics.dayOfWeekStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="day" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => `$${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'pnl') return [formatCurrency(value), 'P&L'];
                  return [value, 'Trades'];
                }}
              />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {statistics.dayOfWeekStats.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.pnl >= 0 ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-7 gap-2">
            {statistics.dayOfWeekStats.map((stat) => (
              <div key={stat.day} className="text-center">
                <p className="text-xs text-muted-foreground">{stat.day}</p>
                <Badge variant={stat.trades > 0 ? 'secondary' : 'outline'} className="text-xs mt-1">
                  {stat.trades}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Performance */}
      {statistics.monthlyStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Performance Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={statistics.monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => `$${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'pnl') return [formatCurrency(value), 'P&L'];
                    return [value, 'Trades'];
                  }}
                />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {statistics.monthlyStats.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.pnl >= 0 ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-2">
              {statistics.monthlyStats.map((stat) => (
                <div key={stat.month} className="text-center">
                  <p className="text-xs text-muted-foreground">{stat.month}</p>
                  <Badge variant={stat.trades > 0 ? 'secondary' : 'outline'} className="text-xs mt-1">
                    {stat.trades}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
