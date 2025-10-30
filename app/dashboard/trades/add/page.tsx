'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AddTradePage } from '@/components/journal/AddTradePage';
import { useSidebar } from '@/contexts/SidebarContext';
import { Trade, JournalEntry, TradeTemplate } from '@/types/journal/trading';
import { loadTrades, saveTrades, loadJournalEntries } from '@/lib/journal/tradingData';
import { loadSettings, DisplayMode } from '@/lib/journal/settings';
import { loadTemplates, saveTemplates, getRecentSymbols, getAllSetups, getAllTags, incrementTemplateUsage, createTemplateFromTrade } from '@/lib/journal/tradeTemplates';

export default function AddTrade() {
  const router = useRouter();
  const params = useSearchParams();
  const { sidebarVisible, toggleSidebar } = useSidebar();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [templates, setTemplates] = useState<TradeTemplate[]>([]);
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
      setTemplates(loadTemplates());
      setDisplayMode(loadSettings().displayMode);
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const tradeId = params.get('tradeId') || undefined;
  const trade = useMemo(() => trades.find(t => t.id === tradeId), [trades, tradeId]);
  const recentSymbols = useMemo(() => getRecentSymbols(10), [trades]);

  const handleSave = (t: Trade) => {
    const idx = trades.findIndex(x => x.id === t.id);
    const list = idx >= 0 ? trades.map(x => x.id === t.id ? t : x) : [...trades, t];
    setTrades(list);
    saveTrades(list);
  };

  const handleTemplateUsed = (templateId: string) => {
    incrementTemplateUsage(templateId);
    setTemplates(loadTemplates());
  };

  return (
    <div>
      <AddTradePage
        onSave={handleSave}
        trade={trade}
        date={undefined}
        templates={templates}
        recentSymbols={recentSymbols}
        onTemplateUsed={handleTemplateUsed}
        sidebarVisible={sidebarVisible}
        onToggleSidebar={toggleSidebar}
        trades={trades}
        journalEntries={journalEntries}
        displayMode={displayMode}
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


