import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { navigateTo } from '@/lib/journal/router';
import { 
  LayoutDashboard, 
  Calendar, 
  BarChart3, 
  Settings, 
  Moon, 
  Sun, 
  Upload, 
  Keyboard, 
  Plus
} from 'lucide-react';
import { Trade, JournalEntry } from '@/types/journal/trading';
import { DisplayMode } from '@/lib/journal/settings';
import { Theme } from '@/lib/journal/theme';

interface FullPageSidebarProps {
  visible: boolean;
  currentRoute: string;
  hasJournalEntryToday: boolean;
  trades?: Trade[];
  journalEntries?: JournalEntry[];
  displayMode: DisplayMode;
  theme: Theme;
  onNavigate: (route: any) => void;
  onDisplayModeChange: (mode: DisplayMode) => void;
  onToggleTheme: () => void;
  onOpenImport: () => void;
  onOpenShortcuts: () => void;
  onOpenSettings: () => void;
}

export function FullPageSidebar({
  visible,
  currentRoute,
  hasJournalEntryToday,
  trades = [],
  journalEntries = [],
  displayMode,
  theme,
  onNavigate,
  onDisplayModeChange,
  onToggleTheme,
  onOpenImport,
  onOpenShortcuts,
  onOpenSettings,
}: FullPageSidebarProps) {
  if (!visible) return null;

  return (
    <aside className="w-60 border-r border-border bg-card flex-shrink-0 sticky top-0 h-screen overflow-y-auto animate-in slide-in-from-left duration-200">
      <div className="p-4 space-y-6">
        {/* Branding */}
        <div className="px-2 py-1">
          <h2 className="text-sm mb-0.5">Trading Journal</h2>
          <p className="text-xs text-muted-foreground">Track & grow</p>
        </div>

        {/* Quick Actions */}
        <div className="space-y-1">
          <p className="px-2 text-xs text-muted-foreground mb-2">Quick Actions</p>
          <Button
            onClick={() => onNavigate({ type: 'quick-add-trade' })}
            variant="ghost"
            className="w-full justify-start gap-2 h-9"
          >
            <Plus className="h-4 w-4" />
            <span>Quick Add</span>
          </Button>
          <Button
            onClick={() => onNavigate({ type: 'add-trade' })}
            variant="ghost"
            className="w-full justify-start gap-2 h-9"
          >
            <Plus className="h-4 w-4" />
            <span>Add Trade</span>
          </Button>
          <Button
            onClick={() => onNavigate({ type: 'add-journal' })}
            variant="ghost"
            className="w-full justify-start gap-2 h-9"
          >
            <Plus className="h-4 w-4" />
            <span>{hasJournalEntryToday ? 'Open Journal' : 'Add Journal'}</span>
          </Button>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          <p className="px-2 text-xs text-muted-foreground mb-2">Pages</p>
          <button
            onClick={() => onNavigate({ type: 'overview' })}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
              currentRoute === 'overview'
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Overview</span>
          </button>
          <button
            onClick={() => onNavigate({ type: 'trades' })}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
              currentRoute === 'trades'
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Trades</span>
          </button>
          <button
            onClick={() => onNavigate({ type: 'analytics' })}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
              currentRoute === 'analytics'
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Projections</span>
          </button>
        </nav>

        {/* Recent Activity */}
        <div className="space-y-1 pt-4 border-t border-border">
          <p className="px-2 text-xs text-muted-foreground mb-2">Recent</p>
          {(() => {
            // Get 3 most recent trades
            const recentTrades = [...trades]
              .sort((a, b) => {
                const dateA = new Date(a.date + (a.entryTime ? `T${a.entryTime}` : '')).getTime();
                const dateB = new Date(b.date + (b.entryTime ? `T${b.entryTime}` : '')).getTime();
                return dateB - dateA;
              })
              .slice(0, 3);

            // Get 2 most recent journal entries
            const recentJournals = [...journalEntries]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 2);

            if (recentTrades.length === 0 && recentJournals.length === 0) {
              return (
                <div className="px-2 py-2 text-xs text-muted-foreground">
                  No recent activity
                </div>
              );
            }

            return (
              <div className="space-y-1">
                {recentTrades.map((trade) => (
                  <button
                    key={trade.id}
                    onClick={() => onNavigate({ type: 'add-trade', tradeId: trade.id })}
                    className="w-full flex items-start gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  >
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-medium">{trade.symbol}</span>
                        <Badge 
                          variant={trade.pnl >= 0 ? 'default' : 'destructive'} 
                          className="h-4 px-1 text-xs"
                        >
                          {trade.type === 'long' ? '↑' : '↓'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {new Date(trade.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {trade.entryTime && ` • ${trade.entryTime}`}
                      </p>
                    </div>
                  </button>
                ))}
                {recentJournals.map((journal) => (
                  <button
                    key={journal.date}
                    onClick={() => onNavigate({ type: 'add-journal', date: journal.date })}
                    className="w-full flex items-start gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  >
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-medium">Journal</span>
                        <Badge 
                          variant="outline" 
                          className="h-4 px-1 text-xs"
                        >
                          {journal.mood === 'excellent' ? '😊' : 
                           journal.mood === 'good' ? '🙂' : 
                           journal.mood === 'neutral' ? '😐' : 
                           journal.mood === 'poor' ? '😕' : '😞'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {new Date(journal.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Settings */}
        <div className="space-y-1 pt-4 border-t border-border">
          <p className="px-2 text-xs text-muted-foreground mb-2">Settings</p>
          <Button
            onClick={onOpenImport}
            variant="ghost"
            className="w-full justify-start gap-2 h-9"
          >
            <Upload className="h-4 w-4" />
            <span>Import</span>
          </Button>
          <Button
            onClick={onToggleTheme}
            variant="ghost"
            className="w-full justify-start gap-2 h-9"
          >
            {theme === 'light' ? (
              <>
                <Moon className="h-4 w-4" />
                <span>Dark</span>
              </>
            ) : (
              <>
                <Sun className="h-4 w-4" />
                <span>Light</span>
              </>
            )}
          </Button>
          <Button
            onClick={onOpenShortcuts}
            variant="ghost"
            className="w-full justify-start gap-2 h-9"
          >
            <Keyboard className="h-4 w-4" />
            <span>Shortcuts</span>
          </Button>
          <Button
            onClick={onOpenSettings}
            variant="ghost"
            className="w-full justify-start gap-2 h-9"
          >
            <Settings className="h-4 w-4" />
            <span>Advanced</span>
          </Button>
        </div>

        {/* Display Mode Toggle */}
        <div className="px-2 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Display</p>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => onDisplayModeChange('pnl')}
              variant={displayMode === 'pnl' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
            >
              $
            </Button>
            <Button
              onClick={() => onDisplayModeChange('rr')}
              variant={displayMode === 'rr' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
            >
              R
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
