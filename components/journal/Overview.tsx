import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { usePageFeatures } from '@/lib/journal/usePageFeatures';
import { useGlobalSettings } from '@/lib/journal/useGlobalSettings';
import { Trade, JournalEntry, Statistics } from '@/types/journal/trading';
import { SetupBadge } from './SetupBadge';
import { 
  Activity, 
  Calendar, 
  BookOpen,
  Smile,
  Meh,
  Frown,
  AlertCircle,
  DoorOpen,
  ChevronRight,
  Edit3,
  Plus,
  StickyNote,
  Check,
  Archive,
  X,
  DollarSign,
  Target,
  Award,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Home,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { DisplayMode } from '@/lib/journal/settings';
import { useRouter } from 'next/navigation';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Sparkline } from './Sparkline';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { 
  loadCurrentNote, 
  saveCurrentNote, 
  archiveCurrentNote, 
  createNewNote, 
  updateNoteContent,
  loadArchivedNotes,
  deleteArchivedNote,
  DailyNote
} from '@/lib/journal/dailyNotes';
import { toast } from 'sonner';
import { TasksCard } from './TasksCard';
import { detectTasks } from '@/lib/journal/taskDetection';
import { formatCurrency, formatRR, getTodayDate, isTradeOpen, isTradeClosed } from '@/lib/journal/formatters';
import { stripHtml, isHtmlEmpty } from '@/lib/journal/htmlUtils';

interface OverviewProps {
  trades: Trade[];
  journalEntries: JournalEntry[];
  stats: Statistics;
  displayMode: DisplayMode;
  onCloseTrade?: (trade: Trade) => void;
}

