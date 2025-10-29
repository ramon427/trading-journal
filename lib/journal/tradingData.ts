import { Trade, JournalEntry, DailyData, Statistics } from '@/types/journal/trading';
import { TradeFilters } from '@/components/journal/TradeFilter';
import { isTradeClosed } from '@/lib/journal/formatters';
import * as tradesRepo from '@/lib/journal/repositories/trades';
import * as journalRepo from '@/lib/journal/repositories/journal';

/**
 * Load all trades from Postgres
 * Note: Now async - call with await in server components or useEffect in client components
 */
export const loadTrades = async (): Promise<Trade[]> => {
  return await tradesRepo.loadTrades();
};

/**
 * Save trades to Postgres
 * Note: Now async - call with await
 */
export const saveTrades = async (trades: Trade[]): Promise<void> => {
  await tradesRepo.saveTrades(trades);
};

/**
 * Load all journal entries from Postgres
 * Note: Now async - call with await in server components or useEffect in client components
 */
export const loadJournalEntries = async (): Promise<JournalEntry[]> => {
  return await journalRepo.loadJournalEntries();
};

/**
 * Save journal entries to Postgres
 * Note: Now async - call with await
 */
export const saveJournalEntries = async (entries: JournalEntry[]): Promise<void> => {
  await journalRepo.saveJournalEntries(entries);
};

