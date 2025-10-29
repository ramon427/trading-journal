import { Trade, JournalEntry } from '../types/trading';
import { calculateStreaks } from './streakTracking';

export interface Task {
  id: string;
  type: 'open-trade' | 'journal' | 'reflection' | 'streak' | 'incomplete-data';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: {
    label: string;
    route: { type: string; tradeId?: string; date?: string };
  };
  count?: number; // For tasks with multiple items
  relatedItems?: Array<{ id: string; label: string; missingFields?: string[] }>;
  missingFields?: string[]; // What specific fields are missing
  badges?: Array<{ label: string; variant: 'default' | 'warning' | 'error' }>;
}

// Helper function to detect missing fields in a trade
function getMissingTradeFields(trade: Trade): string[] {
  const missing: string[] = [];
  
  if (!trade.exitPrice && trade.status === 'closed') missing.push('Exit Price');
  if (!trade.exitTime && trade.status === 'closed') missing.push('Exit Time');
  if (!trade.notes) missing.push('Notes');
  if (!trade.setup) missing.push('Setup');
  if (!trade.tags || trade.tags.length === 0) missing.push('Tags');
  if (!trade.target) missing.push('Target');
  if (!trade.stopLoss) missing.push('Stop Loss');
  if (!trade.entryTime) missing.push('Entry Time');
  if (!trade.screenshotBefore) missing.push('Entry Screenshot');
  if (!trade.screenshotAfter && trade.status === 'closed') missing.push('Exit Screenshot');
  
  return missing;
}

// Helper function to detect missing fields in a journal entry
function getMissingJournalFields(entry: JournalEntry | undefined): string[] {
  if (!entry) return ['Entire Entry'];
  
  const missing: string[] = [];
  
  if (!entry.notes || entry.notes.trim() === '') missing.push('Notes');
  if (!entry.lessonsLearned || entry.lessonsLearned.trim() === '') missing.push('Lessons');
  if (!entry.marketConditions || entry.marketConditions.trim() === '') missing.push('Market Conditions');
  if (entry.mood === 'neutral') missing.push('Mood');
  
  return missing;
}