export function Overview({ trades, journalEntries, stats, displayMode, onCloseTrade }: OverviewProps) {
  const router = useRouter();
  const features = usePageFeatures('home');
  const globalSettings = useGlobalSettings();
  const [currentNote, setCurrentNote] = useState<DailyNote | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    const note = loadCurrentNote();
    setCurrentNote(note);
    setNoteContent(note?.content || '');
  }, []);

  const handleNoteChange = (value: string) => {
    setNoteContent(value);
    
    // Auto-save the note
    let note = currentNote;
    if (!note) {
      note = createNewNote(value);
      setCurrentNote(note);
    } else {
      note = updateNoteContent(note, value);
      setCurrentNote(note);
    }
    saveCurrentNote(note);
  };

  const handleCompleteNote = () => {
    if (!currentNote || !currentNote.content.trim()) {
      toast.error('Note is empty');
      return;
    }

    archiveCurrentNote(currentNote);
    setCurrentNote(null);
    setNoteContent('');
    toast.success('Note archived! Starting fresh.');
  };

  // Open positions - use safe helper that handles legacy data
  const openTrades = trades.filter(t => isTradeOpen(t));
  
  // Today's data
  const today = getTodayDate();
  // Filter trades that were closed today (check exitDate primarily, then date as fallback)
  const todayTrades = trades.filter(t => {
    if (!isTradeClosed(t)) return false;
    const tradeDate = t.exitDate || t.date;
    return tradeDate === today;
  });
  const todayJournal = journalEntries.find(e => e.date === today);
  
  const todayPnL = todayTrades.reduce((sum, t) => sum + t.pnl, 0);
  const todayRR = todayTrades.reduce((sum, t) => sum + (t.rr || 0), 0);

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'excellent':
      case 'good':
        return <Smile className="h-4 w-4 text-green-600 dark:text-green-500" />;
      case 'neutral':
        return <Meh className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />;
      case 'poor':
      case 'terrible':
        return <Frown className="h-4 w-4 text-red-600 dark:text-red-500" />;
      default:
        return null;
    }
  };

  const formatValue = (value: number) => {
    return displayMode === 'rr' ? formatRR(value) : formatCurrency(value);
  };

  const totalValue = displayMode === 'rr' ? (stats.totalRR || 0) : stats.totalPnl;
  const profitFactorValue = displayMode === 'rr' ? (stats.profitFactorRR || 0) : stats.profitFactor;

  // Calculate sparkline data (last 10 trades cumulative)
  const recentTrades = [...trades].sort((a, b) => a.date.localeCompare(b.date)).slice(-10);
  const sparklineData = recentTrades.reduce((acc: number[], trade, index) => {
    const previous = index > 0 ? acc[index - 1] : 0;
    const value = displayMode === 'rr' ? (trade.rr || 0) : trade.pnl;
    acc.push(previous + value);
    return acc;
  }, []);

  // Detect tasks
  const tasks = useMemo(() => {
    return detectTasks(trades, journalEntries, displayMode);
  }, [trades, journalEntries, displayMode]);

  // Stat cards
  const statCards = [
    {
      title: displayMode === 'rr' ? 'Total R:R' : 'Total P&L',
      value: formatValue(totalValue),
      change: stats.expectancy,
      changeLabel: 'Avg per trade',
      icon: DollarSign,
      color: totalValue >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-500',
      bgGradient: totalValue >= 0 ? 'from-emerald-500/5 to-emerald-500/0' : 'from-red-500/5 to-red-500/0',
      iconBg: totalValue >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20',
      sparkline: sparklineData,
    },
    {
      title: 'Win Rate',
      value: `${stats.winRate.toFixed(1)}%`,
      change: stats.winningTrades > stats.losingTrades ? stats.winningTrades - stats.losingTrades : -(stats.losingTrades - stats.winningTrades),
      changeLabel: stats.winningTrades > stats.losingTrades ? 'more wins' : 'more losses',
      icon: Target,
      color: stats.winRate >= 50 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400',
      bgGradient: stats.winRate >= 50 ? 'from-blue-500/5 to-blue-500/0' : 'from-orange-500/5 to-orange-500/0',
      iconBg: stats.winRate >= 50 ? 'bg-blue-500/10 border-blue-500/20' : 'bg-orange-500/10 border-orange-500/20',
    },
    {
      title: 'Total Trades',
      value: stats.totalTrades.toString(),
      change: stats.winningTrades,
      changeLabel: 'winners',
      icon: Activity,
      color: 'text-violet-600 dark:text-violet-400',
      bgGradient: 'from-violet-500/5 to-violet-500/0',
      iconBg: 'bg-violet-500/10 border-violet-500/20',
    },
    {
      title: 'Profit Factor',
      value: profitFactorValue === Infinity ? '∞' : profitFactorValue.toFixed(2),
      change: stats.totalTrades > 0 ? (stats.winningTrades / stats.totalTrades) * 100 : 0,
      changeLabel: 'win rate',
      icon: Award,
      color: profitFactorValue >= 2 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-gray-400',
      bgGradient: profitFactorValue >= 2 ? 'from-amber-500/5 to-amber-500/0' : 'from-gray-500/5 to-gray-500/0',
      iconBg: profitFactorValue >= 2 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-gray-500/10 border-gray-500/20',
    },
  ];

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
              <div className="flex items-center gap-3 mb-2">
                <motion.div 
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                  className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 shadow-sm"
                >
                  <Home className="h-5 w-5 text-primary" />
                </motion.div>
                <h1 className="mb-0 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  {getGreeting()}
                </h1>
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long',
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </p>
            </div>
            
            {/* Quick Stats Preview */}
            <div className="flex items-center gap-3">
              {todayTrades.length > 0 && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground mb-0.5">Today</p>
                  <p className={`text-sm ${(displayMode === 'rr' ? todayRR : todayPnL) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-500'}`}>
                    {displayMode === 'rr' ? formatRR(todayRR) : formatCurrency(todayPnL)}
                  </p>
                </div>
              )}
              {openTrades.length > 0 && (
                <Badge 
                  variant="outline" 
                  className="border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm"
                >
                  {openTrades.length} open
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/8 via-purple-500/5 to-transparent rounded-full blur-3xl -z-0" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-500/8 via-primary/5 to-transparent rounded-full blur-3xl -z-0" />
      </motion.div>
      ) : (
        <div className="pb-4 border-b border-border">
          <h1 className="mb-1">Overview</h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long',
              month: 'long', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </p>
        </div>
      )}

      {/* Performance Snapshot */}
      {features.performanceInsights && (
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

      {/* Tasks & Reminders */}
      {features.tasksReminders && tasks.length > 0 && (
        <TasksCard tasks={tasks} />
      )}

      {/* Open Positions */}
      {features.openTrades && openTrades.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="border-blue-500/30 bg-gradient-to-br from-blue-50/50 via-blue-50/30 to-transparent dark:from-blue-950/30 dark:via-blue-950/20 dark:to-transparent shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <DoorOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span>Open Positions</span>
                </CardTitle>
                <Badge variant="outline" className="border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm">
                  {openTrades.length} {openTrades.length === 1 ? 'Position' : 'Positions'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {openTrades.map((trade, idx) => {
                  const riskPips = trade.stopLoss ? Math.abs(trade.entryPrice - trade.stopLoss) : null;
                  const rewardPips = trade.target ? Math.abs(trade.target - trade.entryPrice) : null;
                  const rrRatio = riskPips && rewardPips ? (rewardPips / riskPips) : null;
                  const entryDate = new Date(trade.date);
                  const todayDate = new Date();
                  const daysHeld = Math.floor((todayDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
                  const formatPips = (price: number) => price.toFixed(5);
                  
                  return (
                    <motion.div
                      key={trade.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      className="p-4 rounded-lg border border-blue-500/20 bg-card/50 hover:bg-card hover:border-blue-500/40 hover:shadow-md transition-all duration-200 cursor-pointer group"
                      onClick={() => router.push(`/dashboard/trades/${encodeURIComponent(trade.id)}`)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 min-w-[140px]">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="mb-0 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {trade.name || trade.symbol}
                            </h4>
                            <Badge 
                              variant={trade.type === 'long' ? 'default' : 'secondary'} 
                              className="text-xs shadow-sm"
                            >
                              {trade.type === 'long' ? '↑ LONG' : '↓ SHORT'}
                            </Badge>
                          </div>
                          {trade.name && <p className="text-xs text-muted-foreground">{trade.symbol}</p>}
                          {trade.setup && (
                            <div className="mt-1.5">
                              <SetupBadge setupName={trade.setup} className="text-xs border-blue-500/30" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 flex items-center gap-4 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">Entry:</span>
                            <span className="text-sm font-medium">{formatPips(trade.entryPrice)}</span>
                          </div>
                          {trade.stopLoss && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-red-600 dark:text-red-400">Stop:</span>
                              <span className="text-sm font-medium text-red-600 dark:text-red-400">{formatPips(trade.stopLoss)}</span>
                            </div>
                          )}
                          {trade.target && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-emerald-600 dark:text-emerald-400">Target:</span>
                              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{formatPips(trade.target)}</span>
                            </div>
                          )}
                          {riskPips && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-muted-foreground">Risk:</span>
                              <span className="text-sm font-medium">{riskPips.toFixed(1)} pips</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-xs text-muted-foreground text-right">
                            <div>{new Date(trade.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                            <div className="opacity-70">{daysHeld}d held</div>
                          </div>
                          {rrRatio && (
                            <Badge variant="outline" className="text-xs border-blue-500/30 shadow-sm">
                              1:{rrRatio.toFixed(1)}
                            </Badge>
                          )}
                          {onCloseTrade && (
                            <Button 
                              onClick={(e) => {
                                e.stopPropagation();
                                onCloseTrade(trade);
                              }}
                              variant="default"
                              size="sm"
                              className="shadow-sm"
                            >
                              Close
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Today Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <span>Today</span>
              <span className="text-sm text-muted-foreground font-normal">
                {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayTrades.length > 0 || todayJournal ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {todayTrades.length > 0 ? (
                    <div className="p-5 rounded-lg border border-border/50 bg-gradient-to-br from-muted/50 to-background hover:from-muted/70 hover:shadow-sm transition-all group">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-muted-foreground opacity-80">Today's {displayMode === 'rr' ? 'R:R' : 'P&L'}</p>
                        <Activity className="h-4 w-4 text-muted-foreground group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <h2 className={`mb-0 ${(displayMode === 'rr' ? todayRR : todayPnL) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-500'}`}>
                          {displayMode === 'rr' ? formatRR(todayRR) : formatCurrency(todayPnL)}
                        </h2>
                        {(displayMode === 'rr' ? todayRR : todayPnL) >= 0 ? (
                          <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-500" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {todayTrades.length} trade{todayTrades.length !== 1 ? 's' : ''} completed
                      </p>
                    </div>
                  ) : (
                    <div className="p-5 rounded-lg border border-dashed border-border bg-muted/20 flex flex-col items-center justify-center text-center hover:bg-muted/30 transition-all">
                      <p className="text-sm text-muted-foreground mb-3">No trades yet today</p>
                      <Button
                        onClick={() => router.push(`/dashboard/trades/quick-add?date=${encodeURIComponent(today)}`)}
                        variant="default"
                        size="sm"
                        className="gap-2 shadow-sm"
                      >
                        <Plus className="h-4 w-4" />
                        Add Trade
                      </Button>
                    </div>
                  )}

                  {todayJournal ? (
                    <div 
                      className="p-5 rounded-lg border border-border/50 bg-gradient-to-br from-muted/50 to-background cursor-pointer hover:from-muted/70 hover:shadow-sm hover:border-primary/50 transition-all duration-200 group relative"
                      onClick={() => router.push(`/dashboard/journal/add?date=${encodeURIComponent(today)}`)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-muted-foreground opacity-80">Mood & Status</p>
                        <div className="flex items-center gap-2">
                          {getMoodIcon(todayJournal.mood)}
                          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                      <h3 className="capitalize mb-2 group-hover:text-primary transition-colors">
                        {todayJournal.mood}
                      </h3>
                      <div className="flex gap-2 flex-wrap">
                        {todayJournal.followedSystem && (
                          <Badge variant="outline" className="text-xs border-emerald-600/20 bg-emerald-600/10 text-emerald-600 dark:text-emerald-400">
                            Followed System
                          </Badge>
                        )}
                        {todayJournal.isNewsDay && (
                          <Badge variant="outline" className="text-xs border-amber-600/20 bg-amber-600/10 text-amber-600 dark:text-amber-400">
                            News Day
                          </Badge>
                        )}
                      </div>
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 rounded-lg border border-dashed border-border bg-muted/20 flex flex-col items-center justify-center text-center hover:bg-muted/30 transition-all">
                      <p className="text-sm text-muted-foreground mb-3">No journal entry today</p>
                      <Button
                        onClick={() => router.push(`/dashboard/journal/add?date=${encodeURIComponent(today)}`)}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <BookOpen className="h-4 w-4" />
                        Add Journal
                      </Button>
                    </div>
                  )}
                </div>

                {todayJournal && todayJournal.notes && !isHtmlEmpty(todayJournal.notes) && (
                  <div 
                    className="p-4 rounded-lg bg-muted/30 border border-border/50 border-l-2 border-l-primary cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-all duration-200 group"
                    onClick={() => router.push(`/dashboard/journal/add?date=${encodeURIComponent(today)}`)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <BookOpen className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0 group-hover:text-primary transition-colors" />
                        <div className="text-sm text-muted-foreground flex-1 line-clamp-2 group-hover:text-foreground transition-colors">
                          {stripHtml(todayJournal.notes)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">View</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="inline-flex p-3 rounded-full bg-muted/50 mb-3">
                  <AlertCircle className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">No trades or journal entry for today yet</p>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    onClick={() => router.push(`/dashboard/trades/quick-add?date=${encodeURIComponent(today)}`)}
                    variant="default"
                    size="sm"
                    className="gap-2 shadow-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add Trade
                  </Button>
                  <Button
                    onClick={() => router.push(`/dashboard/journal/add?date=${encodeURIComponent(today)}`)}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <BookOpen className="h-4 w-4" />
                    Add Journal
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Scratchpad / Daily Notes */}
      {features.scratchpad && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card className="border-amber-500/30 bg-gradient-to-br from-amber-50/50 via-amber-50/30 to-transparent dark:from-amber-950/30 dark:via-amber-950/20 dark:to-transparent shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <StickyNote className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <span>Scratchpad</span>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Dialog open={showArchived} onOpenChange={setShowArchived}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                    >
                      <Archive className="h-4 w-4" />
                      Archive
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[600px]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Archive className="h-5 w-5" />
                        Archived Notes
                      </DialogTitle>
                      <DialogDescription>
                        Previous notes you've marked as complete
                      </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-4">
                        {(() => {
                          const archived = loadArchivedNotes();
                          if (archived.length === 0) {
                            return (
                              <div className="text-center py-8 text-muted-foreground">
                                <Archive className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>No archived notes yet</p>
                              </div>
                            );
                          }
                          return archived.map((note) => (
                            <div
                              key={note.id}
                              className="p-4 rounded-lg border border-border bg-muted/30 space-y-2 hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>
                                      {new Date(note.createdAt).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                    <span>→</span>
                                    <span>
                                      {new Date(note.completedAt).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                  <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    deleteArchivedNote(note.id);
                                    setShowArchived(false);
                                    setTimeout(() => setShowArchived(true), 0);
                                    toast.success('Note deleted');
                                  }}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
                {currentNote && currentNote.content.trim() && (
                  <Button
                    onClick={handleCompleteNote}
                    variant="outline"
                    size="sm"
                    className="gap-2 border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 shadow-sm"
                  >
                    <Check className="h-4 w-4" />
                    Done
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Textarea
                value={noteContent}
                onChange={(e) => handleNoteChange(e.target.value)}
                placeholder="Quick notes, ideas, or reminders... (Press 'Done' when finished to archive and start fresh)"
                className="min-h-[120px] resize-none bg-background/70 border-amber-500/30 focus:border-amber-500 focus:ring-amber-500/20 shadow-sm"
              />
              {currentNote && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <StickyNote className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                  <span>
                    Started {new Date(currentNote.createdAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        </motion.div>
      )}
    </div>
  );
}
