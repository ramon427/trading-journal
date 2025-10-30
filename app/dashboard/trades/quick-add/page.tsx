'use client';

import { useEffect, useMemo, useState } from 'react';
import { QuickAddTradePage } from '@/components/journal/QuickAddTradePage';
import { useSidebar } from '@/contexts/SidebarContext';
import { Trade, JournalEntry, TradeTemplate } from '@/types/journal/trading';
import { loadTrades, saveTrades, loadJournalEntries } from '@/lib/journal/tradingData';
import { loadSettings, DisplayMode } from '@/lib/journal/settings';
import { loadTemplates, getRecentSymbols, incrementTemplateUsage } from '@/lib/journal/tradeTemplates';

export default function QuickAddTrade() {
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

  const recentSymbols = useMemo(() => getRecentSymbols(10), [trades]);

  const handleSave = (t: Trade) => {
    const list = [...trades, t];
    setTrades(list);
    saveTrades(list);
  };

  const handleTemplateUsed = (templateId: string) => {
    incrementTemplateUsage(templateId);
    setTemplates(loadTemplates());
  };

  const today = new Date().toISOString().split('T')[0];
  const hasJournalEntryToday = useMemo(() => journalEntries.some(e => e.date === today), [journalEntries, today]);

  return (
    <div>
      <QuickAddTradePage
        onSave={handleSave}
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
        hasJournalEntryToday={hasJournalEntryToday}
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


