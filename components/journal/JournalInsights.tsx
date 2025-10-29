import { useMemo, useState } from 'react';
import { Trade, JournalEntry } from '@/types/journal/trading';
import { DisplayMode } from '@/lib/journal/settings';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { AlertTriangle, AlertCircle, TrendingDown, Target, X, Check, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface JournalInsightsProps {
  trades: Trade[];
  journalEntries: JournalEntry[];
  displayMode: DisplayMode;
  onDateClick?: (date: string) => void;
}

export function JournalInsights({ trades, journalEntries, displayMode, onDateClick }: JournalInsightsProps) {
  // Store dismissed mistakes in state (could be persisted to localStorage if needed)
  const [dismissedMistakes, setDismissedMistakes] = useState<Set<string>>(new Set());

  const insights = useMemo(() => {
    // Get date from 1 week ago for more focused recent view
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0];

    // Get dates where trades occurred
    const tradeDates = new Set(trades.map(t => t.date));
    
    // Filter journal entries to matching trade dates
    const relevantEntries = journalEntries.filter(j => tradeDates.has(j.date));
    
    if (relevantEntries.length === 0) {
      return { coreMistakes: [] };
    }

    // Core mistakes from the last week: rule breaks + mistake-tagged trades
    const coreMistakes: Array<{
      id: string;
      type: 'rule-break' | 'mistake-trade';
      date: string;
      description: string;
      pnl: number;
      severity: 'high' | 'medium' | 'low';
      pattern?: string;
    }> = [];

    // Add rule-breaking days
    relevantEntries
      .filter(j => !j.followedSystem && j.date >= oneWeekAgoStr)
      .forEach(j => {
        const dayTrades = trades.filter(t => t.date === j.date);
        const totalPnL = dayTrades.reduce((sum, t) => sum + t.pnl, 0);
        const wasNegative = totalPnL < 0;
        
        // Determine severity based on P&L impact
        let severity: 'high' | 'medium' | 'low' = 'medium';
        if (Math.abs(totalPnL) > 300) severity = 'high';
        else if (Math.abs(totalPnL) < 100) severity = 'low';

        // Extract pattern from lessons learned
        const pattern = j.lessonsLearned ? 
          (j.lessonsLearned.toLowerCase().includes('revenge') ? 'Revenge trading' :
           j.lessonsLearned.toLowerCase().includes('fomo') ? 'FOMO trading' :
           j.lessonsLearned.toLowerCase().includes('overtrading') ? 'Overtrading' :
           j.lessonsLearned.toLowerCase().includes('news') ? 'News day trading' :
           undefined) : undefined;
        
        coreMistakes.push({
          id: `rule-break-${j.date}`,
          type: 'rule-break',
          date: j.date,
          description: j.lessonsLearned || j.notes || (wasNegative ? 'Didn\'t follow system - resulted in loss' : 'Didn\'t follow system'),
          pnl: totalPnL,
          severity,
          pattern,
        });
      });

    // Add mistake-tagged trades
    trades
      .filter(t => 
        t.tags?.some(tag => tag.toLowerCase().includes('mistake')) && 
        t.date >= oneWeekAgoStr
      )
      .forEach(t => {
        // Only add if not already added as rule break
        if (!coreMistakes.some(m => m.date === t.date && m.type === 'rule-break')) {
          // Determine severity based on P&L impact
          let severity: 'high' | 'medium' | 'low' = 'medium';
          if (Math.abs(t.pnl) > 300) severity = 'high';
          else if (Math.abs(t.pnl) < 100) severity = 'low';

          // Extract pattern from notes or tags
          const pattern = t.notes ? 
            (t.notes.toLowerCase().includes('revenge') || t.tags?.some(tag => tag.toLowerCase().includes('revenge')) ? 'Revenge trading' :
             t.notes.toLowerCase().includes('fomo') || t.tags?.some(tag => tag.toLowerCase().includes('fomo')) ? 'FOMO trading' :
             t.notes.toLowerCase().includes('overtrad') ? 'Overtrading' :
             undefined) : undefined;

          coreMistakes.push({
            id: `mistake-trade-${t.id}`,
            type: 'mistake-trade',
            date: t.date,
            description: t.notes || `${t.symbol} ${t.setup || 'trade'} - mistake`,
            pnl: t.pnl,
            severity,
            pattern,
          });
        }
      });

    // Sort by severity first, then by date (most recent first)
    coreMistakes.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return b.date.localeCompare(a.date);
    });
    
    return {
      coreMistakes: coreMistakes.slice(0, 4), // Show up to 4 now
    };
  }, [trades, journalEntries]);

  // Filter out dismissed mistakes
  const visibleMistakes = insights.coreMistakes.filter(m => !dismissedMistakes.has(m.id));

  const handleDismiss = (mistakeId: string) => {
    setDismissedMistakes(prev => new Set(prev).add(mistakeId));
    toast.success('Mistake acknowledged');
  };

  // Don't show if no mistakes to fix
  if (visibleMistakes.length === 0) {
    return null;
  }

  const getSeverityIcon = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high':
        return <Zap className="h-3 w-3 text-destructive" />;
      case 'medium':
        return <AlertTriangle className="h-3 w-3 text-chart-3" />;
      case 'low':
        return <AlertCircle className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getSeverityLabel = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high':
        return 'Critical';
      case 'medium':
        return 'Important';
      case 'low':
        return 'Minor';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            <CardTitle className="text-sm">Current Mistakes</CardTitle>
          </div>
          <Badge variant="outline" className="h-5 px-1.5 text-xs">
            {visibleMistakes.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-2">
          {visibleMistakes.map((mistake) => (
            <div
              key={mistake.id}
              className="group relative rounded-md border border-transparent hover:border-border hover:bg-accent/30 transition-all"
            >
              <div className="flex items-start gap-2.5 p-2.5 pr-8">
                {/* Severity icon */}
                <div className="mt-0.5 flex-shrink-0">
                  {getSeverityIcon(mistake.severity)}
                </div>

                {/* Content */}
                <button
                  onClick={() => onDateClick?.(mistake.date)}
                  className="flex-1 text-left min-w-0 space-y-1"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Date */}
                    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0">
                      {new Date(mistake.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>

                    {/* Pattern badge if exists */}
                    {mistake.pattern && (
                      <Badge variant="secondary" className="h-4 px-1.5 text-[10px] flex-shrink-0">
                        {mistake.pattern}
                      </Badge>
                    )}

                    {/* Severity label (only for high) */}
                    {mistake.severity === 'high' && (
                      <Badge variant="destructive" className="h-4 px-1.5 text-[10px] flex-shrink-0">
                        {getSeverityLabel(mistake.severity)}
                      </Badge>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground line-clamp-2 group-hover:text-foreground transition-colors leading-relaxed">
                    {mistake.description}
                  </p>

                  {/* P&L impact if significant */}
                  {Math.abs(mistake.pnl) > 100 && (
                    <p className={`text-xs ${mistake.pnl < 0 ? 'text-destructive' : 'text-chart-2'}`}>
                      Impact: {mistake.pnl < 0 ? '-' : '+'}${Math.abs(mistake.pnl).toFixed(0)}
                    </p>
                  )}
                </button>

                {/* Dismiss button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDismiss(mistake.id);
                  }}
                  className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-background/80"
                  title="Mark as acknowledged"
                >
                  <Check className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Quick tip */}
        {visibleMistakes.length > 0 && (
          <div className="mt-3.5 pt-3 border-t">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              Click to review • Mark <Check className="h-3 w-3 inline-block" /> when fixed
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
