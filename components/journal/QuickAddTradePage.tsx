import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Card, CardContent } from './ui/card';
import { Textarea } from './ui/textarea';
import { Trade, TradeTemplate, JournalEntry } from '@/types/journal/trading';
import { validateTradeWithWarnings, ValidationError } from '@/lib/journal/validation';
import { loadSmartDefaults, updateFromTrade } from '@/lib/journal/smartDefaults';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { TrendingUp, TrendingDown, AlertTriangle, ArrowLeft, Check, Maximize2, Image as ImageIcon, X, Menu, Zap, Clock, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { addRecentSymbol } from '@/lib/journal/tradeTemplates';
import { useRouter } from 'next/navigation';
import { DisplayMode } from '@/lib/journal/settings';
import { Theme } from '@/lib/journal/theme';

interface QuickAddTradePageProps {
  onSave: (trade: Trade) => void;
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

export function QuickAddTradePage({ 
  onSave, 
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
}: QuickAddTradePageProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<Partial<Trade>>({
    date: defaultDate || new Date().toISOString().split('T')[0],
    entryTime: new Date().toTimeString().slice(0, 5), // Current time in HH:MM format
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
  });
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<ValidationError[]>([]);
  const [screenshotBeforeUrl, setScreenshotBeforeUrl] = useState('');
  const beforeFileInputRef = useRef<HTMLInputElement>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialFormDataRef = useRef<string>('');
  const tradeIdRef = useRef<string>(`trade_${Date.now()}`); // Store trade ID to reuse
  const [showRecentTrades, setShowRecentTrades] = useState(false);
  const symbolInputRef = useRef<HTMLInputElement>(null);

  // Initialize form with smart defaults
  useEffect(() => {
    const defaults = loadSmartDefaults();
    const newFormData = {
      ...formData,
      symbol: defaults.lastSymbol || '',
      type: defaults.lastType || 'long',
      tags: defaults.lastTags || [],
      setup: defaults.lastSetup || '',
    };
    setFormData(newFormData);
    
    // Store initial state for comparison after a brief delay
    setTimeout(() => {
      initialFormDataRef.current = JSON.stringify(newFormData);
    }, 0);
  }, []);

  // Detect changes and trigger auto-save
  useEffect(() => {
    if (!initialFormDataRef.current) return; // Wait for initial state to be set
    
    const currentFormData = JSON.stringify(formData);
    
    // Only detect changes if initial state exists and symbol is filled
    if (currentFormData !== initialFormDataRef.current && formData.symbol && formData.symbol.trim() !== '') {
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
  }, [formData]);

  // Auto-save function
  const performAutoSave = () => {
    if (!hasUnsavedChanges) return;
    
    setIsSaving(true);
    
    // Quick trade only requires symbol, skip full validation
    if (!formData.symbol || formData.symbol.trim() === '') {
      setIsSaving(false);
      return;
    }

    const newTrade: Trade = {
      id: tradeIdRef.current, // Reuse the same trade ID
      date: formData.date!,
      entryTime: formData.entryTime,
      symbol: formData.symbol!.toUpperCase(),
      type: formData.type!,
      entryPrice: 0, // Quick trade doesn't require entry price
      exitPrice: null,
      exitDate: undefined,
      pnl: 0,
      rr: null,
      notes: formData.notes || '',
      tags: formData.tags || [],
      setup: formData.setup || '',
      status: 'open',
      stopLoss: formData.stopLoss,
      target: formData.target,
      screenshotBefore: formData.screenshotBefore,
      screenshotAfter: undefined,
    };

    addRecentSymbol(newTrade.symbol);
    updateFromTrade(newTrade);
    onSave(newTrade);
    
    // Update the initial state to current state
    initialFormDataRef.current = JSON.stringify(formData);
    
    setHasUnsavedChanges(false);
    setIsSaving(false);
    
    // No toast for auto-save - it's automatic
  };

  // Handle close with auto-save
  const handleClose = () => {
    if (hasUnsavedChanges && formData.symbol && formData.symbol.trim() !== '') {
      // Save before closing - quick trade only requires symbol
      const newTrade: Trade = {
        id: tradeIdRef.current, // Reuse the same trade ID
        date: formData.date!,
        entryTime: formData.entryTime,
        symbol: formData.symbol!.toUpperCase(),
        type: formData.type!,
        entryPrice: 0,
        exitPrice: null,
        exitDate: undefined,
        pnl: 0,
        rr: null,
        notes: formData.notes || '',
        tags: formData.tags || [],
        setup: formData.setup || '',
        status: 'open',
        stopLoss: formData.stopLoss,
        target: formData.target,
        screenshotBefore: formData.screenshotBefore,
        screenshotAfter: undefined,
      };

      addRecentSymbol(newTrade.symbol);
      updateFromTrade(newTrade);
      onSave(newTrade);
      // No toast here - App.tsx will show "Trade updated successfully"
    }
    
    router.back();
  };

  const handleTemplateSelect = (templateId: string) => {
    if (!templateId) {
      setSelectedTemplate('');
      return;
    }

    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        type: template.type,
        setup: template.setup,
        tags: template.tags,
        stopLoss: template.stopLoss,
        target: template.target,
      }));
      setSelectedTemplate(templateId);
      if (onTemplateUsed) {
        onTemplateUsed(templateId);
      }
      toast.success(`Template "${template.name}\" applied`);
    }
  };

  const handleBeforeImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotBeforeUrl(reader.result as string);
        setFormData({ ...formData, screenshotBefore: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScreenshotUrlChange = (url: string) => {
    setScreenshotBeforeUrl(url);
    setFormData({ ...formData, screenshotBefore: url });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Just trigger the auto-save immediately
    if (hasUnsavedChanges) {
      performAutoSave();
    } else {
      router.back();
    }
  };

  const handleExpandToFull = () => {
    const query = formData.date ? `?date=${encodeURIComponent(formData.date)}` : '';
    router.push(`/dashboard/trades/add${query}`);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape should always work, even when typing in inputs
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
        return;
      }

      // Don't trigger other shortcuts if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }

      // F to expand to full form
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        handleExpandToFull();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasUnsavedChanges, formData]);

  return (
    <div className="bg-background">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border bg-card sticky top-0 z-10">
          <div className="container mx-auto max-w-[1800px] px-6 py-6">
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
                  onClick={handleClose}
                  className="flex-shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-0">
                  <h1 className="mb-0 truncate">Quick Trade</h1>
                  <p className="text-muted-foreground text-sm mt-0.5">
                    Fast entry for on-the-go logging
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <AnimatePresence mode="wait">
                {isSaving ? (
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
                ) : hasUnsavedChanges ? (
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
                ) : formData.symbol ? (
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
                <Button
                  onClick={handleExpandToFull}
                  size="lg"
                  className="gap-2"
                >
                  <Maximize2 className="h-4 w-4" />
                  Full Form
                  <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 text-muted-foreground">
                    F
                  </kbd>
                </Button>
                <Button 
                  onClick={handleClose} 
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

        <div className="container mx-auto max-w-4xl px-6 py-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Copy from Recent Trade */}
            {trades.length > 0 && !formData.symbol && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-blue-500/10">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Copy className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <Label className="text-sm">Quick start from recent trade</Label>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {trades.slice(0, 4).map((trade) => (
                          <Button
                            key={trade.id}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                symbol: trade.symbol,
                                type: trade.type,
                                setup: trade.setup,
                                tags: trade.tags,
                              });
                              toast.success(`Copied from ${trade.symbol}`);
                              symbolInputRef.current?.focus();
                            }}
                            className="justify-start gap-2 hover:bg-blue-500/10 transition-all hover:scale-105"
                          >
                            <span className="font-medium">{trade.symbol}</span>
                            <Badge variant="outline" className="text-xs px-1">
                              {trade.type === 'long' ? '↑' : '↓'}
                            </Badge>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
            
            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error.message}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Basic Trade Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
            <Card className="border-border/50 bg-gradient-to-br from-card via-card/50 to-muted/20 shadow-sm">
              <CardContent className="pt-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-xs text-muted-foreground">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="enhanced-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time" className="text-xs text-muted-foreground">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.entryTime}
                      onChange={(e) => setFormData({ ...formData, entryTime: e.target.value })}
                      className="enhanced-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="symbol" className="text-xs text-muted-foreground">Symbol *</Label>
                    <div className="relative">
                      <Input
                        ref={symbolInputRef}
                        id="symbol"
                        type="text"
                        placeholder="AAPL"
                        value={formData.symbol}
                        onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                        list="recent-symbols"
                        className="enhanced-input pr-10"
                        autoFocus
                      />
                      {formData.symbol && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          type="button"
                          onClick={() => setFormData({ ...formData, symbol: '' })}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-accent transition-colors"
                        >
                          <X className="h-3 w-3 text-muted-foreground" />
                        </motion.button>
                      )}
                    </div>
                    {recentSymbols.length > 0 && (
                      <datalist id="recent-symbols">
                        {recentSymbols.map((symbol) => (
                          <option key={symbol} value={symbol} />
                        ))}
                      </datalist>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            </motion.div>

            {/* Trade Type */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
            <Card className="border-border/50 bg-gradient-to-br from-card via-card/50 to-muted/20 shadow-sm">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Label className="text-xs text-muted-foreground">Direction</Label>
                  <ToggleGroup
                    type="single"
                    value={formData.type}
                    onValueChange={(value) => {
                      if (value) setFormData({ ...formData, type: value as 'long' | 'short' });
                    }}
                    className="grid grid-cols-2 gap-3"
                  >
                    <ToggleGroupItem 
                      value="long" 
                      className="gap-2 h-12 data-[state=on]:bg-emerald-500/10 data-[state=on]:border-emerald-500/30 data-[state=on]:text-emerald-600 dark:data-[state=on]:text-emerald-400 transition-all"
                    >
                      <TrendingUp className="h-4 w-4" />
                      <span>Long</span>
                    </ToggleGroupItem>
                    <ToggleGroupItem 
                      value="short" 
                      className="gap-2 h-12 data-[state=on]:bg-red-500/10 data-[state=on]:border-red-500/30 data-[state=on]:text-red-600 dark:data-[state=on]:text-red-400 transition-all"
                    >
                      <TrendingDown className="h-4 w-4" />
                      <span>Short</span>
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </CardContent>
            </Card>
            </motion.div>
            
            {/* Quick Setup Buttons */}
            {formData.symbol && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
              <Card className="border-border/50 bg-gradient-to-br from-card via-card/50 to-muted/20 shadow-sm">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">Quick Setup</Label>
                      <Badge variant="outline" className="text-xs">
                        <Zap className="h-3 w-3 mr-1" />
                        Fast fill
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {['Breakout', 'Pullback', 'Reversal', 'Range', 'Trend', 'Gap'].map((setupName) => (
                        <Button
                          key={setupName}
                          type="button"
                          variant={formData.setup === setupName ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setFormData({ ...formData, setup: setupName })}
                          className="transition-all hover:scale-105"
                        >
                          {setupName}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
              </motion.div>
            )}

            {/* Notes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25 }}
            >
            <Card className="border-border/50 bg-gradient-to-br from-card via-card/50 to-muted/20 shadow-sm">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Label htmlFor="notes" className="text-xs text-muted-foreground flex items-center gap-2">
                    Notes (optional)
                    <Badge variant="outline" className="text-xs px-1.5 py-0">
                      <Clock className="h-3 w-3 mr-1" />
                      Quick capture
                    </Badge>
                  </Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Quick notes: entry reason, market conditions, or key levels..."
                    className="enhanced-textarea min-h-[100px] resize-none"
                  />
                </div>
              </CardContent>
            </Card>
            </motion.div>

            {/* Entry Screenshot (Optional) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
            <Card className="border-border/50 bg-gradient-to-br from-card via-card/50 to-muted/20 shadow-sm">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Label className="text-xs text-muted-foreground">Entry Screenshot (optional)</Label>
                  <AnimatePresence mode="wait">
                  {formData.screenshotBefore ? (
                    <motion.div
                      key="image-preview"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="relative group"
                    >
                      <img 
                        src={formData.screenshotBefore} 
                        alt="Entry" 
                        className="w-full rounded-lg border border-border shadow-sm" 
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                        onClick={() => {
                          setScreenshotBeforeUrl('');
                          setFormData({ ...formData, screenshotBefore: undefined });
                          if (beforeFileInputRef.current) {
                            beforeFileInputRef.current.value = '';
                          }
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="image-upload"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3"
                    >
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => beforeFileInputRef.current?.click()}
                        className="w-full gap-2 h-12 border-dashed hover:bg-accent hover:scale-[1.02] transition-all"
                      >
                        <ImageIcon className="h-4 w-4" />
                        Upload Chart Screenshot
                      </Button>
                      <input
                        ref={beforeFileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleBeforeImageChange}
                      />
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                          <span className="bg-card px-2 text-muted-foreground">or paste URL</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="https://..."
                          value={screenshotBeforeUrl}
                          onChange={(e) => setScreenshotBeforeUrl(e.target.value)}
                          className="text-sm"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleScreenshotUrlChange(screenshotBeforeUrl)}
                          disabled={!screenshotBeforeUrl}
                        >
                          Add
                        </Button>
                      </div>
                    </motion.div>
                  )}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
            </motion.div>

            {/* Template Selection */}
            {templates.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.35 }}
              >
              <Card className="border-border/50 bg-gradient-to-br from-card via-card/50 to-muted/20 shadow-sm">
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
                        {templates.map((template) => (
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
              </motion.div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