export function detectTasks(
  trades: Trade[],
  journalEntries: JournalEntry[],
  displayMode: 'pnl' | 'rr'
): Task[] {
  const tasks: Task[] = [];
  const today = new Date().toISOString().split('T')[0];

  // 1. Open trades without exit prices
  const openTrades = trades.filter(t => t.status === 'open');
  if (openTrades.length > 0) {
    const tradesNeedingExit = openTrades.filter(t => !t.exitPrice);
    
    if (tradesNeedingExit.length > 0) {
      tasks.push({
        id: 'close-open-trades',
        type: 'open-trade',
        priority: 'high',
        title: `${tradesNeedingExit.length} open trade${tradesNeedingExit.length > 1 ? 's need' : ' needs'} closing`,
        description: tradesNeedingExit.map(t => `${t.symbol} ${t.type}`).slice(0, 2).join(' • '),
        action: {
          label: 'Add Exit',
          route: { type: 'add-trade', tradeId: tradesNeedingExit[0].id }
        },
        count: tradesNeedingExit.length,
        badges: [
          { label: 'Exit Price', variant: 'error' },
          { label: 'Exit Time', variant: 'error' }
        ],
        relatedItems: tradesNeedingExit.map(t => ({
          id: t.id,
          label: `${t.symbol} ${t.type}`,
          missingFields: ['Exit Price', 'Exit Time']
        }))
      });
    }
  }

  // 2. Trades with incomplete data
  const recentTrades = trades
    .filter(t => t.status === 'closed')
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10); // Last 10 trades

  const tradesWithMissingData = recentTrades
    .map(t => ({
      trade: t,
      missing: getMissingTradeFields(t)
    }))
    .filter(item => item.missing.length > 0);

  if (tradesWithMissingData.length > 0) {
    // Count missing fields across all trades
    const allMissingFields = tradesWithMissingData.reduce((acc, item) => {
      item.missing.forEach(field => {
        acc[field] = (acc[field] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    // Get top 3 most common missing fields
    const topMissing = Object.entries(allMissingFields)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([field, count]) => ({ label: field, variant: 'warning' as const }));

    tasks.push({
      id: 'incomplete-trade-data',
      type: 'incomplete-data',
      priority: 'medium',
      title: `${tradesWithMissingData.length} trade${tradesWithMissingData.length > 1 ? 's have' : ' has'} incomplete data`,
      description: 'Complete your records for better insights',
      action: {
        label: 'Complete',
        route: { type: 'add-trade', tradeId: tradesWithMissingData[0].trade.id }
      },
      count: tradesWithMissingData.length,
      badges: topMissing,
      relatedItems: tradesWithMissingData.slice(0, 5).map(item => ({
        id: item.trade.id,
        label: `${item.trade.symbol} • ${new Date(item.trade.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        missingFields: item.missing
      }))
    });
  }

  // 3. Missing or incomplete journal entries
  const todayTrades = trades.filter(t => t.date === today);
  const todayJournal = journalEntries.find(e => e.date === today);
  
  if (todayTrades.length > 0) {
    const missingFields = getMissingJournalFields(todayJournal);
    
    if (missingFields.length > 0) {
      tasks.push({
        id: 'complete-today-journal',
        type: 'journal',
        priority: 'high',
        title: !todayJournal ? "Write today's journal" : "Complete today's journal",
        description: `${todayTrades.length} trade${todayTrades.length > 1 ? 's' : ''} recorded today`,
        action: {
          label: 'Complete',
          route: { type: 'add-journal', date: today }
        },
        badges: missingFields.slice(0, 3).map(field => ({ 
          label: field, 
          variant: field === 'Entire Entry' ? 'error' : 'warning' 
        })),
        missingFields
      });
    }
  }

  // 4. Past journal entries that need completion
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i - 1); // Start from yesterday
    return date.toISOString().split('T')[0];
  });

  const incompletePastJournals = last7Days
    .map(date => {
      const hasTrades = trades.some(t => t.date === date);
      if (!hasTrades) return null;
      
      const journal = journalEntries.find(e => e.date === date);
      const missing = getMissingJournalFields(journal);
      
      if (missing.length === 0) return null;
      
      return { date, missing, journal };
    })
    .filter(item => item !== null);

  if (incompletePastJournals.length > 0) {
    const latestIncomplete = incompletePastJournals[0]!;
    const totalMissingJournals = incompletePastJournals.filter(item => !item.journal).length;
    
    tasks.push({
      id: 'past-journals-incomplete',
      type: 'journal',
      priority: 'medium',
      title: `${incompletePastJournals.length} past journal${incompletePastJournals.length > 1 ? 's need' : ' needs'} attention`,
      description: totalMissingJournals > 0 ? `${totalMissingJournals} missing entirely` : 'Complete for better insights',
      action: {
        label: 'Review',
        route: { type: 'add-journal', date: latestIncomplete.date }
      },
      count: incompletePastJournals.length,
      badges: totalMissingJournals > 0 
        ? [{ label: 'Missing', variant: 'error' }]
        : [{ label: 'Incomplete', variant: 'warning' }]
    });
  }

  // 5. Streaks at risk
  const streaks = calculateStreaks(trades, journalEntries, displayMode);
  
  // Journal streak at risk (if current streak is 3+ days)
  if (streaks.journalStreak >= 3) {
    const lastJournalDate = journalEntries
      .sort((a, b) => b.date.localeCompare(a.date))[0]?.date;
    
    if (lastJournalDate) {
      const daysSinceLastJournal = Math.floor(
        (new Date(today).getTime() - new Date(lastJournalDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // If it's been 1 day since last journal, warn about streak
      if (daysSinceLastJournal === 1 && !hasTodayJournal) {
        tasks.push({
          id: 'journal-streak-risk',
          type: 'streak',
          priority: 'medium',
          title: `${streaks.journalStreak}-day journal streak at risk`,
          description: 'Keep your streak alive',
          action: {
            label: 'Write Journal',
            route: { type: 'add-journal', date: today }
          }
        });
      }
    }
  }

  // Sort by priority: high > medium > low
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}
