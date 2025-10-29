import { motion } from 'motion/react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { Trade } from '@/types/journal/trading';
import { CheckCircle2, Circle, Sparkles } from 'lucide-react';
import { getTradeSmartSuggestions } from '@/lib/journal/smartSuggestions';
import { useState } from 'react';

interface TradeCompletionTrackerProps {
  formData: Partial<Trade>;
  tradeStatus: 'open' | 'closed';
  entryMode?: 'detailed' | 'simple';
  simpleRR?: number;
  simplePnL?: number;
  allTrades?: Trade[];
  onApplySuggestion?: (field: string, value: any) => void;
}

export function TradeCompletionTracker({ formData, tradeStatus, entryMode = 'detailed', simpleRR, simplePnL, allTrades = [], onApplySuggestion }: TradeCompletionTrackerProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Get smart suggestions
  const suggestions = getTradeSmartSuggestions(formData, allTrades).filter(s => 
    s.confidence === 'high' || s.confidence === 'medium'
  );
  
  // Define fields based on entry mode
  let requiredFields: Array<{ key: string; label: string; check: () => boolean }> = [];
  let importantFields: Array<{ key: string; label: string; check: () => boolean }> = [];
  let closedTradeFields: Array<{ key: string; label: string; check: () => boolean }> = [];
  
  if (entryMode === 'simple') {
    // Simple mode - only fields shown in simple mode
    requiredFields = [
      { key: 'symbol', label: 'Symbol', check: () => !!formData.symbol },
      { key: 'date', label: 'Date', check: () => !!formData.date },
      { key: 'simpleRR', label: 'R:R Multiple', check: () => simpleRR !== undefined && simpleRR > 0 },
      { key: 'simplePnL', label: 'Dollar Amount', check: () => simplePnL !== undefined && simplePnL !== 0 },
    ];

    importantFields = [
      { key: 'entryTime', label: 'Time', check: () => !!formData.entryTime },
      { key: 'setup', label: 'Setup', check: () => !!formData.setup },
      { key: 'notes', label: 'Notes', check: () => !!formData.notes && formData.notes.trim().length > 0 },
      { key: 'tags', label: 'Tags', check: () => !!formData.tags && formData.tags.length > 0 },
      { key: 'screenshotBefore', label: 'Entry Screenshot', check: () => !!formData.screenshotBefore },
    ];

    // Exit screenshot for closed trades in simple mode
    if (tradeStatus === 'closed') {
      closedTradeFields = [
        { key: 'screenshotAfter', label: 'Exit Screenshot', check: () => !!formData.screenshotAfter },
      ];
    }
  } else {
    // Detailed mode - all fields
    requiredFields = [
      { key: 'symbol', label: 'Symbol', check: () => !!formData.symbol },
      { key: 'entryPrice', label: 'Entry Price', check: () => !!formData.entryPrice && formData.entryPrice > 0 },
    ];

    importantFields = [
      { key: 'entryTime', label: 'Entry Time', check: () => !!formData.entryTime },
      { key: 'stopLoss', label: 'Stop Loss', check: () => !!formData.stopLoss },
      { key: 'target', label: 'Target', check: () => !!formData.target },
      { key: 'setup', label: 'Setup', check: () => !!formData.setup },
      { key: 'notes', label: 'Notes', check: () => !!formData.notes && formData.notes.trim().length > 0 },
      { key: 'tags', label: 'Tags', check: () => !!formData.tags && formData.tags.length > 0 },
      { key: 'screenshotBefore', label: 'Entry Screenshot', check: () => !!formData.screenshotBefore },
    ];

    closedTradeFields = [
      { key: 'exitPrice', label: 'Exit Price', check: () => !!formData.exitPrice && formData.exitPrice > 0 },
      { key: 'exitTime', label: 'Exit Time', check: () => !!formData.exitTime },
      { key: 'screenshotAfter', label: 'Exit Screenshot', check: () => !!formData.screenshotAfter },
    ];
  }

  // Combine fields based on trade status and entry mode
  const allFields = tradeStatus === 'closed'
    ? [...requiredFields, ...closedTradeFields, ...importantFields]
    : [...requiredFields, ...importantFields];

  const completedFields = allFields.filter(field => field.check());
  const missingFields = allFields.filter(field => !field.check());
  
  const completionPercentage = Math.round((completedFields.length / allFields.length) * 100);
  
  const isComplete = completionPercentage === 100;
  const isAlmostComplete = completionPercentage >= 75;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`border-border/50 shadow-sm ${
        isComplete 
          ? 'bg-gradient-to-br from-emerald-50/50 via-emerald-50/30 to-transparent dark:from-emerald-950/30 dark:via-emerald-950/20 dark:to-transparent border-emerald-500/30' 
          : isAlmostComplete
          ? 'bg-gradient-to-br from-blue-50/50 via-blue-50/30 to-transparent dark:from-blue-950/30 dark:via-blue-950/20 dark:to-transparent border-blue-500/20'
          : 'bg-gradient-to-br from-card via-card/50 to-muted/20'
      }`}>
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm">Data Completion</p>
                {isComplete && (
                  <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                    Complete
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {isComplete 
                  ? 'All fields filled for optimal tracking'
                  : `${missingFields.length} field${missingFields.length > 1 ? 's' : ''} missing`
                }
              </p>
            </div>
            <div className="text-right">
              <p className={`text-2xl ${
                isComplete 
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : isAlmostComplete
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-muted-foreground'
              }`}>
                {completionPercentage}%
              </p>
            </div>
          </div>

          <Progress 
            value={completionPercentage} 
            className={`h-2 ${
              isComplete 
                ? '[&>div]:bg-emerald-500'
                : isAlmostComplete
                ? '[&>div]:bg-blue-500'
                : '[&>div]:bg-amber-500'
            }`}
          />

          {!isComplete && missingFields.length > 0 && (
            <div className="pt-2 border-t border-border/50 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Missing fields:</p>
                {suggestions.length > 0 && onApplySuggestion && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className="h-5 px-2 text-[10px] gap-1"
                  >
                    <Sparkles className="h-3 w-3" />
                    {suggestions.length} {showSuggestions ? 'Hide' : 'Suggestions'}
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {missingFields.slice(0, 6).map((field) => (
                  <Badge 
                    key={field.key}
                    variant="outline" 
                    className="h-5 px-1.5 text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                  >
                    <Circle className="h-2 w-2 mr-1" />
                    {field.label}
                  </Badge>
                ))}
                {missingFields.length > 6 && (
                  <Badge 
                    variant="outline" 
                    className="h-5 px-1.5 text-[10px]"
                  >
                    +{missingFields.length - 6} more
                  </Badge>
                )}
              </div>
              
              {/* Smart Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1.5 pt-1"
                >
                  {suggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-md bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/30"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <Sparkles className="h-3 w-3 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                            <p className="text-xs font-medium text-purple-700 dark:text-purple-400 capitalize">
                              {suggestion.field.replace(/([A-Z])/g, ' $1').trim()}
                            </p>
                            <Badge variant="outline" className="h-4 px-1 text-[9px] bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800">
                              {suggestion.confidence}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-purple-600 dark:text-purple-400 mb-1">
                            {suggestion.reason}
                          </p>
                          <p className="text-xs text-purple-700 dark:text-purple-300 font-medium truncate">
                            {Array.isArray(suggestion.value) ? suggestion.value.join(', ') : suggestion.value}
                          </p>
                        </div>
                        {onApplySuggestion && (
                          <Button
                            onClick={() => {
                              onApplySuggestion(suggestion.field, suggestion.value);
                              setShowSuggestions(false);
                            }}
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-[10px] border-purple-200 dark:border-purple-800"
                          >
                            Apply
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          )}

          {isComplete && (
            <div className="pt-2 border-t border-border/50 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <p className="text-xs">
                Perfect! This trade has all the data needed for comprehensive analysis.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
