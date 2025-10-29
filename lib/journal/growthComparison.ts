import { Trade, Statistics } from '../types/trading';
import { calculateStatistics } from './tradingData';

export interface PeriodComparison {
  metric: string;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'neutral';
  isPositive: boolean; // Whether the trend direction is good
  label: string;
  currentLabel: string;
  previousLabel: string;
}

export interface GrowthComparisonData {
  monthOverMonth: PeriodComparison[];
  quarterOverQuarter: PeriodComparison[];
  recentVsHistorical: PeriodComparison[];
  period: {
    current: string;
    previous: string;
  };
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getQuarterKey(date: Date): string {
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `${date.getFullYear()}-Q${quarter}`;
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatQuarterLabel(quarterKey: string): string {
  return quarterKey.replace('-', ' ');
}

function calculateChange(current: number, previous: number): { change: number; changePercent: number; trend: 'up' | 'down' | 'neutral' } {
  const change = current - previous;
  const changePercent = previous !== 0 ? ((current - previous) / Math.abs(previous)) * 100 : 0;
  const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
  
  return { change, changePercent, trend };
}

function createComparison(
  metric: string,
  label: string,
  current: number,
  previous: number,
  currentLabel: string,
  previousLabel: string,
  isPositiveMetric: boolean = true
): PeriodComparison {
  const { change, changePercent, trend } = calculateChange(current, previous);
  
  // Determine if the trend is positive based on the metric type
  const isPositive = isPositiveMetric 
    ? trend === 'up' 
    : trend === 'down';
  
  return {
    metric,
    current,
    previous,
    change,
    changePercent,
    trend,
    isPositive,
    label,
    currentLabel,
    previousLabel,
  };
}

export function calculateGrowthComparison(trades: Trade[], displayMode: 'pnl' | 'rr'): GrowthComparisonData {
  const now = new Date();
  const currentMonthKey = getMonthKey(now);
  const currentQuarterKey = getQuarterKey(now);
  
  // Previous month
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1);
  const previousMonthKey = getMonthKey(previousMonth);
  
  // Previous quarter
  const previousQuarterDate = new Date(now.getFullYear(), now.getMonth() - 3);
  const previousQuarterKey = getQuarterKey(previousQuarterDate);
  
  // Group trades by month
  const tradesByMonth = new Map<string, Trade[]>();
  trades.forEach(trade => {
    const date = new Date(trade.date);
    const monthKey = getMonthKey(date);
    if (!tradesByMonth.has(monthKey)) {
      tradesByMonth.set(monthKey, []);
    }
    tradesByMonth.get(monthKey)!.push(trade);
  });
  
  // Group trades by quarter
  const tradesByQuarter = new Map<string, Trade[]>();
  trades.forEach(trade => {
    const date = new Date(trade.date);
    const quarterKey = getQuarterKey(date);
    if (!tradesByQuarter.has(quarterKey)) {
      tradesByQuarter.set(quarterKey, []);
    }
    tradesByQuarter.get(quarterKey)!.push(trade);
  });
  
  // Current month trades
  const currentMonthTrades = tradesByMonth.get(currentMonthKey) || [];
  const currentMonthStats = calculateStatistics(currentMonthTrades);
  
  // Previous month trades
  const previousMonthTrades = tradesByMonth.get(previousMonthKey) || [];
  const previousMonthStats = calculateStatistics(previousMonthTrades);
  
  // Current quarter trades
  const currentQuarterTrades = tradesByQuarter.get(currentQuarterKey) || [];
  const currentQuarterStats = calculateStatistics(currentQuarterTrades);
  
  // Previous quarter trades
  const previousQuarterTrades = tradesByQuarter.get(previousQuarterKey) || [];
  const previousQuarterStats = calculateStatistics(previousQuarterTrades);
  
  // Recent trades (last 30 days)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentTrades = trades.filter(t => new Date(t.date) >= thirtyDaysAgo);
  const recentStats = calculateStatistics(recentTrades);
  
  // Historical trades (everything before last 30 days)
  const historicalTrades = trades.filter(t => new Date(t.date) < thirtyDaysAgo);
  const historicalStats = calculateStatistics(historicalTrades);
  
  // Month-over-month comparisons
  const monthOverMonth: PeriodComparison[] = [
    createComparison(
      displayMode === 'rr' ? 'Total R:R' : 'Total P&L',
      displayMode === 'rr' ? 'Total R:R' : 'Total P&L',
      displayMode === 'rr' ? currentMonthStats.totalRR : currentMonthStats.totalPnl,
      displayMode === 'rr' ? previousMonthStats.totalRR : previousMonthStats.totalPnl,
      formatMonthLabel(currentMonthKey),
      formatMonthLabel(previousMonthKey),
      true
    ),
    createComparison(
      'Win Rate',
      'Win Rate',
      currentMonthStats.winRate,
      previousMonthStats.winRate,
      formatMonthLabel(currentMonthKey),
      formatMonthLabel(previousMonthKey),
      true
    ),
    createComparison(
      'Avg Trade',
      displayMode === 'rr' ? 'Avg R:R' : 'Avg Trade',
      displayMode === 'rr' ? currentMonthStats.avgRR : currentMonthStats.expectancy,
      displayMode === 'rr' ? previousMonthStats.avgRR : previousMonthStats.expectancy,
      formatMonthLabel(currentMonthKey),
      formatMonthLabel(previousMonthKey),
      true
    ),
    createComparison(
      'Total Trades',
      'Total Trades',
      currentMonthStats.totalTrades,
      previousMonthStats.totalTrades,
      formatMonthLabel(currentMonthKey),
      formatMonthLabel(previousMonthKey),
      true
    ),
  ];
  
  // Quarter-over-quarter comparisons
  const quarterOverQuarter: PeriodComparison[] = [
    createComparison(
      displayMode === 'rr' ? 'Total R:R' : 'Total P&L',
      displayMode === 'rr' ? 'Total R:R' : 'Total P&L',
      displayMode === 'rr' ? currentQuarterStats.totalRR : currentQuarterStats.totalPnl,
      displayMode === 'rr' ? previousQuarterStats.totalRR : previousQuarterStats.totalPnl,
      formatQuarterLabel(currentQuarterKey),
      formatQuarterLabel(previousQuarterKey),
      true
    ),
    createComparison(
      'Win Rate',
      'Win Rate',
      currentQuarterStats.winRate,
      previousQuarterStats.winRate,
      formatQuarterLabel(currentQuarterKey),
      formatQuarterLabel(previousQuarterKey),
      true
    ),
    createComparison(
      'Avg Trade',
      displayMode === 'rr' ? 'Avg R:R' : 'Avg Trade',
      displayMode === 'rr' ? currentQuarterStats.avgRR : currentQuarterStats.expectancy,
      displayMode === 'rr' ? previousQuarterStats.avgRR : previousQuarterStats.expectancy,
      formatQuarterLabel(currentQuarterKey),
      formatQuarterLabel(previousQuarterKey),
      true
    ),
    createComparison(
      'Total Trades',
      'Total Trades',
      currentQuarterStats.totalTrades,
      previousQuarterStats.totalTrades,
      formatQuarterLabel(currentQuarterKey),
      formatQuarterLabel(previousQuarterKey),
      true
    ),
  ];
  
  // Recent vs Historical comparisons
  const recentVsHistorical: PeriodComparison[] = [
    createComparison(
      displayMode === 'rr' ? 'Avg R:R' : 'Avg Trade',
      displayMode === 'rr' ? 'Avg R:R' : 'Avg Trade',
      displayMode === 'rr' ? recentStats.avgRR : recentStats.expectancy,
      displayMode === 'rr' ? historicalStats.avgRR : historicalStats.expectancy,
      'Last 30 days',
      'Historical',
      true
    ),
    createComparison(
      'Win Rate',
      'Win Rate',
      recentStats.winRate,
      historicalStats.winRate,
      'Last 30 days',
      'Historical',
      true
    ),
    createComparison(
      'Profit Factor',
      'Profit Factor',
      recentStats.profitFactor,
      historicalStats.profitFactor,
      'Last 30 days',
      'Historical',
      true
    ),
    createComparison(
      'Avg Win',
      displayMode === 'rr' ? 'Avg Win (R)' : 'Avg Win ($)',
      displayMode === 'rr' ? recentStats.avgWinRR : recentStats.avgWin,
      displayMode === 'rr' ? historicalStats.avgWinRR : historicalStats.avgWin,
      'Last 30 days',
      'Historical',
      true
    ),
  ];
  
  return {
    monthOverMonth: monthOverMonth.filter(c => c.previous !== 0 || c.current !== 0),
    quarterOverQuarter: quarterOverQuarter.filter(c => c.previous !== 0 || c.current !== 0),
    recentVsHistorical: recentVsHistorical.filter(c => c.previous !== 0 || c.current !== 0),
    period: {
      current: formatMonthLabel(currentMonthKey),
      previous: formatMonthLabel(previousMonthKey),
    },
  };
}
