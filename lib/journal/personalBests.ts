import { Trade, Statistics } from '../types/trading';

export interface PersonalBest {
  id: string;
  title: string;
  description: string;
  value: number;
  formattedValue: string;
  date?: string;
  isRecent: boolean; // Within last 30 days
  icon: string;
  trades?: Trade[]; // Related trades for context
  category: 'performance' | 'consistency' | 'volume' | 'streak'; // For grouping
  sparklineData?: number[]; // Trend data for visualization
  badge?: string; // Special badge text (e.g., "Record!", "Recent")
}

export function calculatePersonalBests(
  trades: Trade[],
  displayMode: 'pnl' | 'rr'
): PersonalBest[] {
  if (trades.length === 0) return [];

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // 1. Best Single Trade (by P&L)
  const bestTradePnL = trades.reduce((best, trade) => {
    return trade.pnl > best.pnl ? trade : best;
  }, trades[0]);

  const bestSingleTrade: PersonalBest = {
    id: 'best-single-trade',
    title: 'Best Trade',
    description: `${bestTradePnL.symbol} ${bestTradePnL.type}`,
    value: bestTradePnL.pnl,
    formattedValue: `${bestTradePnL.pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    date: bestTradePnL.date,
    isRecent: new Date(bestTradePnL.date) >= thirtyDaysAgo,
    icon: 'Trophy',
    trades: [bestTradePnL],
    category: 'performance',
    badge: new Date(bestTradePnL.date) >= thirtyDaysAgo ? '✨ New' : undefined,
  };

  // 2. Best Trading Day (total P&L)
  const dailyPnL = new Map<string, { pnl: number; trades: Trade[] }>();
  trades.forEach(trade => {
    const current = dailyPnL.get(trade.date) || { pnl: 0, trades: [] };
    dailyPnL.set(trade.date, {
      pnl: current.pnl + trade.pnl,
      trades: [...current.trades, trade],
    });
  });

  let bestDayPnL = 0;
  let bestDayDate = '';
  let bestDayTrades: Trade[] = [];

  dailyPnL.forEach((data, date) => {
    if (data.pnl > bestDayPnL) {
      bestDayPnL = data.pnl;
      bestDayDate = date;
      bestDayTrades = data.trades;
    }
  });

  const bestTradingDay: PersonalBest = {
    id: 'best-trading-day',
    title: 'Best Day',
    description: `${bestDayTrades.length} trade${bestDayTrades.length !== 1 ? 's' : ''}`,
    value: bestDayPnL,
    formattedValue: `${bestDayPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    date: bestDayDate,
    isRecent: new Date(bestDayDate) >= thirtyDaysAgo,
    icon: 'Star',
    trades: bestDayTrades,
    category: 'performance',
    badge: new Date(bestDayDate) >= thirtyDaysAgo ? '✨ New' : undefined,
  };

  // 3. Best R:R Trade
  const bestTradeRR = trades.reduce((best, trade) => {
    const currentRR = trade.rr || 0;
    const bestRR = best.rr || 0;
    return currentRR > bestRR ? trade : best;
  }, trades[0]);

  const bestRRTrade: PersonalBest = {
    id: 'best-rr-trade',
    title: 'Best R:R',
    description: `${bestTradeRR.symbol} ${bestTradeRR.type}`,
    value: bestTradeRR.rr || 0,
    formattedValue: `${(bestTradeRR.rr || 0).toFixed(2)}R`,
    date: bestTradeRR.date,
    isRecent: new Date(bestTradeRR.date) >= thirtyDaysAgo,
    icon: 'Target',
    trades: [bestTradeRR],
    category: 'performance',
    badge: new Date(bestTradeRR.date) >= thirtyDaysAgo ? '✨ New' : undefined,
  };

  // 4. Best Win Rate (rolling 10 trades minimum)
  let bestWinRate = 0;
  let bestWinRateDate = '';
  let bestWinRateTrades: Trade[] = [];

  if (trades.length >= 10) {
    const sortedTrades = [...trades].sort((a, b) => a.date.localeCompare(b.date));
    
    // Calculate win rate for every window of 10+ trades
    for (let i = 0; i <= sortedTrades.length - 10; i++) {
      const window = sortedTrades.slice(i, i + 10);
      const wins = window.filter(t => t.pnl > 0).length;
      const winRate = (wins / window.length) * 100;
      
      if (winRate > bestWinRate) {
        bestWinRate = winRate;
        bestWinRateDate = window[window.length - 1].date; // Last trade in window
        bestWinRateTrades = window;
      }
    }
  }

  const bestWinRatePeriod: PersonalBest = {
    id: 'best-win-rate',
    title: 'Best Win Rate',
    description: '10-trade period',
    value: bestWinRate,
    formattedValue: `${bestWinRate.toFixed(0)}%`,
    date: bestWinRateDate,
    isRecent: bestWinRateDate ? new Date(bestWinRateDate) >= thirtyDaysAgo : false,
    icon: 'TrendingUp',
    trades: bestWinRateTrades,
    category: 'consistency',
    badge: bestWinRateDate && new Date(bestWinRateDate) >= thirtyDaysAgo ? '✨ New' : undefined,
  };

  // 5. Best Weekly Performance
  const weeklyPnL = new Map<string, { pnl: number; trades: Trade[]; endDate: string }>();
  
  trades.forEach(trade => {
    const tradeDate = new Date(trade.date);
    // Get Monday of the week
    const dayOfWeek = tradeDate.getDay();
    const diff = tradeDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(tradeDate.setDate(diff));
    const weekKey = monday.toISOString().split('T')[0];
    
    const current = weeklyPnL.get(weekKey) || { pnl: 0, trades: [], endDate: trade.date };
    weeklyPnL.set(weekKey, {
      pnl: current.pnl + trade.pnl,
      trades: [...current.trades, trade],
      endDate: trade.date > current.endDate ? trade.date : current.endDate,
    });
  });

  let bestWeekPnL = 0;
  let bestWeekDate = '';
  let bestWeekTrades: Trade[] = [];

  weeklyPnL.forEach((data, week) => {
    if (data.pnl > bestWeekPnL) {
      bestWeekPnL = data.pnl;
      bestWeekDate = data.endDate;
      bestWeekTrades = data.trades;
    }
  });

  const bestWeek: PersonalBest = {
    id: 'best-week',
    title: 'Best Week',
    description: `${bestWeekTrades.length} trade${bestWeekTrades.length !== 1 ? 's' : ''}`,
    value: bestWeekPnL,
    formattedValue: `${bestWeekPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    date: bestWeekDate,
    isRecent: bestWeekDate ? new Date(bestWeekDate) >= thirtyDaysAgo : false,
    icon: 'Calendar',
    trades: bestWeekTrades,
    category: 'volume',
    badge: bestWeekDate && new Date(bestWeekDate) >= thirtyDaysAgo ? '✨ New' : undefined,
  };

  // 6. Best Monthly Performance
  const monthlyPnL = new Map<string, { pnl: number; trades: Trade[] }>();
  
  trades.forEach(trade => {
    const monthKey = trade.date.substring(0, 7); // YYYY-MM
    const current = monthlyPnL.get(monthKey) || { pnl: 0, trades: [] };
    monthlyPnL.set(monthKey, {
      pnl: current.pnl + trade.pnl,
      trades: [...current.trades, trade],
    });
  });

  let bestMonthPnL = 0;
  let bestMonthKey = '';
  let bestMonthTrades: Trade[] = [];

  monthlyPnL.forEach((data, month) => {
    if (data.pnl > bestMonthPnL) {
      bestMonthPnL = data.pnl;
      bestMonthKey = month;
      bestMonthTrades = data.trades;
    }
  });

  // Format month for display
  const bestMonthDate = bestMonthKey ? `${bestMonthKey}-01` : '';
  const bestMonthFormatted = bestMonthKey 
    ? new Date(bestMonthKey + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

  const bestMonth: PersonalBest = {
    id: 'best-month',
    title: 'Best Month',
    description: bestMonthFormatted,
    value: bestMonthPnL,
    formattedValue: `${bestMonthPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    date: bestMonthDate,
    isRecent: bestMonthDate ? new Date(bestMonthDate) >= thirtyDaysAgo : false,
    icon: 'Award',
    trades: bestMonthTrades,
    category: 'volume',
    badge: bestMonthDate && new Date(bestMonthDate) >= thirtyDaysAgo ? '✨ New' : undefined,
  };

  // 7. Longest Winning Streak (consecutive winning trades, not days)
  let longestWinStreak = 0;
  let currentWinStreak = 0;
  let winStreakEndDate = '';
  let winStreakTrades: Trade[] = [];
  let tempStreakTrades: Trade[] = [];
  
  const sortedTrades = [...trades].sort((a, b) => a.date.localeCompare(b.date));
  
  sortedTrades.forEach(trade => {
    if (trade.pnl > 0) {
      currentWinStreak++;
      tempStreakTrades.push(trade);
      
      if (currentWinStreak > longestWinStreak) {
        longestWinStreak = currentWinStreak;
        winStreakEndDate = trade.date;
        winStreakTrades = [...tempStreakTrades];
      }
    } else {
      currentWinStreak = 0;
      tempStreakTrades = [];
    }
  });

  const longestWinningStreak: PersonalBest | null = longestWinStreak >= 3 ? {
    id: 'longest-win-streak',
    title: 'Longest Win Streak',
    description: `${longestWinStreak} consecutive wins`,
    value: longestWinStreak,
    formattedValue: `${longestWinStreak} wins`,
    date: winStreakEndDate,
    isRecent: winStreakEndDate ? new Date(winStreakEndDate) >= thirtyDaysAgo : false,
    icon: 'Flame',
    trades: winStreakTrades,
    category: 'streak',
    badge: winStreakEndDate && new Date(winStreakEndDate) >= thirtyDaysAgo ? '🔥 Hot' : undefined,
  } : null;

  // 8. Best Average Per Trade (for a day with multiple trades)
  let bestAvgPnLPerTrade = 0;
  let bestAvgDate = '';
  let bestAvgTrades: Trade[] = [];
  
  dailyPnL.forEach((data, date) => {
    if (data.trades.length >= 2) { // At least 2 trades
      const avgPnL = data.pnl / data.trades.length;
      if (avgPnL > bestAvgPnLPerTrade) {
        bestAvgPnLPerTrade = avgPnL;
        bestAvgDate = date;
        bestAvgTrades = data.trades;
      }
    }
  });

  const bestAverageTrade: PersonalBest | null = bestAvgPnLPerTrade > 0 ? {
    id: 'best-avg-trade',
    title: 'Best Avg/Trade',
    description: `${bestAvgTrades.length} trades`,
    value: bestAvgPnLPerTrade,
    formattedValue: `${bestAvgPnLPerTrade.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    date: bestAvgDate,
    isRecent: bestAvgDate ? new Date(bestAvgDate) >= thirtyDaysAgo : false,
    icon: 'BarChart3',
    trades: bestAvgTrades,
    category: 'consistency',
    badge: bestAvgDate && new Date(bestAvgDate) >= thirtyDaysAgo ? '✨ New' : undefined,
  } : null;

  // 9. Best Recovery (biggest single-day recovery from previous loss)
  let bestRecoveryAmount = 0;
  let bestRecoveryDate = '';
  let bestRecoveryTrades: Trade[] = [];
  let previousDayLoss = 0;
  
  const sortedDates = Array.from(dailyPnL.keys()).sort();
  
  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = sortedDates[i - 1];
    const currDate = sortedDates[i];
    const prevPnL = dailyPnL.get(prevDate)?.pnl || 0;
    const currPnL = dailyPnL.get(currDate)?.pnl || 0;
    
    // Check if previous day was a loss and current day is a win
    if (prevPnL < 0 && currPnL > 0) {
      const recovery = currPnL; // The amount recovered
      if (recovery > bestRecoveryAmount) {
        bestRecoveryAmount = recovery;
        bestRecoveryDate = currDate;
        bestRecoveryTrades = dailyPnL.get(currDate)?.trades || [];
        previousDayLoss = Math.abs(prevPnL);
      }
    }
  }

  const bestRecovery: PersonalBest | null = bestRecoveryAmount > 0 ? {
    id: 'best-recovery',
    title: 'Best Comeback',
    description: `After ${previousDayLoss.toFixed(0)} loss`,
    value: bestRecoveryAmount,
    formattedValue: `${bestRecoveryAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    date: bestRecoveryDate,
    isRecent: bestRecoveryDate ? new Date(bestRecoveryDate) >= thirtyDaysAgo : false,
    icon: 'TrendingUp',
    trades: bestRecoveryTrades,
    category: 'performance',
    badge: bestRecoveryDate && new Date(bestRecoveryDate) >= thirtyDaysAgo ? '💪 Strong' : undefined,
  } : null;

  return [
    bestSingleTrade,
    bestTradingDay,
    bestRRTrade,
    bestWinRate > 0 ? bestWinRatePeriod : null,
    longestWinningStreak,
    bestAverageTrade,
    bestRecovery,
    bestWeekPnL > 0 ? bestWeek : null,
    bestMonthPnL > 0 ? bestMonth : null,
  ].filter((best): best is PersonalBest => best !== null);
}
