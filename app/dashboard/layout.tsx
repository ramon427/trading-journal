'use client';

import { useState, useEffect, useMemo } from 'react';
import { DashboardSidebar } from '@/components/journal/DashboardSidebar';
import { ImportDialog } from '@/components/journal/ImportDialog';
import { SettingsDialog } from '@/components/journal/SettingsDialog';
import { KeyboardShortcuts } from '@/components/journal/KeyboardShortcuts';
import { Toaster } from '@/components/journal/ui/sonner';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import { motion, AnimatePresence } from 'motion/react';
import { Trade, JournalEntry } from '@/types/journal/trading';
import { 
  loadTrades, 
  saveTrades, 
  loadJournalEntries, 
  saveJournalEntries, 
  calculateStatistics 
} from '@/lib/journal/tradingData';
import { loadSettings, saveSettings, DisplayMode } from '@/lib/journal/settings';
import { loadTheme, applyTheme } from '@/lib/journal/theme';
import { loadThemeCustomization, applyThemeColors } from '@/lib/journal/themeCustomization';
import { generateDummyData } from '@/lib/journal/dummyData';
import { refreshAllStats } from '@/lib/journal/customization';
import { getSidebarState } from '@/lib/journal/sidebarState';

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [shortcutsDialogOpen, setShortcutsDialogOpen] = useState(false);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('pnl');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const { sidebarVisible } = useSidebar();

  useEffect(() => {
    const loadData = async () => {
      const loadPromise = new Promise<void>((resolve) => {
        const loadedTrades = loadTrades();
        const loadedJournals = loadJournalEntries();
        const settings = loadSettings();
        const loadedTheme = loadTheme();
        
        setDisplayMode(settings.displayMode);
        applyTheme(loadedTheme);
        
        // Apply custom theme colors
        const customization = loadThemeCustomization();
        const customColors = loadedTheme === 'dark' ? customization.dark : customization.light;
        applyThemeColors(customColors, loadedTheme === 'dark');
        
        // If no data exists, use dummy data
        if (loadedTrades.length === 0) {
          const { dummyTrades, dummyJournalEntries } = generateDummyData();
          setTrades(dummyTrades);
          setJournalEntries(dummyJournalEntries);
          saveTrades(dummyTrades);
          saveJournalEntries(dummyJournalEntries);
          refreshAllStats(dummyTrades);
        } else {
          setTrades(loadedTrades);
          setJournalEntries(loadedJournals);
          refreshAllStats(loadedTrades);
        }
        resolve();
      });

      const minLoadTime = new Promise((resolve) => setTimeout(resolve, 500));
      await Promise.all([loadPromise, minLoadTime]);
      setIsInitialLoading(false);
    };

    loadData();
  }, []);

  const handleDisplayModeChange = (mode: DisplayMode) => {
    setDisplayMode(mode);
    saveSettings({ displayMode: mode, showWeekends: true });
  };

  const handleClearData = () => {
    setTrades([]);
    setJournalEntries([]);
    saveTrades([]);
    saveJournalEntries([]);
  };

  const stats = useMemo(() => calculateStatistics(trades), [trades]);

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-background animate-in fade-in duration-300">
        <div className="flex min-h-screen">
          <aside className="w-60 border-r border-border bg-card flex-shrink-0 p-4 space-y-6">
            <div className="px-2 py-1">
              <div className="h-5 w-32 mb-2 bg-muted animate-pulse rounded" />
              <div className="h-3 w-20 bg-muted animate-pulse rounded" />
            </div>
          </aside>
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-6 py-8 max-w-7xl space-y-6">
              <div className="h-10 w-48 bg-muted animate-pulse rounded" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="h-32 bg-muted animate-pulse rounded" />
                <div className="h-32 bg-muted animate-pulse rounded" />
                <div className="h-32 bg-muted animate-pulse rounded" />
              </div>
              <div className="h-96 bg-muted animate-pulse rounded" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="bottom-right" expand={true} richColors closeButton />
      <div className="flex min-h-screen">
        <AnimatePresence mode="wait">
          {sidebarVisible && (
            <motion.aside
              initial={{ x: -240, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -240, opacity: 0 }}
              transition={{ 
                duration: 0.3, 
                ease: [0.4, 0, 0.2, 1],
                opacity: { duration: 0.2 }
              }}
              className="w-60 flex-shrink-0"
            >
              <DashboardSidebar
                displayMode={displayMode}
                onDisplayModeChange={handleDisplayModeChange}
                onOpenImport={() => setImportDialogOpen(true)}
                onOpenShortcuts={() => setShortcutsDialogOpen(true)}
                onOpenSettings={() => setSettingsDialogOpen(true)}
              />
            </motion.aside>
          )}
        </AnimatePresence>
        <motion.main 
          className="flex-1 overflow-y-auto"
          animate={{ 
            paddingLeft: sidebarVisible ? 0 : 0,
          }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          {children}
        </motion.main>
      </div>

      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        journalEntries={journalEntries}
        onImportData={(importedTrades, importedJournalEntries, mergeMode) => {
          // Handle import logic
          setTrades(importedTrades);
          setJournalEntries(importedJournalEntries);
          saveTrades(importedTrades);
          saveJournalEntries(importedJournalEntries);
        }}
      />
      
      <SettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
        onClearData={handleClearData}
        trades={trades}
        totalPnl={stats.totalPnl}
      />

      <KeyboardShortcuts
        open={shortcutsDialogOpen}
        onOpenChange={setShortcutsDialogOpen}
      />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardLayoutContent>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

