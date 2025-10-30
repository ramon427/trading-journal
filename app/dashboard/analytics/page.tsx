'use client';

import { useEffect, useMemo, useState } from 'react';
import { Analytics } from '@/components/journal/Analytics';
import { Trade, JournalEntry } from '@/types/journal/trading';
import { loadTrades, loadJournalEntries, calculateStatistics } from '@/lib/journal/tradingData';
import { loadSettings, DisplayMode } from '@/lib/journal/settings';

export default function AnalyticsPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('pnl');

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const [tradesData, journalData] = await Promise.all([
        loadTrades(),
        loadJournalEntries(),
      ]);
      if (!isMounted) return;
      setTrades(tradesData);
      setJournalEntries(journalData);
      setDisplayMode(loadSettings().displayMode);
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(() => calculateStatistics(trades), [trades]);

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <Analytics trades={trades} journalEntries={journalEntries} stats={stats} displayMode={displayMode} />
    </div>
  );
}


