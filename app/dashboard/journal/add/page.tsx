'use client';

import { useEffect, useMemo, useState } from 'react';
import { AddJournalPage } from '@/components/journal/AddJournalPage';
import { useSidebar } from '@/contexts/SidebarContext';
import { Trade, JournalEntry } from '@/types/journal/trading';
import { loadTrades, loadJournalEntries, saveJournalEntries } from '@/lib/journal/tradingData';
import { loadSettings, DisplayMode } from '@/lib/journal/settings';

export default function AddJournal() {
  const { sidebarVisible, toggleSidebar } = useSidebar();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('pnl');

  useEffect(() => {
    setTrades(loadTrades());
    setJournalEntries(loadJournalEntries());
    setDisplayMode(loadSettings().displayMode);
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const hasJournalEntryToday = useMemo(() => journalEntries.some(e => e.date === today), [journalEntries, today]);

  const handleSave = (entry: JournalEntry) => {
    const idx = journalEntries.findIndex(e => e.date === entry.date);
    const list = idx >= 0 ? journalEntries.map(e => e.date === entry.date ? entry : e) : [...journalEntries, entry];
    setJournalEntries(list);
    saveJournalEntries(list);
  };

  const handleDeleteTrade = (_id: string) => {};

  return (
    <div>
      <AddJournalPage
        onSave={handleSave}
        date={today}
        existingEntry={journalEntries.find(e => e.date === today)}
        trades={trades}
        journalEntries={journalEntries}
        displayMode={displayMode}
        onDeleteTrade={handleDeleteTrade}
        sidebarVisible={sidebarVisible}
        onToggleSidebar={toggleSidebar}
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


