import { useState } from 'react';
import { Trade, JournalEntry } from '@/types/journal/trading';
import { DisplayMode } from '@/lib/journal/settings';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Card, CardContent, CardHeader } from './ui/card';
import { SetupBadge } from './SetupBadge';
import { TagBadge } from './TagBadge';
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
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Calendar as CalendarIcon,
  DollarSign,
  Hash,
  Target,
  Edit,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Menu,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FullPageSidebar } from './FullPageSidebar';
import { Theme } from '@/lib/journal/theme';

interface TradeDetailPageProps {
  trade: Trade;
  displayMode: DisplayMode;
  onEdit: (trade: Trade) => void;
  onDelete: (tradeId: string) => void;
  sidebarVisible: boolean;
  onToggleSidebar: () => void;
  trades: Trade[];
  journalEntries: JournalEntry[];
  theme: Theme;
  hasJournalEntryToday: boolean;
  onNavigate: (route: any) => void;
  onDisplayModeChange: (mode: DisplayMode) => void;
  onToggleTheme: () => void;
  onOpenImport: () => void;
  onOpenShortcuts: () => void;
  onOpenSettings: () => void;
}

export function TradeDetailPage({
  trade,
  displayMode,
  onEdit,
  onDelete,
  sidebarVisible,
  onToggleSidebar,
  trades,
  journalEntries,
  theme,
  hasJournalEntryToday,
  onNavigate,
  onDisplayModeChange,
  onToggleTheme,
  onOpenImport,
  onOpenShortcuts,
  onOpenSettings,
}: TradeDetailPageProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const router = useRouter();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatRR = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '0.0R';
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}R`;
  };

  const formatValue = (value: number) => {
    return displayMode === 'rr' && trade.rr !== undefined
      ? formatRR(trade.rr)
      : formatCurrency(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const percentGain =
    trade.type === 'long'
      ? ((trade.exitPrice - trade.entryPrice) / trade.entryPrice) * 100
      : ((trade.entryPrice - trade.exitPrice) / trade.entryPrice) * 100;

  const isWin = trade.pnl > 0;

  const handleEdit = () => {
    router.push(`/dashboard/trades/${encodeURIComponent(trade.id)}`);
  };

  const handleDelete = () => {
    onDelete(trade.id);
    setShowDeleteConfirm(false);
    router.back();
  };

  return (
    <>
      <div className="flex min-h-screen bg-background">
        <FullPageSidebar
          visible={sidebarVisible}
          currentRoute="trade-detail"
          hasJournalEntryToday={hasJournalEntryToday}
          trades={trades}
          journalEntries={journalEntries}
          displayMode={displayMode}
          theme={theme}
          onNavigate={onNavigate}
          onDisplayModeChange={onDisplayModeChange}
          onToggleTheme={onToggleTheme}
          onOpenImport={onOpenImport}
          onOpenShortcuts={onOpenShortcuts}
          onOpenSettings={onOpenSettings}
        />
        
        <div className="flex-1 min-h-screen bg-background pb-24">
          {/* Header */}
          <div className="border-b border-border bg-card sticky top-0 z-10">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleSidebar}
                    aria-label="Toggle sidebar"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    aria-label="Go back"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="mb-0">{trade.symbol}</h1>
                    <Badge variant={trade.type === 'long' ? 'default' : 'secondary'}>
                      {trade.type.toUpperCase()}
                    </Badge>
                    <Badge variant={isWin ? 'default' : 'destructive'}>
                      {isWin ? 'Win' : 'Loss'}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm mt-0.5">
                    {new Date(trade.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="space-y-6">
            {/* P&L Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="mb-0">Performance</h3>
                  <div
                    className={`text-2xl font-semibold ${
                      isWin ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'
                    }`}
                  >
                    {formatValue(trade.pnl)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Percent Gain</p>
                    <p
                      className={`text-lg font-medium ${
                        percentGain >= 0
                          ? 'text-green-600 dark:text-green-500'
                          : 'text-red-600 dark:text-red-500'
                      }`}
                    >
                      {formatPercentage(percentGain)}
                    </p>
                  </div>
                  {trade.rr !== undefined && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">R:R Ratio</p>
                      <p
                        className={`text-lg font-medium ${
                          trade.rr >= 0
                            ? 'text-green-600 dark:text-green-500'
                            : 'text-red-600 dark:text-red-500'
                        }`}
                      >
                        {trade.rr >= 0 ? `1:${Math.abs(trade.rr).toFixed(1)}` : `-${Math.abs(trade.rr).toFixed(1)}R`}
                      </p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Commission</p>
                    <p className="text-lg font-medium">{formatCurrency(trade.commission)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Net P&L</p>
                    <p
                      className={`text-lg font-medium ${
                        isWin ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'
                      }`}
                    >
                      {formatCurrency(trade.pnl)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trade Details */}
            <Card>
              <CardHeader>
                <h3 className="mb-0">Trade Details</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Entry */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <ArrowDownRight className="h-4 w-4" />
                      <span className="text-sm">Entry</span>
                    </div>
                    <div>
                      <p className="text-2xl font-semibold">
                        {formatCurrency(trade.entryPrice)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {trade.quantity} shares
                      </p>
                    </div>
                  </div>

                  {/* Exit */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <ArrowUpRight className="h-4 w-4" />
                      <span className="text-sm">Exit</span>
                    </div>
                    <div>
                      <p className="text-2xl font-semibold">
                        {formatCurrency(trade.exitPrice)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Total: {formatCurrency(trade.exitPrice * trade.quantity)}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Additional Info */}
                <div className="space-y-3">
                  {trade.setup && (
                    <div className="flex items-start gap-3">
                      <Target className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-2">Setup</p>
                        <SetupBadge setupName={trade.setup} variant="secondary" />
                      </div>
                    </div>
                  )}

                  {trade.tags && trade.tags.length > 0 && (
                    <div className="flex items-start gap-3">
                      <Hash className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-2">Tags</p>
                        <div className="flex flex-wrap gap-2">
                          {trade.tags.map((tag) => (
                            <TagBadge key={tag} tagName={tag} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {trade.notes && (
              <Card>
                <CardHeader>
                  <h3 className="mb-0">Notes</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{trade.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-30">
        <Button
          size="lg"
          onClick={() => router.push('/dashboard/trades')}
          className="shadow-lg gap-2 px-6"
        >
          <CalendarIcon className="h-4 w-4" />
          <span>Back to Calendar</span>
        </Button>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Trade</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this trade? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </>
  );
}
