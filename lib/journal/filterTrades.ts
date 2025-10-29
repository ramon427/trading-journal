import { Trade, JournalEntry } from '../types/trading';
import { AdvancedTradeFilters } from '../components/AdvancedFilters';

export function filterTrades(
  trades: Trade[], 
  journalEntries: JournalEntry[],
  filters: AdvancedTradeFilters
): Trade[] {
  // Early return if no filters
  if (Object.keys(filters).length === 0) {
    return trades;
  }

  // Pre-compute expensive lookups once
  const query = filters.searchQuery?.toLowerCase();
  const ruleBreakingDates = filters.ruleBreaking 
    ? new Set(journalEntries.filter(entry => !entry.followedSystem).map(entry => entry.date))
    : null;

  // Single-pass filter with all conditions
  // Reduces from O(n*m) to O(n) where m is number of filters
  return trades.filter(trade => {
    // Search query - searches across symbol, setup, notes, and tags
    if (query) {
      const matchesSearch = 
        trade.symbol.toLowerCase().includes(query) ||
        trade.setup?.toLowerCase().includes(query) ||
        trade.notes?.toLowerCase().includes(query) ||
        trade.tags.some(tag => tag.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }

    // Date range
    if (filters.dateFrom && trade.date < filters.dateFrom) return false;
    if (filters.dateTo && trade.date > filters.dateTo) return false;

    // Symbols (multi-select)
    if (filters.symbols?.length && !filters.symbols.includes(trade.symbol)) return false;

    // Setups (multi-select)
    if (filters.setups?.length && (!trade.setup || !filters.setups.includes(trade.setup))) return false;

    // Tags (multi-select - match if trade has ANY of the selected tags)
    if (filters.tags?.length && !trade.tags.some(tag => filters.tags!.includes(tag))) return false;

    // Outcome filter
    if (filters.outcome === 'wins' && trade.pnl <= 0) return false;
    if (filters.outcome === 'losses' && trade.pnl >= 0) return false;
    if (filters.outcome === 'breakeven' && trade.pnl !== 0) return false;

    // Status filter
    if (filters.status && filters.status !== 'all') {
      const isOpen = trade.status === 'open' || trade.exitPrice === null;
      if (filters.status === 'open' && !isOpen) return false;
      if (filters.status === 'closed' && isOpen) return false;
    }

    // Trade type filter
    if (filters.tradeType && filters.tradeType !== 'all' && trade.type !== filters.tradeType) return false;

    // P&L range
    if (filters.pnlMin !== undefined && trade.pnl < filters.pnlMin) return false;
    if (filters.pnlMax !== undefined && trade.pnl > filters.pnlMax) return false;

    // R:R range
    if (filters.rrMin !== undefined && (trade.rr === undefined || trade.rr < filters.rrMin)) return false;
    if (filters.rrMax !== undefined && (trade.rr === undefined || trade.rr > filters.rrMax)) return false;

    // Rule-breaking filter
    if (ruleBreakingDates && !ruleBreakingDates.has(trade.date)) return false;

    // Has notes
    if (filters.hasNotes && (!trade.notes || !trade.notes.trim())) return false;

    // Has tags
    if (filters.hasTags && (!trade.tags || !trade.tags.length)) return false;

    // Has screenshots
    if (filters.hasScreenshots && 
        !trade.screenshotBefore?.length && 
        !trade.screenshotAfter?.length) return false;

    return true;
  });
}

// Helper function to get unique values from trades
export function getUniqueSymbols(trades: Trade[]): string[] {
  return Array.from(new Set(trades.map(t => t.symbol))).sort();
}

export function getUniqueSetups(trades: Trade[]): string[] {
  return Array.from(new Set(trades.map(t => t.setup).filter(Boolean) as string[])).sort();
}

export function getUniqueTags(trades: Trade[]): string[] {
  const allTags = trades.flatMap(t => t.tags);
  return Array.from(new Set(allTags)).sort();
}
