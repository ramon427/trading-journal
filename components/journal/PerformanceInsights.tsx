import { useMemo } from 'react';
import { Trade, JournalEntry, Statistics } from '@/types/journal/trading';
import { DisplayMode } from '@/lib/journal/settings';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { 
  TrendingUp, 
  TrendingDown, 
  Target,
  Award,
  AlertTriangle,
  Calendar,
  Clock,
  DollarSign,
  Percent,
  BarChart3,
  Zap,
  Shield,
  Brain,
  CheckCircle2,
  XCircle,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, LineChart, Line } from 'recharts';

interface PerformanceInsightsProps {
  trades: Trade[];
  journalEntries: JournalEntry[];
  stats: Statistics;
  displayMode: DisplayMode;
}

interface Insight {
  type: 'success' | 'warning' | 'danger' | 'info';
  title: string;
  message: string;
  icon: any;
  metric?: string;
}

export function PerformanceInsights({ trades, journalEntries, stats, displayMode }: PerformanceInsightsProps) {
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

  // Calculate setup performance
  const setupPerformance = useMemo(() => {
    return Object.entries(stats.performanceBySetup)
      .map(([setup, data]) => ({
        setup: setup || 'Unknown',
        ...data,
      }))
      .sort((a, b) => b.pnl - a.pnl);
  }, [stats.performanceBySetup]);

  // Calculate win/loss streaks
  const streakData = useMemo(() => {
    const sortedTrades = [...trades].sort((a, b) => a.date.localeCompare(b.date));
    let currentStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let currentWinStreak = 0;
    let currentLossStreak = 0;

    sortedTrades.forEach(trade => {
      if (trade.pnl > 0) {
        currentWinStreak++;
        currentLossStreak = 0;
        currentStreak = currentStreak >= 0 ? currentStreak + 1 : 1;
        maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
      } else if (trade.pnl < 0) {
        currentLossStreak++;
        currentWinStreak = 0;
        currentStreak = currentStreak <= 0 ? currentStreak - 1 : -1;
        maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
      }
    });

    return {
      currentStreak,
      maxWinStreak,
      maxLossStreak,
      isWinStreak: currentStreak > 0,
    };
  }, [trades]);

  // Rule-following analysis
  const ruleFollowingData = useMemo(() => {
    const daysWithTrades = new Set(trades.map(t => t.date));
    const relevantJournals = journalEntries.filter(j => daysWithTrades.has(j.date));
    const followedSystem = relevantJournals.filter(j => j.followedSystem).length;
    const total = relevantJournals.length;

    return {
      followed: followedSystem,
      total: total,
      percentage: total > 0 ? (followedSystem / total) * 100 : 0,
    };
  }, [trades, journalEntries]);

  // Risk management metrics
  const riskMetrics = useMemo(() => {
    const tradesWithRR = trades.filter(t => t.rr !== undefined);
    const avgRisk = tradesWithRR.length > 0 
      ? tradesWithRR.reduce((sum, t) => sum + Math.abs(Math.min(t.rr || 0, 0)), 0) / tradesWithRR.length
      : 0;
    
    const avgReward = stats.winningTrades > 0
      ? stats.avgWin / (stats.losingTrades > 0 ? Math.abs(stats.avgLoss) : 1)
      : 0;

    return {
      avgRisk,
      avgReward,
      riskRewardRatio: avgReward,
      stopLossAdherence: tradesWithRR.length / trades.length * 100,
    };
  }, [trades, stats]);

  // Generate actionable insights
  const insights = useMemo((): Insight[] => {
    const insights: Insight[] = [];

    // Win rate insight
    if (stats.winRate >= 60) {
      insights.push({
        type: 'success',
        title: 'Strong Win Rate',
        message: `You're maintaining a ${stats.winRate.toFixed(1)}% win rate, which is excellent. Keep following your system!`,
        icon: Award,
        metric: `${stats.winRate.toFixed(1)}%`,
      });
    } else if (stats.winRate < 45) {
      insights.push({
        type: 'warning',
        title: 'Win Rate Needs Attention',
        message: `Your win rate of ${stats.winRate.toFixed(1)}% is below optimal. Focus on setup quality and entry timing.`,
        icon: Target,
        metric: `${stats.winRate.toFixed(1)}%`,
      });
    }

    // Profit factor insight
    if (stats.profitFactor >= 2) {
      insights.push({
        type: 'success',
        title: 'Excellent Profit Factor',
        message: `Your profit factor of ${stats.profitFactor.toFixed(2)} shows you're making $${stats.profitFactor.toFixed(2)} for every $1 risked.`,
        icon: TrendingUp,
        metric: `${stats.profitFactor.toFixed(2)}x`,
      });
    } else if (stats.profitFactor < 1.5) {
      insights.push({
        type: 'danger',
        title: 'Low Profit Factor',
        message: `Profit factor of ${stats.profitFactor.toFixed(2)} needs improvement. Focus on letting winners run and cutting losses quickly.`,
        icon: TrendingDown,
        metric: `${stats.profitFactor.toFixed(2)}x`,
      });
    }

    // Best performing setup
    if (setupPerformance.length > 0 && setupPerformance[0].trades >= 3) {
      const bestSetup = setupPerformance[0];
      insights.push({
        type: 'success',
        title: 'Best Performing Setup',
        message: `"${bestSetup.setup}" is your strongest setup with ${bestSetup.winRate.toFixed(0)}% win rate. Consider trading it more often.`,
        icon: Zap,
        metric: `${bestSetup.winRate.toFixed(0)}%`,
      });
    }

    // Worst performing setup
    if (setupPerformance.length > 0 && setupPerformance[setupPerformance.length - 1].trades >= 3) {
      const worstSetup = setupPerformance[setupPerformance.length - 1];
      if (worstSetup.winRate < 40) {
        insights.push({
          type: 'warning',
          title: 'Underperforming Setup',
          message: `"${worstSetup.setup}" has only ${worstSetup.winRate.toFixed(0)}% win rate. Review or avoid this setup.`,
          icon: AlertTriangle,
          metric: `${worstSetup.winRate.toFixed(0)}%`,
        });
      }
    }

    // Rule following
    if (ruleFollowingData.percentage < 80 && ruleFollowingData.total >= 5) {
      insights.push({
        type: 'danger',
        title: 'System Discipline Issue',
        message: `You only followed your system ${ruleFollowingData.percentage.toFixed(0)}% of the time. Stick to your rules for consistent results.`,
        icon: Shield,
        metric: `${ruleFollowingData.percentage.toFixed(0)}%`,
      });
    } else if (ruleFollowingData.percentage >= 90) {
      insights.push({
        type: 'success',
        title: 'Excellent Discipline',
        message: `You followed your system ${ruleFollowingData.percentage.toFixed(0)}% of the time. This consistency will pay off!`,
        icon: CheckCircle2,
        metric: `${ruleFollowingData.percentage.toFixed(0)}%`,
      });
    }

    // Winning streak
    if (streakData.currentStreak >= 3 && streakData.isWinStreak) {
      insights.push({
        type: 'success',
        title: 'Hot Streak!',
        message: `You're on a ${streakData.currentStreak}-trade winning streak. Stay focused and don't get overconfident.`,
        icon: Activity,
        metric: `${streakData.currentStreak} wins`,
      });
    }

    // Losing streak
    if (streakData.currentStreak <= -3 && !streakData.isWinStreak) {
      insights.push({
        type: 'warning',
        title: 'Breaking a Slump',
        message: `You're on a ${Math.abs(streakData.currentStreak)}-trade losing streak. Take a step back and review your setups.`,
        icon: XCircle,
        metric: `${Math.abs(streakData.currentStreak)} losses`,
      });
    }

    // Best day of week
    if (dayOfWeekPerformance.length > 0) {
      const bestDay = dayOfWeekPerformance.reduce((best, day) => 
        day.pnl > best.pnl ? day : best
      );
      if (bestDay.trades >= 3) {
        insights.push({
          type: 'info',
          title: 'Best Trading Day',
          message: `${bestDay.day} is your most profitable day with ${formatValue(bestDay.pnl)}. Consider focusing more trades on this day.`,
          icon: Calendar,
          metric: bestDay.day,
        });
      }
    }

    return insights;
  }, [stats, setupPerformance, ruleFollowingData, streakData, dayOfWeekPerformance, displayMode]);

  if (trades.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="mb-2">No Data Yet</h3>
          <p className="text-muted-foreground">
            Add some trades to see performance insights and recommendations.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total P&L / R:R */}
            <div className="p-4 rounded-md border border-border">
              <p className="text-xs text-muted-foreground mb-1">{displayMode === 'rr' ? 'Total R:R' : 'Total P&L'}</p>
              <h3 className={stats.totalPnl >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}>
                {formatValue(displayMode === 'rr' ? (stats.totalRR || 0) : stats.totalPnl)}
              </h3>
            </div>

            {/* Win Rate */}
            <div className="p-4 rounded-md border border-border">
              <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
              <h3 className="text-green-600 dark:text-green-500">{stats.winRate.toFixed(1)}%</h3>
            </div>

            {/* Total Trades */}
            <div className="p-4 rounded-md border border-border">
              <p className="text-xs text-muted-foreground mb-1">Total Trades</p>
              <h3>{stats.totalTrades}</h3>
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

      {/* Key Insights */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-5 w-5" />
          <h3>AI-Powered Insights</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights.map((insight, index) => (
            <Card key={index} className={
              insight.type === 'success' ? 'border-green-500/50' :
              insight.type === 'warning' ? 'border-yellow-500/50' :
              insight.type === 'danger' ? 'border-red-500/50' :
              ''
            }>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <insight.icon className={`h-4 w-4 flex-shrink-0 ${
                        insight.type === 'success' ? 'text-green-600' :
                        insight.type === 'warning' ? 'text-yellow-600' :
                        insight.type === 'danger' ? 'text-red-600' :
                        'text-blue-600'
                      }`} />
                      <h4 className="text-sm truncate">{insight.title}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {insight.message}
                    </p>
                  </div>
                  {insight.metric && (
                    <Badge variant={
                      insight.type === 'success' ? 'default' :
                      insight.type === 'warning' ? 'secondary' :
                      'outline'
                    } className="flex-shrink-0">
                      {insight.metric}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Performance Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Symbol Performance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top Symbols by Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {symbolPerformance.slice(0, 5).map((symbol) => (
                <div key={symbol.symbol} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">
                        {symbol.symbol}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {symbol.trades} trades
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-mono ${
                        symbol.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatValue(displayMode === 'rr' ? symbol.rr : symbol.pnl)}
                      </span>
                      <Badge variant={symbol.winRate >= 50 ? 'default' : 'secondary'} className="text-xs">
                        {symbol.winRate.toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={symbol.winRate} className="h-1.5" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Win/Loss Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Win/Loss Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Wins', value: stats.winningTrades, color: '#22c55e' },
                    { name: 'Losses', value: stats.losingTrades, color: '#ef4444' },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {[
                    { name: 'Wins', value: stats.winningTrades, color: '#22c55e' },
                    { name: 'Losses', value: stats.losingTrades, color: '#ef4444' },
                  ].map((entry, index) => (
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

      {/* Setup Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Setup Performance
          </CardTitle>
        </CardHeader>
          <CardContent>
            {setupPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={setupPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis 
                    dataKey="setup" 
                    tick={{ fontSize: 12 }}
                    stroke="var(--muted-foreground)"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="var(--muted-foreground)"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '0.5rem',
                    }}
                    formatter={(value: any) => formatValue(displayMode === 'rr' ? value : value)}
                  />
                  <Bar 
                    dataKey={displayMode === 'rr' ? 'rr' : 'pnl'}
                    radius={[4, 4, 0, 0]}
                  >
                    {setupPerformance.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`}
                        fill={entry.pnl >= 0 ? 'var(--chart-2)' : 'var(--destructive)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No setup data available
              </div>
            )}
          </CardContent>
        </Card>

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
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dayOfWeekPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 12 }}
                  stroke="var(--muted-foreground)"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="var(--muted-foreground)"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                  }}
                  formatter={(value: any, name: string) => {
                    if (name === 'winRate') return `${value.toFixed(1)}%`;
                    return formatValue(value);
                  }}
                />
                <Bar 
                  dataKey={displayMode === 'rr' ? 'rr' : 'pnl'}
                  radius={[4, 4, 0, 0]}
                >
                  {dayOfWeekPerformance.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={entry.pnl >= 0 ? 'var(--chart-2)' : 'var(--destructive)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Not enough data for day of week analysis
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Current Streak */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className={`h-4 w-4 ${
                streakData.isWinStreak ? 'text-green-600' : 'text-red-600'
              }`} />
              <span className="text-xs text-muted-foreground">Current Streak</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-mono ${
                streakData.currentStreak >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {Math.abs(streakData.currentStreak)}
              </span>
              <span className="text-xs text-muted-foreground">
                {streakData.isWinStreak ? 'wins' : 'losses'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Longest Win Streak */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-xs text-muted-foreground">Best Streak</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-mono text-green-600">
                {streakData.maxWinStreak}
              </span>
              <span className="text-xs text-muted-foreground">wins</span>
            </div>
          </CardContent>
        </Card>

        {/* Longest Loss Streak */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="text-xs text-muted-foreground">Worst Streak</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-mono text-red-600">
                {streakData.maxLossStreak}
              </span>
              <span className="text-xs text-muted-foreground">losses</span>
            </div>
          </CardContent>
        </Card>

        {/* System Adherence */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className={`h-4 w-4 ${
                ruleFollowingData.percentage >= 80 ? 'text-green-600' : 'text-yellow-600'
              }`} />
              <span className="text-xs text-muted-foreground">Rule Following</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-mono ${
                ruleFollowingData.percentage >= 80 ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {ruleFollowingData.percentage.toFixed(0)}
              </span>
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
