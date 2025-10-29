import { Trade, JournalEntry } from '../types/trading';

export interface SmartSuggestion {
  field: string;
  value: any;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Get smart suggestions for a trade based on user's history
 */
export function getTradeSmartSuggestions(
  currentTrade: Partial<Trade>,
  allTrades: Trade[]
): SmartSuggestion[] {
  const suggestions: SmartSuggestion[] = [];

  // Filter out current trade if editing
  const historicalTrades = allTrades.filter(t => t.id !== currentTrade.id);
  
  if (historicalTrades.length === 0) {
    return suggestions;
  }

  // Suggest setup based on symbol
  if (currentTrade.symbol && !currentTrade.setup) {
    const symbolTrades = historicalTrades.filter(
      t => t.symbol === currentTrade.symbol && t.setup
    );
    
    if (symbolTrades.length > 0) {
      // Find most common setup for this symbol
      const setupCounts = symbolTrades.reduce((acc, trade) => {
        acc[trade.setup!] = (acc[trade.setup!] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const mostCommon = Object.entries(setupCounts).sort((a, b) => b[1] - a[1])[0];
      
      if (mostCommon) {
        suggestions.push({
          field: 'setup',
          value: mostCommon[0],
          reason: `You've used "${mostCommon[0]}" for ${mostCommon[1]} ${currentTrade.symbol} trade${mostCommon[1] > 1 ? 's' : ''}`,
          confidence: mostCommon[1] >= 3 ? 'high' : 'medium'
        });
      }
    }
  }

  // Suggest tags based on setup
  if (currentTrade.setup && (!currentTrade.tags || currentTrade.tags.length === 0)) {
    const setupTrades = historicalTrades.filter(
      t => t.setup === currentTrade.setup && t.tags && t.tags.length > 0
    );
    
    if (setupTrades.length > 0) {
      // Find most common tags for this setup
      const tagCounts = setupTrades.reduce((acc, trade) => {
        trade.tags?.forEach(tag => {
          acc[tag] = (acc[tag] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>);
      
      const topTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([tag]) => tag);
      
      if (topTags.length > 0) {
        suggestions.push({
          field: 'tags',
          value: topTags,
          reason: `Common tags for "${currentTrade.setup}" setups`,
          confidence: setupTrades.length >= 5 ? 'high' : 'medium'
        });
      }
    }
  }

  // Suggest stop loss based on average risk for this setup
  if (currentTrade.setup && currentTrade.entryPrice && !currentTrade.stopLoss) {
    const setupTrades = historicalTrades.filter(
      t => t.setup === currentTrade.setup && t.stopLoss && t.entryPrice
    );
    
    if (setupTrades.length >= 3) {
      const avgRiskPercent = setupTrades.reduce((sum, trade) => {
        const risk = Math.abs((trade.stopLoss! - trade.entryPrice) / trade.entryPrice);
        return sum + risk;
      }, 0) / setupTrades.length;
      
      const suggestedStop = currentTrade.type === 'long'
        ? currentTrade.entryPrice * (1 - avgRiskPercent)
        : currentTrade.entryPrice * (1 + avgRiskPercent);
      
      suggestions.push({
        field: 'stopLoss',
        value: Number(suggestedStop.toFixed(2)),
        reason: `Based on your avg ${(avgRiskPercent * 100).toFixed(1)}% risk for "${currentTrade.setup}"`,
        confidence: setupTrades.length >= 5 ? 'high' : 'medium'
      });
    }
  }

  // Suggest target based on average R:R for this setup
  if (currentTrade.setup && currentTrade.entryPrice && currentTrade.stopLoss && !currentTrade.target) {
    const setupTrades = historicalTrades.filter(
      t => t.setup === currentTrade.setup && t.target && t.entryPrice && t.stopLoss
    );
    
    if (setupTrades.length >= 3) {
      const avgRR = setupTrades.reduce((sum, trade) => {
        const risk = Math.abs(trade.stopLoss! - trade.entryPrice);
        const reward = Math.abs(trade.target! - trade.entryPrice);
        return sum + (reward / risk);
      }, 0) / setupTrades.length;
      
      const risk = Math.abs(currentTrade.stopLoss - currentTrade.entryPrice);
      const suggestedTarget = currentTrade.type === 'long'
        ? currentTrade.entryPrice + (risk * avgRR)
        : currentTrade.entryPrice - (risk * avgRR);
      
      suggestions.push({
        field: 'target',
        value: Number(suggestedTarget.toFixed(2)),
        reason: `Based on your avg 1:${avgRR.toFixed(1)} R:R for "${currentTrade.setup}"`,
        confidence: setupTrades.length >= 5 ? 'high' : 'medium'
      });
    }
  }

  return suggestions;
}

/**
 * Get smart suggestions for journal entries
 */
export function getJournalSmartSuggestions(
  currentEntry: Partial<JournalEntry>,
  allEntries: JournalEntry[],
  trades: Trade[]
): SmartSuggestion[] {
  const suggestions: SmartSuggestion[] = [];

  if (allEntries.length === 0) {
    return suggestions;
  }

  const date = currentEntry.date || new Date().toISOString().split('T')[0];
  const dayTrades = trades.filter(t => t.date === date);

  // Suggest market conditions based on day's trading activity
  if (dayTrades.length > 0 && !currentEntry.marketConditions) {
    const winRate = dayTrades.filter(t => t.pnl > 0).length / dayTrades.length;
    let condition = '';
    
    if (winRate >= 0.7) {
      condition = 'Strong trending market with clear setups';
    } else if (winRate >= 0.5) {
      condition = 'Mixed conditions with selective opportunities';
    } else if (winRate < 0.5 && dayTrades.length > 2) {
      condition = 'Choppy market with false signals';
    } else {
      condition = 'Range-bound with limited momentum';
    }
    
    suggestions.push({
      field: 'marketConditions',
      value: condition,
      reason: `Based on ${dayTrades.length} trade${dayTrades.length > 1 ? 's' : ''} today (${(winRate * 100).toFixed(0)}% win rate)`,
      confidence: dayTrades.length >= 3 ? 'high' : 'medium'
    });
  }

  // Suggest mood based on day's P&L
  if (dayTrades.length > 0 && !currentEntry.mood) {
    const totalPnL = dayTrades.reduce((sum, t) => sum + t.pnl, 0);
    const avgPnL = totalPnL / dayTrades.length;
    
    let mood: JournalEntry['mood'];
    if (totalPnL > 200 || avgPnL > 100) {
      mood = 'excellent';
    } else if (totalPnL > 0) {
      mood = 'good';
    } else if (totalPnL === 0 || Math.abs(totalPnL) < 50) {
      mood = 'neutral';
    } else if (totalPnL > -200) {
      mood = 'poor';
    } else {
      mood = 'terrible';
    }
    
    suggestions.push({
      field: 'mood',
      value: mood,
      reason: `Based on $${totalPnL.toFixed(2)} P&L today`,
      confidence: 'medium'
    });
  }

  // Suggest lessons learned based on mistakes made
  if (dayTrades.length > 0 && !currentEntry.lessonsLearned) {
    const mistakeTrades = dayTrades.filter(t => 
      t.tags?.includes('Mistake') || t.setup === 'FOMO' || t.setup === 'Revenge trade'
    );
    
    if (mistakeTrades.length > 0) {
      suggestions.push({
        field: 'lessonsLearned',
        value: `Avoid ${mistakeTrades[0].setup || 'emotional trading'}. Stick to the plan.`,
        reason: `${mistakeTrades.length} trade${mistakeTrades.length > 1 ? 's' : ''} tagged as mistake`,
        confidence: 'high'
      });
    } else {
      const losers = dayTrades.filter(t => t.pnl < 0);
      if (losers.length > 0 && losers.length < dayTrades.length) {
        suggestions.push({
          field: 'lessonsLearned',
          value: 'Cut losses quickly when setup invalidates',
          reason: `${losers.length} losing trade${losers.length > 1 ? 's' : ''} but followed stops`,
          confidence: 'medium'
        });
      }
    }
  }

  return suggestions;
}

/**
 * Check if user should be reminded about a field
 */
export function shouldShowFieldReminder(
  field: string,
  tradeOrEntry: Partial<Trade | JournalEntry>,
  allTrades: Trade[]
): boolean {
  // Don't show reminders for brand new entries with no data
  const hasAnyData = Object.keys(tradeOrEntry).length > 2; // More than just id and date
  if (!hasAnyData) return false;

  // Critical fields should always show if missing
  const criticalFields = ['symbol', 'entryPrice', 'exitPrice', 'mood', 'notes'];
  if (criticalFields.includes(field)) {
    return !(tradeOrEntry as any)[field];
  }

  // Show reminder for important fields if user has filled out critical fields
  const importantFields = ['setup', 'stopLoss', 'target', 'tags', 'lessonsLearned', 'marketConditions'];
  if (importantFields.includes(field)) {
    const hasCriticalData = criticalFields.some(f => (tradeOrEntry as any)[f]);
    return hasCriticalData && !(tradeOrEntry as any)[field];
  }

  return false;
}
