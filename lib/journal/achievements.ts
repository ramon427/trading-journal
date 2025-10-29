import { Trade, Statistics, JournalEntry } from '../types/trading';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  progress: number; // 0-100
  current: number;
  target: number;
  formatValue?: (value: number) => string;
}

export function calculateAchievements(trades: Trade[], stats: Statistics, journalEntries?: JournalEntry[]): Achievement[] {
  // 1. First 10 Trades
  const tradeCount = stats.totalTrades;
  const firstTenTrades: Achievement = {
    id: 'trades-10',
    title: 'First 10 Trades',
    description: 'Start your trading journey',
    icon: 'Activity',
    isUnlocked: tradeCount >= 10,
    progress: Math.min((tradeCount / 10) * 100, 100),
    current: tradeCount,
    target: 10,
  };

  // 2. 50 Trades Milestone
  const fiftyTrades: Achievement = {
    id: 'trades-50',
    title: '50 Trades Logged',
    description: 'Building experience and data',
    icon: 'Activity',
    isUnlocked: tradeCount >= 50,
    progress: Math.min((tradeCount / 50) * 100, 100),
    current: tradeCount,
    target: 50,
  };

  // 3. 100 Trades Club
  const hundredTrades: Achievement = {
    id: 'trades-100',
    title: '100 Trades Club',
    description: 'Significant trading experience',
    icon: 'Trophy',
    isUnlocked: tradeCount >= 100,
    progress: Math.min((tradeCount / 100) * 100, 100),
    current: tradeCount,
    target: 100,
  };

  // 4. First Profitable Month
  const hasProfitableMonth = (() => {
    const monthlyPnL = new Map<string, number>();
    
    trades.forEach(trade => {
      const monthKey = trade.date.substring(0, 7); // YYYY-MM
      const current = monthlyPnL.get(monthKey) || 0;
      monthlyPnL.set(monthKey, current + trade.pnl);
    });
    
    return Array.from(monthlyPnL.values()).some(pnl => pnl > 0);
  })();

  const profitableMonthMilestone: Achievement = {
    id: 'profitable-month',
    title: 'Profitable Month',
    description: 'First month in the green',
    icon: 'TrendingUp',
    isUnlocked: hasProfitableMonth,
    progress: hasProfitableMonth ? 100 : (stats.totalPnl > 0 ? 50 : 0),
    current: hasProfitableMonth ? 1 : 0,
    target: 1,
  };

  // 5. Consistent Journaling (30 entries)
  const journalCount = journalEntries?.length || 0;
  const consistentJournaling: Achievement = {
    id: 'journal-30',
    title: 'Consistent Journaler',
    description: 'Log 30 daily journal entries',
    icon: 'Calendar',
    isUnlocked: journalCount >= 30,
    progress: Math.min((journalCount / 30) * 100, 100),
    current: journalCount,
    target: 30,
  };

  // 6. System Follower (10 consecutive days following system)
  const consecutiveSystemDays = (() => {
    if (!journalEntries || journalEntries.length === 0) return 0;
    
    const sortedEntries = [...journalEntries]
      .filter(e => e.didTrade) // Only count trading days
      .sort((a, b) => b.date.localeCompare(a.date));
    
    let streak = 0;
    for (const entry of sortedEntries) {
      if (entry.followedSystem) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  })();

  const systemFollower: Achievement = {
    id: 'system-10',
    title: 'System Discipline',
    description: '10 consecutive trading days following your system',
    icon: 'Target',
    isUnlocked: consecutiveSystemDays >= 10,
    progress: Math.min((consecutiveSystemDays / 10) * 100, 100),
    current: consecutiveSystemDays,
    target: 10,
  };

  // 7. Win Rate Achievement (60%+ with 20+ trades)
  const hasGoodWinRate = stats.totalTrades >= 20 && stats.winRate >= 60;
  const winRateAchievement: Achievement = {
    id: 'winrate-60',
    title: 'Consistent Winner',
    description: '60%+ win rate with 20+ trades',
    icon: 'Award',
    isUnlocked: hasGoodWinRate,
    progress: stats.totalTrades < 20 
      ? Math.min((stats.totalTrades / 20) * 100, 100)
      : Math.min((stats.winRate / 60) * 100, 100),
    current: stats.totalTrades >= 20 ? stats.winRate : stats.totalTrades,
    target: stats.totalTrades >= 20 ? 60 : 20,
    formatValue: stats.totalTrades >= 20 
      ? (value: number) => `${value.toFixed(1)}%`
      : undefined,
  };

  // 8. Positive Profit Factor (with 30+ trades)
  const hasGoodProfitFactor = stats.totalTrades >= 30 && stats.profitFactor >= 2;
  const profitFactorAchievement: Achievement = {
    id: 'pf-2',
    title: 'Strong Edge',
    description: '2.0+ profit factor with 30+ trades',
    icon: 'Zap',
    isUnlocked: hasGoodProfitFactor,
    progress: stats.totalTrades < 30
      ? Math.min((stats.totalTrades / 30) * 100, 100)
      : Math.min((stats.profitFactor / 2) * 100, 100),
    current: stats.totalTrades >= 30 ? stats.profitFactor : stats.totalTrades,
    target: stats.totalTrades >= 30 ? 2 : 30,
    formatValue: stats.totalTrades >= 30
      ? (value: number) => value.toFixed(2)
      : undefined,
  };

  return [
    firstTenTrades,
    fiftyTrades,
    hundredTrades,
    profitableMonthMilestone,
    consistentJournaling,
    systemFollower,
    winRateAchievement,
    profitFactorAchievement,
  ];
}
