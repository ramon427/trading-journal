import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Trade, JournalEntry, Statistics } from '@/types/journal/trading';
import { usePageFeatures } from '@/lib/journal/usePageFeatures';
import { useGlobalSettings } from '@/lib/journal/useGlobalSettings';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Award, 
  Activity, 
  ArrowUp, 
  ArrowDown, 
  Calendar,
  BarChart3,
  Flame,
  Trophy,
  Star,
  Sparkles,
  Zap,
  Filter,
  Info
} from 'lucide-react';
import { getCumulativePnL, calculateStatistics } from '@/lib/journal/tradingData';
import { DisplayMode } from '@/lib/journal/settings';
import { ChartTooltip } from './ChartTooltip';
import { Badge } from './ui/badge';
import { calculateAchievements } from '@/lib/journal/achievements';
import { Progress } from './ui/progress';
import { calculateStreaks } from '@/lib/journal/streakTracking';
import { calculatePersonalBests } from '@/lib/journal/personalBests';
import { calculateGrowthComparison } from '@/lib/journal/growthComparison';
import { AnimatedStatCard, AnimatedProgressStat } from './AnimatedStatCard';
import { Sparkline } from './Sparkline';
import { Button } from './ui/button';
import { EmptyState } from './EmptyState';
import { useRouter } from 'next/navigation';

interface BenchmarksProps {
  trades: Trade[];
  journalEntries: JournalEntry[];
  stats: Statistics;
  displayMode: DisplayMode;
}

type TimePeriod = 'week' | 'month' | 'quarter' | 'year' | 'all';

