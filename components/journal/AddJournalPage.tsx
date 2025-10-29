import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { JournalEntry, Trade } from '@/types/journal/trading';
import { RichTextEditor } from './RichTextEditor';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { useRouter } from 'next/navigation';
import { DisplayMode } from '@/lib/journal/settings';
import { ArrowLeft, Plus, TrendingUp, TrendingDown, Edit, Trash2, Minus, Menu, Save, X, XCircle, Undo, Redo, Smile, Frown, Meh, CheckCircle2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { Theme } from '@/lib/journal/theme';
import { TradeTemplate } from '@/types/journal/trading';
import { useUndoRedo } from '@/lib/journal/useUndoRedo';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from './ui/breadcrumb';
import { MissingFieldBadge } from './MissingFieldBadge';
import { Label } from './ui/label';
import { InlineTaskHint } from './InlineTaskHint';
import { getJournalSmartSuggestions } from '@/lib/journal/smartSuggestions';
import { sanitizeHtmlForSave } from '@/lib/journal/htmlUtils';

interface AddJournalPageProps {
  onSave: (entry: JournalEntry) => void;
  date?: string;
  existingEntry?: JournalEntry;
  trades: Trade[];
  journalEntries: JournalEntry[];
  displayMode: DisplayMode;
  onDeleteTrade: (tradeId: string) => void;
  sidebarVisible: boolean;
  onToggleSidebar: () => void;
  theme: Theme;
  hasJournalEntryToday: boolean;
  onNavigate: (route: any) => void;
  onDisplayModeChange: (mode: DisplayMode) => void;
  onToggleTheme: () => void;
  onOpenImport: () => void;
  onOpenShortcuts: () => void;
  onOpenSettings: () => void;
}

export function AddJournalPage({ 
  onSave, 
  date, 
  existingEntry, 
  trades, 
  journalEntries,
  displayMode, 
  onDeleteTrade,
  sidebarVisible,
  onToggleSidebar,
  theme,
  hasJournalEntryToday,
  onNavigate,
  onDisplayModeChange,
  onToggleTheme,
  onOpenImport,
  onOpenShortcuts,
  onOpenSettings
}: AddJournalPageProps) {
  const router = useRouter();
  const entryDate = date || new Date().toISOString().split('T')[0];
  
  // Use undo/redo hook for journal content
  const {
    state: journalContent,
    set: setJournalContent,
    undo,
    redo,
    canUndo,
    canRedo,
    reset: resetJournalContent,
  } = useUndoRedo<{ name: string; notes: string; lessonsLearned: string; marketConditions: string; mood: string; followedSystem: boolean; newsEvents: { name: string; time: string }[] }>({
    name: existingEntry?.name || '',
    notes: existingEntry?.notes || '',
    lessonsLearned: existingEntry?.lessonsLearned || '',
    marketConditions: existingEntry?.marketConditions || '',
    mood: existingEntry?.mood || 'neutral',
    followedSystem: existingEntry?.followedSystem ?? true,
    newsEvents: existingEntry?.newsEvents || [],
  }, {
    maxHistorySize: 50,
    debounceMs: 300,
  });

  const name = journalContent.name;
  const notes = journalContent.notes;
  const lessonsLearned = journalContent.lessonsLearned;
  const marketConditions = journalContent.marketConditions;
  const mood = journalContent.mood;
  const followedSystem = journalContent.followedSystem;
  const newsEvents = journalContent.newsEvents;
  const setName = (newName: string) => setJournalContent({ ...journalContent, name: newName });
  const setNotes = (newNotes: string) => setJournalContent({ ...journalContent, notes: newNotes });
  const setLessonsLearned = (value: string) => setJournalContent({ ...journalContent, lessonsLearned: value });
  const setMarketConditions = (value: string) => setJournalContent({ ...journalContent, marketConditions: value });
  const setMood = (newMood: string) => setJournalContent({ ...journalContent, mood: newMood });
  const setFollowedSystem = (value: boolean) => setJournalContent({ ...journalContent, followedSystem: value });
  const setNewsEvents = (events: { name: string; time: string }[]) => setJournalContent({ ...journalContent, newsEvents: events });
  
  // Get smart suggestions for this journal entry
  const suggestions = getJournalSmartSuggestions(
    { date: entryDate, mood, notes, lessonsLearned, marketConditions },
    journalEntries,
    trades
  );
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialNotesRef = useRef<string>('');
  const initialNameRef = useRef<string>('');
  const initialLessonsLearnedRef = useRef<string>('');
  const initialMarketConditionsRef = useRef<string>('');
  const initialMoodRef = useRef<string>('neutral');
  const initialFollowedSystemRef = useRef<boolean>(true);
  const initialNewsEventsRef = useRef<{ name: string; time: string }[]>([]);
  const isInitializedRef = useRef<boolean>(false);

  // Initialize notes and name
  useEffect(() => {
    isInitializedRef.current = false;
    if (existingEntry) {
      resetJournalContent({
        name: existingEntry.name || '',
        notes: existingEntry.notes || '',
        lessonsLearned: existingEntry.lessonsLearned || '',
        marketConditions: existingEntry.marketConditions || '',
        mood: existingEntry.mood || 'neutral',
        followedSystem: existingEntry.followedSystem ?? true,
        newsEvents: existingEntry.newsEvents || [],
      });
      initialNameRef.current = existingEntry.name || '';
      initialNotesRef.current = existingEntry.notes || '';
      initialLessonsLearnedRef.current = existingEntry.lessonsLearned || '';
      initialMarketConditionsRef.current = existingEntry.marketConditions || '';
      initialMoodRef.current = existingEntry.mood || 'neutral';
      initialFollowedSystemRef.current = existingEntry.followedSystem ?? true;
      initialNewsEventsRef.current = existingEntry.newsEvents || [];
    } else {
      resetJournalContent({
        name: '',
        notes: '',
        lessonsLearned: '',
        marketConditions: '',
        mood: 'neutral',
        followedSystem: true,
        newsEvents: [],
      });
      initialNameRef.current = '';
      initialNotesRef.current = '';
      initialLessonsLearnedRef.current = '';
      initialMarketConditionsRef.current = '';
      initialMoodRef.current = 'neutral';
      initialFollowedSystemRef.current = true;
      initialNewsEventsRef.current = [];
    }
    setHasUnsavedChanges(false);
    // Mark as initialized after state has been set
    setTimeout(() => {
      isInitializedRef.current = true;
    }, 100);
  }, [existingEntry, resetJournalContent]);

  // Detect changes and trigger auto-save
  useEffect(() => {
    // Wait for initialization to complete
    if (!isInitializedRef.current) return;

    // Check if notes, name, mood, followedSystem, lessonsLearned, marketConditions, or newsEvents have changed from initial state
    const newsEventsChanged = JSON.stringify(newsEvents) !== JSON.stringify(initialNewsEventsRef.current);
    if (notes !== initialNotesRef.current || name !== initialNameRef.current || mood !== initialMoodRef.current || followedSystem !== initialFollowedSystemRef.current || lessonsLearned !== initialLessonsLearnedRef.current || marketConditions !== initialMarketConditionsRef.current || newsEventsChanged) {
      setHasUnsavedChanges(true);

      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Set new timeout for auto-save (2 seconds after last change)
      autoSaveTimeoutRef.current = setTimeout(() => {
        performAutoSave();
      }, 2000);
    } else {
      // If the current state matches initial state, mark as no unsaved changes
      setHasUnsavedChanges(false);
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [notes, name, mood, followedSystem, lessonsLearned, marketConditions, newsEvents]);

  const performAutoSave = () => {
    if (!hasUnsavedChanges) return;

    setIsSaving(true);

    const newEntry: JournalEntry = {
      date: entryDate,
      name: name.trim() || undefined, // Only save name if it's not empty
      mood: mood as 'excellent' | 'good' | 'neutral' | 'poor' | 'terrible',
      notes: sanitizeHtmlForSave(notes),
      lessonsLearned: sanitizeHtmlForSave(lessonsLearned),
      marketConditions: sanitizeHtmlForSave(marketConditions),
      didTrade: existingEntry?.didTrade ?? true,
      followedSystem: followedSystem,
      isNewsDay: newsEvents.length > 0 || (existingEntry?.isNewsDay ?? false),
      newsEvents: newsEvents.length > 0 ? newsEvents : undefined,
    };

    onSave(newEntry);

    // Update initial state to current state
    initialNameRef.current = name;
    initialNotesRef.current = notes;
    initialLessonsLearnedRef.current = lessonsLearned;
    initialMarketConditionsRef.current = marketConditions;
    initialMoodRef.current = mood;
    initialFollowedSystemRef.current = followedSystem;
    initialNewsEventsRef.current = newsEvents;
    setHasUnsavedChanges(false);

    // Show saving indicator briefly
    setTimeout(() => {
      setIsSaving(false);
    }, 500);

    // Show subtle toast
    toast.success('Changes saved', { duration: 1500 });
  };

  // Auto-save on component unmount if there are unsaved changes
  useEffect(() => {
    return () => {
      // On cleanup/unmount, save if there are unsaved changes
      const newsEventsChanged = JSON.stringify(newsEvents) !== JSON.stringify(initialNewsEventsRef.current);
      if (hasUnsavedChanges && (notes !== initialNotesRef.current || name !== initialNameRef.current || mood !== initialMoodRef.current || followedSystem !== initialFollowedSystemRef.current || lessonsLearned !== initialLessonsLearnedRef.current || marketConditions !== initialMarketConditionsRef.current || newsEventsChanged)) {
        const newEntry: JournalEntry = {
          date: entryDate,
          name: name.trim() || undefined,
          mood: mood as 'excellent' | 'good' | 'neutral' | 'poor' | 'terrible',
          notes: sanitizeHtmlForSave(notes),
          lessonsLearned: sanitizeHtmlForSave(lessonsLearned),
          marketConditions: sanitizeHtmlForSave(marketConditions),
          didTrade: existingEntry?.didTrade ?? true,
          followedSystem: followedSystem,
          isNewsDay: newsEvents.length > 0 || (existingEntry?.isNewsDay ?? false),
          newsEvents: newsEvents.length > 0 ? newsEvents : undefined,
        };
        onSave(newEntry);
        // Don't show toast here - silently save on unmount
      }
    };
  }, [hasUnsavedChanges, notes, name, mood, followedSystem, lessonsLearned, marketConditions, entryDate, existingEntry, onSave]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo/Redo shortcuts work everywhere (including in editor)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        if (canRedo) {
          redo();
          toast.success('Redo', { duration: 1000 });
        }
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (canUndo) {
          undo();
          toast.success('Undo', { duration: 1000 });
        }
        return;
      }

      // Don't trigger other shortcuts if user is typing in an input/textarea or the editor
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Escape to go back (auto-save will handle saving)
      if (e.key === 'Escape') {
        e.preventDefault();
        router.back();
      }
      // Cmd/Ctrl + S to save
      else if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (hasUnsavedChanges) {
          handleManualSave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasUnsavedChanges, canUndo, canRedo, undo, redo]);

  const handleManualSave = () => {
    if (!hasUnsavedChanges) return;
    
    // Clear auto-save timeout if exists
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    performAutoSave();
  };

  // Handle image clicks in the editor
  useEffect(() => {
    const handleImageClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG' && target.closest('.ProseMirror')) {
        const imgSrc = (target as HTMLImageElement).src;
        setSelectedImage(imgSrc);
      }
    };

    document.addEventListener('click', handleImageClick);
    return () => document.removeEventListener('click', handleImageClick);
  }, []);

  const formattedDate = new Date(entryDate).toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  });

  // Filter trades for this specific day
  const dayTrades = trades.filter(t => t.date === entryDate);
  
  // Calculate day stats
  const dayPnL = dayTrades.reduce((sum, t) => sum + t.pnl, 0);
  const dayRR = dayTrades.reduce((sum, t) => sum + (t.rr || 0), 0);

  const formatCurrency = (value: number) => {
    const formatted = Math.abs(value).toFixed(2);
    return value >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  const formatRR = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '0.00R';
    const formatted = Math.abs(value).toFixed(2);
    return value >= 0 ? `+${formatted}R` : `-${formatted}R`;
  };

  return (
    <div className="bg-background">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border bg-card sticky top-0 z-10">
          <div className="container mx-auto max-w-[1800px] px-6 py-5">
            <div className="flex items-center justify-between gap-4 min-w-0">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleSidebar}
                  className="flex-shrink-0"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div className="min-w-0">
                  <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                          <button onClick={() => router.push('/dashboard/trades')} className="cursor-pointer">
                            Trades
                          </button>
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPage>Journal Entry</BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                  <p className="text-muted-foreground text-xs mt-1">{name || formattedDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {hasUnsavedChanges && !isSaving && (
                  <Badge variant="outline" className="gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                    Unsaved changes
                  </Badge>
                )}
                {isSaving && (
                  <Badge variant="outline" className="gap-1.5" style={{ animation: 'saving-pulse 1.5s ease-in-out infinite' }}>
                    <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    Saving...
                  </Badge>
                )}
                <div className="flex items-center gap-1 border-r border-border pr-3 mr-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={undo}
                    disabled={!canUndo}
                    title="Undo (Cmd/Ctrl+Z)"
                  >
                    <Undo className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={redo}
                    disabled={!canRedo}
                    title="Redo (Cmd/Ctrl+Shift+Z)"
                  >
                    <Redo className="h-4 w-4" />
                  </Button>
                </div>
                <Button 
                  onClick={() => router.push('/dashboard/trades')} 
                  size="lg" 
                  variant="outline"
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Close
                  <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 text-muted-foreground">
                    ESC
                  </kbd>
                </Button>
              </div>
            </div>
          </div>
        </div>

      {/* Main Content - Dashboard Layout */}
      <div className="flex-1 bg-background">
        <div className="container mx-auto max-w-[1800px] px-6 py-8 space-y-6">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-card via-card/50 to-background p-8 shadow-sm"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 shadow-sm">
                  <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                </div>
                <div className="flex-1">
                  <h1 className="mb-0 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    Journal Entry
                  </h1>
                </div>
              </div>
              <p className="text-sm text-muted-foreground ml-14">
                {formattedDate}
              </p>
            </div>
            
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-500/8 via-purple-500/5 to-transparent rounded-full blur-3xl -z-0" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-500/8 via-blue-500/5 to-transparent rounded-full blur-3xl -z-0" />
          </motion.div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left Column - Stats & Quick Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="lg:col-span-1 space-y-6"
            >
              {/* Day Summary Card */}
              <Card className="border-border/50 shadow-sm">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Date</p>
                      <h3 className="mb-0">{new Date(entryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</h3>
                    </div>

                    {/* Mood Selector */}
                    <div className="pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-3">Mental State</p>
                      <div className="grid grid-cols-5 gap-2">
                        {[
                          { value: 'excellent', icon: '😊', label: 'Excellent', color: 'hover:bg-green-50 dark:hover:bg-green-950/20' },
                          { value: 'good', icon: '🙂', label: 'Good', color: 'hover:bg-green-50 dark:hover:bg-green-950/20' },
                          { value: 'neutral', icon: '😐', label: 'Neutral', color: 'hover:bg-yellow-50 dark:hover:bg-yellow-950/20' },
                          { value: 'poor', icon: '😕', label: 'Poor', color: 'hover:bg-orange-50 dark:hover:bg-orange-950/20' },
                          { value: 'terrible', icon: '😞', label: 'Terrible', color: 'hover:bg-red-50 dark:hover:bg-red-950/20' },
                        ].map((moodOption) => (
                          <button
                            key={moodOption.value}
                            onClick={() => setMood(moodOption.value)}
                            className={`flex items-center justify-center p-2.5 rounded-lg border-2 transition-all ${
                              mood === moodOption.value
                                ? 'border-primary bg-accent'
                                : 'border-border'
                            } ${moodOption.color}`}
                            title={moodOption.label}
                          >
                            <span className="text-2xl">{moodOption.icon}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Followed System Toggle */}
                    <div className="pt-4 border-t border-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className={`h-4 w-4 ${followedSystem ? 'text-green-600' : 'text-muted-foreground'}`} />
                          <label htmlFor="followed-system" className="text-sm cursor-pointer">
                            Followed System
                          </label>
                        </div>
                        <Switch
                          id="followed-system"
                          checked={followedSystem}
                          onCheckedChange={setFollowedSystem}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Did you stick to your trading plan?
                      </p>
                    </div>
                    
                    <div className="pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-3">Performance</p>
                      {dayTrades.length > 0 ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Trades</span>
                            <Badge variant="secondary">
                              {dayTrades.length}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">P&L</span>
                            <div className={`flex items-center gap-1.5 ${dayPnL > 0 ? 'text-green-600' : dayPnL < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                              {dayPnL > 0 ? (
                                <TrendingUp className="h-4 w-4" />
                              ) : dayPnL < 0 ? (
                                <TrendingDown className="h-4 w-4" />
                              ) : (
                                <Minus className="h-4 w-4" />
                              )}
                              <span className="font-medium">
                                {displayMode === 'rr' ? formatRR(dayRR) : formatCurrency(dayPnL)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Win Rate</span>
                            <span className="font-medium">
                              {Math.round((dayTrades.filter(t => t.pnl > 0).length / dayTrades.length) * 100)}%
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No trading activity</p>
                      )}
                    </div>

                    <div className="pt-4 border-t border-border">
                      <Button 
                        onClick={() => router.push(`/dashboard/trades/add${entryDate ? `?date=${encodeURIComponent(entryDate)}` : ''}`)} 
                        variant="outline"
                        size="sm"
                        className="w-full gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Trade
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trades List Card */}
              <Card className="border-border/50 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="mb-0">Trades</h3>
                    {dayTrades.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {dayTrades.length}
                      </Badge>
                    )}
                  </div>
                  
                  {dayTrades.length > 0 ? (
                    <div className="space-y-3">
                      {dayTrades.map(trade => {
                        const pnlValue = displayMode === 'rr' ? (trade.rr || 0) : trade.pnl;
                        const isProfit = pnlValue > 0;
                        const isLoss = pnlValue < 0;
                        
                        return (
                          <button
                            key={trade.id}
                            onClick={() => router.push(`/dashboard/trades/${encodeURIComponent(trade.id)}`)}
                            className="w-full p-3 rounded-lg border border-border hover:bg-accent transition-colors text-left"
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-medium truncate">{trade.symbol}</span>
                                <Badge variant={trade.type === 'long' ? 'default' : 'secondary'} className="text-xs flex-shrink-0">
                                  {trade.type === 'long' ? '↑' : '↓'}
                                </Badge>
                              </div>
                              <div className={`flex items-center gap-1 flex-shrink-0 ${
                                isProfit ? 'text-green-600' : 
                                isLoss ? 'text-red-600' : 
                                'text-muted-foreground'
                              }`}>
                                {isProfit ? (
                                  <TrendingUp className="h-3.5 w-3.5" />
                                ) : isLoss ? (
                                  <TrendingDown className="h-3.5 w-3.5" />
                                ) : (
                                  <Minus className="h-3.5 w-3.5" />
                                )}
                                <span className="text-sm font-medium">
                                  {displayMode === 'rr' 
                                    ? formatRR(trade.rr || 0)
                                    : formatCurrency(trade.pnl)
                                  }
                                </span>
                              </div>
                            </div>
                            {trade.setup && (
                              <p className="text-xs text-muted-foreground truncate">{trade.setup}</p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 border border-dashed border-border rounded-lg">
                      <p className="text-sm text-muted-foreground mb-3">No trades yet</p>
                      <Button 
                        onClick={() => router.push(`/dashboard/trades/add${entryDate ? `?date=${encodeURIComponent(entryDate)}` : ''}`)} 
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Trade
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Middle Column - Journal Editor */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="lg:col-span-2 space-y-6"
            >
              {/* Notes Section */}
              <Card className="border-border/50 shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h3 className="mb-1">Journal Entry</h3>
                    <p className="text-sm text-muted-foreground">
                      Document your trading day, thoughts, and observations
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="journal-name" className="text-sm text-muted-foreground">
                      Title (optional)
                    </label>
                    <Input
                      id="journal-name"
                      type="text"
                      placeholder={formattedDate}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="enhanced-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="notes">Notes</Label>
                      <MissingFieldBadge 
                        show={!notes || notes.trim().length === 0} 
                        variant="warning"
                        tooltip="Document your thoughts and observations"
                      />
                    </div>
                    <RichTextEditor
                      content={notes}
                      onChange={setNotes}
                      placeholder="Start writing your journal entry... Paste images directly or add links with Cmd+K"
                      minHeight="400px"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Lessons Learned Section */}
              <Card className="border-border/50 shadow-sm">
                <CardContent className="p-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="lessons">Lessons Learned</Label>
                    <MissingFieldBadge 
                      show={!lessonsLearned || lessonsLearned.trim().length === 0} 
                      variant="warning"
                      tooltip="What did you learn from today's trading?"
                    />
                  </div>
                  {/* Smart Suggestion for Lessons */}
                  {suggestions.find(s => s.field === 'lessonsLearned') && (
                    <InlineTaskHint
                      id={`journal-${entryDate}-lessons-suggestion`}
                      message={suggestions.find(s => s.field === 'lessonsLearned')!.reason}
                      variant="suggestion"
                      action={{
                        label: 'Use suggestion',
                        onClick: () => {
                          const suggestion = suggestions.find(s => s.field === 'lessonsLearned');
                          if (suggestion) {
                            setLessonsLearned(suggestion.value);
                            toast.success('Applied suggestion');
                          }
                        }
                      }}
                    />
                  )}
                  <RichTextEditor
                    content={lessonsLearned}
                    onChange={setLessonsLearned}
                    placeholder="What did you learn today? What would you do differently next time?"
                    minHeight="250px"
                  />
                </CardContent>
              </Card>

              {/* Market Conditions Section */}
              <Card className="border-border/50 shadow-sm">
                <CardContent className="p-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="market">Market Conditions</Label>
                    <MissingFieldBadge 
                      show={!marketConditions || marketConditions.trim().length === 0} 
                      variant="warning"
                      tooltip="Describe the overall market environment"
                    />
                  </div>
                  {/* Smart Suggestion for Market Conditions */}
                  {suggestions.find(s => s.field === 'marketConditions') && (
                    <InlineTaskHint
                      id={`journal-${entryDate}-market-suggestion`}
                      message={suggestions.find(s => s.field === 'marketConditions')!.reason}
                      variant="suggestion"
                      action={{
                        label: 'Use suggestion',
                        onClick: () => {
                          const suggestion = suggestions.find(s => s.field === 'marketConditions');
                          if (suggestion) {
                            setMarketConditions(suggestion.value);
                            toast.success('Applied suggestion');
                          }
                        }
                      }}
                    />
                  )}
                  <RichTextEditor
                    content={marketConditions}
                    onChange={setMarketConditions}
                    placeholder="How was the market today? Trending, choppy, volatile? Any major news or events?"
                    minHeight="250px"
                  />
                </CardContent>
              </Card>
            </motion.div>

            {/* Right Column - Image Preview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="lg:col-span-2 flex flex-col"
            >
              <Card className="border-border/50 shadow-sm sticky top-24 flex-1">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="mb-0">Image Preview</h3>
                    {selectedImage && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedImage(null)}
                        className="h-7 w-7 p-0"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {selectedImage ? (
                    <div className="space-y-4 flex-1 flex flex-col">
                      <div 
                        className="rounded-lg border border-border overflow-hidden bg-muted shadow-sm cursor-pointer hover:border-ring/50 transition-colors flex-1 flex items-center justify-center"
                        onClick={() => setModalImage(selectedImage)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setModalImage(selectedImage);
                          }
                        }}
                      >
                        <img
                          src={selectedImage}
                          alt="Preview"
                          className="w-full h-auto max-h-[600px] object-contain"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        Click the preview to view full size
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-24 border border-dashed border-border rounded-lg flex-1 flex flex-col items-center justify-center">
                      <p className="text-sm text-muted-foreground mb-1">No image selected</p>
                      <p className="text-xs text-muted-foreground">
                        Click on an image in your journal to view it here
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
      </div>

      {/* Full Screen Image Modal */}
      {modalImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center cursor-pointer"
          onClick={() => setModalImage(null)}
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.95)' }}
        >
          <img
            src={modalImage}
            alt="Full size preview"
            className="max-w-[95vw] max-h-[95vh] w-auto h-auto object-contain"
            onClick={(e) => e.stopPropagation()}
            style={{ objectFit: 'contain' }}
          />
        </div>
      )}
    </div>
  );
}
