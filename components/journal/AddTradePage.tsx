import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Card, CardContent } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Trade, TradeTemplate, JournalEntry } from '@/types/journal/trading';
import { validateTradeWithWarnings, ValidationError } from '@/lib/journal/validation';
import { loadSmartDefaults, updateFromTrade } from '@/lib/journal/smartDefaults';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { TrendingUp, TrendingDown, AlertTriangle, Image as ImageIcon, X, ArrowLeft, Check, Menu, Save, Undo, Redo, FileText, DollarSign, Target, Bookmark } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { addRecentSymbol } from '@/lib/journal/tradeTemplates';
import { useRouter } from 'next/navigation';
import { DisplayMode } from '@/lib/journal/settings';
import { Theme } from '@/lib/journal/theme';
import { useUndoRedo } from '@/lib/journal/useUndoRedo';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from './ui/breadcrumb';
import { TradeCompletionTracker } from './TradeCompletionTracker';
import { MissingFieldBadge } from './MissingFieldBadge';
import { InlineTaskHint } from './InlineTaskHint';

interface AddTradePageProps {
  onSave: (trade: Trade) => void;
  trade?: Trade;
  date?: string;
  templates?: TradeTemplate[];
  recentSymbols?: string[];
  onTemplateUsed?: (templateId: string) => void;
  sidebarVisible: boolean;
  onToggleSidebar: () => void;
  trades: Trade[];
  journalEntries: JournalEntry[];
  displayMode: DisplayMode;
  theme: Theme;
  hasJournalEntryToday: boolean;
  onNavigate: (route: any) => void;
  onDisplayModeChange: (mode: DisplayMode) => void;
  onToggleTheme: () => void;
  onOpenImport: () => void;
  onOpenShortcuts: () => void;
  onOpenSettings: () => void;
}

