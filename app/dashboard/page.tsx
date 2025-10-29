'use client';

import { useEffect, useState, useMemo } from 'react';
import { Overview } from '@/components/journal/Overview';
import { Trade, JournalEntry } from '@/types/journal/trading';
import { 
  loadTrades, 
  saveTrades, 
  loadJournalEntries, 
  saveJournalEntries, 
  calculateStatistics 
} from '@/lib/journal/tradingData';
import { loadSettings, DisplayMode } from '@/lib/journal/settings';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function DashboardPage() {
  const router = useRouter();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('pnl');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [loadedTrades, loadedJournals, settings] = await Promise.all([
          loadTrades(),
          loadJournalEntries(),
          Promise.resolve(loadSettings()), // Settings still uses localStorage
        ]);
        
        setTrades(loadedTrades);
        setJournalEntries(loadedJournals);
        setDisplayMode(settings.displayMode);
      } catch (error) {
        console.error('Failed to load data:', error);
        toast.error('Failed to load trading data');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, []);

  const stats = useMemo(() => calculateStatistics(trades), [trades]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-7xl space-y-6">
        <div className="h-10 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-muted animate-pulse rounded" />
          <div className="h-32 bg-muted animate-pulse rounded" />
          <div className="h-32 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  const navigateTo = (route: { type: string; tradeId?: string }) => {
    if (route.type === 'add-trade' && route.tradeId) {
      router.push(`/dashboard/trades/add?tradeId=${route.tradeId}`);
    } else {
      router.push(`/dashboard/${route.type}`);
    }
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <Overview 
        trades={trades} 
        journalEntries={journalEntries} 
        stats={stats} 
        displayMode={displayMode} 
        onCloseTrade={(trade) => {
          navigateTo({ type: 'add-trade', tradeId: trade.id });
        }}
      />
    </div>
  );
}

