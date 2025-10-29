import { useMemo } from 'react';
import { motion } from 'motion/react';
import { Trade, JournalEntry, Statistics } from '@/types/journal/trading';
import { DisplayMode } from '@/lib/journal/settings';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { usePageFeatures } from '@/lib/journal/usePageFeatures';
import { useGlobalSettings } from '@/lib/journal/useGlobalSettings';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Target,
  Calendar,
  Clock,
  BarChart3,
  Zap,
  Brain,
  Activity,
  Package,
  TrendingUpIcon
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ComposedChart, Line, Area, LineChart } from 'recharts';
import { EmptyState } from './EmptyState';
import { useRouter } from 'next/navigation';

interface AnalyticsProps {
  trades: Trade[];
  journalEntries: JournalEntry[];
  stats: Statistics;
  displayMode: DisplayMode;
}

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label, formatValue }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-3 backdrop-blur-sm">
      <p className="text-sm mb-2 opacity-80">{label}</p>
      {payload.map((entry: any, index: number) => {
        const value = entry.value;
        const isPositive = value >= 0;
        
        return (
          <div key={index} className="flex items-center justify-between gap-4 text-sm">
            <span className="opacity-60">{entry.name || entry.dataKey}</span>
            <span className={isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-500'}>
              {formatValue ? formatValue(value) : value}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export function Analytics({ trades, journalEntries, stats, displayMode }: AnalyticsProps) {
  const router = useRouter();
  const features = usePageFeatures('analytics');
  const globalSettings = useGlobalSettings();
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatRR = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '0.0R';
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}R`;
  };

  const formatValue = (value: number) => {
    return displayMode === 'rr' ? formatRR(value) : formatCurrency(value);
  };

  // Calculate performance by symbol
  const symbolPerformance = useMemo(() => {
    const symbolStats: { [key: string]: { trades: number; wins: number; pnl: number; rr: number } } = {};
    
    trades.forEach(trade => {
      if (!symbolStats[trade.symbol]) {
        symbolStats[trade.symbol] = { trades: 0, wins: 0, pnl: 0, rr: 0 };
      }
      symbolStats[trade.symbol].trades++;
      if (trade.pnl > 0) symbolStats[trade.symbol].wins++;
      symbolStats[trade.symbol].pnl += trade.pnl;
      symbolStats[trade.symbol].rr += (trade.rr || 0);
    });

    return Object.entries(symbolStats)
      .map(([symbol, data]) => ({
        symbol,
        trades: data.trades,
        winRate: (data.wins / data.trades) * 100,
        pnl: data.pnl,
        rr: data.rr,
        avgPnl: data.pnl / data.trades,
        avgRR: data.rr / data.trades,
      }))
      .sort((a, b) => b.pnl - a.pnl)
      .slice(0, 10);
  }, [trades]);

  // Calculate performance by day of week
  const dayOfWeekPerformance = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayStats: { [key: number]: { trades: number; pnl: number; rr: number; wins: number } } = {};
    
    trades.forEach(trade => {
      const dayOfWeek = new Date(trade.date).getDay();
      if (!dayStats[dayOfWeek]) {
        dayStats[dayOfWeek] = { trades: 0, pnl: 0, rr: 0, wins: 0 };
      }
      dayStats[dayOfWeek].trades++;
      dayStats[dayOfWeek].pnl += trade.pnl;
      dayStats[dayOfWeek].rr += (trade.rr || 0);
      if (trade.pnl > 0) dayStats[dayOfWeek].wins++;
    });

    return days.map((day, index) => ({
      day,
      trades: dayStats[index]?.trades || 0,
      pnl: dayStats[index]?.pnl || 0,
      rr: dayStats[index]?.rr || 0,
      winRate: dayStats[index] ? (dayStats[index].wins / dayStats[index].trades) * 100 : 0,
    })).filter(d => d.trades > 0);
  }, [trades]);

  // Calculate performance by time of day
  const timeOfDayPerformance = useMemo(() => {
    const timeSlots = {
      'Pre-Market (4-9:30am)': { start: 4, end: 9.5 },
      'Market Open (9:30-11am)': { start: 9.5, end: 11 },
      'Mid-Day (11am-2pm)': { start: 11, end: 14 },
      'Afternoon (2-4pm)': { start: 14, end: 16 },
      'After-Hours (4-8pm)': { start: 16, end: 20 },
    };

    const timeStats: { [key: string]: { trades: number; pnl: number; rr: number; wins: number } } = {};

    trades.forEach(trade => {
      if (!trade.entryTime) return;
      
      const [hours, minutes] = trade.entryTime.split(':').map(Number);
      const timeDecimal = hours + minutes / 60;

      for (const [slot, range] of Object.entries(timeSlots)) {
        if (timeDecimal >= range.start && timeDecimal < range.end) {
          if (!timeStats[slot]) {
            timeStats[slot] = { trades: 0, pnl: 0, rr: 0, wins: 0 };
          }
          timeStats[slot].trades++;
          timeStats[slot].pnl += trade.pnl;
          timeStats[slot].rr += (trade.rr || 0);
          if (trade.pnl > 0) timeStats[slot].wins++;
          break;
        }
      }
    });

    return Object.entries(timeStats)
      .map(([time, data]) => ({
        time: time.replace(/\s*\([^)]*\)/, ''), // Short name
        fullTime: time, // Full name for tooltip
        trades: data.trades,
        pnl: data.pnl,
        rr: data.rr,
        winRate: (data.wins / data.trades) * 100,
      }))
      .sort((a, b) => {
        // Sort by time of day instead of performance
        const timeOrder = ['Pre-Market', 'Market Open', 'Mid-Day', 'Afternoon', 'After-Hours'];
        return timeOrder.indexOf(a.time) - timeOrder.indexOf(b.time);
      });
  }, [trades]);

  // Calculate setup performance
  const setupPerformance = useMemo(() => {
    return Object.entries(stats.performanceBySetup)
      .map(([setup, data]) => ({
        setup: setup || 'Unknown',
        ...data,
      }))
      .sort((a, b) => b.pnl - a.pnl);
  }, [stats.performanceBySetup]);

  // Calculate Long vs Short performance
  const directionPerformance = useMemo(() => {
    const longStats = { trades: 0, wins: 0, pnl: 0, rr: 0 };
    const shortStats = { trades: 0, wins: 0, pnl: 0, rr: 0 };

    trades.forEach(trade => {
      if (trade.type === 'long') {
        longStats.trades++;
        if (trade.pnl > 0) longStats.wins++;
        longStats.pnl += trade.pnl;
        longStats.rr += (trade.rr || 0);
      } else {
        shortStats.trades++;
        if (trade.pnl > 0) shortStats.wins++;
        shortStats.pnl += trade.pnl;
        shortStats.rr += (trade.rr || 0);
      }
    });

    return [
      {
        direction: 'Long',
        trades: longStats.trades,
        winRate: longStats.trades > 0 ? (longStats.wins / longStats.trades) * 100 : 0,
        pnl: longStats.pnl,
        rr: longStats.rr,
      },
      {
        direction: 'Short',
        trades: shortStats.trades,
        winRate: shortStats.trades > 0 ? (shortStats.wins / shortStats.trades) * 100 : 0,
        pnl: shortStats.pnl,
        rr: shortStats.rr,
      },
    ].filter(d => d.trades > 0);
  }, [trades]);

  // Calculate monthly performance
  const monthlyPerformance = useMemo(() => {
    const monthStats: { [key: string]: { trades: number; pnl: number; rr: number; wins: number } } = {};

    trades.forEach(trade => {
      const month = new Date(trade.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!monthStats[month]) {
        monthStats[month] = { trades: 0, pnl: 0, rr: 0, wins: 0 };
      }
      monthStats[month].trades++;
      monthStats[month].pnl += trade.pnl;
      monthStats[month].rr += (trade.rr || 0);
      if (trade.pnl > 0) monthStats[month].wins++;
    });

    return Object.entries(monthStats)
      .map(([month, data]) => ({
        month,
        trades: data.trades,
        pnl: data.pnl,
        rr: data.rr,
        winRate: (data.wins / data.trades) * 100,
      }))
      .sort((a, b) => {
        // Sort chronologically
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      });
  }, [trades]);

  // Calculate tag performance
  const tagPerformance = useMemo(() => {
    const tagStats: { [key: string]: { trades: number; wins: number; pnl: number; rr: number } } = {};

    trades.forEach(trade => {
      if (trade.tags && trade.tags.length > 0) {
        trade.tags.forEach(tag => {
          if (!tagStats[tag]) {
            tagStats[tag] = { trades: 0, wins: 0, pnl: 0, rr: 0 };
          }
          tagStats[tag].trades++;
          if (trade.pnl > 0) tagStats[tag].wins++;
          tagStats[tag].pnl += trade.pnl;
          tagStats[tag].rr += (trade.rr || 0);
        });
      }
    });

    return Object.entries(tagStats)
      .map(([tag, data]) => ({
        tag,
        trades: data.trades,
        winRate: (data.wins / data.trades) * 100,
        pnl: data.pnl,
        rr: data.rr,
      }))
      .sort((a, b) => b.pnl - a.pnl)
      .slice(0, 10);
  }, [trades]);

  // Recent trends
  const recentTrends = useMemo(() => {
    const sortedTrades = [...trades].sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      const timeA = a.entryTime || '00:00';
      const timeB = b.entryTime || '00:00';
      return timeB.localeCompare(timeA);
    });

    const calcTrendStats = (count: number) => {
      const recentTrades = sortedTrades.slice(0, count);
      const wins = recentTrades.filter(t => t.pnl > 0).length;
      const pnl = recentTrades.reduce((sum, t) => sum + t.pnl, 0);
      const rr = recentTrades.reduce((sum, t) => sum + (t.rr || 0), 0);
      
      return {
        trades: recentTrades.length,
        wins,
        winRate: recentTrades.length > 0 ? (wins / recentTrades.length) * 100 : 0,
        pnl,
        rr,
      };
    };

    return {
      last10: calcTrendStats(10),
      last20: calcTrendStats(20),
      last30: calcTrendStats(30),
    };
  }, [trades]);

  // Best and worst performers
  const bestDay = useMemo(() => {
    return dayOfWeekPerformance.reduce((best, day) => 
      day.pnl > best.pnl ? day : best
    , dayOfWeekPerformance[0] || { day: 'N/A', pnl: 0, trades: 0, rr: 0, winRate: 0 });
  }, [dayOfWeekPerformance]);

  const bestTimeSlot = useMemo(() => {
    if (timeOfDayPerformance.length === 0) return null;
    return timeOfDayPerformance.reduce((best, time) => 
      time.pnl > best.pnl ? time : best
    );
  }, [timeOfDayPerformance]);

  const bestSetup = useMemo(() => {
    if (setupPerformance.length === 0) return null;
    return setupPerformance[0];
  }, [setupPerformance]);

  if (trades.length === 0) {
    return (
      <div className="space-y-6 pb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card via-card to-muted/30 p-6"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="mb-0.5">Analytics</h1>
                <p className="text-xs text-muted-foreground">Deep dive into your trading patterns</p>
              </div>
            </div>
          </div>
        </motion.div>
        
        <EmptyState
          icon={Brain}
          title="No analytics yet"
          description="Start trading to see detailed performance breakdowns and pattern analysis"
          action={{
            label: "Add your first trade",
            onClick: () => router.push('/dashboard/trades/quick-add')
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Section or Simple Header */}
      {globalSettings.showHeroSections ? (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-card via-card/50 to-background p-6 shadow-sm"
        >
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <motion.div 
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
              className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 shadow-sm"
            >
              <Brain className="h-5 w-5 text-blue-600 dark:text-blue-500" />
            </motion.div>
            <div>
              <h1 className="mb-0.5 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Analytics</h1>
              <p className="text-xs text-muted-foreground">Deep dive into your trading patterns</p>
            </div>
          </div>
        </div>
        
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/8 via-purple-500/5 to-transparent rounded-full blur-3xl -z-0" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-500/8 via-blue-500/5 to-transparent rounded-full blur-3xl -z-0" />
      </motion.div>
      ) : (
        <div className="pb-4 border-b border-border">
          <h1 className="mb-1">Analytics</h1>
          <p className="text-sm text-muted-foreground">Deep dive into your trading patterns</p>
        </div>
      )}

      {/* Tabs for organized content */}
      <Tabs defaultValue="time" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 p-1 h-auto bg-muted/50">
          <TabsTrigger value="time" className="gap-2 data-[state=active]:bg-card">
            <Clock className="h-4 w-4" />
            <span>Time</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2 data-[state=active]:bg-card">
            <Activity className="h-4 w-4" />
            <span>Performance</span>
          </TabsTrigger>
          <TabsTrigger value="assets" className="gap-2 data-[state=active]:bg-card">
            <Package className="h-4 w-4" />
            <span>Assets</span>
          </TabsTrigger>
        </TabsList>

        {/* Time Analysis Tab */}
        <TabsContent value="time" className="space-y-6 mt-0">
          {/* Key Findings Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Best Day */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="border-border/50 bg-card/50 hover:bg-card hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                    <span className="text-xs text-muted-foreground opacity-60">Best Day</span>
                  </div>
                  <h3 className="mb-1">{bestDay.day}</h3>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">
                    {formatValue(displayMode === 'rr' ? bestDay.rr : bestDay.pnl)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {bestDay.trades} trades • {bestDay.winRate.toFixed(0)}% win rate
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Best Time */}
            {bestTimeSlot && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.15 }}
              >
                <Card className="border-border/50 bg-card/50 hover:bg-card hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-blue-600 dark:text-blue-500" />
                      <span className="text-xs text-muted-foreground opacity-60">Best Time</span>
                    </div>
                    <h3 className="mb-1 text-sm">{bestTimeSlot.time}</h3>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">
                      {formatValue(displayMode === 'rr' ? bestTimeSlot.rr : bestTimeSlot.pnl)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {bestTimeSlot.trades} trades • {bestTimeSlot.winRate.toFixed(0)}% win rate
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Monthly Highlight */}
            {monthlyPerformance.length > 0 && (() => {
              const bestMonth = monthlyPerformance.reduce((best, month) => 
                month.pnl > best.pnl ? month : best
              );
              return (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <Card className="border-border/50 bg-card/50 hover:bg-card hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-violet-600 dark:text-violet-500" />
                        <span className="text-xs text-muted-foreground opacity-60">Best Month</span>
                      </div>
                      <h3 className="mb-1">{bestMonth.month}</h3>
                      <p className="text-sm text-emerald-600 dark:text-emerald-400">
                        {formatValue(displayMode === 'rr' ? bestMonth.rr : bestMonth.pnl)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {bestMonth.trades} trades • {bestMonth.winRate.toFixed(0)}% win rate
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })()}
          </div>

          {/* Day of Week Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Performance by Day of Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dayOfWeekPerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart data={dayOfWeekPerformance}>
                    <defs>
                      <linearGradient id="dayPositiveGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity={0.3} />
                      </linearGradient>
                      <linearGradient id="dayNegativeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(220, 38, 38)" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="rgb(220, 38, 38)" stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.2} vertical={false} />
                    <XAxis 
                      dataKey="day" 
                      tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => (
                        <CustomTooltip 
                          active={active} 
                          payload={payload} 
                          label={label}
                          formatValue={(value: number) => formatValue(value)}
                        />
                      )}
                    />
                    <Bar 
                      dataKey={displayMode === 'rr' ? 'rr' : 'pnl'}
                      radius={[6, 6, 0, 0]}
                    >
                      {dayOfWeekPerformance.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`}
                          fill={entry.pnl >= 0 ? 'url(#dayPositiveGradient)' : 'url(#dayNegativeGradient)'}
                        />
                      ))}
                    </Bar>
                    <Line 
                      type="monotone" 
                      dataKey="winRate" 
                      stroke="hsl(var(--chart-4))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--chart-4))', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[320px] flex items-center justify-center text-muted-foreground">
                  Not enough data for day of week analysis
                </div>
              )}
            </CardContent>
          </Card>

          {/* Time of Day Performance */}
          {timeOfDayPerformance.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Performance by Time of Day
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={timeOfDayPerformance}>
                    <defs>
                      <linearGradient id="timePositiveGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity={0.2} />
                      </linearGradient>
                      <linearGradient id="timeNegativeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(220, 38, 38)" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="rgb(220, 38, 38)" stopOpacity={0.2} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.2} vertical={false} />
                    <XAxis 
                      dataKey="time" 
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                      angle={-15}
                      textAnchor="end"
                      height={70}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => (
                        <CustomTooltip 
                          active={active} 
                          payload={payload} 
                          label={payload?.[0]?.payload?.fullTime || label}
                          formatValue={(value: number) => formatValue(value)}
                        />
                      )}
                    />
                    <Bar 
                      dataKey={displayMode === 'rr' ? 'rr' : 'pnl'}
                      radius={[6, 6, 0, 0]}
                    >
                      {timeOfDayPerformance.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`}
                          fill={entry.pnl >= 0 ? 'url(#timePositiveGradient)' : 'url(#timeNegativeGradient)'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Monthly Performance - Bar Chart */}
          {monthlyPerformance.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Monthly Performance Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart data={monthlyPerformance}>
                    <defs>
                      <linearGradient id="monthPositiveGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity={0.2} />
                      </linearGradient>
                      <linearGradient id="monthNegativeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(220, 38, 38)" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="rgb(220, 38, 38)" stopOpacity={0.2} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.2} vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => (
                        <CustomTooltip 
                          active={active} 
                          payload={payload} 
                          label={label}
                          formatValue={(value: number) => formatValue(value)}
                        />
                      )}
                    />
                    <Bar 
                      dataKey={displayMode === 'rr' ? 'rr' : 'pnl'}
                      radius={[6, 6, 0, 0]}
                    >
                      {monthlyPerformance.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`}
                          fill={entry.pnl >= 0 ? 'url(#monthPositiveGradient)' : 'url(#monthNegativeGradient)'}
                        />
                      ))}
                    </Bar>
                    <Line 
                      type="monotone" 
                      dataKey="winRate" 
                      stroke="hsl(var(--chart-4))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--chart-4))', r: 4 }}
                      activeDot={{ r: 6 }}
                      yAxisId="right"
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                      axisLine={false}
                      tickLine={false}
                      domain={[0, 100]}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6 mt-0">
          {/* Long vs Short Performance */}
          {directionPerformance.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span>Long vs Short Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {directionPerformance.map((dir, index) => (
                    <motion.div
                      key={dir.direction}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.15 + index * 0.05 }}
                      className="p-5 rounded-xl border border-border/50 bg-gradient-to-br from-card via-card/50 to-muted/20 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {dir.direction === 'Long' ? (
                            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                          ) : (
                            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                              <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                          )}
                          <h4 className="group-hover:scale-105 origin-left transition-transform">{dir.direction}</h4>
                        </div>
                        <Badge 
                          variant={dir.pnl >= 0 ? 'default' : 'destructive'} 
                          className="shadow-sm px-3 py-1"
                        >
                          {formatValue(displayMode === 'rr' ? dir.rr : dir.pnl)}
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Trades</span>
                          <span className="font-medium">{dir.trades}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Win Rate</span>
                          <span className="font-medium">{dir.winRate.toFixed(1)}%</span>
                        </div>
                        <div className="pt-2">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                            <span>Win Rate</span>
                            <span>{dir.winRate.toFixed(1)}%</span>
                          </div>
                          <Progress value={dir.winRate} className="h-2" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {/* Visual Comparison Chart */}
                <div className="mt-6 pt-6 border-t border-border/50">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={directionPerformance} layout="vertical">
                      <defs>
                        <linearGradient id="directionPositiveGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity={0.4} />
                        </linearGradient>
                        <linearGradient id="directionNegativeGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="rgb(220, 38, 38)" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="rgb(220, 38, 38)" stopOpacity={0.4} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.2} horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="direction" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={60} />
                      <Tooltip
                        content={({ active, payload }) => (
                          <CustomTooltip 
                            active={active} 
                            payload={payload} 
                            label={payload?.[0]?.payload?.direction || ''}
                            formatValue={(value: number) => formatValue(value)}
                          />
                        )}
                      />
                      <Bar 
                        dataKey={displayMode === 'rr' ? 'rr' : 'pnl'}
                        radius={[0, 6, 6, 0]}
                      >
                        {directionPerformance.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`}
                            fill={entry.pnl >= 0 ? 'url(#directionPositiveGradient)' : 'url(#directionNegativeGradient)'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            </motion.div>
          )}

          {/* Recent Performance Trends */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <TrendingUpIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <span>Recent Performance Trends</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Last 10 Trades', data: recentTrends.last10, delay: 0.25 },
                  { label: 'Last 20 Trades', data: recentTrends.last20, delay: 0.3 },
                  { label: 'Last 30 Trades', data: recentTrends.last30, delay: 0.35 },
                ].map(({ label, data, delay }) => (
                  data.trades > 0 && (
                    <motion.div
                      key={label}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay }}
                      className="p-5 rounded-xl border border-border/50 bg-gradient-to-br from-card via-card/50 to-muted/20 hover:shadow-md transition-all group"
                    >
                      <p className="text-xs text-muted-foreground mb-4 opacity-60 uppercase tracking-wide">{label}</p>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between items-baseline mb-1">
                            <span className="text-xs text-muted-foreground">P&L</span>
                            <span className={`text-lg font-medium group-hover:scale-105 origin-right transition-transform ${data.pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-500'}`}>
                              {formatValue(displayMode === 'rr' ? data.rr : data.pnl)}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Trades</span>
                          <span className="font-medium">{data.trades}</span>
                        </div>
                        <div className="pt-2">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                            <span>Win Rate</span>
                            <span>{data.winRate.toFixed(1)}%</span>
                          </div>
                          <Progress value={data.winRate} className="h-2" />
                        </div>
                      </div>
                    </motion.div>
                  )
                ))}
              </div>
            </CardContent>
          </Card>
          </motion.div>

          {/* Setup Performance */}
          {setupPerformance.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <Target className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span>Performance by Setup</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Bar Chart Visualization */}
                <div className="mb-6">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={setupPerformance.slice(0, 8)} layout="vertical">
                      <defs>
                        <linearGradient id="setupPositiveGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity={0.4} />
                        </linearGradient>
                        <linearGradient id="setupNegativeGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="rgb(220, 38, 38)" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="rgb(220, 38, 38)" stopOpacity={0.4} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.2} horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="setup" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={100} />
                      <Tooltip
                        content={({ active, payload }) => (
                          <CustomTooltip 
                            active={active} 
                            payload={payload} 
                            label={payload?.[0]?.payload?.setup || ''}
                            formatValue={(value: number) => formatValue(value)}
                          />
                        )}
                      />
                      <Bar 
                        dataKey={displayMode === 'rr' ? 'rr' : 'pnl'}
                        radius={[0, 6, 6, 0]}
                      >
                        {setupPerformance.slice(0, 8).map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`}
                            fill={entry.pnl >= 0 ? 'url(#setupPositiveGradient)' : 'url(#setupNegativeGradient)'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Detailed List */}
                <div className="space-y-2">
                  {setupPerformance.map((setup, index) => (
                    <motion.div
                      key={setup.setup}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.45 + index * 0.03 }}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-gradient-to-br from-card via-card/50 to-muted/20 hover:shadow-md transition-all group"
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm group-hover:scale-105 origin-left transition-transform">{setup.setup}</h4>
                          <Badge variant={setup.pnl >= 0 ? 'default' : 'destructive'} className="ml-2 shadow-sm">
                            {formatValue(displayMode === 'rr' ? setup.rr || 0 : setup.pnl)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                          <span>{setup.totalTrades} trades</span>
                          <span>{setup.winRate.toFixed(0)}% win rate</span>
                        </div>
                        <Progress value={setup.winRate} className="h-1.5" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
            </motion.div>
          )}
        </TabsContent>

        {/* Assets Tab */}
        <TabsContent value="assets" className="space-y-6 mt-0">
          {/* Top Performers Summary */}
          {symbolPerformance.length > 0 && (() => {
            const topWinner = symbolPerformance[0];
            const topByWinRate = [...symbolPerformance].sort((a, b) => b.winRate - a.winRate)[0];
            const mostTraded = [...symbolPerformance].sort((a, b) => b.trades - a.trades)[0];
            
            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <Card className="border-border/50 bg-card/50 hover:bg-card hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                        <span className="text-xs text-muted-foreground opacity-60">Top Performer</span>
                      </div>
                      <h3 className="mb-1">{topWinner.symbol}</h3>
                      <p className="text-sm text-emerald-600 dark:text-emerald-400">
                        {formatValue(displayMode === 'rr' ? topWinner.rr : topWinner.pnl)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {topWinner.trades} trades • {topWinner.winRate.toFixed(0)}% win rate
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.15 }}
                >
                  <Card className="border-border/50 bg-card/50 hover:bg-card hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-blue-600 dark:text-blue-500" />
                        <span className="text-xs text-muted-foreground opacity-60">Highest Win Rate</span>
                      </div>
                      <h3 className="mb-1">{topByWinRate.symbol}</h3>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        {topByWinRate.winRate.toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {topByWinRate.trades} trades • {formatValue(displayMode === 'rr' ? topByWinRate.avgRR : topByWinRate.avgPnl)} avg
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <Card className="border-border/50 bg-card/50 hover:bg-card hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-4 w-4 text-purple-600 dark:text-purple-500" />
                        <span className="text-xs text-muted-foreground opacity-60">Most Traded</span>
                      </div>
                      <h3 className="mb-1">{mostTraded.symbol}</h3>
                      <p className="text-sm text-purple-600 dark:text-purple-400">
                        {mostTraded.trades} trades
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {mostTraded.winRate.toFixed(0)}% win rate • {formatValue(displayMode === 'rr' ? mostTraded.rr : mostTraded.pnl)}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            );
          })()}
          
          {/* Symbol Performance */}
          {symbolPerformance.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
            >
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span>Symbol Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Bar Chart Visualization */}
                <div className="mb-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={symbolPerformance} layout="vertical">
                      <defs>
                        <linearGradient id="symbolPositiveGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity={0.4} />
                        </linearGradient>
                        <linearGradient id="symbolNegativeGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="rgb(220, 38, 38)" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="rgb(220, 38, 38)" stopOpacity={0.4} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.2} horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="symbol" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={60} />
                      <Tooltip
                        content={({ active, payload }) => (
                          <CustomTooltip 
                            active={active} 
                            payload={payload} 
                            label={payload?.[0]?.payload?.symbol || ''}
                            formatValue={(value: number) => formatValue(value)}
                          />
                        )}
                      />
                      <Bar 
                        dataKey={displayMode === 'rr' ? 'rr' : 'pnl'}
                        radius={[0, 6, 6, 0]}
                      >
                        {symbolPerformance.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`}
                            fill={entry.pnl >= 0 ? 'url(#symbolPositiveGradient)' : 'url(#symbolNegativeGradient)'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Detailed List */}
                <div className="space-y-2">
                  {symbolPerformance.map((symbol, index) => (
                    <motion.div
                      key={symbol.symbol}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 + index * 0.03 }}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-gradient-to-br from-card via-card/50 to-muted/20 hover:shadow-md transition-all group"
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm group-hover:scale-105 origin-left transition-transform">{symbol.symbol}</h4>
                          <Badge variant={symbol.pnl >= 0 ? 'default' : 'destructive'} className="ml-2 shadow-sm">
                            {formatValue(displayMode === 'rr' ? symbol.rr : symbol.pnl)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                          <span>{symbol.trades} trades</span>
                          <span>{symbol.winRate.toFixed(0)}% win rate</span>
                          <span className="text-muted-foreground/60">
                            Avg: {formatValue(displayMode === 'rr' ? symbol.avgRR : symbol.avgPnl)}
                          </span>
                        </div>
                        <Progress value={symbol.winRate} className="h-1.5" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
            </motion.div>
          )}

          {/* Tag Performance */}
          {tagPerformance.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
            >
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span>Performance by Tag</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Tag Cloud Style Visualization */}
                <div className="mb-6 p-5 rounded-xl border border-border/50 bg-gradient-to-br from-muted/30 via-card to-muted/20 min-h-[120px] flex flex-wrap items-center justify-center gap-3">
                  {tagPerformance.map((tag, index) => {
                    const size = Math.max(12, Math.min(24, 12 + (tag.trades / 2)));
                    const isProfitable = tag.pnl >= 0;
                    
                    return (
                      <motion.div
                        key={tag.tag}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.65 + index * 0.05 }}
                        className={`px-3 py-1.5 rounded-full border transition-all cursor-default hover:scale-110 ${
                          isProfitable 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20' 
                            : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/20'
                        }`}
                        style={{ fontSize: `${size}px` }}
                        title={`${tag.trades} trades • ${tag.winRate.toFixed(0)}% win rate • ${formatValue(displayMode === 'rr' ? tag.rr : tag.pnl)}`}
                      >
                        {tag.tag}
                      </motion.div>
                    );
                  })}
                </div>
                
                {/* Detailed List */}
                <div className="space-y-2">
                  {tagPerformance.map((tag, index) => (
                    <motion.div
                      key={tag.tag}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.7 + index * 0.03 }}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-gradient-to-br from-card via-card/50 to-muted/20 hover:shadow-md transition-all group"
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm group-hover:scale-105 origin-left transition-transform">{tag.tag}</h4>
                          <Badge variant={tag.pnl >= 0 ? 'default' : 'destructive'} className="ml-2 shadow-sm">
                            {formatValue(displayMode === 'rr' ? tag.rr : tag.pnl)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                          <span>{tag.trades} trades</span>
                          <span>{tag.winRate.toFixed(0)}% win rate</span>
                        </div>
                        <Progress value={tag.winRate} className="h-1.5" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
