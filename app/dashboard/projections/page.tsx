'use client';

import { useEffect, useMemo, useState } from 'react';
import { Projections } from '@/components/journal/Projections';
import { Trade } from '@/types/journal/trading';
import { loadTrades, calculateStatistics } from '@/lib/journal/tradingData';
import { loadSettings, DisplayMode } from '@/lib/journal/settings';

export default function ProjectionsPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('pnl');

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const tradesData = await loadTrades();
      if (!isMounted) return;
      setTrades(tradesData);
      setDisplayMode(loadSettings().displayMode);
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(() => calculateStatistics(trades), [trades]);

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <Projections trades={trades} stats={stats} displayMode={displayMode} />
    </div>
  );
}