export const calculateStatistics = (trades: Trade[], useRR: boolean = false): Statistics => {
  // Filter out open trades - only calculate stats for closed trades
  // Use the safe isTradeClosed helper that handles legacy data and zero exitPrice
  const closedTrades = trades.filter(t => isTradeClosed(t));
  
  if (closedTrades.length === 0) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      totalPnl: 0,
      totalRR: 0,
      avgWin: 0,
      avgLoss: 0,
      avgRR: 0,
      bestRR: 0,
      largestWin: 0,
      largestLoss: 0,
      profitFactor: 0,
      avgDailyPnl: 0,
      avgDailyRR: 0,
      bestDay: 0,
      worstDay: 0,
      bestDayRR: 0,
      worstDayRR: 0,
      currentStreak: 0,
      longestWinStreak: 0,
      longestLoseStreak: 0,
      expectancy: 0,
      expectancyRR: 0,
      maxDrawdown: 0,
      maxDrawdownRR: 0,
      maxDrawdownDuration: 0,
      recoveryTime: 0,
      performanceByDay: {},
      performanceBySetup: {},
    };
  }

  const winningTrades = closedTrades.filter(t => t.pnl > 0);
  const losingTrades = closedTrades.filter(t => t.pnl < 0);
  
  const totalPnl = closedTrades.reduce((sum, t) => sum + t.pnl, 0);
  const totalWins = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
  const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
  
  // Calculate R:R totals
  const totalRR = closedTrades.reduce((sum, t) => sum + (t.rr || 0), 0);
  const totalWinsRR = winningTrades.reduce((sum, t) => sum + (t.rr || 0), 0);
  const totalLossesRR = Math.abs(losingTrades.reduce((sum, t) => sum + (t.rr || 0), 0));
  
  // Group by date for P&L (use exitDate if available, otherwise date)
  const dailyPnl = new Map<string, number>();
  const dailyRR = new Map<string, number>();
  
  closedTrades.forEach(trade => {
    const tradeDate = trade.exitDate || trade.date;
    const currentPnl = dailyPnl.get(tradeDate) || 0;
    dailyPnl.set(tradeDate, currentPnl + trade.pnl);
    
    const currentRR = dailyRR.get(tradeDate) || 0;
    dailyRR.set(tradeDate, currentRR + (trade.rr || 0));
  });
  
  const dailyPnlValues = Array.from(dailyPnl.values());
  const dailyRRValues = Array.from(dailyRR.values());
  const tradingDays = dailyPnl.size;
  
  // Calculate streaks
  const sortedTrades = [...closedTrades].sort((a, b) => {
    const aDate = a.exitDate || a.date;
    const bDate = b.exitDate || b.date;
    return aDate.localeCompare(bDate);
  });
  let currentStreak = 0;
  let longestWinStreak = 0;
  let longestLoseStreak = 0;
  let currentWinStreak = 0;
  let currentLoseStreak = 0;
  
  sortedTrades.forEach(trade => {
    if (trade.pnl > 0) {
      currentWinStreak++;
      currentLoseStreak = 0;
      currentStreak = currentWinStreak;
      longestWinStreak = Math.max(longestWinStreak, currentWinStreak);
    } else if (trade.pnl < 0) {
      currentLoseStreak++;
      currentWinStreak = 0;
      currentStreak = -currentLoseStreak;
      longestLoseStreak = Math.max(longestLoseStreak, currentLoseStreak);
    }
  });
  
  // Calculate advanced metrics
  const expectancy = closedTrades.length > 0 ? totalPnl / closedTrades.length : 0;
  const expectancyRR = closedTrades.length > 0 ? totalRR / closedTrades.length : 0;
  
  // Max drawdown calculation - inline cumulative PnL calculation
  const sortedForCumulative = [...closedTrades].sort((a, b) => {
    const aDate = a.exitDate || a.date;
    const bDate = b.exitDate || b.date;
    return aDate.localeCompare(bDate);
  });
  const cumulativePnl: { date: string; pnl: number }[] = [];
  const cumulativeRR: { date: string; rr: number }[] = [];
  let cumulativeTotal = 0;
  let cumulativeTotalRR = 0;
  const dailyPnlForCumulative = new Map<string, number>();
  const dailyRRForCumulative = new Map<string, number>();
  sortedForCumulative.forEach(trade => {
    const tradeDate = trade.exitDate || trade.date;
    const current = dailyPnlForCumulative.get(tradeDate) || 0;
    dailyPnlForCumulative.set(tradeDate, current + trade.pnl);
    
    const currentRR = dailyRRForCumulative.get(tradeDate) || 0;
    dailyRRForCumulative.set(tradeDate, currentRR + (trade.rr || 0));
  });
  Array.from(dailyPnlForCumulative.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([date, pnl]) => {
      cumulativeTotal += pnl;
      cumulativePnl.push({ date, pnl: cumulativeTotal });
    });
  Array.from(dailyRRForCumulative.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([date, rr]) => {
      cumulativeTotalRR += rr;
      cumulativeRR.push({ date, rr: cumulativeTotalRR });
    });
  let maxDrawdown = 0;
  let maxDrawdownRR = 0;
  let peak = 0;
  let peakRR = 0;
  let drawdownStart = '';
  let drawdownEnd = '';
  let maxDrawdownDuration = 0;
  
  cumulativePnl.forEach((point, index) => {
    if (point.pnl > peak) {
      peak = point.pnl;
      drawdownStart = point.date;
    }
    const drawdown = peak - point.pnl;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      drawdownEnd = point.date;
    }
  });
  
  // Calculate RR drawdown
  cumulativeRR.forEach((point, index) => {
    if (point.rr > peakRR) {
      peakRR = point.rr;
    }
    const drawdownRR = peakRR - point.rr;
    if (drawdownRR > maxDrawdownRR) {
      maxDrawdownRR = drawdownRR;
    }
  });
  
  // Calculate drawdown duration
  if (drawdownStart && drawdownEnd) {
    const start = new Date(drawdownStart);
    const end = new Date(drawdownEnd);
    maxDrawdownDuration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }
  
  // Recovery time calculation
  const losses = sortedTrades.filter(t => t.pnl < 0);
  let totalRecoveryDays = 0;
  let recoveryCount = 0;
  
  losses.forEach((loss, index) => {
    const lossDate = new Date(loss.date);
    let recovered = false;
    let recoveryDays = 0;
    
    for (let i = index + 1; i < sortedTrades.length; i++) {
      const nextTrade = sortedTrades[i];
      const nextDate = new Date(nextTrade.date);
      recoveryDays = Math.ceil((nextDate.getTime() - lossDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (nextTrade.pnl >= Math.abs(loss.pnl)) {
        recovered = true;
        totalRecoveryDays += recoveryDays;
        recoveryCount++;
        break;
      }
    }
  });
  
  const recoveryTime = recoveryCount > 0 ? totalRecoveryDays / recoveryCount : 0;
  
  // Performance by day of week
  const performanceByDay: { [key: string]: { trades: number; pnl: number; rr: number; winRate: number; wins: number } } = {
    'Monday': { trades: 0, pnl: 0, rr: 0, winRate: 0, wins: 0 },
    'Tuesday': { trades: 0, pnl: 0, rr: 0, winRate: 0, wins: 0 },
    'Wednesday': { trades: 0, pnl: 0, rr: 0, winRate: 0, wins: 0 },
    'Thursday': { trades: 0, pnl: 0, rr: 0, winRate: 0, wins: 0 },
    'Friday': { trades: 0, pnl: 0, rr: 0, winRate: 0, wins: 0 },
  };
  
  closedTrades.forEach(trade => {
    const tradeDate = trade.exitDate || trade.date;
    const date = new Date(tradeDate);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    if (performanceByDay[dayName]) {
      performanceByDay[dayName].trades++;
      performanceByDay[dayName].pnl += trade.pnl;
      performanceByDay[dayName].rr += (trade.rr || 0);
      if (trade.pnl > 0) performanceByDay[dayName].wins++;
    }
  });
  
  Object.keys(performanceByDay).forEach(day => {
    const data = performanceByDay[day];
    data.winRate = data.trades > 0 ? (data.wins / data.trades) * 100 : 0;
  });
  
  // Performance by setup
  const performanceBySetup: { [key: string]: { trades: number; pnl: number; rr: number; winRate: number; wins: number } } = {};
  
  closedTrades.forEach(trade => {
    if (trade.setup) {
      if (!performanceBySetup[trade.setup]) {
        performanceBySetup[trade.setup] = { trades: 0, pnl: 0, rr: 0, winRate: 0, wins: 0 };
      }
      performanceBySetup[trade.setup].trades++;
      performanceBySetup[trade.setup].pnl += trade.pnl;
      performanceBySetup[trade.setup].rr += (trade.rr || 0);
      if (trade.pnl > 0) performanceBySetup[trade.setup].wins++;
    }
  });
  
  Object.keys(performanceBySetup).forEach(setup => {
    const data = performanceBySetup[setup];
    data.winRate = data.trades > 0 ? (data.wins / data.trades) * 100 : 0;
  });
  
  return {
    totalTrades: closedTrades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate: closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0,
    totalPnl,
    totalRR,
    avgWin: winningTrades.length > 0 ? totalWins / winningTrades.length : 0,
    avgWinRR: winningTrades.length > 0 ? totalWinsRR / winningTrades.length : 0,
    avgLoss: losingTrades.length > 0 ? totalLosses / losingTrades.length : 0,
    avgLossRR: losingTrades.length > 0 ? totalLossesRR / losingTrades.length : 0,
    avgRR: closedTrades.length > 0 ? totalRR / closedTrades.length : 0,
    bestRR: closedTrades.length > 0 ? Math.max(...closedTrades.map(t => t.rr || 0)) : 0,
    largestWin: winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.pnl)) : 0,
    largestWinRR: winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.rr || 0)) : 0,
    largestLoss: losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.pnl)) : 0,
    largestLossRR: losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.rr || 0)) : 0,
    profitFactor: totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0,
    profitFactorRR: totalLossesRR > 0 ? totalWinsRR / totalLossesRR : totalWinsRR > 0 ? Infinity : 0,
    avgDailyPnl: tradingDays > 0 ? totalPnl / tradingDays : 0,
    avgDailyRR: tradingDays > 0 ? totalRR / tradingDays : 0,
    bestDay: dailyPnlValues.length > 0 ? Math.max(...dailyPnlValues) : 0,
    bestDayRR: dailyRRValues.length > 0 ? Math.max(...dailyRRValues) : 0,
    worstDay: dailyPnlValues.length > 0 ? Math.min(...dailyPnlValues) : 0,
    worstDayRR: dailyRRValues.length > 0 ? Math.min(...dailyRRValues) : 0,
    currentStreak,
    longestWinStreak,
    longestLoseStreak,
    expectancy,
    expectancyRR,
    maxDrawdown,
    maxDrawdownRR,
    maxDrawdownDuration,
    recoveryTime,
    performanceByDay,
    performanceBySetup,
  };
};