export function AddTradePage({ 
  onSave, 
  trade, 
  date: defaultDate,
  templates = [], 
  recentSymbols = [],
  onTemplateUsed,
  sidebarVisible,
  onToggleSidebar,
  trades,
  journalEntries,
  displayMode,
  theme,
  hasJournalEntryToday,
  onNavigate,
  onDisplayModeChange,
  onToggleTheme,
  onOpenImport,
  onOpenShortcuts,
  onOpenSettings
}: AddTradePageProps) {
  const router = useRouter();
  // Entry mode: 'detailed' = all price fields, 'simple' = just R:R and dollar amount
  // Initialize from trade if it exists, otherwise default to 'detailed'
  const [entryMode, setEntryMode] = useState<'detailed' | 'simple'>(trade?.entryMode || 'detailed');
  const [tradeStatus, setTradeStatus] = useState<'open' | 'closed'>(trade?.status || 'open');
  const [activeTab, setActiveTab] = useState('essentials');
  
  // Use undo/redo hook for form data
  const {
    state: formData,
    set: setFormData,
    undo,
    redo,
    canUndo,
    canRedo,
    reset: resetFormData,
  } = useUndoRedo<Partial<Trade>>({
    date: defaultDate || new Date().toISOString().split('T')[0],
    entryTime: '',
    symbol: '',
    type: 'long',
    entryPrice: 0,
    exitPrice: null,
    notes: '',
    tags: [],
    setup: '',
    status: 'open',
    stopLoss: undefined,
    target: undefined,
    name: '',
  }, {
    maxHistorySize: 50,
    debounceMs: 300,
  });
  const [tagInput, setTagInput] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<ValidationError[]>([]);
  const [screenshotBeforeUrl, setScreenshotBeforeUrl] = useState('');
  const [screenshotAfterUrl, setScreenshotAfterUrl] = useState('');
  const beforeFileInputRef = useRef<HTMLInputElement>(null);
  const afterFileInputRef = useRef<HTMLInputElement>(null);
  
  // Risk calculation mode: 'manual' | 'rr' | 'pips'
  const [riskMode, setRiskMode] = useState<'manual' | 'rr' | 'pips'>('manual');
  const [rrValue, setRRValue] = useState<number>(2); // Default 1:2 R:R
  const [stopLossPips, setStopLossPips] = useState<number>(10); // Default 10 pips
  const [targetPips, setTargetPips] = useState<number>(20); // Default 20 pips
  
  // Simple mode state
  const [simpleWon, setSimpleWon] = useState(true); // Win or loss
  const [simpleRR, setSimpleRR] = useState<number>(2); // R:R multiple
  const [simplePnL, setSimplePnL] = useState<number>(0); // Dollar amount
  
  // Auto-save state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialFormDataRef = useRef<string>('');

  // Initialize form
  useEffect(() => {
    if (trade) {
      resetFormData(trade);
      setTradeStatus(trade.status);
      setTagInput('');
      setScreenshotBeforeUrl('');
      setScreenshotAfterUrl('');
      setHasUnsavedChanges(false);
      // Store initial state for comparison after a brief delay to ensure state is settled
      setTimeout(() => {
        initialFormDataRef.current = JSON.stringify({
          ...trade,
          status: trade.status,
          entryMode: trade.entryMode || 'detailed',
        });
      }, 0);
    } else {
      const defaults = loadSmartDefaults();
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      const newFormData = {
        date: defaultDate || new Date().toISOString().split('T')[0],
        entryTime: currentTime,
        symbol: defaults.lastSymbol || '',
        type: defaults.lastType || 'long',
        entryPrice: 0,
        exitPrice: null,
        notes: '',
        tags: defaults.lastTags || [],
        setup: defaults.lastSetup || '',
        status: 'open',
        stopLoss: undefined,
        target: undefined,
        name: '',
      };
      
      resetFormData(newFormData);
      setTradeStatus('open');
      setTagInput('');
      setSelectedTemplate('');
      setScreenshotBeforeUrl('');
      setScreenshotAfterUrl('');
      setHasUnsavedChanges(false);
      setTimeout(() => {
        initialFormDataRef.current = JSON.stringify({
          ...newFormData,
          status: 'open',
        });
      }, 0);
    }
  }, [trade, defaultDate, resetFormData]);

  // Detect changes and trigger auto-save for existing trades
  useEffect(() => {
    if (!trade) return; // Only auto-save for editing existing trades
    if (!initialFormDataRef.current) return; // Wait for initial state to be set
    
    const currentFormData = JSON.stringify({
      ...formData,
      status: tradeStatus,
      entryMode: entryMode,
    });
    
    // Only detect changes if initial state exists
    if (currentFormData !== initialFormDataRef.current) {
      setHasUnsavedChanges(true);
      
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      // Set new timeout for auto-save (0.5 seconds after last change)
      autoSaveTimeoutRef.current = setTimeout(() => {
        performAutoSave();
      }, 500);
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
  }, [formData, tradeStatus, simpleWon, simpleRR, simplePnL, trade, entryMode]);
  
  // Auto-save function
  const performAutoSave = useCallback(() => {
    if (!trade || !hasUnsavedChanges) return;
    
    setIsSaving(true);
    
    // Calculate P&L and R:R based on entry mode
    let pnl = 0;
    let rr = 0;

    if (entryMode === 'simple') {
      pnl = simpleWon ? Math.abs(simplePnL) : -Math.abs(simplePnL);
      rr = simpleWon ? Math.abs(simpleRR) : -Math.abs(simpleRR);
    } else {
      if (formData.exitPrice !== null && formData.exitPrice !== undefined) {
        const priceChange = formData.type === 'long'
          ? formData.exitPrice - (formData.entryPrice || 0)
          : (formData.entryPrice || 0) - formData.exitPrice;

        pnl = priceChange * 100;

        if (formData.stopLoss) {
          const risk = Math.abs((formData.entryPrice || 0) - formData.stopLoss);
          if (risk > 0) {
            rr = Math.abs(priceChange) / risk * (priceChange >= 0 ? 1 : -1);
          }
        }
      }
    }

    const updatedTrade: Trade = {
      id: trade.id,
      name: formData.name || undefined,
      date: formData.date!,
      entryTime: formData.entryTime,
      symbol: formData.symbol!.toUpperCase(),
      type: formData.type as 'long' | 'short',
      entryPrice: entryMode === 'simple' ? 0 : (formData.entryPrice || 0),
      exitPrice: entryMode === 'simple' ? null : (formData.exitPrice ?? null),
      pnl,
      rr,
      notes: formData.notes || '',
      tags: formData.tags || [],
      setup: formData.setup || '',
      stopLoss: entryMode === 'simple' ? undefined : formData.stopLoss,
      target: entryMode === 'simple' ? undefined : formData.target,
      exitDate: formData.exitDate || (entryMode === 'detailed' && formData.exitPrice ? formData.date : undefined),
      exitTime: formData.exitTime,
      status: tradeStatus,
      entryMode: entryMode, // Save the entry mode
      screenshotBefore: formData.screenshotBefore,
      screenshotAfter: formData.screenshotAfter,
    };

    onSave(updatedTrade);
    initialFormDataRef.current = JSON.stringify({
      ...formData,
      status: tradeStatus,
      entryMode: entryMode,
    });
    
    setHasUnsavedChanges(false);
    setIsSaving(false);
    
    // Show subtle toast
    toast.success('Changes saved', { duration: 1500 });
  }, [trade, formData, tradeStatus, hasUnsavedChanges, entryMode, simpleWon, simpleRR, simplePnL, onSave]);

  // Auto-calculate stop loss and target based on risk mode
  useEffect(() => {
    if (!formData.entryPrice || formData.entryPrice === 0) return;
    
    if (riskMode === 'rr') {
      // R:R Mode: Calculate target from stop loss + R:R ratio
      if (formData.stopLoss && rrValue > 0) {
        const risk = Math.abs(formData.entryPrice - formData.stopLoss);
        const reward = risk * rrValue;
        
        const calculatedTarget = formData.type === 'long'
          ? formData.entryPrice + reward
          : formData.entryPrice - reward;
        
        setFormData(prev => ({ ...prev, target: calculatedTarget }));
      }
    } else if (riskMode === 'pips') {
      // Pips Mode: Calculate from pip values
      const pipValue = 0.01; // Assume 1 pip = 0.01
      
      const calculatedStopLoss = formData.type === 'long'
        ? formData.entryPrice - (stopLossPips * pipValue)
        : formData.entryPrice + (stopLossPips * pipValue);
      
      const calculatedTarget = formData.type === 'long'
        ? formData.entryPrice + (targetPips * pipValue)
        : formData.entryPrice - (targetPips * pipValue);
      
      setFormData(prev => ({ 
        ...prev, 
        stopLoss: calculatedStopLoss,
        target: calculatedTarget 
      }));
    }
  }, [riskMode, rrValue, stopLossPips, targetPips, formData.entryPrice, formData.type, formData.stopLoss, setFormData]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC to close
      if (e.key === 'Escape') {
        router.back();
      }
      // Ctrl/Cmd + Z to undo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Ctrl/Cmd + Shift + Z to redo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      // Ctrl/Cmd + S to save (for new trades)
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (!trade) {
          handleSubmit(e as any);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, trade]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate P&L and R:R based on entry mode
    let pnl = 0;
    let rr = 0;

    if (entryMode === 'simple') {
      pnl = simpleWon ? Math.abs(simplePnL) : -Math.abs(simplePnL);
      rr = simpleWon ? Math.abs(simpleRR) : -Math.abs(simpleRR);
    } else {
      if (formData.exitPrice !== null && formData.exitPrice !== undefined) {
        const priceChange = formData.type === 'long'
          ? formData.exitPrice - (formData.entryPrice || 0)
          : (formData.entryPrice || 0) - formData.exitPrice;

        pnl = priceChange * 100;

        if (formData.stopLoss) {
          const risk = Math.abs((formData.entryPrice || 0) - formData.stopLoss);
          if (risk > 0) {
            rr = Math.abs(priceChange) / risk * (priceChange >= 0 ? 1 : -1);
          }
        }
      }
    }

    // Determine exitDate: use formData.exitDate if set, otherwise use date if trade is closed
    let exitDate: string | undefined;
    if (tradeStatus === 'closed') {
      // If trade is closed, ensure we have an exitDate
      exitDate = formData.exitDate || formData.date;
    } else {
      // If trade is open, clear exitDate
      exitDate = undefined;
    }

    const newTrade: Trade = {
      id: trade?.id || `trade_${Date.now()}`,
      name: formData.name || undefined,
      date: formData.date!,
      entryTime: formData.entryTime,
      symbol: formData.symbol!.toUpperCase(),
      type: formData.type as 'long' | 'short',
      entryPrice: entryMode === 'simple' ? 0 : (formData.entryPrice || 0),
      exitPrice: entryMode === 'simple' ? null : (formData.exitPrice ?? null),
      pnl,
      rr,
      notes: formData.notes || '',
      tags: formData.tags || [],
      setup: formData.setup || '',
      stopLoss: entryMode === 'simple' ? undefined : formData.stopLoss,
      target: entryMode === 'simple' ? undefined : formData.target,
      exitDate,
      exitTime: formData.exitTime,
      status: tradeStatus,
      entryMode: entryMode, // Save the entry mode
      screenshotBefore: formData.screenshotBefore,
      screenshotAfter: formData.screenshotAfter,
    };

    const { errors, warnings } = validateTradeWithWarnings(newTrade);
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationWarnings(warnings);

    onSave(newTrade);
    
    // Store for smart defaults
    updateFromTrade(newTrade);
    
    // Add to recent symbols
    addRecentSymbol(newTrade.symbol);

    router.push('/dashboard/trades');
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (!templateId) return;
    
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    
    setFormData({
      ...formData,
      type: template.type,
      setup: template.setup,
      stopLoss: template.stopLoss,
      target: template.target,
      tags: template.tags,
    });
    
    onTemplateUsed?.(templateId);
    toast.success(`Template "${template.name}" applied`);
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    
    const newTag = tagInput.trim();
    if (!formData.tags?.includes(newTag)) {
      setFormData({ ...formData, tags: [...(formData.tags || []), newTag] });
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(tag => tag !== tagToRemove) || [],
    });
  };

  const handleBeforeFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, screenshotBefore: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleAfterFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, screenshotAfter: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleAddScreenshotFromUrl = (type: 'before' | 'after') => {
    const url = type === 'before' ? screenshotBeforeUrl : screenshotAfterUrl;
    if (!url) return;
    
    if (type === 'before') {
      setFormData({ ...formData, screenshotBefore: url });
      setScreenshotBeforeUrl('');
    } else {
      setFormData({ ...formData, screenshotAfter: url });
      setScreenshotAfterUrl('');
    }
  };

  const handleRemoveScreenshot = (type: 'before' | 'after') => {
    if (type === 'before') {
      setFormData({ ...formData, screenshotBefore: undefined });
    } else {
      setFormData({ ...formData, screenshotAfter: undefined });
    }
  };

  return (
    <div className="bg-background">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border bg-card sticky top-0 z-10">
          <div className="container mx-auto max-w-[1800px] px-6 py-4">
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleSidebar}
                  className="flex-shrink-0"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push('/dashboard/trades')}
                  className="flex-shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" />
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
                        <BreadcrumbPage>{trade ? (formData.name || formData.symbol || 'Edit Trade') : 'New Trade'}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                  <p className="text-muted-foreground text-xs mt-1">
                    {trade ? 'Update your trade details' : 'Fill in the essential trade information'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <AnimatePresence mode="wait">
                {trade && isSaving ? (
                  <motion.div
                    key="saving"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Badge variant="outline" className="gap-1.5 bg-blue-500/10 border-blue-500/30">
                      <motion.span 
                        className="h-2 w-2 rounded-full bg-blue-500"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                      Saving...
                    </Badge>
                  </motion.div>
                ) : trade && hasUnsavedChanges ? (
                  <motion.div
                    key="unsaved"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Badge variant="outline" className="gap-1.5 bg-orange-500/10 border-orange-500/30">
                      <motion.span 
                        className="h-2 w-2 rounded-full bg-orange-500"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      Unsaved
                    </Badge>
                  </motion.div>
                ) : trade ? (
                  <motion.div
                    key="saved"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Badge variant="outline" className="gap-1.5 bg-emerald-500/10 border-emerald-500/30">
                      <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      Saved
                    </Badge>
                  </motion.div>
                ) : null}
                </AnimatePresence>
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

        {/* Main Content */}
        <div className="flex-1 bg-background">
          <div className="container mx-auto max-w-[1800px] px-6 py-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Validation Messages */}
              {validationErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {validationErrors.map((error, i) => (
                        <li key={i}>{error.message}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {validationWarnings.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {validationWarnings.map((warning, i) => (
                        <li key={i}>{warning.message}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Completion Tracker */}
              <TradeCompletionTracker 
                formData={formData} 
                tradeStatus={tradeStatus}
                entryMode={entryMode}
                simpleRR={simpleRR}
                simplePnL={simplePnL}
                allTrades={trades}
                onApplySuggestion={(field, value) => {
                  setFormData({ ...formData, [field]: value });
                  toast.success(`Applied suggestion for ${field}`);
                }}
              />

              {/* Trade Name - Smaller, Optional */}
              <div className="space-y-2">
                <Input
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Trade name (optional)"
                  className="border-dashed"
                />
                <p className="text-xs text-muted-foreground">
                  Optional - helps you remember important trades
                </p>
              </div>

              {/* Entry Mode Toggle */}
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <Label className="text-xs text-muted-foreground">Entry Mode</Label>
                    <ToggleGroup
                      type="single"
                      value={entryMode}
                      onValueChange={(value) => value && setEntryMode(value as 'detailed' | 'simple')}
                      className="grid grid-cols-2 gap-3"
                    >
                      <ToggleGroupItem 
                        value="detailed" 
                        className="gap-2 flex-1 data-[state=on]:bg-blue-500/10 data-[state=on]:border-blue-500/30 data-[state=on]:text-blue-600 dark:data-[state=on]:text-blue-400 transition-all"
                      >
                        Detailed
                      </ToggleGroupItem>
                      <ToggleGroupItem 
                        value="simple" 
                        className="gap-2 flex-1 data-[state=on]:bg-emerald-500/10 data-[state=on]:border-emerald-500/30 data-[state=on]:text-emerald-600 dark:data-[state=on]:text-emerald-400 transition-all"
                      >
                        Simple
                      </ToggleGroupItem>
                    </ToggleGroup>
                    <p className="text-xs text-muted-foreground">
                      {entryMode === 'detailed' 
                        ? 'Track all price levels (entry, exit, stop loss, target)' 
                        : 'Quick entry with just R:R and dollar amount'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Template Selection */}
              {!trade && templates.length > 0 && entryMode === 'detailed' && (
                <Card className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <Label className="text-xs text-muted-foreground flex items-center gap-2">
                        Load from template
                        <Badge variant="outline" className="text-xs px-1.5 py-0">
                          {templates.length} saved
                        </Badge>
                      </Label>
                      <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Choose a template..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {templates.map(template => (
                            <SelectItem key={template.id} value={template.id}>
                              <div className="flex items-center gap-2">
                                <span>{template.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {template.type === 'long' ? '↑' : '↓'}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tabbed Content */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-auto p-1">
                  <TabsTrigger value="essentials" className="gap-2 data-[state=active]:bg-blue-500/10">
                    <DollarSign className="h-4 w-4" />
                    Essentials
                  </TabsTrigger>
                  {entryMode === 'detailed' && (
                    <TabsTrigger value="risk" className="gap-2 data-[state=active]:bg-purple-500/10">
                      <Target className="h-4 w-4" />
                      Risk
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="details" className="gap-2 data-[state=active]:bg-orange-500/10">
                    <Bookmark className="h-4 w-4" />
                    Details
                  </TabsTrigger>
                </TabsList>

                {/* Tab 1: Essentials */}
                <TabsContent value="essentials" className="space-y-6 mt-6">
                  {/* Trade Status - Only for detailed mode */}
                  {entryMode === 'detailed' && (
                    <Card className="border-border/50">
                      <CardContent className="pt-6 space-y-3">
                        <Label className="text-xs text-muted-foreground">Trade Status</Label>
                        <ToggleGroup
                          type="single"
                          value={tradeStatus}
                          onValueChange={(value) => {
                            if (value) {
                              setTradeStatus(value as 'open' | 'closed');
                              if (value === 'open') {
                                setFormData({ ...formData, exitPrice: null, exitDate: undefined });
                              }
                            }
                          }}
                          className="grid grid-cols-2 gap-3"
                        >
                          <ToggleGroupItem 
                            value="open" 
                            className="gap-2 flex-1 data-[state=on]:bg-blue-500/10 data-[state=on]:border-blue-500/30 data-[state=on]:text-blue-600 dark:data-[state=on]:text-blue-400 transition-all"
                          >
                            Open
                          </ToggleGroupItem>
                          <ToggleGroupItem 
                            value="closed" 
                            className="gap-2 flex-1 data-[state=on]:bg-emerald-500/10 data-[state=on]:border-emerald-500/30 data-[state=on]:text-emerald-600 dark:data-[state=on]:text-emerald-400 transition-all"
                          >
                            Closed
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </CardContent>
                    </Card>
                  )}

                  {/* Core Details */}
                  <Card className="border-border/50">
                    <CardContent className="pt-6 space-y-4">
                      {/* Date and Time */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="date" className="text-xs text-muted-foreground">
                            {entryMode === 'simple' ? 'Trade Date' : 'Entry Date'}
                          </Label>
                          <Input
                            id="date"
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="entryTime" className="text-xs text-muted-foreground">
                              {entryMode === 'simple' ? 'Time' : 'Entry Time'}
                            </Label>
                            <MissingFieldBadge 
                              show={!formData.entryTime} 
                              variant="warning"
                              tooltip="Entry time helps analyze your timing patterns"
                            />
                          </div>
                          <Input
                            id="entryTime"
                            type="time"
                            value={formData.entryTime || ''}
                            onChange={(e) => setFormData({ ...formData, entryTime: e.target.value })}
                          />
                        </div>

                        {/* Exit date/time for closed trades */}
                        <AnimatePresence mode="wait">
                        {entryMode === 'detailed' && tradeStatus === 'closed' && (
                          <>
                            <motion.div
                              key="exit-date"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.2 }}
                              className="space-y-2"
                            >
                              <Label htmlFor="exitDate" className="text-xs text-muted-foreground">Exit Date</Label>
                              <Input
                                id="exitDate"
                                type="date"
                                value={formData.exitDate || formData.date}
                                onChange={(e) => setFormData({ ...formData, exitDate: e.target.value })}
                              />
                            </motion.div>

                            <motion.div
                              key="exit-time"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.2, delay: 0.05 }}
                              className="space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <Label htmlFor="exitTime" className="text-xs text-muted-foreground">Exit Time</Label>
                                <MissingFieldBadge 
                                  show={!formData.exitTime && tradeStatus === 'closed'} 
                                  variant="warning"
                                  tooltip="Exit time helps analyze your exit timing"
                                />
                              </div>
                              <Input
                                id="exitTime"
                                type="time"
                                value={formData.exitTime || ''}
                                onChange={(e) => setFormData({ ...formData, exitTime: e.target.value })}
                              />
                            </motion.div>
                          </>
                        )}
                        </AnimatePresence>
                      </div>

                      {/* Symbol */}
                      <div className="space-y-2">
                        <Label htmlFor="symbol" className="text-xs text-muted-foreground">Symbol *</Label>
                        {recentSymbols.length > 0 && !trade ? (
                          <Select
                            value={formData.symbol}
                            onValueChange={(value) => setFormData({ ...formData, symbol: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select or type symbol" />
                            </SelectTrigger>
                            <SelectContent>
                              {recentSymbols.map(symbol => (
                                <SelectItem key={symbol} value={symbol}>{symbol}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            id="symbol"
                            value={formData.symbol}
                            onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                            placeholder="AAPL"
                          />
                        )}
                      </div>

                      {/* Direction */}
                      <div className="space-y-3">
                        <Label className="text-xs text-muted-foreground">Direction</Label>
                        <ToggleGroup
                          type="single"
                          value={formData.type}
                          onValueChange={(value) => value && setFormData({ ...formData, type: value as 'long' | 'short' })}
                          className="grid grid-cols-2 gap-3"
                        >
                          <ToggleGroupItem 
                            value="long" 
                            className="gap-2 h-12 data-[state=on]:bg-emerald-500/10 data-[state=on]:border-emerald-500/30 data-[state=on]:text-emerald-600 dark:data-[state=on]:text-emerald-400 transition-all"
                          >
                            <TrendingUp className="h-4 w-4" />
                            Long
                          </ToggleGroupItem>
                          <ToggleGroupItem 
                            value="short" 
                            className="gap-2 h-12 data-[state=on]:bg-red-500/10 data-[state=on]:border-red-500/30 data-[state=on]:text-red-600 dark:data-[state=on]:text-red-400 transition-all"
                          >
                            <TrendingDown className="h-4 w-4" />
                            Short
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Prices - Detailed Mode */}
                  <AnimatePresence mode="wait">
                  {entryMode === 'detailed' && (
                    <motion.div
                      key="prices-section"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                    <Card className="border-border/50">
                      <CardContent className="pt-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="entryPrice" className="text-xs text-muted-foreground">Entry Price</Label>
                            <Input
                              id="entryPrice"
                              type="number"
                              step="0.01"
                              value={formData.entryPrice || ''}
                              onChange={(e) => setFormData({ ...formData, entryPrice: parseFloat(e.target.value) || 0 })}
                              placeholder="0.00"
                            />
                          </div>

                          {tradeStatus === 'closed' && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label htmlFor="exitPrice" className="text-xs text-muted-foreground">Exit Price</Label>
                                <MissingFieldBadge 
                                  show={!formData.exitPrice || formData.exitPrice <= 0} 
                                  variant="error"
                                  tooltip="Exit price is required for closed trades"
                                />
                              </div>
                              <Input
                                id="exitPrice"
                                type="number"
                                step="0.01"
                                value={formData.exitPrice || ''}
                                onChange={(e) => setFormData({ ...formData, exitPrice: parseFloat(e.target.value) || null })}
                                placeholder="0.00"
                              />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    </motion.div>
                  )}
                  </AnimatePresence>

                  {/* Simple Mode Result */}
                  <AnimatePresence mode="wait">
                  {entryMode === 'simple' && (
                    <motion.div
                      key="simple-mode-section"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                    <Card className="border-border/50">
                      <CardContent className="pt-6 space-y-4">
                        {/* Win/Loss Toggle */}
                        <div className="space-y-3">
                          <Label className="text-xs text-muted-foreground">Outcome</Label>
                          <ToggleGroup
                            type="single"
                            value={simpleWon ? 'win' : 'loss'}
                            onValueChange={(value) => value && setSimpleWon(value === 'win')}
                            className="grid grid-cols-2 gap-3"
                          >
                            <ToggleGroupItem value="win" className="gap-2 flex-1 h-12 data-[state=on]:bg-green-500/10 data-[state=on]:border-green-500/30 data-[state=on]:text-green-600 dark:data-[state=on]:text-green-400 transition-all">
                              <TrendingUp className="h-4 w-4" />
                              Win
                            </ToggleGroupItem>
                            <ToggleGroupItem value="loss" className="gap-2 flex-1 h-12 data-[state=on]:bg-red-500/10 data-[state=on]:border-red-500/30 data-[state=on]:text-red-600 dark:data-[state=on]:text-red-400 transition-all">
                              <TrendingDown className="h-4 w-4" />
                              Loss
                            </ToggleGroupItem>
                          </ToggleGroup>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {/* R:R Multiple */}
                          <div className="space-y-2">
                            <Label htmlFor="simpleRR">R:R Multiple</Label>
                            <Input
                              id="simpleRR"
                              type="number"
                              step="0.1"
                              value={simpleRR || ''}
                              onChange={(e) => setSimpleRR(parseFloat(e.target.value) || 0)}
                              placeholder="2.5"
                            />
                            <p className="text-xs text-muted-foreground">e.g., 2.5 = 2.5R</p>
                          </div>

                          {/* Dollar Amount */}
                          <div className="space-y-2">
                            <Label htmlFor="simplePnL">Dollar Amount</Label>
                            <Input
                              id="simplePnL"
                              type="number"
                              step="0.01"
                              value={simplePnL || ''}
                              onChange={(e) => setSimplePnL(parseFloat(e.target.value) || 0)}
                              placeholder="250.00"
                            />
                            <p className="text-xs text-muted-foreground">Profit or loss ($)</p>
                          </div>
                        </div>

                        {/* Summary */}
                        <div className={`text-sm p-3 rounded-lg ${
                          simpleWon 
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                            : 'bg-red-500/10 text-red-600 dark:text-red-400'
                        }`}>
                          <span className="font-medium">
                            {simpleWon ? '+' : '-'}${Math.abs(simplePnL).toFixed(2)}
                          </span>
                          {' '}
                          <span className="text-muted-foreground">
                            ({simpleWon ? '+' : '-'}{Math.abs(simpleRR).toFixed(1)}R)
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                    </motion.div>
                  )}
                  </AnimatePresence>

                  {/* Submit Button for Essentials Tab */}
                  {!trade && (
                    <Button type="submit" className="w-full" size="lg">
                      <Check className="h-4 w-4 mr-2" />
                      Save Trade
                    </Button>
                  )}
                </TabsContent>

                {/* Tab 2: Risk Management - Only for Detailed Mode */}
                {entryMode === 'detailed' && (
                  <TabsContent value="risk" className="space-y-6 mt-6">
                    <Card className="border-border/50">
                      <CardContent className="pt-6 space-y-4">
                        {/* Risk Calculation Mode */}
                        <div className="space-y-3">
                          <Label className="text-xs text-muted-foreground">Risk Calculation</Label>
                          <ToggleGroup
                            type="single"
                            value={riskMode}
                            onValueChange={(value) => value && setRiskMode(value as 'manual' | 'rr' | 'pips')}
                            className="grid grid-cols-3 gap-2"
                          >
                            <ToggleGroupItem 
                              value="manual" 
                              className="gap-2 data-[state=on]:bg-blue-500/10 data-[state=on]:border-blue-500/30 data-[state=on]:text-blue-600 dark:data-[state=on]:text-blue-400 transition-all"
                            >
                              Price
                            </ToggleGroupItem>
                            <ToggleGroupItem 
                              value="rr" 
                              className="gap-2 data-[state=on]:bg-purple-500/10 data-[state=on]:border-purple-500/30 data-[state=on]:text-purple-600 dark:data-[state=on]:text-purple-400 transition-all"
                            >
                              R:R
                            </ToggleGroupItem>
                            <ToggleGroupItem 
                              value="pips" 
                              className="gap-2 data-[state=on]:bg-orange-500/10 data-[state=on]:border-orange-500/30 data-[state=on]:text-orange-600 dark:data-[state=on]:text-orange-400 transition-all"
                            >
                              Pips
                            </ToggleGroupItem>
                          </ToggleGroup>
                          <p className="text-xs text-muted-foreground">
                            {riskMode === 'manual' && 'Enter exact price levels for stop loss and target'}
                            {riskMode === 'rr' && 'Auto-calculate target from risk:reward ratio'}
                            {riskMode === 'pips' && 'Enter stop loss and target in pips from entry'}
                          </p>
                        </div>

                        <AnimatePresence mode="wait">
                          {riskMode === 'manual' && (
                            <motion.div
                              key="manual-mode"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.2 }}
                              className="grid grid-cols-2 gap-4"
                            >
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label htmlFor="stopLoss" className="text-xs text-muted-foreground">Stop Loss ($)</Label>
                                  <MissingFieldBadge 
                                    show={!formData.stopLoss} 
                                    variant="warning"
                                    tooltip="Stop loss helps manage risk"
                                  />
                                </div>
                                <Input
                                  id="stopLoss"
                                  type="number"
                                  step="0.01"
                                  value={formData.stopLoss || ''}
                                  onChange={(e) => setFormData({ ...formData, stopLoss: parseFloat(e.target.value) || undefined })}
                                  placeholder="0.00"
                                />
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label htmlFor="target" className="text-xs text-muted-foreground">Target ($)</Label>
                                  <MissingFieldBadge 
                                    show={!formData.target} 
                                    variant="warning"
                                    tooltip="Target price helps track your plan"
                                  />
                                </div>
                                <Input
                                  id="target"
                                  type="number"
                                  step="0.01"
                                  value={formData.target || ''}
                                  onChange={(e) => setFormData({ ...formData, target: parseFloat(e.target.value) || undefined })}
                                  placeholder="0.00"
                                />
                              </div>
                            </motion.div>
                          )}

                          {riskMode === 'rr' && (
                            <motion.div
                              key="rr-mode"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.2 }}
                              className="space-y-4"
                            >
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="stopLoss-rr" className="text-xs text-muted-foreground">Stop Loss ($)</Label>
                                  <Input
                                    id="stopLoss-rr"
                                    type="number"
                                    step="0.01"
                                    value={formData.stopLoss || ''}
                                    onChange={(e) => setFormData({ ...formData, stopLoss: parseFloat(e.target.value) || undefined })}
                                    placeholder="0.00"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="rrValue" className="text-xs text-muted-foreground">Risk:Reward (1:X)</Label>
                                  <Input
                                    id="rrValue"
                                    type="number"
                                    step="0.1"
                                    value={rrValue || ''}
                                    onChange={(e) => setRRValue(parseFloat(e.target.value) || 2)}
                                    placeholder="2.0"
                                  />
                                </div>
                              </div>
                              {formData.target && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="flex items-center gap-2 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20"
                                >
                                  <div className="flex-1">
                                    <p className="text-xs text-muted-foreground">Calculated Target</p>
                                    <p className="font-medium">${formData.target.toFixed(2)}</p>
                                  </div>
                                </motion.div>
                              )}
                            </motion.div>
                          )}

                          {riskMode === 'pips' && (
                            <motion.div
                              key="pips-mode"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.2 }}
                              className="space-y-4"
                            >
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="stopLossPips" className="text-xs text-muted-foreground">Stop Loss (Pips)</Label>
                                  <Input
                                    id="stopLossPips"
                                    type="number"
                                    step="1"
                                    value={stopLossPips || ''}
                                    onChange={(e) => setStopLossPips(parseFloat(e.target.value) || 10)}
                                    placeholder="10"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="targetPips" className="text-xs text-muted-foreground">Target (Pips)</Label>
                                  <Input
                                    id="targetPips"
                                    type="number"
                                    step="1"
                                    value={targetPips || ''}
                                    onChange={(e) => setTargetPips(parseFloat(e.target.value) || 20)}
                                    placeholder="20"
                                  />
                                </div>
                              </div>
                              {formData.stopLoss && formData.target && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="grid grid-cols-2 gap-3"
                                >
                                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                    <p className="text-xs text-muted-foreground">Stop Loss</p>
                                    <p className="font-medium">${formData.stopLoss.toFixed(2)}</p>
                                  </div>
                                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                                    <p className="text-xs text-muted-foreground">Target</p>
                                    <p className="font-medium">${formData.target.toFixed(2)}</p>
                                  </div>
                                </motion.div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>

                    {/* Submit Button for Risk Tab */}
                    {!trade && (
                      <Button type="submit" className="w-full" size="lg">
                        <Check className="h-4 w-4 mr-2" />
                        Save Trade
                      </Button>
                    )}
                  </TabsContent>
                )}

                {/* Tab 3: Details (Setup, Tags, Notes, Screenshots) */}
                <TabsContent value="details" className="space-y-6 mt-6">
                  {/* Setup */}
                  <Card className="border-border/50">
                    <CardContent className="pt-6 space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="setup">Setup</Label>
                          <MissingFieldBadge 
                            show={!formData.setup} 
                            variant="warning"
                            tooltip="Adding a setup helps identify patterns"
                          />
                        </div>
                        <Input
                          id="setup"
                          value={formData.setup}
                          onChange={(e) => setFormData({ ...formData, setup: e.target.value })}
                          placeholder="e.g., Breakout, Support bounce"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Tags</Label>
                          <MissingFieldBadge 
                            show={!formData.tags || formData.tags.length === 0} 
                            variant="warning"
                            tooltip="Tags help categorize and filter trades"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Input
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddTag();
                              }
                            }}
                            placeholder="Add tag and press Enter"
                          />
                          <Button type="button" onClick={handleAddTag} variant="outline">Add</Button>
                        </div>
                        {formData.tags && formData.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {formData.tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="gap-1">
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTag(tag)}
                                  className="ml-1 hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Notes */}
                  <Card className="border-border/50">
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="notes">Notes</Label>
                          <MissingFieldBadge 
                            show={!formData.notes || formData.notes.trim().length === 0} 
                            variant="warning"
                            tooltip="Notes help you remember and learn from each trade"
                          />
                        </div>
                        <Textarea
                          id="notes"
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          placeholder="Trade notes, observations, lessons learned..."
                          autoResize
                          maxHeight={800}
                          className="min-h-[200px]"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Entry Screenshot */}
                  <Card className="border-border/50">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Entry Screenshot</Label>
                          <MissingFieldBadge 
                            show={!formData.screenshotBefore} 
                            variant="warning"
                            tooltip="Add a screenshot of your entry setup"
                          />
                        </div>
                        {!formData.screenshotBefore && entryMode === 'detailed' && (
                          <InlineTaskHint
                            id={`trade-${trade?.id || 'new'}-screenshot-tip`}
                            message="Screenshots help you review setups later and identify patterns in your trading."
                            variant="tip"
                          />
                        )}
                        {formData.screenshotBefore ? (
                          <div className="relative group">
                            <img 
                              src={formData.screenshotBefore} 
                              alt="Entry" 
                              className="w-full rounded-lg border border-border" 
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleRemoveScreenshot('before')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => beforeFileInputRef.current?.click()}
                              className="w-full gap-2"
                            >
                              <ImageIcon className="h-4 w-4" />
                              Upload Image
                            </Button>
                            <input
                              ref={beforeFileInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleBeforeFileUpload}
                            />
                            <div className="relative">
                              <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                              </div>
                              <div className="relative flex justify-center text-xs">
                                <span className="bg-card px-2 text-muted-foreground">or</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Paste image URL"
                                value={screenshotBeforeUrl}
                                onChange={(e) => setScreenshotBeforeUrl(e.target.value)}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleAddScreenshotFromUrl('before')}
                                disabled={!screenshotBeforeUrl}
                              >
                                Add
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Exit Screenshot - only show if closed */}
                  <AnimatePresence mode="wait">
                  {tradeStatus === 'closed' && (
                    <motion.div
                      key="exit-screenshot"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                    <Card className="border-border/50">
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>Exit Screenshot</Label>
                            <MissingFieldBadge 
                              show={!formData.screenshotAfter && tradeStatus === 'closed'} 
                              variant="warning"
                              tooltip="Add a screenshot of your exit"
                            />
                          </div>
                          {formData.screenshotAfter ? (
                            <div className="relative group">
                              <img 
                                src={formData.screenshotAfter} 
                                alt="Exit" 
                                className="w-full rounded-lg border border-border" 
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleRemoveScreenshot('after')}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => afterFileInputRef.current?.click()}
                                className="w-full gap-2"
                              >
                                <ImageIcon className="h-4 w-4" />
                                Upload Image
                              </Button>
                              <input
                                ref={afterFileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAfterFileUpload}
                              />
                              <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                  <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs">
                                  <span className="bg-card px-2 text-muted-foreground">or</span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Paste image URL"
                                  value={screenshotAfterUrl}
                                  onChange={(e) => setScreenshotAfterUrl(e.target.value)}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => handleAddScreenshotFromUrl('after')}
                                  disabled={!screenshotAfterUrl}
                                >
                                  Add
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    </motion.div>
                  )}
                  </AnimatePresence>

                  {/* Submit Button for Details Tab */}
                  {!trade && (
                    <Button type="submit" className="w-full" size="lg">
                      <Check className="h-4 w-4 mr-2" />
                      Save Trade
                    </Button>
                  )}
                </TabsContent>
              </Tabs>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
