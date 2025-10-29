import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Trade, Statistics } from '@/types/journal/trading';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { TrendingUp, FileSpreadsheet, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { DisplayMode } from '@/lib/journal/settings';
import { EmptyState } from './EmptyState';
import { ChartTooltip } from './ChartTooltip';
import { loadAccountSettings } from '@/lib/journal/accountSettings';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/hover-card';
import { Alert, AlertDescription } from './ui/alert';

interface GrowthProjectionProps {
  trades: Trade[];
  stats: Statistics;
  displayMode: DisplayMode;
}

export function GrowthProjection({ trades, stats, displayMode }: GrowthProjectionProps) {
  const [projectionDays, setProjectionDays] = useState(90);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [targetWinRate, setTargetWinRate] = useState<number | null>(null);
  const [targetRR, setTargetRR] = useState<number | null>(null);

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

  // Data quality indicator
  const getDataQuality = (tradeCount: number) => {
    if (tradeCount < 10) return { 
      label: 'Limited', 
      color: 'bg-orange-500 dark:bg-orange-600',
      message: 'Need at least 10 trades for meaningful projections. Keep trading!',
      confidence: 'low'
    };
    if (tradeCount < 30) return { 
      label: 'Developing', 
      color: 'bg-yellow-500 dark:bg-yellow-600',
      message: 'Good start! More data will improve projection accuracy.',
      confidence: 'medium'
    };
    if (tradeCount < 100) return { 
      label: 'Reliable', 
      color: 'bg-green-500 dark:bg-green-600',
      message: 'Solid data foundation. Projections are reliable.',
      confidence: 'high'
    };
    return { 
      label: 'Excellent', 
      color: 'bg-blue-500 dark:bg-blue-600',
      message: 'Outstanding dataset. Projections are highly accurate.',
      confidence: 'very-high'
    };
  };

  // Calculate current value
  const currentBalance = displayMode === 'rr' ? (stats.totalRR || 0) : stats.totalPnl;
  const accountSettings = loadAccountSettings();
  const assumedStartingBalance = displayMode === 'rr' ? 0 : (accountSettings?.startingBalance || 10000);
  const currentAccountValue = assumedStartingBalance + currentBalance;

  // Calculate daily return rate - memoized for performance
  const { tradingDays, avgDailyReturn, avgDailyReturnPercent } = useMemo(() => {
    const dailyValues = new Map<string, number>();
    trades.forEach(trade => {
      const current = dailyValues.get(trade.date) || 0;
      const addValue = displayMode === 'rr' ? (trade.rr || 0) : trade.pnl;
      dailyValues.set(trade.date, current + addValue);
    });
    
    const days = dailyValues.size;
    const avgReturn = days > 0 ? (displayMode === 'rr' ? (stats.avgDailyRR || 0) : stats.avgDailyPnl) : 0;
    const avgReturnPercent = displayMode === 'rr' 
      ? avgReturn
      : (assumedStartingBalance > 0 ? (avgReturn / assumedStartingBalance) * 100 : 0);

    return {
      tradingDays: days,
      avgDailyReturn: avgReturn,
      avgDailyReturnPercent: avgReturnPercent
    };
  }, [trades, displayMode, stats.avgDailyRR, stats.avgDailyPnl, assumedStartingBalance]);

  // Main projection - use realistic rate (80% of current performance)
  const projectionRate = avgDailyReturnPercent * 0.8;

  // Project forward based on selected timeframe - memoized for performance
  const projectionData = useMemo(() => {
    const today = new Date();
    const data = [];
    for (let day = 0; day <= projectionDays; day++) {
      const growthFactor = 1 + projectionRate / 100;
      const projected = currentAccountValue * Math.pow(growthFactor, day);
      
      // Safety check for NaN or Infinity
      const safeProjected = isFinite(projected) ? projected : currentAccountValue;
      
      const projectionDate = new Date(today);
      projectionDate.setDate(today.getDate() + day);
      
      data.push({
        day,
        date: projectionDate.toISOString().split('T')[0],
        displayDate: projectionDate,
        current: Math.round(safeProjected)
      });
    }
    return data;
  }, [projectionDays, currentAccountValue, projectionRate]);

  const projectedEndValue = projectionData[projectionDays]?.current || currentAccountValue;
  const projectedGain = projectedEndValue - currentAccountValue;
  const projectedGainPercent = currentAccountValue > 0 ? (projectedGain / currentAccountValue) * 100 : 0;

  // Calculate month boundaries for vertical lines - memoized
  const monthBoundaries = useMemo(() => {
    const boundaries: string[] = [];
    let lastMonth = -1;
    projectionData.forEach((point) => {
      const date = new Date(point.date);
      const currentMonth = date.getMonth();
      if (currentMonth !== lastMonth && lastMonth !== -1) {
        boundaries.push(point.date);
      }
      lastMonth = currentMonth;
    });
    return boundaries;
  }, [projectionData]);

  // Calculate current average R:R ratio
  const currentAvgRR = stats.avgLoss !== 0 ? Math.abs(stats.avgWin / stats.avgLoss) : 1.5;

  // Initialize sliders to current values on first render
  const effectiveWinRate = targetWinRate ?? stats.winRate;
  const effectiveRR = targetRR ?? currentAvgRR;

  // What-if scenario calculations - memoized for performance
  const whatIfScenarios = useMemo(() => {
    if (targetWinRate === null && targetRR === null) return null;

    const adjustedWinRate = effectiveWinRate;
    const adjustedAvgRR = effectiveRR;
    
    // In RR mode, calculate based on R values; in PnL mode, use dollar amounts
    let adjustedAvgWin, adjustedAvgLoss;
    if (displayMode === 'rr') {
      // For RR mode, work with R multiples
      // If current avgWinRR and avgLossRR exist, use them; otherwise derive from ratio
      const currentAvgWinRR = stats.avgWinRR || 1;
      const currentAvgLossRR = stats.avgLossRR || 1;
      
      // Keep the same loss size, adjust win size based on new RR
      adjustedAvgLoss = currentAvgLossRR;
      adjustedAvgWin = Math.abs(adjustedAvgLoss) * adjustedAvgRR;
    } else {
      // For PnL mode, keep win size same, adjust loss size
      adjustedAvgWin = stats.avgWin;
      adjustedAvgLoss = adjustedAvgRR !== 0 ? Math.abs(adjustedAvgWin / adjustedAvgRR) : stats.avgLoss;
    }
    
    const newExpectedValue = (adjustedWinRate / 100) * adjustedAvgWin - ((100 - adjustedWinRate) / 100) * Math.abs(adjustedAvgLoss);
    const tradesPerDay = tradingDays > 0 ? trades.length / tradingDays : 0;
    const newAvgDailyReturn = newExpectedValue * tradesPerDay;
    const newAvgDailyReturnPercent = currentAccountValue > 0 
      ? (newAvgDailyReturn / currentAccountValue) * 100 
      : 0;
    
    const adjustedRate = newAvgDailyReturnPercent * 0.8;
    const adjustedProjection = [];
    const today = new Date();
    
    for (let day = 0; day <= projectionDays; day++) {
      const growthFactor = 1 + adjustedRate / 100;
      const value = currentAccountValue * Math.pow(growthFactor, day);
      
      // Safety check for NaN or Infinity
      const safeValue = isFinite(value) ? value : currentAccountValue;
      
      const projectionDate = new Date(today);
      projectionDate.setDate(today.getDate() + day);
      
      adjustedProjection.push({
        day,
        date: projectionDate.toISOString().split('T')[0],
        whatif: Math.round(safeValue)
      });
    }
    
    const whatIfEndValue = adjustedProjection[projectionDays]?.whatif || currentAccountValue;
    const improvement = projectedEndValue !== 0 
      ? ((whatIfEndValue - projectedEndValue) / projectedEndValue) * 100 
      : 0;
    
    return {
      data: adjustedProjection,
      projectedEndValue: whatIfEndValue,
      improvement,
      gain: whatIfEndValue - currentAccountValue
    };
  }, [targetWinRate, targetRR, effectiveWinRate, effectiveRR, displayMode, stats.avgWinRR, stats.avgLossRR, stats.avgWin, stats.avgLoss, tradingDays, trades.length, currentAccountValue, projectionDays, projectedEndValue]);

  // Merge what-if data into projection data for the chart
  const chartData = useMemo(() => {
    if (!whatIfScenarios) return projectionData;
    
    return projectionData.map((point, index) => ({
      ...point,
      whatif: whatIfScenarios.data[index]?.whatif
    }));
  }, [projectionData, whatIfScenarios]);

  // Risk of Ruin calculation - memoized for performance
  const riskOfRuin = useMemo(() => {
    if (stats.totalTrades < 10 || stats.winRate === 0) {
      return {
        probability: 0,
        severity: 'low' as const,
        warning: 'Not enough data for risk assessment'
      };
    }
    
    const winProb = stats.winRate / 100;
    const loseProb = 1 - winProb;
    const avgWin = Math.abs(stats.avgWin);
    const avgLoss = Math.abs(stats.avgLoss);
    
    let ror = 0;
    
    if (avgWin > 0 && avgLoss > 0) {
      const payoffRatio = avgWin / avgLoss;
      const kelly = (winProb * payoffRatio - loseProb) / payoffRatio;
      const riskPerTrade = 0.01;
      
      // Prevent division by zero
      if (kelly !== 0) {
        const kellyMultiple = riskPerTrade / kelly;
        
        if (kellyMultiple > 1) {
          ror = Math.min(95, 20 + (kellyMultiple - 1) * 30);
        } else {
          ror = Math.max(1, 20 * (1 - kelly));
        }
      }
    }
    
    const severity = ror > 50 ? 'high' : ror > 20 ? 'medium' : 'low';
    const warning = ror > 50 
      ? 'High risk - reduce position size or improve win rate'
      : ror > 20
      ? 'Moderate risk - maintain discipline'
      : 'Low risk - good edge and risk management';
    
    return {
      probability: Math.round(ror),
      severity: severity as 'high' | 'medium' | 'low',
      warning
    };
  }, [stats.totalTrades, stats.winRate, stats.avgWin, stats.avgLoss]);

  const exportProjectionData = () => {
    const csvContent = [
      ['Date', 'Day', 'Current Trajectory', whatIfScenarios ? 'What-If Scenario' : ''].filter(Boolean).join(','),
      ...projectionData.map((d, i) => [
        d.date,
        d.day, 
        d.current, 
        whatIfScenarios ? whatIfScenarios.data[i].whatif : ''
      ].filter((_, idx) => idx < 3 || whatIfScenarios).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `growth-projection-${projectionDays}days.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Projection data exported');
  };

  const dataQuality = useMemo(() => getDataQuality(trades.length), [trades.length]);

  if (trades.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No projection data yet"
        description="Add some trades to see growth projections based on your performance"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Value */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="p-5 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 hover:border-blue-500/40 transition-all hover:shadow-md group"
        >
          <p className="text-xs text-muted-foreground mb-2 opacity-80">Current Value</p>
          <h3 className="text-blue-600 dark:text-blue-400 mb-0 group-hover:scale-105 origin-left transition-transform">
            {formatValue(currentAccountValue)}
          </h3>
        </motion.div>

        {/* Projected Value */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="p-5 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 hover:border-purple-500/40 transition-all hover:shadow-md group"
        >
          <p className="text-xs text-muted-foreground mb-2 opacity-80">Projected ({projectionDays}d)</p>
          <h3 className="text-purple-600 dark:text-purple-400 mb-0 group-hover:scale-105 origin-left transition-transform">
            {formatValue(projectedEndValue)}
          </h3>
        </motion.div>

        {/* Expected Gain */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className={`p-5 rounded-lg border transition-all hover:shadow-md group ${
          projectedGain >= 0 
            ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40' 
            : 'bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20 hover:border-red-500/40'
        }`}>
          <p className="text-xs text-muted-foreground mb-2 opacity-80">Expected Gain</p>
          <h3 className={`mb-1 group-hover:scale-105 origin-left transition-transform ${
            projectedGain >= 0 
              ? 'text-emerald-600 dark:text-emerald-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            {formatValue(projectedGain)}
          </h3>
          <p className="text-xs text-muted-foreground">
            {projectedGainPercent >= 0 ? '+' : ''}{projectedGainPercent.toFixed(1)}%
          </p>
        </motion.div>

        {/* Data Quality */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="p-5 rounded-lg bg-gradient-to-br from-muted/50 to-background border border-border/50 hover:border-border transition-all hover:shadow-md flex items-center justify-between gap-2 group"
        >
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-2 opacity-80">Data Quality</p>
            <Badge className={`${dataQuality.color} text-white border-0 text-xs shadow-sm`}>
              {dataQuality.label}
            </Badge>
          </div>
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 opacity-60 hover:opacity-100">
                <Info className="h-3.5 w-3.5" />
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-2">
                <h4 className="text-sm">Data Quality</h4>
                <p className="text-xs text-muted-foreground">
                  {dataQuality.message}
                </p>
              </div>
            </HoverCardContent>
          </HoverCard>
        </motion.div>
      </div>

      {/* Main Content - Chart and What-If Side by Side */}
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Chart Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex-1 min-w-0"
        >
        <Card className="border-border/50 shadow-sm h-full">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span>Growth Projection</span>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Select value={projectionDays.toString()} onValueChange={(v) => setProjectionDays(parseInt(v))}>
                  <SelectTrigger className="w-[120px] shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 Days</SelectItem>
                    <SelectItem value="60">60 Days</SelectItem>
                    <SelectItem value="90">90 Days</SelectItem>
                    <SelectItem value="180">180 Days</SelectItem>
                    <SelectItem value="365">1 Year</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={exportProjectionData} title="Export data" className="shadow-sm">
                  <FileSpreadsheet className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid 
                strokeDasharray="3 3"
                stroke="var(--border)"
                opacity={0.2}
                vertical={false}
              />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(date) => {
                  const d = new Date(date);
                  if (projectionDays <= 60) {
                    // Show date for shorter periods
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  } else if (projectionDays <= 180) {
                    // Show month/day for medium periods
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  } else {
                    // Show month/year for longer periods
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    return `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
                  }
                }}
                interval={projectionDays <= 30 ? 4 : projectionDays <= 90 ? 10 : projectionDays <= 180 ? 20 : 30}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                width={80}
                tickFormatter={(value) => formatValue(value)}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const date = new Date(label);
                  const formattedDate = date.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  });
                  return (
                    <ChartTooltip
                      active={active}
                      payload={payload}
                      label={label}
                      formatter={(value: number) => formatValue(value)}
                      labelFormatter={() => formattedDate}
                    />
                  );
                }}
              />
              <Legend 
                wrapperStyle={{ 
                  fontSize: '12px',
                  paddingTop: '12px'
                }}
              />
              {/* Month separator lines */}
              {monthBoundaries.map((date) => (
                <ReferenceLine
                  key={date}
                  x={date}
                  stroke="hsl(var(--border))"
                  strokeDasharray="3 3"
                  strokeOpacity={0.4}
                />
              ))}
              <Line 
                type="monotone" 
                dataKey="current" 
                stroke="#3b82f6" 
                strokeWidth={3}
                name="Current Trajectory"
                dot={false}
              />
              {whatIfScenarios && (
                <Line 
                  type="monotone" 
                  dataKey="whatif" 
                  stroke="#a855f7" 
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  name="What-If Scenario"
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
          </CardContent>
        </Card>
        </motion.div>

        {/* What-If Scenarios Panel - Right Side */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="xl:w-[380px] flex-shrink-0"
        >
        <Card className="border-border/50 shadow-sm h-full">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <span>What-If Scenarios</span>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-60 hover:opacity-100">
                      <Info className="h-3 w-3" />
                    </Button>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="space-y-2">
                      <h4 className="text-sm">Model improvements</h4>
                      <p className="text-xs text-muted-foreground">
                        Adjust win rate and risk/reward to see how performance improvements would impact your projected growth.
                      </p>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </CardTitle>
              {(targetWinRate !== null || targetRR !== null) && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setTargetWinRate(null);
                    setTargetRR(null);
                  }}
                >
                  Reset
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Manual Adjustments */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Target Win Rate</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Current: {stats.winRate.toFixed(1)}%</span>
                    <span className={`text-sm ${effectiveWinRate !== stats.winRate ? (effectiveWinRate > stats.winRate ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400') : ''}`}>
                      {effectiveWinRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <Slider
                  value={[effectiveWinRate]}
                  onValueChange={(value) => setTargetWinRate(value[0])}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Target Risk:Reward</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Current: 1:{currentAvgRR.toFixed(1)}</span>
                    <span className={`text-sm ${effectiveRR !== currentAvgRR ? (effectiveRR > currentAvgRR ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400') : ''}`}>
                      1:{effectiveRR.toFixed(1)}
                    </span>
                  </div>
                </div>
                <Slider
                  value={[effectiveRR * 10]}
                  onValueChange={(value) => setTargetRR(value[0] / 10)}
                  min={5}
                  max={200}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1:0.5</span>
                  <span>1:10.0</span>
                  <span>1:20.0</span>
                </div>
              </div>
            </div>

            {/* Impact Preview */}
            <AnimatePresence mode="wait">
            {(targetWinRate !== null || targetRR !== null) && whatIfScenarios && (
              <motion.div
                key="impact-preview"
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: '1rem' }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
              <Alert className={whatIfScenarios.improvement >= 0 ? "border-green-500/50 bg-green-500/10" : "border-red-500/50 bg-red-500/10"}>
                <AlertDescription className="text-sm">
                  {whatIfScenarios.improvement >= 0 ? (
                    <>
                      <strong>Potential impact:</strong> Reaching these targets could result in <strong>{formatValue(whatIfScenarios.projectedEndValue - projectedEndValue)}</strong> additional profit over {projectionDays} days ({whatIfScenarios.improvement.toFixed(1)}% improvement).
                    </>
                  ) : (
                    <>
                      <strong>Warning:</strong> These targets would decrease your projected returns by {Math.abs(whatIfScenarios.improvement).toFixed(1)}%.
                    </>
                  )}
                </AlertDescription>
              </Alert>
              </motion.div>
            )}
            </AnimatePresence>

            {/* What-If Result Summary */}
            <AnimatePresence mode="wait">
            {whatIfScenarios && (
              <motion.div
                key="whatif-result"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="p-5 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 shadow-sm"
              >
                <p className="text-xs text-muted-foreground mb-2 opacity-80">What-If Result</p>
                <div className="flex items-baseline gap-2 mb-1">
                  <h3 className="text-purple-600 dark:text-purple-400 mb-0">
                    {formatValue(whatIfScenarios.gain)}
                  </h3>
                  <p className={`text-sm ${whatIfScenarios.improvement >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {whatIfScenarios.improvement >= 0 ? '+' : ''}{whatIfScenarios.improvement.toFixed(1)}%
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  End value: {formatValue(whatIfScenarios.projectedEndValue)}
                </p>
              </motion.div>
            )}
            </AnimatePresence>
          </CardContent>
        </Card>
        </motion.div>
      </div>


      {/* Risk Analysis - Collapsible */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <Card className="border-border/50 overflow-hidden">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-accent/50 transition-all duration-200 group py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <CardTitle>Risk Assessment</CardTitle>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {riskOfRuin.probability}%
                    </Badge>
                  </div>
                  
                  {/* Risk meter preview */}
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span>Risk level:</span>
                      <span className="capitalize">{riskOfRuin.severity}</span>
                    </div>
                    <div className="relative h-1 bg-muted/50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${riskOfRuin.probability}%` }}
                        transition={{ duration: 0.8, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        className="absolute inset-y-0 left-0 bg-foreground rounded-full"
                      />
                    </div>
                  </div>
                </div>
                
                <motion.div
                  animate={{ rotate: showAdvanced ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0"
                >
                  <ChevronDown className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-foreground" />
                </motion.div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CardContent className="border-t pt-5 space-y-5">
                {/* Main risk display */}
                <div className="space-y-3">
                  {/* Risk percentage with animated circle */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm text-muted-foreground">Probability of Ruin</p>
                      <div className="flex items-baseline gap-2">
                        <h2 className="mb-0">{riskOfRuin.probability}%</h2>
                        <Badge variant="outline" className="text-xs capitalize">
                          {riskOfRuin.severity}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Circular risk indicator */}
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        {/* Background circle */}
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          className="text-muted/30"
                        />
                        {/* Animated progress circle */}
                        <motion.circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          strokeLinecap="round"
                          className="text-foreground"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: riskOfRuin.probability / 100 }}
                          transition={{ duration: 1, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
                          style={{
                            strokeDasharray: "264",
                            strokeDashoffset: 0,
                          }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-medium">{riskOfRuin.probability}%</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Risk meter with gradient */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Low risk</span>
                      <span>High risk</span>
                    </div>
                    <div className="relative h-1.5 bg-muted/30 rounded-full overflow-hidden">
                      {/* Gradient background */}
                      <div 
                        className="absolute inset-0 opacity-20"
                        style={{
                          background: 'linear-gradient(to right, rgb(16, 185, 129), rgb(245, 158, 11), rgb(220, 38, 38))'
                        }}
                      />
                      {/* Animated indicator */}
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${riskOfRuin.probability}%` }}
                        transition={{ duration: 1, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        className="absolute inset-y-0 left-0 bg-foreground/80 rounded-full"
                      />
                      {/* Position marker */}
                      <motion.div
                        initial={{ left: '0%', opacity: 0 }}
                        animate={{ 
                          left: `${Math.min(riskOfRuin.probability, 98)}%`,
                          opacity: 1 
                        }}
                        transition={{ duration: 1, delay: 0.5, ease: [0.4, 0, 0.2, 1] }}
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                      >
                        <div className="w-3 h-3 bg-foreground rounded-full border-2 border-background shadow-sm" />
                      </motion.div>
                    </div>
                  </div>
                  
                  {/* Warning message */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.6 }}
                    className="p-3.5 rounded-lg bg-muted/30 border border-border/50"
                  >
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {riskOfRuin.warning}
                    </p>
                  </motion.div>
                </div>
                
                {/* Risk breakdown */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.7 }}
                  className="pt-4 border-t border-border/50"
                >
                  <p className="text-xs text-muted-foreground mb-2.5">Risk Factors</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">Win Rate</p>
                      <p className="font-medium">{stats.winRate.toFixed(1)}%</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">Avg R:R</p>
                      <p className="font-medium">1:{(Math.abs(stats.avgWin / (stats.avgLoss || 1))).toFixed(2)}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">Sample Size</p>
                      <p className="font-medium">{stats.totalTrades} trades</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">Confidence</p>
                      <p className="font-medium capitalize">{dataQuality.confidence}</p>
                    </div>
                  </div>
                </motion.div>
              </CardContent>
            </motion.div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
      </motion.div>
    </div>
  );
}
