'use client';

import { useEffect, useState } from 'react';
import { CustomizePage } from '@/components/journal/CustomizePage';
import { Trade } from '@/types/journal/trading';
import { loadTrades } from '@/lib/journal/tradingData';
import { loadTheme } from '@/lib/journal/theme';
import { initializeCustomization, refreshAllStats } from '@/lib/journal/customization';

export default function Customize() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>(loadTheme());

  useEffect(() => {
    const t = loadTrades();
    setTrades(t);
    refreshAllStats(t);
    initializeCustomization();
  }, []);

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <CustomizePage trades={trades} theme={theme} onRefresh={() => {
        const t = loadTrades();
        setTrades(t);
        refreshAllStats(t);
      }} />
    </div>
  );
}


