import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Trade, Statistics } from '@/types/journal/trading';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Flame, 
  FileSpreadsheet, 
  ChevronDown, 
  ChevronUp,
  ArrowUpDown,
  Lightbulb,
  AlertTriangle,
  Target,
  Award,
  Activity,
  Snowflake
} from 'lucide-react';
import { DisplayMode } from '@/lib/journal/settings';
import { TradeFilter, TradeFilters } from './TradeFilter';
import { navigateTo } from '@/lib/journal/router';
import { 
  filterTrades, 
  getAvailableSymbols, 
  getAvailableSetups, 
  getAvailableTags,
  calculateStatistics 
} from '@/lib/journal/tradingData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { ChartTooltip } from './ChartTooltip';
import { Sparkline } from './Sparkline';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';

interface StatsPanelProps {
  trades: Trade[];
  stats: Statistics;
  displayMode: DisplayMode;
  onEditTrade?: (trade: Trade) => void;
  onDeleteTrade?: (tradeId: string) => void;
}

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
};

type ComparisonPeriod = 'none' | 'last-week' | 'last-month' | 'last-quarter';

interface Insight {
  type: 'positive' | 'negative' | 'neutral' | 'warning';
  message: string;
  icon: typeof TrendingUp;
}

export function StatsPanel({ trades, stats: globalStats, displayMode, onEditTrade, onDeleteTrade }: StatsPanelProps) {
  const [filters, setFilters] = useState<TradeFilters>({ period: 'all' });
  const [symbolSortConfig, setSymbolSortConfig] = useState<SortConfig>({ key: 'pnl', direction: 'desc' });
  const [setupSortConfig, setSetupSortConfig] = useState<SortConfig>({ key: 'pnl', direction: 'desc' });
  const [bestTradesOpen, setBestTradesOpen] = useState(true);
  const [worstTradesOpen, setWorstTradesOpen] = useState(true);
  const [comparisonPeriod, setComparisonPeriod] = useState<ComparisonPeriod>('none');

  // Filter trades and recalculate stats
  const filteredTrades = useMemo(() => filterTrades(trades, filters), [trades, filters]);
  
  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return filters.period !== 'all' || 
           filters.dateFrom !== undefined || 
           filters.dateTo !== undefined ||
           filters.symbol !== undefined ||
           filters.setup !== undefined ||
           filters.tag !== undefined;
  }, [filters]);
  
  // Use global stats when no filters, recalculate when filtered
  const stats = useMemo(() => {
    return hasActiveFilters ? calculateStatistics(filteredTrades) : globalStats;
  }, [hasActiveFilters, filteredTrades, globalStats]);
  
  const availableSymbols = useMemo(() => getAvailableSymbols(trades), [trades]);
  const availableSetups = useMemo(() => getAvailableSetups(trades), [trades]);
  const availableTags = useMemo(() => getAvailableTags(trades), [trades]);

  // Comparison period calculation
  const comparisonStats = useMemo(() => {
    if (comparisonPeriod === 'none') return null;

    const now = new Date();
    let cutoffDate: Date;

    switch (comparisonPeriod) {
      case 'last-week':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last-month':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'last-quarter':
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        return null;
    }

    const comparisonTrades = filteredTrades.filter(t => new Date(t.date) < cutoffDate);
    return calculateStatistics(comparisonTrades);
  }, [filteredTrades, comparisonPeriod]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatRR = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '0.0R';
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}R`;
  };

  const formatValue = (value: number) => {
    return displayMode === 'rr' ? formatRR(value) : formatCurrency(value);
  };

  const formatComparison = (current: number, previous: number) => {
    if (previous === 0) return null;
    const diff = current - previous;
    const percentDiff = (diff / Math.abs(previous)) * 100;
    const isPositive = diff >= 0;
    
    return (
      <span className={`text-xs ml-2 ${isPositive ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
        ({isPositive ? '↑' : '↓'} {Math.abs(percentDiff).toFixed(1)}%)
      </span>
    );
  };

  // Quick Insights
  const insights: Insight[] = useMemo(() => {
    const results: Insight[] = [];
    
    // Current streak
    if (stats.currentStreak >= 3) {
      results.push({
        type: 'positive',
        message: `You're on a ${stats.currentStreak}-trade winning streak! Stay disciplined.`,
        icon: Flame
      });
    } else if (stats.currentStreak <= -3) {
      results.push({
        type: 'warning',
        message: `${Math.abs(stats.currentStreak)}-trade losing streak. Consider taking a break.`,
        icon: AlertTriangle
      });
    }

    // Best day analysis
    const dayStats = Object.entries(stats.performanceByDay);
    if (dayStats.length > 0) {
      const bestDay = dayStats.reduce((a, b) => b[1].pnl > a[1].pnl ? b : a);
      if (bestDay[1].winRate > stats.winRate + 5) {
        results.push({
          type: 'positive',
          message: `${bestDay[0]} trades have ${bestDay[1].winRate.toFixed(0)}% win rate (${(bestDay[1].winRate - stats.winRate).toFixed(0)}% above average)`,
          icon: TrendingUp
        });
      }
    }

    // Top symbol
    if (filteredTrades.length > 0) {
      const symbolStats = new Map<string, number>();
      filteredTrades.forEach(trade => {
        const current = symbolStats.get(trade.symbol) || 0;
        symbolStats.set(trade.symbol, current + (displayMode === 'rr' ? (trade.rr || 0) : trade.pnl));
      });
      const topSymbol = Array.from(symbolStats.entries()).reduce((a, b) => b[1] > a[1] ? b : a);
      if (topSymbol[1] > 0) {
        results.push({
          type: 'positive',
          message: `${topSymbol[0]} is your most profitable symbol (${formatValue(topSymbol[1])})`,
          icon: Award
        });
      }
    }

    // Profit factor insight
    const profitFactorValue = displayMode === 'rr' ? (stats.profitFactorRR || 0) : stats.profitFactor;
    if (profitFactorValue >= 2) {
      results.push({
        type: 'positive',
        message: `Excellent profit factor of ${profitFactorValue.toFixed(2)} - your wins significantly outweigh losses`,
        icon: Target
      });
    } else if (profitFactorValue < 1 && stats.totalTrades > 10) {
      results.push({
        type: 'negative',
        message: `Profit factor below 1.0 (${profitFactorValue.toFixed(2)}) - review your strategy`,
        icon: AlertTriangle
      });
    }

    return results.slice(0, 4);
  }, [filteredTrades, stats, displayMode]);

  // Symbol performance data
  const symbolStats = useMemo(() => {
    const map = new Map<string, { trades: number; pnl: number; rr: number; wins: number; tradeList: Trade[] }>();
    filteredTrades.forEach(trade => {
      const current = map.get(trade.symbol) || { trades: 0, pnl: 0, rr: 0, wins: 0, tradeList: [] };
      current.trades += 1;
      current.pnl += trade.pnl;
      current.rr += (trade.rr || 0);
      if (trade.pnl > 0) current.wins += 1;
      current.tradeList.push(trade);
      map.set(trade.symbol, current);
    });

    return Array.from(map.entries())
      .map(([symbol, data]) => ({
        symbol,
        ...data,
        winRate: (data.wins / data.trades) * 100,
        avgValue: (displayMode === 'rr' ? data.rr : data.pnl) / data.trades
      }));
  }, [filteredTrades, displayMode]);

  const topSymbols = useMemo(() => {
    const sorted = [...symbolStats].sort((a, b) => {
      const aVal = symbolSortConfig.key === 'symbol' ? a.symbol.localeCompare(b.symbol) :
                   symbolSortConfig.key === 'trades' ? a.trades - b.trades :
                   symbolSortConfig.key === 'winRate' ? a.winRate - b.winRate :
                   (displayMode === 'rr' ? a.rr - b.rr : a.pnl - b.pnl);
      const bVal = 0; // Already calculated in comparison
      return symbolSortConfig.direction === 'asc' ? aVal : -aVal;
    });
    return sorted.slice(0, 10);
  }, [symbolStats, symbolSortConfig, displayMode]);

  // Setup performance data
  const setupStats = useMemo(() => {
    const map = new Map<string, { trades: number; pnl: number; rr: number; wins: number; tradeList: Trade[] }>();
    filteredTrades.forEach(trade => {
      if (trade.setup) {
        const current = map.get(trade.setup) || { trades: 0, pnl: 0, rr: 0, wins: 0, tradeList: [] };
        current.trades += 1;
        current.pnl += trade.pnl;
        current.rr += (trade.rr || 0);
        if (trade.pnl > 0) current.wins += 1;
        current.tradeList.push(trade);
        map.set(trade.setup, current);
      }
    });

    return Array.from(map.entries())
      .map(([setup, data]) => ({
        setup,
        ...data,
        winRate: (data.wins / data.trades) * 100,
      }));
  }, [filteredTrades]);

  const topSetups = useMemo(() => {
    const sorted = [...setupStats].sort((a, b) => {
      const aVal = setupSortConfig.key === 'setup' ? a.setup.localeCompare(b.setup) :
                   setupSortConfig.key === 'trades' ? a.trades - b.trades :
                   setupSortConfig.key === 'winRate' ? a.winRate - b.winRate :
                   (displayMode === 'rr' ? a.rr - b.rr : a.pnl - b.pnl);
      const bVal = 0;
      return setupSortConfig.direction === 'asc' ? aVal : -aVal;
    });
    return sorted.slice(0, 10);
  }, [setupStats, setupSortConfig, displayMode]);

  // Best and worst trades
  const sortedTrades = useMemo(() => {
    return [...filteredTrades].sort((a, b) => 
      displayMode === 'rr' 
        ? (b.rr || 0) - (a.rr || 0)
        : b.pnl - a.pnl
    );
  }, [filteredTrades, displayMode]);

  const bestTrades = sortedTrades.slice(0, 5);
  const worstTrades = sortedTrades.slice(-5).reverse();

  // Day of week chart data
  const dayOfWeekData = useMemo(() => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days.map(day => {
      const data = stats.performanceByDay[day];
      if (!data) return { day: day.substring(0, 3), value: 0, winRate: 0, trades: 0 };
      
      return {
        day: day.substring(0, 3),
        value: displayMode === 'rr' ? data.rr : data.pnl,
        winRate: data.winRate,
        trades: data.trades
      };
    }).filter(d => d.trades > 0);
  }, [stats.performanceByDay, displayMode]);

  // Win/Loss pie chart data
  const winLossData = [
    { name: 'Wins', value: stats.winningTrades, color: '#22c55e' },
    { name: 'Losses', value: stats.losingTrades, color: '#ef4444' },
  ];



  // Export functions
  const exportSymbolData = () => {
    const csvContent = [
      ['Symbol', 'Trades', 'Win Rate', displayMode === 'rr' ? 'Total R:R' : 'Total P&L'].join(','),
      ...topSymbols.map(s => [
        s.symbol,
        s.trades,
        `${s.winRate.toFixed(1)}%`,
        displayMode === 'rr' ? s.rr.toFixed(1) : s.pnl.toFixed(2)
      ].join(','))
    ].join('\n');
    
    downloadCSV(csvContent, 'symbol-performance.csv');
  };

  const exportSetupData = () => {
    const csvContent = [
      ['Setup', 'Trades', 'Win Rate', displayMode === 'rr' ? 'Total R:R' : 'Total P&L'].join(','),
      ...topSetups.map(s => [
        s.setup,
        s.trades,
        `${s.winRate.toFixed(1)}%`,
        displayMode === 'rr' ? s.rr.toFixed(1) : s.pnl.toFixed(2)
      ].join(','))
    ].join('\n');
    
    downloadCSV(csvContent, 'setup-performance.csv');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported successfully');
  };

  const handleSort = (key: string, config: SortConfig, setter: (config: SortConfig) => void) => {
    if (config.key === key) {
      setter({ key, direction: config.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      setter({ key, direction: 'desc' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Sticky Filter Component */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 pb-4 -mt-2 pt-2 mb-2">
        <TradeFilter
          filters={filters}
          onFiltersChange={setFilters}
          availableSymbols={availableSymbols}
          availableSetups={availableSetups}
          availableTags={availableTags}
        />

        {/* Filter Summary & Comparison Period */}
        <div className="flex items-center justify-between gap-4 mt-4 pt-3 border-t border-border">
          {filteredTrades.length < trades.length && (
            <p className="text-sm text-muted-foreground">
              Showing <span className="text-foreground font-medium">{filteredTrades.length}</span> of {trades.length} total trades
            </p>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-muted-foreground">Compare to:</span>
            <Select value={comparisonPeriod} onValueChange={(v) => setComparisonPeriod(v as ComparisonPeriod)}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="last-week">Last Week</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="last-quarter">Last Quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Overview Section - Comprehensive Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {/* Total P&L / R:R */}
            <div className="p-4 rounded-md border border-border">
              <p className="text-xs text-muted-foreground mb-1">{displayMode === 'rr' ? 'Total R:R' : 'Total P&L'}</p>
              <div className="flex items-baseline gap-1">
                <h3 className={stats.totalPnl >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}>
                  {formatValue(displayMode === 'rr' ? (stats.totalRR || 0) : stats.totalPnl)}
                </h3>
                {comparisonStats && formatComparison(
                  displayMode === 'rr' ? (stats.totalRR || 0) : stats.totalPnl,
                  displayMode === 'rr' ? (comparisonStats.totalRR || 0) : comparisonStats.totalPnl
                )}
              </div>
            </div>

            {/* Win Rate */}
            <div className="p-4 rounded-md border border-border">
              <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
              <div className="flex items-baseline gap-1">
                <h3 className="text-green-600 dark:text-green-500">{stats.winRate.toFixed(1)}%</h3>
                {comparisonStats && formatComparison(stats.winRate, comparisonStats.winRate)}
              </div>
            </div>

            {/* Total Trades */}
            <div className="p-4 rounded-md border border-border">
              <p className="text-xs text-muted-foreground mb-1">Total Trades</p>
              <div className="flex items-baseline gap-1">
                <h3>{stats.totalTrades}</h3>
                {comparisonStats && formatComparison(stats.totalTrades, comparisonStats.totalTrades)}
              </div>
            </div>

            {/* Avg R:R or Win/Loss Ratio */}
            <div className="p-4 rounded-md border border-border">
              <p className="text-xs text-muted-foreground mb-1">
                {displayMode === 'rr' ? 'Avg R:R' : 'Avg Win/Loss'}
              </p>
              <h3>
                {displayMode === 'rr' 
                  ? `1:${stats.avgLoss !== 0 ? Math.abs(stats.avgWin / stats.avgLoss).toFixed(1) : '0.0'}`
                  : `${formatCurrency(stats.avgWin)} / ${formatCurrency(Math.abs(stats.avgLoss))}`
                }
              </h3>
            </div>

            {/* Best Day */}
            <div className="p-4 rounded-md border border-border">
              <p className="text-xs text-muted-foreground mb-1">Best Day</p>
              <h3 className="text-green-600 dark:text-green-500">
                {displayMode === 'rr' ? formatRR(stats.bestDayRR || 0) : formatCurrency(stats.bestDay)}
              </h3>
            </div>

            {/* Worst Day */}
            <div className="p-4 rounded-md border border-border">
              <p className="text-xs text-muted-foreground mb-1">Worst Day</p>
              <h3 className="text-red-600 dark:text-red-500">
                {displayMode === 'rr' ? formatRR(stats.worstDayRR || 0) : formatCurrency(stats.worstDay)}
              </h3>
            </div>

            {/* Expectancy */}
            <div className="p-4 rounded-md border border-border">
              <p className="text-xs text-muted-foreground mb-1">Expectancy</p>
              <h3 className={stats.expectancy >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}>
                {displayMode === 'rr' ? formatRR(stats.expectancyRR || 0) : formatCurrency(stats.expectancy)}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">per trade</p>
            </div>

            {/* Profit Factor */}
            <div className="p-4 rounded-md border border-border">
              <p className="text-xs text-muted-foreground mb-1">Profit Factor</p>
              <h3 className={
                (displayMode === 'rr' ? (stats.profitFactorRR || 0) : stats.profitFactor) >= 1 
                  ? 'text-green-600 dark:text-green-500' 
                  : 'text-red-600 dark:text-red-500'
              }>
                {(() => {
                  const pfValue = displayMode === 'rr' ? (stats.profitFactorRR || 0) : stats.profitFactor;
                  return pfValue === Infinity ? '∞' : pfValue.toFixed(2);
                })()}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {(() => {
                  const pfValue = displayMode === 'rr' ? (stats.profitFactorRR || 0) : stats.profitFactor;
                  return pfValue >= 2 ? 'Excellent' : pfValue >= 1.5 ? 'Good' : pfValue >= 1 ? 'Fair' : 'Poor';
                })()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Quick Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-md border border-border bg-muted/30">
                  <insight.icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                    insight.type === 'positive' ? 'text-green-600 dark:text-green-500' :
                    insight.type === 'warning' ? 'text-orange-600 dark:text-orange-500' :
                    insight.type === 'negative' ? 'text-red-600 dark:text-red-500' :
                    'text-foreground'
                  }`} />
                  <p className="text-sm">{insight.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabbed Content */}
      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="w-full border-b border-border">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="symbols">Symbols & Setups</TabsTrigger>
          <TabsTrigger value="trades">Trade Review</TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          {/* Visual Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Day of Week Performance */}
            {dayOfWeekData.length > 0 && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Performance by Day of Week</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dayOfWeekData} barGap={8}>
                      <CartesianGrid strokeDasharray="0" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis 
                        dataKey="day" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickFormatter={(value) => displayMode === 'rr' ? `${value}R` : `${value}`}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (!active || !payload || payload.length === 0) return null;
                          const data = payload[0].payload;
                          return (
                            <div className="bg-popover border border-border rounded-md p-3">
                              <p className="font-medium mb-1">{data.day}</p>
                              <p className="text-sm text-muted-foreground">
                                {displayMode === 'rr' ? 'R:R' : 'P&L'}: <span className={data.value >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}>
                                  {formatValue(data.value)}
                                </span>
                              </p>
                              <p className="text-sm text-muted-foreground">Win Rate: {data.winRate.toFixed(0)}%</p>
                              <p className="text-sm text-muted-foreground">Trades: {data.trades}</p>
                            </div>
                          );
                        }}
                        cursor={false}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="hsl(var(--chart-1))"
                        radius={0}
                      >
                        {dayOfWeekData.map((entry, index) => (
                          <Cell key={index} fill={entry.value >= 0 ? '#22c55e' : '#ef4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Win/Loss Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Win/Loss Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={winLossData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {winLossData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || payload.length === 0) return null;
                        const data = payload[0].payload;
                        const total = stats.winningTrades + stats.losingTrades;
                        const percentage = total > 0 ? (data.value / total * 100).toFixed(1) : 0;
                        return (
                          <div className="bg-popover border border-border rounded-md p-3">
                            <p className="font-medium mb-1">{data.name}</p>
                            <p className="text-sm text-muted-foreground">{data.value} trades ({percentage}%)</p>
                          </div>
                        );
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <div className="text-center mt-4">
                  <p className="text-2xl">{stats.winRate.toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Streak Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-md bg-muted">
                    {stats.currentStreak >= 3 ? (
                      <Flame className="h-5 w-5 text-orange-600 dark:text-orange-500 animate-pulse" />
                    ) : stats.currentStreak <= -3 ? (
                      <Snowflake className="h-5 w-5 text-blue-500" />
                    ) : (
                      <Flame className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">Current Streak</p>
                      {stats.currentStreak >= 3 && (
                        <Badge variant="secondary" className="gap-1 text-xs border-orange-500/20">
                          <Flame className="h-3 w-3 text-orange-600" />
                          Hot!
                        </Badge>
                      )}
                      {stats.currentStreak <= -3 && (
                        <Badge variant="secondary" className="gap-1 text-xs border-blue-500/20">
                          <Snowflake className="h-3 w-3 text-blue-500" />
                          Cold
                        </Badge>
                      )}
                    </div>
                    <h4 className={stats.currentStreak >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}>
                      {stats.currentStreak >= 0 ? `+${stats.currentStreak}` : stats.currentStreak} trades
                    </h4>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-md bg-muted">
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Longest Win Streak</p>
                    <h4 className="text-green-600 dark:text-green-500">
                      {stats.longestWinStreak} trades
                    </h4>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-md bg-muted">
                    <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Longest Lose Streak</p>
                    <h4 className="text-red-600 dark:text-red-400">
                      {stats.longestLoseStreak} trades
                    </h4>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Symbols & Setups Tab */}
        <TabsContent value="symbols" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Symbols */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Top Performing Symbols</CardTitle>
                  <Button variant="outline" size="sm" onClick={exportSymbolData}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {topSymbols.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 -ml-3"
                            onClick={() => handleSort('symbol', symbolSortConfig, setSymbolSortConfig)}
                          >
                            Symbol
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8"
                            onClick={() => handleSort('trades', symbolSortConfig, setSymbolSortConfig)}
                          >
                            Trades
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8"
                            onClick={() => handleSort('winRate', symbolSortConfig, setSymbolSortConfig)}
                          >
                            Win %
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8"
                            onClick={() => handleSort('value', symbolSortConfig, setSymbolSortConfig)}
                          >
                            {displayMode === 'rr' ? 'R:R' : 'P&L'}
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead className="w-24">Trend</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topSymbols.map((item, index) => {
                        const value = displayMode === 'rr' ? item.rr : item.pnl;
                        const sparklineValues = item.tradeList
                          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                          .map(t => displayMode === 'rr' ? (t.rr || 0) : t.pnl);
                        
                        return (
                          <TableRow key={index}>
                            <TableCell>{item.symbol}</TableCell>
                            <TableCell className="text-right">{item.trades}</TableCell>
                            <TableCell className="text-right">{item.winRate.toFixed(0)}%</TableCell>
                            <TableCell className={`text-right ${value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {formatValue(value)}
                            </TableCell>
                            <TableCell>
                              <Sparkline data={sparklineValues} width={60} height={20} />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No trades yet</p>
                )}
              </CardContent>
            </Card>

            {/* Top Setups */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Top Performing Setups</CardTitle>
                  <Button variant="outline" size="sm" onClick={exportSetupData}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {topSetups.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 -ml-3"
                            onClick={() => handleSort('setup', setupSortConfig, setSetupSortConfig)}
                          >
                            Setup
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8"
                            onClick={() => handleSort('trades', setupSortConfig, setSetupSortConfig)}
                          >
                            Trades
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8"
                            onClick={() => handleSort('winRate', setupSortConfig, setSetupSortConfig)}
                          >
                            Win %
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8"
                            onClick={() => handleSort('value', setupSortConfig, setSetupSortConfig)}
                          >
                            {displayMode === 'rr' ? 'R:R' : 'P&L'}
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead className="w-24">Trend</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topSetups.map((item, index) => {
                        const value = displayMode === 'rr' ? item.rr : item.pnl;
                        const sparklineValues = item.tradeList
                          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                          .map(t => displayMode === 'rr' ? (t.rr || 0) : t.pnl);
                        
                        return (
                          <TableRow key={index}>
                            <TableCell>{item.setup}</TableCell>
                            <TableCell className="text-right">{item.trades}</TableCell>
                            <TableCell className="text-right">{item.winRate.toFixed(0)}%</TableCell>
                            <TableCell className={`text-right ${value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {formatValue(value)}
                            </TableCell>
                            <TableCell>
                              <Sparkline data={sparklineValues} width={60} height={20} />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No setups recorded</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trade Review Tab */}
        <TabsContent value="trades" className="space-y-6">
          {/* Best Trades - Collapsible */}
          <Collapsible open={bestTradesOpen} onOpenChange={setBestTradesOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle>Best Trades</CardTitle>
                    {bestTradesOpen ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  {bestTrades.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Symbol</TableHead>
                          <TableHead>Setup</TableHead>
                          <TableHead className="text-right">{displayMode === 'rr' ? 'R:R' : 'P&L'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bestTrades.map((trade, index) => {
                          const value = displayMode === 'rr' ? (trade.rr || 0) : trade.pnl;
                          return (
                            <TableRow 
                              key={index} 
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => {
                                setSelectedTrade(trade);
                                setDetailModalOpen(true);
                              }}
                            >
                              <TableCell>{new Date(trade.date).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {trade.symbol}
                                  <Badge variant={trade.type === 'long' ? 'default' : 'secondary'} className="text-xs">
                                    {trade.type}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>{trade.setup || '-'}</TableCell>
                              <TableCell className="text-right text-green-600 dark:text-green-400">
                                {formatValue(value)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No trades yet</p>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Worst Trades - Collapsible */}
          <Collapsible open={worstTradesOpen} onOpenChange={setWorstTradesOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle>Worst Trades</CardTitle>
                    {worstTradesOpen ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  {worstTrades.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Symbol</TableHead>
                          <TableHead>Setup</TableHead>
                          <TableHead className="text-right">{displayMode === 'rr' ? 'R:R' : 'P&L'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {worstTrades.map((trade, index) => {
                          const value = displayMode === 'rr' ? (trade.rr || 0) : trade.pnl;
                          return (
                            <TableRow 
                              key={index}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => {
                                setSelectedTrade(trade);
                                setDetailModalOpen(true);
                              }}
                            >
                              <TableCell>{new Date(trade.date).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {trade.symbol}
                                  <Badge variant={trade.type === 'long' ? 'default' : 'secondary'} className="text-xs">
                                    {trade.type}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>{trade.setup || '-'}</TableCell>
                              <TableCell className="text-right text-red-600 dark:text-red-400">
                                {formatValue(value)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No trades yet</p>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </TabsContent>
      </Tabs>
    </div>
  );
}
