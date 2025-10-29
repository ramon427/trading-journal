import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trade, JournalEntry } from '@/types/journal/trading';
import { DisplayMode } from '@/lib/journal/settings';
import { Button } from './ui/button';
import { usePageFeatures } from '@/lib/journal/usePageFeatures';
import { useGlobalSettings } from '@/lib/journal/useGlobalSettings';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { TradingCalendar } from './TradingCalendar';
import { SelectedDatePanel } from './SelectedDatePanel';
import { AdvancedFilters, AdvancedTradeFilters, FilterPreset } from './AdvancedFilters';
import { JournalInsights } from './JournalInsights';
import { Sparkline } from './Sparkline';
import { Plus, Calendar, Activity, Filter, DollarSign, Target, Award, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';
import { filterTrades, getUniqueSymbols, getUniqueSetups, getUniqueTags } from '@/lib/journal/filterTrades';
import { loadFilterPresets, addFilterPreset, deleteFilterPreset } from '@/lib/journal/filterPresets';
import { getTradesViewState, saveTradesViewState } from '@/lib/journal/tradesViewState';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { formatCurrency, formatRR } from '@/lib/journal/formatters';

interface TradesProps {
  trades: Trade[];
  journalEntries: JournalEntry[];
  displayMode: DisplayMode;
  showWeekends: boolean;
  onAddTrade: (trade: Trade) => void;
  onEditTrade: (trade: Trade) => void;
  onDeleteTrade: (tradeId: string) => void;
  onOpenTradeDialog: () => void;
}

export function Trades({
  trades,
  journalEntries,
  displayMode,
  showWeekends,
  onAddTrade,
  onEditTrade,
  onDeleteTrade,
  onOpenTradeDialog,
}: TradesProps) {
  const router = useRouter();
  const features = usePageFeatures('trades');
  const globalSettings = useGlobalSettings();
  const [filters, setFilters] = useState<AdvancedTradeFilters>({});
  const [presets, setPresets] = useState<FilterPreset[]>(loadFilterPresets());
  
  // Load persisted view state on mount
  const viewState = getTradesViewState();
  const [selectedDate, setSelectedDate] = useState<string>(
    viewState.selectedDate || new Date().toISOString().split('T')[0]
  );
  const [highlightedDate, setHighlightedDate] = useState<string | null>(
    viewState.highlightedDate
  );

  // Persist selected date changes
  useEffect(() => {
    saveTradesViewState({ selectedDate, highlightedDate });
  }, [selectedDate, highlightedDate]);

  // Extract unique values for filters
  const availableSymbols = useMemo(() => getUniqueSymbols(trades), [trades]);
  const availableSetups = useMemo(() => getUniqueSetups(trades), [trades]);
  const availableTags = useMemo(() => getUniqueTags(trades), [trades]);

  // Apply filters to trades using the utility function
  const filteredTrades = useMemo(() => {
    return filterTrades(trades, journalEntries, filters);
  }, [trades, journalEntries, filters]);

  // Apply filters to journal entries to only show those with filtered trades
  const filteredJournalEntries = useMemo(() => {
    const filteredDates = new Set(filteredTrades.map(t => t.date));
    return journalEntries.filter(j => filteredDates.has(j.date) || filteredTrades.length === trades.length);
  }, [journalEntries, filteredTrades, trades.length]);

  // Calculate quick stats for filtered trades
  const quickStats = useMemo(() => {
    const totalPnL = filteredTrades.reduce((sum, t) => sum + t.pnl, 0);
    const totalRR = filteredTrades.reduce((sum, t) => sum + (t.rr || 0), 0);
    const wins = filteredTrades.filter(t => t.pnl > 0).length;
    const losses = filteredTrades.filter(t => t.pnl < 0).length;
    const winRate = filteredTrades.length > 0 ? (wins / filteredTrades.length) * 100 : 0;
    
    // Calculate profit factor
    const totalWins = filteredTrades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
    const totalLosses = Math.abs(filteredTrades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0));
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;
    
    const totalWinsRR = filteredTrades.filter(t => (t.rr || 0) > 0).reduce((sum, t) => sum + (t.rr || 0), 0);
    const totalLossesRR = Math.abs(filteredTrades.filter(t => (t.rr || 0) < 0).reduce((sum, t) => sum + (t.rr || 0), 0));
    const profitFactorRR = totalLossesRR > 0 ? totalWinsRR / totalLossesRR : totalWinsRR > 0 ? Infinity : 0;
    
    // Calculate expectancy (average per trade)
    const expectancy = filteredTrades.length > 0 ? totalPnL / filteredTrades.length : 0;
    const expectancyRR = filteredTrades.length > 0 ? totalRR / filteredTrades.length : 0;

    return {
      total: filteredTrades.length,
      totalPnL,
      totalRR,
      wins,
      losses,
      winRate,
      profitFactor,
      profitFactorRR,
      expectancy,
      expectancyRR,
    };
  }, [filteredTrades]);

  const formatValue = (value: number) => {
    return displayMode === 'rr' ? formatRR(value) : formatCurrency(value);
  };
  
  // Calculate sparkline data (last 10 trades cumulative)
  const sparklineData = useMemo(() => {
    const recentTrades = [...filteredTrades].sort((a, b) => a.date.localeCompare(b.date)).slice(-10);
    return recentTrades.reduce((acc: number[], trade, index) => {
      const previous = index > 0 ? acc[index - 1] : 0;
      const value = displayMode === 'rr' ? (trade.rr || 0) : trade.pnl;
      acc.push(previous + value);
      return acc;
    }, []);
  }, [filteredTrades, displayMode]);

  const totalValue = displayMode === 'rr' ? quickStats.totalRR : quickStats.totalPnL;
  const profitFactorValue = displayMode === 'rr' ? quickStats.profitFactorRR : quickStats.profitFactor;
  
  // Stat cards matching Overview page
  const statCards = [
    {
      title: displayMode === 'rr' ? 'Total R:R' : 'Total P&L',
      value: formatValue(totalValue),
      change: displayMode === 'rr' ? quickStats.expectancyRR : quickStats.expectancy,
      changeLabel: 'Avg per trade',
      icon: DollarSign,
      color: totalValue >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-500',
      bgGradient: totalValue >= 0 ? 'from-emerald-500/5 to-emerald-500/0' : 'from-red-500/5 to-red-500/0',
      iconBg: totalValue >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20',
      sparkline: sparklineData,
    },
    {
      title: 'Win Rate',
      value: `${quickStats.winRate.toFixed(1)}%`,
      change: quickStats.wins > quickStats.losses ? quickStats.wins - quickStats.losses : -(quickStats.losses - quickStats.wins),
      changeLabel: quickStats.wins > quickStats.losses ? 'more wins' : 'more losses',
      icon: Target,
      color: quickStats.winRate >= 50 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400',
      bgGradient: quickStats.winRate >= 50 ? 'from-blue-500/5 to-blue-500/0' : 'from-orange-500/5 to-orange-500/0',
      iconBg: quickStats.winRate >= 50 ? 'bg-blue-500/10 border-blue-500/20' : 'bg-orange-500/10 border-orange-500/20',
    },
    {
      title: 'Total Trades',
      value: quickStats.total.toString(),
      change: quickStats.wins,
      changeLabel: 'winners',
      icon: Activity,
      color: 'text-violet-600 dark:text-violet-400',
      bgGradient: 'from-violet-500/5 to-violet-500/0',
      iconBg: 'bg-violet-500/10 border-violet-500/20',
    },
    {
      title: 'Profit Factor',
      value: profitFactorValue === Infinity ? '∞' : profitFactorValue.toFixed(2),
      change: quickStats.total > 0 ? (quickStats.wins / quickStats.total) * 100 : 0,
      changeLabel: 'win rate',
      icon: Award,
      color: profitFactorValue >= 2 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-gray-400',
      bgGradient: profitFactorValue >= 2 ? 'from-amber-500/5 to-amber-500/0' : 'from-gray-500/5 to-gray-500/0',
      iconBg: profitFactorValue >= 2 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-gray-500/10 border-gray-500/20',
    },
  ];

  // Check if filters are active
  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof AdvancedTradeFilters];
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'boolean') return value;
    return value !== undefined && value !== null && value !== '';
  });

  // Preset handlers
  const handleSavePreset = (name: string, filters: AdvancedTradeFilters) => {
    const newPreset = addFilterPreset(name, filters);
    setPresets([...presets, newPreset]);
  };

  const handleLoadPreset = (preset: FilterPreset) => {
    setFilters(preset.filters);
    toast.success(`Loaded preset: ${preset.name}`);
  };

  const handleDeletePreset = (presetId: string) => {
    deleteFilterPreset(presetId);
    setPresets(presets.filter(p => p.id !== presetId));
    toast.success('Preset deleted');
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Section or Simple Header */}
      {globalSettings.showHeroSections ? (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-card via-card/50 to-background p-8 shadow-sm"
        >
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <motion.div 
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                  className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 shadow-sm"
                >
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                </motion.div>
                <div>
                  <h1 className="mb-0.5 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    Trade Calendar
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Visual overview of your trading activity and performance
                  </p>
                </div>
              </div>
            </div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Button 
                onClick={onOpenTradeDialog} 
                className="gap-2 shadow-sm hover:shadow-md transition-all group"
                size="default"
              >
                <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />
                Quick Trade
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-primary-foreground/20 px-1.5 font-mono text-[10px] font-medium opacity-70">
                  N
                </kbd>
              </Button>
            </motion.div>
          </div>
        </div>
        
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-500/8 via-purple-500/5 to-transparent rounded-full blur-3xl -z-0" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-500/8 via-blue-500/5 to-transparent rounded-full blur-3xl -z-0" />
      </motion.div>
      ) : (
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <h1 className="mb-1">Trade Calendar</h1>
            <p className="text-sm text-muted-foreground">
              Visual overview of your trading activity and performance
            </p>
          </div>
          <Button 
            onClick={onOpenTradeDialog} 
            className="gap-2"
            size="default"
          >
            <Plus className="h-4 w-4" />
            Quick Trade
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-primary-foreground/20 px-1.5 font-mono text-[10px] font-medium opacity-70">
              N
            </kbd>
          </Button>
        </div>
      )}

      {/* Performance Stats - Matching Overview Page */}
      {features.performanceOverview && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg">Performance</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/benchmarks')}
              className="gap-2 text-muted-foreground hover:text-foreground group"
            >
              See all benchmarks
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className={`border-border/50 bg-gradient-to-br ${stat.bgGradient} hover:shadow-md hover:border-border transition-all group h-full`}>
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1.5 opacity-80">{stat.title}</p>
                      <h3 className={`${stat.color} transition-all group-hover:scale-105 origin-left`}>
                        {stat.value}
                      </h3>
                      {stat.change !== undefined && (
                        <div className="flex items-center gap-1 mt-2">
                          {typeof stat.change === 'number' && stat.change !== 0 && (
                            stat.change > 0 ? (
                              <ArrowUp className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <ArrowDown className="h-3 w-3 text-red-600 dark:text-red-500" />
                            )
                          )}
                          <p className="text-xs text-muted-foreground">
                            {typeof stat.change === 'number' ? Math.abs(stat.change).toFixed(1) : stat.change} {stat.changeLabel}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className={`p-2.5 rounded-lg border ${stat.iconBg} shadow-sm group-hover:scale-110 transition-transform`}>
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </div>
                  {stat.sparkline && stat.sparkline.length > 0 ? (
                    <div className="mt-auto pt-3 border-t border-border/50">
                      <Sparkline data={stat.sparkline} width={120} height={28} />
                    </div>
                  ) : (
                    <div className="h-[49px]" />
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        </div>
      )}

      {/* Filters Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <AdvancedFilters
          filters={filters}
          onFiltersChange={setFilters}
          availableSymbols={availableSymbols}
          availableSetups={availableSetups}
          availableTags={availableTags}
          presets={presets}
          onSavePreset={handleSavePreset}
          onLoadPreset={handleLoadPreset}
          onDeletePreset={handleDeletePreset}
          horizontal={true}
        />
      </motion.div>

      {/* Calendar and Right Sidebar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6"
      >
        {/* Main Calendar */}
        <div className="order-2 lg:order-1">
          <TradingCalendar
            trades={filteredTrades}
            journalEntries={filteredJournalEntries}
            onAddTrade={onAddTrade}
            onAddJournalEntry={() => {}}
            onDeleteTrade={onDeleteTrade}
            onDeleteJournalEntry={() => {}}
            displayMode={displayMode}
            showWeekends={showWeekends}
            hideJournalFeatures={false}
            highlightedDate={highlightedDate}
            selectedDate={selectedDate}
            onSelectedDateChange={setSelectedDate}
            hideSelectedDateActivity={true}
          />
        </div>

        {/* Right Sidebar: Selected Date + Focus This Week */}
        <div className="order-1 lg:order-2 lg:sticky lg:top-6 lg:self-start space-y-4 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:pr-2 scrollbar-thin">
          {/* Selected Date Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <SelectedDatePanel
              selectedDate={selectedDate}
              trades={filteredTrades}
              journalEntry={filteredJournalEntries.find(j => j.date === selectedDate)}
              displayMode={displayMode}
              hideJournalFeatures={false}
            />
          </motion.div>
          
          {/* Focus This Week - at bottom */}
          {features.journalInsights && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <JournalInsights 
                trades={filteredTrades}
                journalEntries={journalEntries}
                displayMode={displayMode}
                onDateClick={(date) => {
                  setSelectedDate(date);
                  setHighlightedDate(date);
                  // Scroll to calendar
                  const calendarElement = document.querySelector('[data-calendar]');
                  if (calendarElement) {
                    calendarElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                  // Clear highlight after 3 seconds
                  setTimeout(() => setHighlightedDate(null), 3000);
                }}
              />
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