export function Benchmarks({ trades, journalEntries, stats, displayMode }: BenchmarksProps) {
  const router = useRouter();
  const features = usePageFeatures('benchmarks');
  const globalSettings = useGlobalSettings();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all');
  const [chartMetric, setChartMetric] = useState<'cumulative' | 'daily'>('cumulative');
  const cumulativePnL = getCumulativePnL(trades);

  // Get daily data  
  const dailyPnL = new Map<string, number>();
  const dailyRR = new Map<string, number>();

  trades.forEach(trade => {
    const pnl = dailyPnL.get(trade.date) || 0;
    dailyPnL.set(trade.date, pnl + trade.pnl);
    
    const rr = dailyRR.get(trade.date) || 0;
    dailyRR.set(trade.date, rr + (trade.rr || 0));
  });
  
  const dailyData = Array.from((displayMode === 'rr' ? dailyRR : dailyPnL).entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, value]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: date,
      value: Number(value.toFixed(2)),
    }));

  // Cumulative data
  const cumulativeData = displayMode === 'rr' 
    ? (() => {
        const sortedTrades = [...trades].sort((a, b) => a.date.localeCompare(b.date));
        const cumulative: { date: string; value: number }[] = [];
        let total = 0;
        
        const dailyRRMap = new Map<string, number>();
        sortedTrades.forEach(trade => {
          const current = dailyRRMap.get(trade.date) || 0;
          dailyRRMap.set(trade.date, current + (trade.rr || 0));
        });
        
        Array.from(dailyRRMap.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .forEach(([date, rr]) => {
            total += rr;
            cumulative.push({ date, value: total });
          });
        
        return cumulative;
      })()
    : cumulativePnL.map(item => ({ date: item.date, value: item.pnl }));

  const chartData = cumulativeData.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    fullDate: item.date,
    value: Number(item.value.toFixed(2)),
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatRR = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}R`;
  };

  const formatValue = (value: number) => {
    return displayMode === 'rr' ? formatRR(value) : formatCurrency(value);
  };

  const totalValue = displayMode === 'rr' ? (stats.totalRR || 0) : stats.totalPnl;



  const getXAxisInterval = (dataLength: number) => {
    if (dataLength <= 10) return 0;
    if (dataLength <= 20) return 1;
    if (dataLength <= 40) return 2;
    return Math.floor(dataLength / 15);
  };



  // Filter trades by time period
  const filteredTrades = useMemo(() => {
    if (timePeriod === 'all') return trades;
    
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (timePeriod) {
      case 'week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return trades.filter(trade => new Date(trade.date) >= cutoffDate);
  }, [trades, timePeriod]);

  const filteredStats = useMemo(() => calculateStatistics(filteredTrades), [filteredTrades]);

  // Calculate previous period stats for comparison
  const previousPeriodStats = useMemo(() => {
    if (timePeriod === 'all') return null;
    
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();
    
    switch (timePeriod) {
      case 'week':
        startDate.setDate(now.getDate() - 14);
        endDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 2);
        endDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 6);
        endDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 2);
        endDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    const previousTrades = trades.filter(trade => {
      const tradeDate = new Date(trade.date);
      return tradeDate >= startDate && tradeDate < endDate;
    });
    
    return previousTrades.length > 0 ? calculateStatistics(previousTrades) : null;
  }, [trades, timePeriod]);

  // Empty state check
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
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="mb-0.5">Benchmarks</h1>
                <p className="text-xs text-muted-foreground">Track your progress and celebrate achievements</p>
              </div>
            </div>
          </div>
        </motion.div>
        
          <EmptyState
          icon={Target}
          title="No benchmarks yet"
          description="Start trading to see your performance metrics, achievements, and growth"
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
      {/* Hero Summary Section or Simple Header */}
      {globalSettings.showHeroSections ? (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-card via-card/50 to-background p-6 shadow-sm"
        >
        <div className="relative z-10 space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 shadow-sm"
              >
                <Target className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
              </motion.div>
              <div>
                <h1 className="mb-0.5 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Benchmarks</h1>
                <p className="text-xs text-muted-foreground">Track your progress and celebrate achievements</p>
              </div>
            </div>

            {/* Time Period Selector */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-1 p-1 rounded-lg border border-border bg-background">
                <Button
                  variant={timePeriod === 'week' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTimePeriod('week')}
                  className="h-7 px-2 text-xs"
                >
                  Week
                </Button>
                <Button
                  variant={timePeriod === 'month' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTimePeriod('month')}
                  className="h-7 px-2 text-xs"
                >
                  Month
                </Button>
                <Button
                  variant={timePeriod === 'quarter' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTimePeriod('quarter')}
                  className="h-7 px-2 text-xs"
                >
                  Quarter
                </Button>
                <Button
                  variant={timePeriod === 'year' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTimePeriod('year')}
                  className="h-7 px-2 text-xs"
                >
                  Year
                </Button>
                <Button
                  variant={timePeriod === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTimePeriod('all')}
                  className="h-7 px-2 text-xs"
                >
                  All
                </Button>
              </div>
            </div>
          </div>

          {/* Hero Stats */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={timePeriod}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              <div className="space-y-1 p-3 rounded-lg bg-gradient-to-br from-background to-muted/20 border border-border/50">
                <p className="text-xs text-muted-foreground">Win Rate</p>
                <p className={`text-2xl ${
                  filteredStats.winRate >= 60
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : filteredStats.winRate >= 50 
                    ? 'text-green-600 dark:text-green-500' 
                    : filteredStats.winRate >= 40
                    ? 'text-cyan-600 dark:text-cyan-400'
                    : 'text-red-600 dark:text-red-500'
                }`}>
                  {filteredStats.winRate.toFixed(1)}%
                </p>
                {previousPeriodStats && (
                  <p className={`text-xs flex items-center gap-1 ${
                    filteredStats.winRate >= previousPeriodStats.winRate
                      ? 'text-green-600 dark:text-green-500'
                      : 'text-red-600 dark:text-red-500'
                  }`}>
                    {filteredStats.winRate >= previousPeriodStats.winRate ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    )}
                    {Math.abs(filteredStats.winRate - previousPeriodStats.winRate).toFixed(1)}%
                  </p>
                )}
              </div>
            
            <div className="space-y-1 p-3 rounded-lg bg-gradient-to-br from-background to-muted/20 border border-border/50">
              <p className="text-xs text-muted-foreground">Total {displayMode === 'rr' ? 'R:R' : 'P&L'}</p>
              <p className={`text-2xl ${
                (displayMode === 'rr' ? (filteredStats.totalRR || 0) : filteredStats.totalPnl) >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-500'
              }`}>
                {displayMode === 'rr' 
                  ? formatRR(filteredStats.totalRR || 0)
                  : formatCurrency(filteredStats.totalPnl)
                }
              </p>
              {previousPeriodStats && (
                <p className={`text-xs flex items-center gap-1 ${
                  (displayMode === 'rr' ? (filteredStats.totalRR || 0) : filteredStats.totalPnl) >=
                  (displayMode === 'rr' ? (previousPeriodStats.totalRR || 0) : previousPeriodStats.totalPnl)
                    ? 'text-green-600 dark:text-green-500'
                    : 'text-red-600 dark:text-red-500'
                }`}>
                  {(displayMode === 'rr' ? (filteredStats.totalRR || 0) : filteredStats.totalPnl) >=
                   (displayMode === 'rr' ? (previousPeriodStats.totalRR || 0) : previousPeriodStats.totalPnl) ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )}
                  vs last period
                </p>
              )}
            </div>
            
            <div className="space-y-1 p-3 rounded-lg bg-gradient-to-br from-background to-muted/20 border border-border/50">
              <p className="text-xs text-muted-foreground">Total Trades</p>
              <p className="text-2xl text-blue-600 dark:text-blue-400">{filteredStats.totalTrades}</p>
              {previousPeriodStats && (
                <p className="text-xs text-muted-foreground">
                  {filteredStats.winningTrades}W / {filteredStats.losingTrades}L
                </p>
              )}
            </div>
            
            <div className="space-y-1 p-3 rounded-lg bg-gradient-to-br from-background to-muted/20 border border-border/50">
              <p className="text-xs text-muted-foreground">Profit Factor</p>
              <p className={`text-2xl ${
                filteredStats.profitFactor >= 2
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : filteredStats.profitFactor >= 1.5
                  ? 'text-green-600 dark:text-green-500'
                  : filteredStats.profitFactor >= 1
                  ? 'text-cyan-600 dark:text-cyan-400'
                  : 'text-red-600 dark:text-red-500'
              }`}>
                {filteredStats.profitFactor.toFixed(2)}
              </p>
              {previousPeriodStats && (
                <p className={`text-xs flex items-center gap-1 ${
                  filteredStats.profitFactor >= previousPeriodStats.profitFactor
                    ? 'text-green-600 dark:text-green-500'
                    : 'text-red-600 dark:text-red-500'
                }`}>
                  {filteredStats.profitFactor >= previousPeriodStats.profitFactor ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )}
                  {Math.abs(filteredStats.profitFactor - previousPeriodStats.profitFactor).toFixed(2)}
                </p>
              )}
            </div>
          </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-emerald-500/8 via-violet-500/5 to-transparent rounded-full blur-3xl -z-0" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-violet-500/8 via-cyan-500/5 to-transparent rounded-full blur-3xl -z-0" />
      </motion.div>
      ) : (
        <div className="pb-4 border-b border-border">
          <h1 className="mb-1">Benchmarks</h1>
          <p className="text-sm text-muted-foreground">Track your progress and celebrate achievements</p>
        </div>
      )}

      {/* Key Insights Section */}
      {trades.length > 0 && (() => {
        const insights = [];
        const streaks = calculateStreaks(trades, journalEntries, displayMode);
        
        // Best performing metric
        if (filteredStats.winRate >= 60) {
          insights.push({
            icon: Star,
            color: 'text-violet-600 dark:text-violet-400',
            bgColor: 'bg-gradient-to-br from-violet-100 to-violet-50 dark:from-violet-900/40 dark:to-violet-900/20',
            title: 'Strong Win Rate',
            description: `${filteredStats.winRate.toFixed(1)}% win rate shows excellent consistency`,
          });
        }
        
        // High profit factor
        if (filteredStats.profitFactor >= 2) {
          insights.push({
            icon: Zap,
            color: 'text-emerald-600 dark:text-emerald-400',
            bgColor: 'bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/40 dark:to-emerald-900/20',
            title: 'High Profit Factor',
            description: `${filteredStats.profitFactor.toFixed(2)} profit factor indicates winning trades outweigh losses`,
          });
        }
        
        // Active winning streak
        if (streaks.currentWinningStreak >= 3) {
          insights.push({
            icon: Flame,
            color: 'text-orange-600 dark:text-orange-400',
            bgColor: 'bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/40 dark:to-orange-900/20',
            title: 'Hot Streak',
            description: `${streaks.currentWinningStreak} day winning streak - momentum is on your side`,
          });
        }
        
        // Trading volume milestone
        if (filteredStats.totalTrades >= 100) {
          insights.push({
            icon: Trophy,
            color: 'text-indigo-600 dark:text-indigo-400',
            bgColor: 'bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/40 dark:to-indigo-900/20',
            title: 'Milestone Reached',
            description: `${filteredStats.totalTrades} trades completed - significant experience gained`,
          });
        }

        if (insights.length === 0) return null;

        // Dynamic grid columns based on insight count
        const gridCols = insights.length === 1 
          ? 'grid-cols-1 max-w-md' 
          : insights.length === 2 
          ? 'grid-cols-1 md:grid-cols-2' 
          : insights.length === 3
          ? 'grid-cols-1 md:grid-cols-3'
          : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4';

        return (
          <AnimatePresence mode="wait">
            <motion.div
              key={`insights-${timePeriod}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
            <div className={`grid ${gridCols} gap-3`}>
              {insights.slice(0, 4).map((insight, index) => (
                <motion.div
                  key={insight.title}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.15 + index * 0.05 }}
                  whileHover={{ scale: 1.01, y: -1 }}
                  className="p-3 rounded-lg border border-border/50 bg-card/50 hover:bg-card hover:shadow-md transition-all cursor-default"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${insight.bgColor} flex-shrink-0`}>
                      <insight.icon className={`h-4 w-4 ${insight.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs mb-0.5 opacity-60">Insight</p>
                      <h4 className="text-sm mb-0.5">{insight.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
          </AnimatePresence>
        );
      })()}

      {/* Achievements & Streaks Layout */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`content-${timePeriod}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
        {/* Achievements Section */}
        {features.achievements && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Award className="h-5 w-5 text-primary" />
              <h2 className="mb-0">Achievements</h2>
            </div>
          {(() => {
        const achievements = calculateAchievements(filteredTrades, filteredStats, journalEntries);
        const iconMap: Record<string, any> = {
          Activity,
          TrendingUp,
          Target,
          Trophy,
          Calendar,
          Award,
          Zap,
        };

        // Sort: unlocked first, then by progress (near-complete first)
        const sortedAchievements = [...achievements].sort((a, b) => {
          if (a.isUnlocked && !b.isUnlocked) return -1;
          if (!a.isUnlocked && b.isUnlocked) return 1;
          if (!a.isUnlocked && !b.isUnlocked) return b.progress - a.progress;
          return 0;
        });

        // Check if no achievements at all
        if (achievements.length === 0) {
          return (
            <Card>
              <CardContent className="pt-6">
                <EmptyState
                  icon={Award}
                  title="No achievements yet"
                  description="Complete trades and maintain journal entries to unlock achievements"
                />
              </CardContent>
            </Card>
          );
        }

        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  <span>Milestones</span>
                </div>
                <Badge variant="outline" className="h-5 text-xs">
                  {achievements.filter(a => a.isUnlocked).length} / {achievements.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sortedAchievements.map((achievement) => {
                  const Icon = iconMap[achievement.icon];
                  const isNearComplete = !achievement.isUnlocked && achievement.progress >= 80;
                  
                  return (
                    <div 
                      key={achievement.id}
                      className={`p-3 rounded-lg border transition-all ${
                        achievement.isUnlocked 
                          ? 'border-emerald-500/50 dark:border-emerald-500/40 bg-gradient-to-br from-emerald-50 to-emerald-50/50 dark:from-emerald-950/30 dark:to-emerald-950/10 shadow-sm' 
                          : isNearComplete
                          ? 'border-violet-500/50 dark:border-violet-500/40 bg-gradient-to-br from-violet-50 to-violet-50/50 dark:from-violet-950/30 dark:to-violet-950/10 shadow-md'
                          : 'border-border/50 bg-gradient-to-br from-background to-muted/30 hover:from-muted/30 hover:to-muted/50'
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${
                          achievement.isUnlocked 
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 shadow-sm' 
                            : isNearComplete
                            ? 'bg-violet-100 dark:bg-violet-900/40 shadow-sm'
                            : 'bg-muted/50'
                        }`}>
                          <Icon className={`h-4 w-4 ${
                            achievement.isUnlocked 
                              ? 'text-emerald-600 dark:text-emerald-400' 
                              : isNearComplete
                              ? 'text-violet-600 dark:text-violet-400'
                              : 'text-muted-foreground'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm truncate">{achievement.title}</h4>
                            {achievement.isUnlocked && (
                              <Badge variant="outline" className="h-5 px-1.5 text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700 shadow-sm">
                                ✓
                              </Badge>
                            )}
                            {isNearComplete && (
                              <Badge variant="outline" className="h-5 px-1.5 text-xs bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400 border-violet-300 dark:border-violet-700 shadow-sm">
                                🎯 {achievement.progress.toFixed(0)}%
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {achievement.description}
                          </p>
                        </div>
                      </div>
                      
                      {!achievement.isUnlocked && (
                        <div className="space-y-1.5">
                          <Progress 
                            value={achievement.progress} 
                            className={`h-1.5 ${isNearComplete ? 'animate-pulse' : ''}`}
                          />
                          <p className="text-xs text-muted-foreground">
                            {achievement.formatValue 
                              ? achievement.formatValue(achievement.current)
                              : achievement.current}
                            {' / '}
                            {achievement.formatValue 
                              ? achievement.formatValue(achievement.target)
                              : achievement.target}
                          </p>
                        </div>
                      )}
                      
                      {achievement.isUnlocked && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                          Unlocked!
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })()}
          </motion.div>
        )}

        {/* Streak Tracking Section */}
        {features.streaks && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Flame className="h-5 w-5 text-primary" />
              <h2 className="mb-0">Streaks</h2>
            </div>
          {(() => {
          const streaks = calculateStreaks(trades, journalEntries, displayMode);
          
          return (
            <Card>
              <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Winning Streak */}
                <div className="p-3 rounded-lg border border-border/50 bg-gradient-to-br from-background to-muted/20 hover:from-muted/20 hover:to-muted/30 transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/40 dark:to-emerald-900/20 shadow-sm">
                      <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm">Winning Days</h4>
                      <p className="text-xs text-muted-foreground">Consecutive green</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <p className={`text-2xl ${
                        streaks.currentWinningStreak > 0 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : 'text-muted-foreground'
                      }`}>
                        {streaks.currentWinningStreak}
                      </p>
                      {streaks.currentWinningStreak > 0 && (
                        <Flame className="h-5 w-5 text-orange-500 dark:text-orange-400" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Best: {streaks.bestWinningStreak} {streaks.bestWinningStreak === 1 ? 'day' : 'days'}
                    </p>
                    {streaks.currentWinningStreak > 0 && streaks.currentWinningStreak === streaks.bestWinningStreak && (
                      <Badge variant="outline" className="h-5 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800">
                        🔥 New record!
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Trading Consistency */}
                <div className="p-3 rounded-lg border border-border/50 bg-gradient-to-br from-background to-muted/20 hover:from-muted/20 hover:to-muted/30 transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-900/20 shadow-sm">
                      <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm">Trading Days</h4>
                      <p className="text-xs text-muted-foreground">Active streak</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <p className={`text-2xl ${
                        streaks.tradingDaysStreak > 0 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : 'text-muted-foreground'
                      }`}>
                        {streaks.tradingDaysStreak}
                      </p>
                      {streaks.tradingDaysStreak > 0 && (
                        <Flame className="h-5 w-5 text-orange-500 dark:text-orange-400" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Best: {streaks.bestTradingDaysStreak} {streaks.bestTradingDaysStreak === 1 ? 'day' : 'days'}
                    </p>
                    {streaks.tradingDaysStreak > 0 && streaks.tradingDaysStreak === streaks.bestTradingDaysStreak && (
                      <Badge variant="outline" className="h-5 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800">
                        🔥 New record!
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Journal Consistency */}
                <div className="p-3 rounded-lg border border-border/50 bg-gradient-to-br from-background to-muted/20 hover:from-muted/20 hover:to-muted/30 transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-violet-100 to-violet-50 dark:from-violet-900/40 dark:to-violet-900/20 shadow-sm">
                      <Calendar className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm">Journal Days</h4>
                      <p className="text-xs text-muted-foreground">Daily entries</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <p className={`text-2xl ${
                        streaks.journalStreak > 0 
                          ? 'text-violet-600 dark:text-violet-400' 
                          : 'text-muted-foreground'
                      }`}>
                        {streaks.journalStreak}
                      </p>
                      {streaks.journalStreak > 0 && (
                        <Flame className="h-5 w-5 text-orange-500 dark:text-orange-400" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Best: {streaks.bestJournalStreak} {streaks.bestJournalStreak === 1 ? 'day' : 'days'}
                    </p>
                    {streaks.journalStreak > 0 && streaks.journalStreak === streaks.bestJournalStreak && (
                      <Badge variant="outline" className="h-5 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800">
                        🔥 New record!
                      </Badge>
                    )}
                  </div>
                </div>

                {/* System Adherence */}
                <div className="p-3 rounded-lg border border-border/50 bg-gradient-to-br from-background to-muted/20 hover:from-muted/20 hover:to-muted/30 transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-100 to-cyan-50 dark:from-cyan-900/40 dark:to-cyan-900/20 shadow-sm">
                      <Target className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm">Following System</h4>
                      <p className="text-xs text-muted-foreground">Discipline streak</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <p className={`text-2xl ${
                        streaks.systemAdherenceStreak > 0 
                          ? 'text-cyan-600 dark:text-cyan-400' 
                          : 'text-muted-foreground'
                      }`}>
                        {streaks.systemAdherenceStreak}
                      </p>
                      {streaks.systemAdherenceStreak > 0 && (
                        <Flame className="h-5 w-5 text-orange-500 dark:text-orange-400" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Best: {streaks.bestSystemAdherenceStreak} {streaks.bestSystemAdherenceStreak === 1 ? 'day' : 'days'}
                    </p>
                    {streaks.systemAdherenceStreak > 0 && streaks.systemAdherenceStreak === streaks.bestSystemAdherenceStreak && (
                      <Badge variant="outline" className="h-5 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800">
                        🔥 New record!
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Warning for losing streak */}
              {streaks.currentLosingStreak > 2 && (
                <div className="mt-4 p-4 rounded-md border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20">
                  <div className="flex items-start gap-3">
                    <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm text-red-900 dark:text-red-100">
                        {streaks.currentLosingStreak} losing days in a row
                      </h4>
                      <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                        Time to review your strategy and take a break if needed. Every trader hits rough patches.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              </CardContent>
            </Card>
          );
        })()}
          </motion.div>
        )}

      {/* Personal Bests Section */}
      {features.personalBests && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`personal-bests-${timePeriod}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-5 w-5 text-primary" />
              <h2 className="mb-0">Personal Bests</h2>
            </div>
            {(() => {
            const personalBests = calculatePersonalBests(filteredTrades, displayMode);
          
          if (personalBests.length === 0) return null;

          const iconMap: Record<string, any> = {
            Trophy,
            Star,
            Target,
            TrendingUp,
            Calendar,
            Award,
            Flame,
            BarChart3,
          };

          // Show top 6 records only
          const topBests = personalBests.slice(0, 6);

          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {topBests.map((best, index) => {
                const Icon = iconMap[best.icon];
                const dateFormatted = best.date 
                  ? new Date(best.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric'
                    })
                  : '';

                return (
                  <motion.div
                    key={best.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: 0.35 + index * 0.03 }}
                    className="p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors group"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 rounded-md bg-muted/50 group-hover:bg-muted transition-colors">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs text-muted-foreground truncate">{best.title}</h4>
                      </div>
                      {best.isRecent && (
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                      )}
                    </div>
                    
                    <div className="space-y-1.5">
                      <p className="text-xl text-foreground">
                        {best.formattedValue}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="truncate">{best.description}</span>
                        {dateFormatted && (
                          <span className="flex-shrink-0 ml-2">{dateFormatted}</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          );
        })()}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Growth Tracking - Simplified */}
      {features.growthTracking && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="mb-0">Growth Tracking</h2>
          </div>
          {(() => {
          const growthData = calculateGrowthComparison(trades, displayMode);
        
        if (trades.length < 2 || growthData.monthOverMonth.length === 0) return null;

        const formatValue = (value: number, metric: string) => {
          if (metric === 'Win Rate') {
            return `${value.toFixed(1)}%`;
          } else if (metric === 'Profit Factor') {
            return value.toFixed(2);
          } else if (displayMode === 'rr') {
            return `${value >= 0 ? '+' : ''}${value.toFixed(2)}R`;
          } else {
            return `${value >= 0 ? '+' : ''}${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          }
        };

        return (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Month-over-Month</CardTitle>
                <Badge variant="outline" className="h-5 text-xs">
                  {growthData.period.current} vs {growthData.period.previous}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {growthData.monthOverMonth.map((comparison) => (
                  <div key={comparison.metric} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">{comparison.label}</p>
                      {comparison.trend !== 'neutral' && (
                        <div className={`flex items-center gap-0.5 ${
                          comparison.isPositive 
                            ? 'text-green-600 dark:text-green-500' 
                            : 'text-red-600 dark:text-red-500'
                        }`}>
                          {comparison.trend === 'up' ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )}
                        </div>
                      )}
                    </div>
                    <p className={`text-xl ${
                      comparison.isPositive && comparison.trend !== 'neutral'
                        ? 'text-green-600 dark:text-green-500'
                        : comparison.trend === 'down'
                        ? 'text-red-600 dark:text-red-500'
                        : 'text-foreground'
                    }`}>
                      {formatValue(comparison.current, comparison.metric)}
                    </p>
                    {comparison.changePercent !== 0 && comparison.changePercent !== Infinity && (
                      <p className="text-xs text-muted-foreground">
                        {comparison.changePercent > 0 ? '+' : ''}{comparison.changePercent.toFixed(0)}% from last month
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })()}
        </motion.div>
      )}
      
      </motion.div>
      </AnimatePresence>

      {/* Charts Section - Stacked for Better Visibility */}
      {/* Section Divider */}
      {features.performanceCharts && (
        <div className="border-t border-border" />
      )}

      {/* Enhanced Performance Charts with Toggle and Zoom */}
      {features.performanceCharts && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex items-center justify-between gap-2 mb-3 sticky top-0 bg-background py-2 z-10">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h2 className="mb-0">Performance Charts</h2>
            </div>
          
          {/* Chart Metric Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-lg border border-border bg-background">
            <Button
              variant={chartMetric === 'cumulative' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setChartMetric('cumulative')}
              className="h-7 px-2 text-xs"
            >
              Cumulative
            </Button>
            <Button
              variant={chartMetric === 'daily' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setChartMetric('daily')}
              className="h-7 px-2 text-xs"
            >
              Daily
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {chartMetric === 'cumulative' 
                  ? (displayMode === 'rr' ? 'Cumulative R:R' : 'Cumulative P&L')
                  : (displayMode === 'rr' ? 'Daily R:R' : 'Daily P&L')
                }
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {(chartMetric === 'cumulative' ? chartData : dailyData).length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                {chartMetric === 'cumulative' ? (
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="hsl(var(--border))"
                      opacity={0.5}
                      vertical={false}
                    />
                    <XAxis 
                      dataKey="date"
                      interval={getXAxisInterval(chartData.length)}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      height={30}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      width={60}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => (
                        <ChartTooltip
                          active={active}
                          payload={payload?.map(p => ({ ...p, name: displayMode === 'rr' ? 'R:R' : 'P&L' }))}
                          label={label}
                          formatter={(value: number) => formatValue(value)}
                          labelFormatter={(label) => {
                            const item = chartData.find(d => d.date === label);
                            return item?.fullDate ? new Date(item.fullDate).toLocaleDateString('en-US', { 
                              weekday: 'short',
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            }) : label;
                          }}
                        />
                      )}
                    />
                    {/* Reference line at zero */}
                    <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke={(displayMode === 'rr' ? (filteredStats.totalRR || 0) : filteredStats.totalPnl) >= 0 ? "#10b981" : "#dc2626"}
                      strokeWidth={2}
                      fill={(displayMode === 'rr' ? (filteredStats.totalRR || 0) : filteredStats.totalPnl) >= 0 ? "url(#colorPnl)" : "url(#colorNegative)"}
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={dailyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="hsl(var(--border))"
                      opacity={0.5}
                      vertical={false}
                    />
                    <XAxis 
                      dataKey="date" 
                      interval={getXAxisInterval(dailyData.length)}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      height={30}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      width={60}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => (
                        <ChartTooltip
                          active={active}
                          payload={payload?.map(p => ({ ...p, name: displayMode === 'rr' ? 'R:R' : 'P&L' }))}
                          label={label}
                          formatter={(value: number) => formatValue(value)}
                          labelFormatter={(label) => {
                            const item = dailyData.find(d => d.date === label);
                            return item?.fullDate ? new Date(item.fullDate).toLocaleDateString('en-US', { 
                              weekday: 'short',
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            }) : label;
                          }}
                        />
                      )}
                    />
                    <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {dailyData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`}
                          fill={entry.value >= 0 ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            ) : (
              <EmptyState
                icon={BarChart3}
                title="No chart data"
                description="Add trades to see your performance visualized"
              />
            )}
          </CardContent>
        </Card>
        </motion.div>
      )}
    </div>
  );
}
