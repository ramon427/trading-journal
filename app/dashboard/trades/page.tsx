'use client';

import { useEffect, useMemo, useState } from 'react';
import { Trades } from '@/components/journal/Trades';
import { Trade, JournalEntry } from '@/types/journal/trading';
import { loadTrades, saveTrades, loadJournalEntries } from '@/lib/journal/tradingData';
import { loadSettings, DisplayMode } from '@/lib/journal/settings';
import { useRouter } from 'next/navigation';

export default function TradesPage() {
  const router = useRouter();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('pnl');
  const [showWeekends, setShowWeekends] = useState<boolean>(true);

  useEffect(() => {
    setTrades(loadTrades());
    setJournalEntries(loadJournalEntries());
    const settings = loadSettings();
    setDisplayMode(settings.displayMode);
    setShowWeekends(settings.showWeekends);
  }, []);

  const handleAddTrade = (trade: Trade) => {
    const list = [...trades, trade];
    setTrades(list);
    saveTrades(list);
  };

  const handleEditTrade = (trade: Trade) => {
    const idx = trades.findIndex(t => t.id === trade.id);
    if (idx >= 0) {
      const list = [...trades];
      list[idx] = trade;
      setTrades(list);
      saveTrades(list);
    }
  };

  const handleDeleteTrade = (tradeId: string) => {
    const list = trades.filter(t => t.id !== tradeId);
    setTrades(list);
    saveTrades(list);
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <Trades
        trades={trades}
        journalEntries={journalEntries}
        displayMode={displayMode}
        showWeekends={showWeekends}
        onAddTrade={handleAddTrade}
        onEditTrade={handleEditTrade}
        onDeleteTrade={handleDeleteTrade}
        onOpenTradeDialog={() => router.push('/dashboard/trades/quick-add')}
      />
    </div>
  );
}


