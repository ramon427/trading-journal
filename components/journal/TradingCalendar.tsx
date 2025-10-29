import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Trade, JournalEntry } from '@/types/journal/trading';
import { DisplayMode } from '@/lib/journal/settings';
import { ChevronLeft, ChevronRight, Plus, BookOpen, TrendingUp, TrendingDown, Minus, Trash2, Edit, FileText, AlertTriangle, AlertCircle, Calendar as CalendarIcon, Columns3, Columns, CalendarDays, CalendarRange } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { stripHtml, isHtmlEmpty } from '@/lib/journal/htmlUtils';

interface TradingCalendarProps {
  trades: Trade[];
  journalEntries: JournalEntry[];
  onAddTrade: (trade: Trade) => void;
  onAddJournalEntry: (entry: JournalEntry) => void;
  onDeleteTrade: (tradeId: string) => void;
  onDeleteJournalEntry: (date: string) => void;
  displayMode: DisplayMode;
  showWeekends: boolean;
  hideJournalFeatures?: boolean;
  highlightedDate?: string | null;
  selectedDate?: string;
  onSelectedDateChange?: (date: string) => void;
  hideSelectedDateActivity?: boolean;
}

type CalendarMode = 'pnl' | 'news';

export function TradingCalendar({ trades, journalEntries, onAddTrade, onAddJournalEntry, onDeleteTrade, onDeleteJournalEntry, displayMode, showWeekends, hideJournalFeatures = false, highlightedDate = null, selectedDate: externalSelectedDate, onSelectedDateChange, hideSelectedDateActivity = false }: TradingCalendarProps) {
  const router = useRouter();
  // Initialize calendar to the most recent trade month, or current month if no trades
  const getInitialDate = () => {
    if (trades.length > 0) {
      const sortedTrades = [...trades].sort((a, b) => b.date.localeCompare(a.date));
      return new Date(sortedTrades[0].date);
    }
    // Default to current month if no trades
    return new Date();
  };
  
  const [currentDate, setCurrentDate] = useState(getInitialDate());
  const [internalSelectedDate, setInternalSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Use external selectedDate if provided, otherwise use internal state
  const selectedDate = externalSelectedDate !== undefined ? externalSelectedDate : internalSelectedDate;
  const setSelectedDate = (date: string) => {
    if (onSelectedDateChange) {
      onSelectedDateChange(date);
    } else {
      setInternalSelectedDate(date);
    }
  };
  const [sheetOpen, setSheetOpen] = useState(false);
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('pnl');
  const [deleteTradeId, setDeleteTradeId] = useState<string | null>(null);
  const [deleteJournalDate, setDeleteJournalDate] = useState<string | null>(null);
  const [doubleClickDebounce, setDoubleClickDebounce] = useState<NodeJS.Timeout | null>(null);


  // Keyboard shortcuts for month navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in input/textarea or if sheet is open
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || sheetOpen) {
        return;
      }

      // Left/Right arrow keys for month navigation
      if (e.key === 'ArrowLeft' && e.altKey) {
        e.preventDefault();
        previousMonth();
      } else if (e.key === 'ArrowRight' && e.altKey) {
        e.preventDefault();
        nextMonth();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sheetOpen]);

  // Cleanup double-click debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (doubleClickDebounce) {
        clearTimeout(doubleClickDebounce);
      }
    };
  }, [doubleClickDebounce]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Group trades by date (memoized for performance)
  const tradesByDate = useMemo(() => {
    const map = new Map<string, Trade[]>();
    trades.forEach(trade => {
      if (!map.has(trade.date)) {
        map.set(trade.date, []);
      }
      map.get(trade.date)!.push(trade);
    });
    return map;
  }, [trades]);

  // Group journal entries by date (memoized for performance)
  const journalByDate = useMemo(() => {
    const map = new Map<string, JournalEntry>();
    journalEntries.forEach(entry => {
      map.set(entry.date, entry);
    });
    return map;
  }, [journalEntries]);
  
  // Debug: Log journal entries with news events (development only)
  if (process.env.NODE_ENV === 'development') {
    const entriesWithNews = journalEntries.filter(e => e.newsEvents && e.newsEvents.length > 0);
    if (entriesWithNews.length > 0) {
      console.log('✅ Journal entries with news events:', entriesWithNews.map(e => ({
        date: e.date,
        eventCount: e.newsEvents?.length || 0
      })));
    }
  }

  const getDayPnL = (dateStr: string) => {
    const dayTrades = tradesByDate.get(dateStr) || [];
    return dayTrades.reduce((sum, trade) => sum + trade.pnl, 0);
  };

  const getDayRR = (dateStr: string) => {
    const dayTrades = tradesByDate.get(dateStr) || [];
    return dayTrades.reduce((sum, trade) => sum + (trade.rr || 0), 0);
  };

  const formatCurrency = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 1000) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatRR = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '0.0R';
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}R`;
  };

  // Calculate all P&L values for the visible period to determine heat map scaling
  const getVisibleDates = () => {
    const dates: string[] = [];
    
    // Month view: show all days in the month
    const monthYear = currentDate.getFullYear();
    const monthNum = currentDate.getMonth();
    const daysInCurrentMonth = new Date(monthYear, monthNum + 1, 0).getDate();
    
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const dateStr = `${monthYear}-${String(monthNum + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      dates.push(dateStr);
    }
    return dates;
  };

  const getHeatMapScale = () => {
    const visibleDates = getVisibleDates();
    const values = visibleDates.map(date => {
      const value = displayMode === 'rr' ? getDayRR(date) : getDayPnL(date);
      return Math.abs(value);
    }).filter(v => v > 0);
    
    if (values.length === 0) return displayMode === 'rr' ? 3 : 500;
    
    // Use 90th percentile for better scaling
    const sorted = values.sort((a, b) => a - b);
    const index = Math.floor(sorted.length * 0.9);
    const percentile90 = sorted[index] || sorted[sorted.length - 1];
    
    return Math.max(percentile90, displayMode === 'rr' ? 1 : 100);
  };

  const getCellColorClass = (dateStr: string) => {
    const dayTrades = tradesByDate.get(dateStr) || [];
    const dayJournal = journalByDate.get(dateStr);
    const dayPnL = getDayPnL(dateStr);
    const dayRR = getDayRR(dateStr);
    const hasActivity = dayTrades.length > 0 || dayJournal;
    const allMissed = dayTrades.length > 0 && dayTrades.every(t => t.missedTrade);

    if (!hasActivity) {
      return 'bg-card hover:bg-accent/50 border-border';
    }

    if (calendarMode === 'pnl') {
      const value = displayMode === 'rr' ? dayRR : dayPnL;
      const intensityDivisor = getHeatMapScale();
      
      if (value > 0) {
        const intensity = Math.min(value / intensityDivisor, 1);
        // More granular intensity levels for better visualization
        if (intensity > 0.8) return 'bg-green-200 hover:bg-green-300 border-green-400 dark:bg-green-900 dark:hover:bg-green-800 dark:border-green-700';
        if (intensity > 0.6) return 'bg-green-100 hover:bg-green-200 border-green-300 dark:bg-green-950 dark:hover:bg-green-900 dark:border-green-800';
        if (intensity > 0.4) return 'bg-green-50 hover:bg-green-100 border-green-200 dark:bg-green-950/70 dark:hover:bg-green-950 dark:border-green-900';
        if (intensity > 0.2) return 'bg-green-50/70 hover:bg-green-50 border-green-100 dark:bg-green-950/50 dark:hover:bg-green-950/70 dark:border-green-900/70';
        return 'bg-green-50/40 hover:bg-green-50/70 border-green-100/70 dark:bg-green-950/30 dark:hover:bg-green-950/50 dark:border-green-900/50';
      } else if (value < 0) {
        const intensity = Math.min(Math.abs(value) / intensityDivisor, 1);
        if (intensity > 0.8) return 'bg-red-200 hover:bg-red-300 border-red-400 dark:bg-red-900 dark:hover:bg-red-800 dark:border-red-700';
        if (intensity > 0.6) return 'bg-red-100 hover:bg-red-200 border-red-300 dark:bg-red-950 dark:hover:bg-red-900 dark:border-red-800';
        if (intensity > 0.4) return 'bg-red-50 hover:bg-red-100 border-red-200 dark:bg-red-950/70 dark:hover:bg-red-950 dark:border-red-900';
        if (intensity > 0.2) return 'bg-red-50/70 hover:bg-red-50 border-red-100 dark:bg-red-950/50 dark:hover:bg-red-950/70 dark:border-red-900/70';
        return 'bg-red-50/40 hover:bg-red-50/70 border-red-100/70 dark:bg-red-950/30 dark:hover:bg-red-950/50 dark:border-red-900/50';
      } else {
        return 'bg-gray-50 hover:bg-gray-100 border-gray-200 dark:bg-gray-900/50 dark:hover:bg-gray-900 dark:border-gray-800';
      }
    }

    if (calendarMode === 'news') {
      if (dayJournal?.newsEvents && dayJournal.newsEvents.length > 0) {
        return 'bg-purple-50 hover:bg-purple-100 border-purple-200 dark:bg-purple-950/50 dark:hover:bg-purple-950 dark:border-purple-900';
      } else if (dayJournal) {
        return 'bg-teal-50 hover:bg-teal-100 border-teal-200 dark:bg-teal-950/50 dark:hover:bg-teal-950 dark:border-teal-900';
      }
      return 'bg-gray-50 hover:bg-gray-100 border-gray-200 dark:bg-gray-900/50 dark:hover:bg-gray-900 dark:border-gray-800';
    }

    return 'bg-card hover:bg-accent/50 border-border';
  };

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const jumpToToday = () => {
    setCurrentDate(new Date());
    toast.success('Jumped to current month');
  };

  // Cleanup double-click debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (doubleClickDebounce) {
        clearTimeout(doubleClickDebounce);
      }
    };
  }, [doubleClickDebounce]);

  // Keyboard shortcuts for calendar navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if no input/textarea is focused or if contenteditable
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return;
      }

      // Alt + Arrow keys for month navigation
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentDate(new Date(year, month - 1, 1));
      } else if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentDate(new Date(year, month + 1, 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [month, year]);

  const handleEditTrade = (trade: Trade) => {
    setSheetOpen(false);
    router.push(`/dashboard/trades/${encodeURIComponent(trade.id)}`);
  };

  const confirmDeleteTrade = () => {
    if (deleteTradeId) {
      onDeleteTrade(deleteTradeId);
      setDeleteTradeId(null);
    }
  };

  const confirmDeleteJournalEntry = () => {
    if (deleteJournalDate) {
      onDeleteJournalEntry(deleteJournalDate);
      setDeleteJournalDate(null);
    }
  };

  // Calculate stats for visible period
  const getVisiblePeriodStats = () => {
    const visibleDates = getVisibleDates();
    const visibleTrades = trades.filter(t => visibleDates.includes(t.date));
    
    const totalPnL = visibleTrades.reduce((sum, t) => sum + t.pnl, 0);
    const totalRR = visibleTrades.reduce((sum, t) => sum + (t.rr || 0), 0);
    const wins = visibleTrades.filter(t => t.pnl > 0).length;
    const losses = visibleTrades.filter(t => t.pnl < 0).length;
    const winRate = visibleTrades.length > 0 ? (wins / visibleTrades.length) * 100 : 0;
    
    return {
      totalPnL,
      totalRR,
      totalTrades: visibleTrades.length,
      wins,
      losses,
      winRate,
    };
  };

  // Render a single month calendar
  const renderMonth = (monthOffset: number = 0) => {
    const monthDate = new Date(year, month + monthOffset, 1);
    const monthYear = monthDate.getFullYear();
    const monthNum = monthDate.getMonth();
    
    const firstDay = new Date(monthYear, monthNum, 1);
    const lastDay = new Date(monthYear, monthNum + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const daysInCurrentMonth = lastDay.getDate();
    
    const days = [];
    
    // Add empty cells for days before the start of the month
    if (showWeekends) {
      for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(<div key={`empty-${monthOffset}-${i}`} className="h-20 sm:h-24" />);
      }
    } else {
      const adjustedStart = startingDayOfWeek === 0 ? 0 : startingDayOfWeek - 1;
      for (let i = 0; i < adjustedStart; i++) {
        days.push(<div key={`empty-${monthOffset}-${i}`} className="h-20 sm:h-24" />);
      }
    }

    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const dateStr = `${monthYear}-${String(monthNum + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const currentDayOfWeek = new Date(monthYear, monthNum, day).getDay();
      
      // Skip weekends if showWeekends is false
      if (!showWeekends && (currentDayOfWeek === 0 || currentDayOfWeek === 6)) {
        continue;
      }
      
      const dayTrades = tradesByDate.get(dateStr) || [];
      const dayJournal = journalByDate.get(dateStr);
      const dayPnL = getDayPnL(dateStr);
      const dayRR = getDayRR(dateStr);
      const hasActivity = dayTrades.length > 0 || dayJournal;
      const colorClass = getCellColorClass(dateStr);
      
      const displayValue = displayMode === 'rr' ? dayRR : dayPnL;
      const displayText = displayMode === 'rr' ? formatRR(dayRR) : formatCurrency(dayPnL);
      const isHighlighted = highlightedDate === dateStr;
      const isToday = dateStr === new Date().toISOString().split('T')[0];
      const isSelected = selectedDate === dateStr;

      days.push(
        <div
          key={`${monthOffset}-${day}`}
          data-date={dateStr}
          className={`calendar-cell ${calendarMode === 'news' ? 'h-24 sm:h-28' : 'h-20 sm:h-24'} border rounded-lg p-1 sm:p-1.5 cursor-pointer transition-all relative overflow-hidden select-none ${colorClass} ${
            isHighlighted ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background shadow-lg scale-105' : ''
          } ${isToday ? 'ring-1 ring-primary/30' : ''} ${isSelected ? 'ring-2 ring-primary shadow-md' : ''}`}
          onClick={(e) => {
            const target = e.currentTarget;
            target.classList.add('calendar-cell-click');
            setTimeout(() => target.classList.remove('calendar-cell-click'), 200);
            setSelectedDate(dateStr);
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            
            // Debounce to prevent multiple rapid navigations
            if (doubleClickDebounce) {
              return; // Ignore if within debounce period
            }
            
            const target = e.currentTarget;
            target.classList.add('calendar-cell-double-click');
            setTimeout(() => target.classList.remove('calendar-cell-double-click'), 400);
            
            // Set debounce timeout
            const timeout = setTimeout(() => {
              setDoubleClickDebounce(null);
            }, 500);
            setDoubleClickDebounce(timeout);
            
            router.push(`/dashboard/journal/add?date=${encodeURIComponent(dateStr)}`);
          }}
        >
          {/* Subtle gradient overlay for profit/loss days */}
          {hasActivity && calendarMode === 'pnl' && (
            <div 
              className={`absolute inset-0 pointer-events-none ${
                displayValue > 0 
                  ? 'bg-gradient-to-br from-green-500/5 via-transparent to-transparent' 
                  : displayValue < 0 
                  ? 'bg-gradient-to-br from-red-500/5 via-transparent to-transparent'
                  : ''
              }`}
            />
          )}
          <div className="flex flex-col h-full relative z-10">
            {/* Day number and indicators */}
            <div className="flex items-start justify-between mb-0.5 sm:mb-1">
              <div className="flex items-center gap-1">
                <span className={`text-xs sm:text-sm ${isToday ? 'font-bold' : 'font-semibold'}`}>
                  {day}
                </span>
                {dayJournal && !dayJournal.followedSystem && calendarMode === 'pnl' && (
                  <AlertTriangle className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-destructive" title="Rule-breaking day" />
                )}
              </div>
              {dayTrades.length > 0 && (
                <span className="text-[10px] sm:text-xs font-medium text-muted-foreground">
                  {dayTrades.length}
                </span>
              )}
            </div>
            
            {/* P&L / R Display (P&L Mode) */}
            {calendarMode === 'pnl' && (dayTrades.length > 0 || dayJournal) && (
              <div className="flex-1 flex items-center justify-center">
                <div className={`text-center ${
                  displayValue > 0 ? 'text-green-700 dark:text-green-400' : 
                  displayValue < 0 ? 'text-red-700 dark:text-red-400' : 
                  'text-muted-foreground'
                }`}>
                  <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                    {displayValue > 0 ? (
                      <TrendingUp className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                    ) : displayValue < 0 ? (
                      <TrendingDown className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                    ) : (
                      <Minus className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                    )}
                  </div>
                  <div className="text-[10px] sm:text-xs font-semibold mt-0.5">
                    {displayValue === 0 ? '+0' : displayText}
                  </div>
                </div>
              </div>
            )}

            {/* News Events Display (News Mode) */}
            {calendarMode === 'news' && dayJournal?.newsEvents && dayJournal.newsEvents.length > 0 && (
              <div className="flex-1 flex flex-col gap-0.5 justify-start overflow-hidden">
                {dayJournal.newsEvents.slice(0, 2).map((event, idx) => (
                  <div
                    key={idx}
                    className="bg-purple-600 dark:bg-purple-700 text-white px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] leading-tight font-semibold truncate"
                    title={`${event.name} - ${event.time}`}
                  >
                    {event.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const visibleStats = getVisiblePeriodStats();

  // Removed renderYear function - year view removed

  return (
    <div className="space-y-6" data-calendar>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            {/* Top Row: Title and Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle>
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                {/* Calendar Mode Selector */}
                <ToggleGroup type="single" value={calendarMode} onValueChange={(value) => value && setCalendarMode(value as CalendarMode)} size="sm">
                  <ToggleGroupItem value="pnl" aria-label="P&L Mode">
                    P&L
                  </ToggleGroupItem>
                  <ToggleGroupItem value="news" aria-label="News Mode">
                    News
                  </ToggleGroupItem>
                </ToggleGroup>
                
                {/* Period Navigation */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={previousMonth} className="min-h-9" title="Previous month (Alt + Left Arrow)">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={jumpToToday} className="min-h-9 gap-2" title="Jump to today">
                    <CalendarDays className="h-4 w-4" />
                    <span className="hidden sm:inline">Today</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={nextMonth} className="min-h-9" title="Next month (Alt + Right Arrow)">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap gap-4 pt-3 border-t">
              {calendarMode === 'pnl' && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-green-100 dark:bg-green-950 border border-green-300 dark:border-green-800"></div>
                    <span className="text-xs text-muted-foreground">Profit</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-100 dark:bg-red-950 border border-red-300 dark:border-red-800"></div>
                    <span className="text-xs text-muted-foreground">Loss</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800"></div>
                    <span className="text-xs text-muted-foreground">Breakeven</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-destructive" />
                    <span className="text-xs text-muted-foreground">Rule-Breaking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded ring-1 ring-primary/30"></div>
                    <span className="text-xs text-muted-foreground">Today</span>
                  </div>
                </>
              )}
              
              {calendarMode === 'news' && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-900"></div>
                    <span className="text-xs text-muted-foreground">Has News Events</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-900"></div>
                    <span className="text-xs text-muted-foreground">Regular Day</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-purple-600 dark:bg-purple-700"></div>
                    <span className="text-xs text-muted-foreground">News Event Badge</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`grid ${showWeekends ? 'grid-cols-7' : 'grid-cols-5'} gap-1 sm:gap-1.5 mb-2`}>
            {(showWeekends 
              ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] 
              : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
            ).map(day => (
              <div key={day} className="text-center text-muted-foreground text-xs sm:text-sm">
                {day}
              </div>
            ))}
          </div>
          <div className={`grid ${showWeekends ? 'grid-cols-7' : 'grid-cols-5'} gap-1 sm:gap-1.5`}>
            {renderMonth(0)}
          </div>
        </CardContent>

        {/* Selected Date Activity */}
        <div className="px-6 pb-6">
          {!hideSelectedDateActivity && (() => {
            const today = new Date().toISOString().split('T')[0];
            const selectedTrades = tradesByDate.get(selectedDate) || [];
            const selectedJournal = journalByDate.get(selectedDate);
            const hasSelectedData = selectedTrades.length > 0 || selectedJournal;
            const isToday = selectedDate === today;

            return (
              <div className="mt-4 pt-4 border-t space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs text-muted-foreground">
                    {isToday ? "Today's Activity" : "Selected Date"}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: selectedDate.split('-')[0] !== today.split('-')[0] ? 'numeric' : undefined })}
                    </span>
                    {!isToday && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedDate(today)}
                        className="h-5 px-2 text-xs"
                      >
                        Today
                      </Button>
                    )}
                  </div>
                </div>

                {!hasSelectedData ? (
                  <div className="bg-muted/30 border border-dashed border-border rounded-lg p-4 text-center space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {isToday ? 'No trades or journal entries yet today' : 'No activity on this date'}
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (!hideJournalFeatures) {
                            router.push(`/dashboard/journal/add?date=${encodeURIComponent(selectedDate)}`);
                          }
                        }}
                        className="gap-2"
                        disabled={hideJournalFeatures}
                      >
                        <BookOpen className="h-3 w-3" />
                        Add Journal
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/dashboard/trades/add?date=${encodeURIComponent(selectedDate)}`)}
                        className="gap-2"
                      >
                        <Plus className="h-3 w-3" />
                        Add Trade
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Journal Entry */}
                    {selectedJournal && !hideJournalFeatures && (
                      <button
                        onClick={(e) => {
                          const target = e.currentTarget;
                          target.classList.add('activity-item-click');
                          setTimeout(() => target.classList.remove('activity-item-click'), 300);
                          router.push(`/dashboard/journal/add?date=${encodeURIComponent(selectedDate)}`);
                        }}
                        className="activity-item w-full bg-accent/50 hover:bg-accent border border-border rounded-lg p-3 text-left transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <BookOpen className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">Journal Entry</span>
                            </div>
                            {/* Compact Journal Info */}
                            <div className="space-y-1">
                              {!isHtmlEmpty(selectedJournal.notes) ? (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {stripHtml(selectedJournal.notes)}
                                </p>
                              ) : (
                                <p className="text-xs text-muted-foreground italic">
                                  No description added
                                </p>
                              )}
                              {(selectedJournal.lessonsLearned || selectedJournal.marketConditions) && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                  {selectedJournal.lessonsLearned && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <span className="line-clamp-1">{selectedJournal.lessonsLearned}</span>
                                    </div>
                                  )}
                                  {selectedJournal.marketConditions && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <span className="line-clamp-1">{selectedJournal.marketConditions}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                              {/* Journal Metadata */}
                              <div className="flex flex-wrap gap-2 pt-1">
                                {selectedJournal.followedSystem !== undefined && !selectedJournal.followedSystem && (
                                  <Badge variant="destructive" className="h-4 px-1.5 text-[10px]">
                                    Off-system
                                  </Badge>
                                )}
                                {selectedJournal.isNewsDay && (
                                  <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                                    News day
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    )}

                    {/* Trades */}
                    {selectedTrades.length > 0 && (
                      <div className="space-y-1.5">
                        {selectedTrades.slice(0, 3).map((trade) => (
                          <button
                            key={trade.id}
                            onClick={(e) => {
                              const target = e.currentTarget;
                              target.classList.add('activity-item-click');
                              setTimeout(() => target.classList.remove('activity-item-click'), 300);
                              router.push(`/dashboard/trades/${encodeURIComponent(trade.id)}`);
                            }}
                            className="activity-item w-full bg-accent/50 hover:bg-accent border border-border rounded-lg p-2.5 text-left transition-all"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <Badge 
                                  variant={trade.pnl >= 0 ? 'default' : 'destructive'} 
                                  className="h-5 px-1.5 text-xs flex-shrink-0"
                                >
                                  {trade.type === 'long' ? '↑' : '↓'}
                                </Badge>
                                <div className="min-w-0">
                                  <p className="text-sm truncate">{trade.name || trade.symbol}</p>
                                  {trade.name && (
                                    <p className="text-xs text-muted-foreground">{trade.symbol}</p>
                                  )}
                                </div>
                              </div>
                              <Badge 
                                variant={trade.pnl >= 0 ? 'default' : 'destructive'}
                                className="text-xs flex-shrink-0"
                              >
                                {displayMode === 'rr' ? `${trade.rr?.toFixed(1) || 0}R` : formatCurrency(trade.pnl)}
                              </Badge>
                            </div>
                          </button>
                        ))}
                        {selectedTrades.length > 3 && (
                          <button
                            onClick={() => {
                              setSheetOpen(true);
                            }}
                            className="w-full text-center text-xs text-muted-foreground hover:text-foreground py-2 transition-colors"
                          >
                            +{selectedTrades.length - 3} more trade{selectedTrades.length - 3 !== 1 ? 's' : ''}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </Card>

      {/* Date Details Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-xl overflow-y-auto p-0 flex flex-col">
          {/* Header - Fixed */}
          <div className="sticky top-0 z-10 bg-background border-b border-border px-6 py-5">
            <SheetHeader className="space-y-2">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-2xl">
                  {selectedDate && new Date(selectedDate).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </SheetTitle>
                <Badge variant="secondary" className="text-xs">
                  {selectedDate && new Date(selectedDate).toLocaleDateString('en-US', { 
                    weekday: 'long'
                  })}
                </Badge>
              </div>
              <SheetDescription className="sr-only">
                View and manage trades and journal entries for this day
              </SheetDescription>
              <div className="flex items-center gap-3">
                {selectedDate && tradesByDate.has(selectedDate) && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>{tradesByDate.get(selectedDate)!.length} {tradesByDate.get(selectedDate)!.length === 1 ? 'trade' : 'trades'}</span>
                  </div>
                )}
                {selectedDate && journalByDate.has(selectedDate) && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>Journal entry</span>
                  </div>
                )}
              </div>
            </SheetHeader>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-6 py-6 space-y-6">
              {/* Quick Actions - Only show when no data */}
              {selectedDate && !tradesByDate.has(selectedDate) && !journalByDate.has(selectedDate) && (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => {
                      if (selectedDate) {
                        // Create a default journal entry for this day if it doesn't exist
                        if (!journalByDate.has(selectedDate)) {
                          const defaultJournalEntry: JournalEntry = {
                            date: selectedDate,
                            mood: 'neutral',
                            notes: '',
                            lessonsLearned: '',
                            marketConditions: '',
                            didTrade: true,
                            followedSystem: true,
                            isNewsDay: false,
                          };
                          onAddJournalEntry(defaultJournalEntry);
                        }
                        setSheetOpen(false);
                        // Navigate to full add-trade page with date
                        router.push(`/dashboard/trades/add?date=${encodeURIComponent(selectedDate)}`);
                      }
                    }}
                    className="h-20 flex flex-col gap-1.5 border-dashed hover:border-solid transition-all"
                    variant="outline"
                  >
                    <Plus className="h-5 w-5" />
                    <span className="text-sm">Add Trade</span>
                  </Button>
                  <Button
                    onClick={() => {
                      if (selectedDate) {
                        router.push(`/dashboard/journal/add?date=${encodeURIComponent(selectedDate)}`);
                      }
                    }}
                    className="h-20 flex flex-col gap-1.5 border-dashed hover:border-solid transition-all"
                    variant="outline"
                  >
                    <FileText className="h-5 w-5" />
                    <span className="text-sm">Add Journal</span>
                  </Button>
                </div>
              )}

              {selectedDate && (
                <>
                  {/* Journal Entry */}
                  {journalByDate.has(selectedDate) && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <h3 className="text-sm">Journal Entry</h3>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteJournalDate(selectedDate);
                          }}
                          className="h-7 w-7 p-0 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      
                      <div 
                        className="space-y-4 rounded-lg border border-border bg-card p-4 cursor-pointer hover:border-foreground/20 hover:shadow-sm transition-all"
                        onClick={() => router.push(`/dashboard/journal/add?date=${encodeURIComponent(selectedDate)}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            router.push(`/dashboard/journal/add?date=${encodeURIComponent(selectedDate)}`);
                          }
                        }}
                      >
                        {/* Metadata pills */}
                        <div className="flex flex-wrap gap-2">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-xs">
                            <span>
                              {journalByDate.get(selectedDate)!.mood === 'excellent' && '😄'}
                              {journalByDate.get(selectedDate)!.mood === 'good' && '🙂'}
                              {journalByDate.get(selectedDate)!.mood === 'neutral' && '😐'}
                              {journalByDate.get(selectedDate)!.mood === 'poor' && '😕'}
                              {journalByDate.get(selectedDate)!.mood === 'terrible' && '😞'}
                            </span>
                            <span className="capitalize">{journalByDate.get(selectedDate)!.mood}</span>
                          </div>
                          <Badge 
                            variant={journalByDate.get(selectedDate)!.followedSystem ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {journalByDate.get(selectedDate)!.followedSystem ? '✓ System Followed' : '⚠ Deviated'}
                          </Badge>
                          {journalByDate.get(selectedDate)!.isNewsDay && (
                            <Badge variant="secondary" className="text-xs">
                              📰 News Day
                            </Badge>
                          )}
                        </div>

                        {/* Content sections */}
                        <div className="space-y-3">
                          {journalByDate.get(selectedDate)!.marketConditions && (
                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground">Market Conditions</div>
                              <div className="text-sm">{journalByDate.get(selectedDate)!.marketConditions}</div>
                            </div>
                          )}
                          {journalByDate.get(selectedDate)!.notes && (
                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground">Notes</div>
                              <div className="text-sm leading-relaxed">{journalByDate.get(selectedDate)!.notes}</div>
                            </div>
                          )}
                          {journalByDate.get(selectedDate)!.lessonsLearned && (
                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground">Lessons Learned</div>
                              <div className="text-sm leading-relaxed">{journalByDate.get(selectedDate)!.lessonsLearned}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Trades */}
                  {tradesByDate.has(selectedDate) && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm">
                          Trades · {tradesByDate.get(selectedDate)!.length}
                        </h3>
                      </div>
                      <div className="space-y-2">
                        {tradesByDate.get(selectedDate)!.map((trade) => (
                          <div 
                            key={trade.id} 
                            className="group relative rounded-lg border border-border bg-card hover:border-foreground/20 transition-all cursor-pointer"
                            onClick={() => {
                              router.push(`/dashboard/trades/${encodeURIComponent(trade.id)}`);
                            }}
                          >
                            <div className="p-4 space-y-3">
                              {/* Header Row */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="font-medium">{trade.symbol}</span>
                                  <Badge 
                                    variant={trade.type === 'long' ? 'default' : 'secondary'}
                                    className="text-xs uppercase"
                                  >
                                    {trade.type}
                                  </Badge>
                                  {trade.setup && (
                                    <span className="text-xs text-muted-foreground truncate">
                                      {trade.setup}
                                    </span>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {/* P&L Display */}
                                  <div className="flex flex-col items-end gap-0.5">
                                    <span className={`text-sm font-medium ${
                                      trade.pnl >= 0 
                                        ? 'text-green-600 dark:text-green-400' 
                                        : 'text-red-600 dark:text-red-400'
                                    }`}>
                                      {displayMode === 'rr' && trade.rr !== undefined 
                                        ? formatRR(trade.rr) 
                                        : formatCurrency(trade.pnl)
                                      }
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {displayMode === 'rr' && trade.rr !== undefined 
                                        ? formatCurrency(trade.pnl)
                                        : trade.rr !== undefined ? formatRR(trade.rr) : ''
                                      }
                                    </span>
                                  </div>

                                  {/* Action Buttons - Hidden until hover */}
                                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/dashboard/trades/${encodeURIComponent(trade.id)}`);
                                      }}
                                      className="h-7 w-7 p-0"
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteTradeId(trade.id);
                                      }}
                                      className="h-7 w-7 p-0 hover:text-destructive"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              {/* Details Row */}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <span>Entry:</span>
                                  <span className="text-foreground">${trade.entryPrice.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span>Exit:</span>
                                  <span className="text-foreground">
                                    {trade.exitPrice !== null ? `${trade.exitPrice.toFixed(2)}` : 'Open'}
                                  </span>
                                </div>
                                {trade.quantity && (
                                  <div className="flex items-center gap-1">
                                    <span>{trade.quantity} shares</span>
                                  </div>
                                )}
                              </div>

                              {/* Notes */}
                              {trade.notes && (
                                <div className="text-xs text-muted-foreground leading-relaxed line-clamp-2 pt-1 border-t border-border/50">
                                  {trade.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}


                </>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmations */}
      <AlertDialog open={deleteTradeId !== null} onOpenChange={(open) => !open && setDeleteTradeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Trade</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this trade? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTrade} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteJournalDate !== null} onOpenChange={(open) => !open && setDeleteJournalDate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Journal Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this journal entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteJournalEntry} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
