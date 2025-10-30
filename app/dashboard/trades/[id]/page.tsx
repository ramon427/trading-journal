'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TradeDetailPage } from '@/components/journal/TradeDetailPage';
import { Trade, JournalEntry } from '@/types/journal/trading';
import { loadTrades, saveTrades, loadJournalEntries, calculateStatistics } from '@/lib/journal/tradingData';
import { loadSettings, DisplayMode } from '@/lib/journal/settings';

export default function TradeDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
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

  const trade = useMemo(() => trades.find(t => t.id === params.id), [trades, params.id]);

  const handleEdit = (updated: Trade) => {
    const idx = trades.findIndex(t => t.id === updated.id);
    if (idx >= 0) {
      const list = [...trades];
      list[idx] = updated;
      setTrades(list);
      saveTrades(list);
    }
  };

  const handleDelete = (tradeId: string) => {
    const list = trades.filter(t => t.id !== tradeId);
    setTrades(list);
    saveTrades(list);
    router.push('/dashboard/trades');
  };

  if (!trade) {
    return <div className="container mx-auto px-6 py-8">Trade not found</div>;
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-5xl">
      <TradeDetailPage
        trade={trade}
        displayMode={displayMode}
        onEdit={handleEdit}
        onDelete={handleDelete}
        sidebarVisible={false}
        onToggleSidebar={() => {}}
        trades={trades}
        journalEntries={journalEntries}
        theme={'light'}
        hasJournalEntryToday={false}
        onNavigate={() => {}}
        onDisplayModeChange={() => {}}
        onToggleTheme={() => {}}
        onOpenImport={() => {}}
        onOpenShortcuts={() => {}}
        onOpenSettings={() => {}}
      />
    </div>
  );
}