export const getDailyData = (trades: Trade[], journalEntries: JournalEntry[]): Map<string, DailyData> => {
  const dailyMap = new Map<string, DailyData>();
  
  // Add trades
  trades.forEach(trade => {
    if (!dailyMap.has(trade.date)) {
      dailyMap.set(trade.date, {
        date: trade.date,
        trades: [],
        totalPnl: 0,
      });
    }
    const day = dailyMap.get(trade.date)!;
    day.trades.push(trade);
    day.totalPnl += trade.pnl;
  });
  
  // Add journal entries
  journalEntries.forEach(entry => {
    if (!dailyMap.has(entry.date)) {
      dailyMap.set(entry.date, {
        date: entry.date,
        trades: [],
        totalPnl: 0,
      });
    }
    dailyMap.get(entry.date)!.journalEntry = entry;
  });
  
  return dailyMap;
};

export const getCumulativePnL = (trades: Trade[]): { date: string; pnl: number }[] => {
  // Only include closed trades
  const closedTrades = trades.filter(t => t.status === 'closed' || (t.exitPrice !== null && t.exitPrice !== undefined));
  const sortedTrades = [...closedTrades].sort((a, b) => {
    const aDate = a.exitDate || a.date;
    const bDate = b.exitDate || b.date;
    return aDate.localeCompare(bDate);
  });
  const cumulative: { date: string; pnl: number }[] = [];
  let total = 0;
  
  const dailyPnl = new Map<string, number>();
  sortedTrades.forEach(trade => {
    const tradeDate = trade.exitDate || trade.date;
    const current = dailyPnl.get(tradeDate) || 0;
    dailyPnl.set(tradeDate, current + trade.pnl);
  });
  
  Array.from(dailyPnl.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([date, pnl]) => {
      total += pnl;
      cumulative.push({ date, pnl: total });
    });
  
  return cumulative;
};

