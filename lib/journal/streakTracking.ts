import { Trade, JournalEntry } from '../types/trading';

export interface StreakData {
  currentWinningStreak: number;
  bestWinningStreak: number;
  currentLosingStreak: number;
  longestLosingStreak: number;
  tradingDaysStreak: number;
  bestTradingDaysStreak: number;
  journalStreak: number;
  bestJournalStreak: number;
  systemAdherenceStreak: number;
  bestSystemAdherenceStreak: number;
}

export function calculateStreaks(
  trades: Trade[], 
  journalEntries: JournalEntry[],
  displayMode: 'pnl' | 'rr'
): StreakData {
  // Calculate winning/losing streaks based on daily P&L
  const dailyPnL = new Map<string, number>();
  trades.forEach(trade => {
    const current = dailyPnL.get(trade.date) || 0;
    const value = displayMode === 'rr' ? (trade.rr || 0) : trade.pnl;
    dailyPnL.set(trade.date, current + value);
  });
  
  const sortedDates = Array.from(dailyPnL.entries())
    .sort((a, b) => b[0].localeCompare(a[0])); // Descending

  // Current winning/losing streak
  let currentWinningStreak = 0;
  let currentLosingStreak = 0;
  
  if (sortedDates.length > 0) {
    const firstDayPnL = sortedDates[0][1];
    const isCurrentlyWinning = firstDayPnL > 0;
    
    for (const [date, pnl] of sortedDates) {
      if (isCurrentlyWinning && pnl > 0) {
        currentWinningStreak++;
      } else if (!isCurrentlyWinning && pnl <= 0) {
        currentLosingStreak++;
      } else {
        break;
      }
    }
  }

  // Best winning/losing streaks
  let bestWinningStreak = 0;
  let longestLosingStreak = 0;
  let tempWinStreak = 0;
  let tempLoseStreak = 0;
  
  const chronologicalDates = Array.from(dailyPnL.entries())
    .sort((a, b) => a[0].localeCompare(b[0])); // Ascending
  
  for (const [date, pnl] of chronologicalDates) {
    if (pnl > 0) {
      tempWinStreak++;
      bestWinningStreak = Math.max(bestWinningStreak, tempWinStreak);
      tempLoseStreak = 0;
    } else {
      tempLoseStreak++;
      longestLosingStreak = Math.max(longestLosingStreak, tempLoseStreak);
      tempWinStreak = 0;
    }
  }

  // Trading days streak (consecutive days with trades)
  const allTradeDates = Array.from(new Set(trades.map(t => t.date)))
    .sort((a, b) => b.localeCompare(a)); // Descending
  
  let tradingDaysStreak = 0;
  let bestTradingDaysStreak = 0;
  let tempTradingStreak = 0;
  
  // Calculate current trading days streak
  if (allTradeDates.length > 0) {
    let expectedDate = new Date(allTradeDates[0]);
    
    for (const dateStr of allTradeDates) {
      const currentDate = new Date(dateStr);
      
      // Skip weekends for consecutive check
      while (expectedDate.getDay() === 0 || expectedDate.getDay() === 6) {
        expectedDate.setDate(expectedDate.getDate() - 1);
      }
      
      if (dateStr === expectedDate.toISOString().split('T')[0]) {
        tradingDaysStreak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        break;
      }
    }
  }
  
  // Calculate best trading days streak
  const sortedTradeDates = allTradeDates.sort((a, b) => a.localeCompare(b)); // Ascending
  
  for (let i = 0; i < sortedTradeDates.length; i++) {
    tempTradingStreak++;
    
    if (i < sortedTradeDates.length - 1) {
      const current = new Date(sortedTradeDates[i]);
      let next = new Date(sortedTradeDates[i + 1]);
      
      // Move to next weekday
      let expectedNext = new Date(current);
      expectedNext.setDate(expectedNext.getDate() + 1);
      while (expectedNext.getDay() === 0 || expectedNext.getDay() === 6) {
        expectedNext.setDate(expectedNext.getDate() + 1);
      }
      
      if (sortedTradeDates[i + 1] !== expectedNext.toISOString().split('T')[0]) {
        bestTradingDaysStreak = Math.max(bestTradingDaysStreak, tempTradingStreak);
        tempTradingStreak = 0;
      }
    } else {
      bestTradingDaysStreak = Math.max(bestTradingDaysStreak, tempTradingStreak);
    }
  }

  // Journal streak (consecutive days with journal entries)
  const allJournalDates = journalEntries.map(j => j.date)
    .sort((a, b) => b.localeCompare(a)); // Descending
  
  let journalStreak = 0;
  let bestJournalStreak = 0;
  let tempJournalStreak = 0;
  
  // Calculate current journal streak
  if (allJournalDates.length > 0) {
    let expectedDate = new Date(allJournalDates[0]);
    
    for (const dateStr of allJournalDates) {
      if (dateStr === expectedDate.toISOString().split('T')[0]) {
        journalStreak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        break;
      }
    }
  }
  
  // Calculate best journal streak
  const sortedJournalDates = allJournalDates.sort((a, b) => a.localeCompare(b)); // Ascending
  
  for (let i = 0; i < sortedJournalDates.length; i++) {
    tempJournalStreak++;
    
    if (i < sortedJournalDates.length - 1) {
      const current = new Date(sortedJournalDates[i]);
      const next = new Date(sortedJournalDates[i + 1]);
      
      const expectedNext = new Date(current);
      expectedNext.setDate(expectedNext.getDate() + 1);
      
      if (sortedJournalDates[i + 1] !== expectedNext.toISOString().split('T')[0]) {
        bestJournalStreak = Math.max(bestJournalStreak, tempJournalStreak);
        tempJournalStreak = 0;
      }
    } else {
      bestJournalStreak = Math.max(bestJournalStreak, tempJournalStreak);
    }
  }

  // System adherence streak (consecutive days following system)
  const systemDates = journalEntries
    .filter(j => j.followedSystem === true)
    .map(j => j.date)
    .sort((a, b) => b.localeCompare(a)); // Descending
  
  let systemAdherenceStreak = 0;
  let bestSystemAdherenceStreak = 0;
  let tempSystemStreak = 0;
  
  // Calculate current system adherence streak
  if (systemDates.length > 0) {
    let expectedDate = new Date(systemDates[0]);
    
    for (const dateStr of systemDates) {
      if (dateStr === expectedDate.toISOString().split('T')[0]) {
        systemAdherenceStreak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        break;
      }
    }
  }
  
  // Calculate best system adherence streak
  const sortedSystemDates = systemDates.sort((a, b) => a.localeCompare(b)); // Ascending
  
  for (let i = 0; i < sortedSystemDates.length; i++) {
    tempSystemStreak++;
    
    if (i < sortedSystemDates.length - 1) {
      const current = new Date(sortedSystemDates[i]);
      const next = new Date(sortedSystemDates[i + 1]);
      
      const expectedNext = new Date(current);
      expectedNext.setDate(expectedNext.getDate() + 1);
      
      if (sortedSystemDates[i + 1] !== expectedNext.toISOString().split('T')[0]) {
        bestSystemAdherenceStreak = Math.max(bestSystemAdherenceStreak, tempSystemStreak);
        tempSystemStreak = 0;
      }
    } else {
      bestSystemAdherenceStreak = Math.max(bestSystemAdherenceStreak, tempSystemStreak);
    }
  }

  return {
    currentWinningStreak,
    bestWinningStreak,
    currentLosingStreak,
    longestLosingStreak,
    tradingDaysStreak,
    bestTradingDaysStreak,
    journalStreak,
    bestJournalStreak,
    systemAdherenceStreak,
    bestSystemAdherenceStreak,
  };
}
