import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Trade, JournalEntry } from '@/types/journal/trading';
import { DisplayMode } from '@/lib/journal/settings';
import { BookOpen, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { stripHtml, isHtmlEmpty } from '@/lib/journal/htmlUtils';

interface SelectedDatePanelProps {
  selectedDate: string;
  trades: Trade[];
  journalEntry: JournalEntry | undefined;
  displayMode: DisplayMode;
  hideJournalFeatures?: boolean;
}

export function SelectedDatePanel({
  selectedDate,
  trades: allTrades,
  journalEntry,
  displayMode,
  hideJournalFeatures = false,
}: SelectedDatePanelProps) {
  const router = useRouter();
  const today = new Date().toISOString().split('T')[0];
  const isToday = selectedDate === today;
  const selectedTrades = allTrades.filter(t => t.date === selectedDate);
  const hasData = selectedTrades.length > 0 || journalEntry;

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

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm mb-0.5">
              {isToday ? 'Today' : 'Selected Date'}
            </h4>
            <p className="text-xs text-muted-foreground">
              {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'short',
                month: 'short', 
                day: 'numeric', 
                year: selectedDate.split('-')[0] !== today.split('-')[0] ? 'numeric' : undefined 
              })}
            </p>
          </div>
          {!isToday && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                const todayElement = document.querySelector(`[data-date="${today}"]`);
                if (todayElement) {
                  (todayElement as HTMLElement).click();
                }
              }}
              className="h-7 px-2 text-xs"
            >
              Jump to today
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {!hasData ? (
          <div className="bg-muted/30 border border-dashed border-border rounded-lg p-4 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              {isToday ? 'No activity yet today' : 'No activity on this date'}
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              {!hideJournalFeatures && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/dashboard/journal/add?date=${encodeURIComponent(selectedDate)}`)}
                  className="gap-2"
                >
                  <BookOpen className="h-3 w-3" />
                  Add Journal
                </Button>
              )}
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
            {journalEntry && !hideJournalFeatures && (
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
                      {!isHtmlEmpty(journalEntry.notes) ? (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {stripHtml(journalEntry.notes)}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          No description added
                        </p>
                      )}
                      {(journalEntry.lessonsLearned || journalEntry.marketConditions) && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {journalEntry.lessonsLearned && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <span className="line-clamp-1">{journalEntry.lessonsLearned}</span>
                            </div>
                          )}
                          {journalEntry.marketConditions && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <span className="line-clamp-1">{journalEntry.marketConditions}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {/* Journal Metadata */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {journalEntry.followedSystem !== undefined && !journalEntry.followedSystem && (
                          <Badge variant="destructive" className="h-4 px-1.5 text-[10px]">
                            Off-system
                          </Badge>
                        )}
                        {journalEntry.isNewsDay && (
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
                {selectedTrades.slice(0, 5).map((trade) => (
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
                {selectedTrades.length > 5 && (
                  <p className="text-center text-xs text-muted-foreground py-2">
                    +{selectedTrades.length - 5} more trade{selectedTrades.length - 5 !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