export const getAvailableSymbols = (trades: Trade[]): string[] => {
  const symbols = new Set<string>();
  trades.forEach(trade => {
    if (trade.symbol) symbols.add(trade.symbol);
  });
  return Array.from(symbols).sort();
};

export const getAvailableSetups = (trades: Trade[]): string[] => {
  const setups = new Set<string>();
  trades.forEach(trade => {
    if (trade.setup) setups.add(trade.setup);
  });
  return Array.from(setups).sort();
};

export const getAvailableTags = (trades: Trade[]): string[] => {
  const tags = new Set<string>();
  trades.forEach(trade => {
    if (trade.tags && Array.isArray(trade.tags)) {
      trade.tags.forEach(tag => tags.add(tag));
    }
  });
  return Array.from(tags).sort();
};

export const filterTrades = (trades: Trade[], filters: TradeFilters): Trade[] => {
  let filtered = [...trades];
  
  // Period filter
  if (filters.period && filters.period !== 'all') {
    const now = new Date();
    const days = parseInt(filters.period.replace('d', ''));
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    filtered = filtered.filter(trade => new Date(trade.date) >= cutoffDate);
  }
  
  // Date range filter
  if (filters.dateFrom) {
    filtered = filtered.filter(trade => trade.date >= filters.dateFrom!);
  }
  if (filters.dateTo) {
    filtered = filtered.filter(trade => trade.date <= filters.dateTo!);
  }
  
  // Symbol filter
  if (filters.symbol) {
    filtered = filtered.filter(trade => trade.symbol === filters.symbol);
  }
  
  // Setup filter
  if (filters.setup) {
    filtered = filtered.filter(trade => trade.setup === filters.setup);
  }
  
  // Tag filter
  if (filters.tag) {
    filtered = filtered.filter(trade => trade.tags?.includes(filters.tag!));
  }
  
  return filtered;
};
