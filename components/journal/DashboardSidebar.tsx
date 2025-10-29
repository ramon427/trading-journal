'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/journal/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/journal/ui/tooltip';
import { LayoutDashboard, Calendar, BarChart3, TrendingUp, Settings, Moon, Sun, Upload, Keyboard, Plus, Target, Palette } from 'lucide-react';
import { useState } from 'react';
import { loadTheme, toggleTheme, Theme, applyTheme } from '@/lib/journal/theme';
import { loadThemeCustomization, applyThemeColors } from '@/lib/journal/themeCustomization';
import { toast } from 'sonner';

interface DashboardSidebarProps {
  displayMode: 'pnl' | 'rr';
  onDisplayModeChange: (mode: 'pnl' | 'rr') => void;
  onOpenImport: () => void;
  onOpenShortcuts: () => void;
  onOpenSettings: () => void;
}

export function DashboardSidebar({
  displayMode,
  onDisplayModeChange,
  onOpenImport,
  onOpenShortcuts,
  onOpenSettings,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState<Theme>(loadTheme());

  const handleToggleTheme = () => {
    const newTheme = toggleTheme(theme);
    setTheme(newTheme);
    applyTheme(newTheme);
    
    const customization = loadThemeCustomization();
    const customColors = newTheme === 'dark' ? customization.dark : customization.light;
    applyThemeColors(customColors, newTheme === 'dark');
    
    toast.success(`${newTheme === 'dark' ? '🌙' : '☀️'} ${newTheme}`, {
      duration: 1500,
    });
  };

  const isActive = (path: string) => pathname === path;

  return (
    <aside className="w-60 border-r border-border bg-card flex-shrink-0 sticky top-0 h-screen overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Branding */}
        <div className="px-2 py-2 mb-2">
          <h2 className="mb-1 tracking-tight">Trading Journal</h2>
          <p className="text-xs text-muted-foreground/80">Track & grow</p>
        </div>

        {/* Quick Actions */}
        <div className="space-y-1">
          <p className="px-2 text-xs text-muted-foreground mb-2">Quick Actions</p>
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => router.push('/dashboard/trades/quick-add')}
                  variant="ghost"
                  className="w-full justify-between gap-2 h-9 group"
                >
                  <div className="flex items-center gap-2 transition-transform duration-200 group-hover:translate-x-0.5">
                    <Plus className="h-4 w-4" />
                    <span>Quick Trade</span>
                  </div>
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] opacity-40 group-hover:opacity-70 transition-opacity">
                    N
                  </kbd>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="text-xs">Simplified trade entry</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => router.push('/dashboard/trades/add')}
                  variant="ghost"
                  className="w-full justify-between gap-2 h-9 group"
                >
                  <div className="flex items-center gap-2 transition-transform duration-200 group-hover:translate-x-0.5">
                    <Plus className="h-4 w-4" />
                    <span>New Trade</span>
                  </div>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="text-xs">Detailed trade entry with all fields</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => router.push('/dashboard/journal/add')}
                  variant="ghost"
                  className="w-full justify-between gap-2 h-9 group"
                >
                  <div className="flex items-center gap-2 transition-transform duration-200 group-hover:translate-x-0.5">
                    <Plus className="h-4 w-4" />
                    <span>Today's Journal</span>
                  </div>
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] opacity-40 group-hover:opacity-70 transition-opacity">
                    J
                  </kbd>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="text-xs">Record your trading day</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          <p className="px-2 text-xs text-muted-foreground mb-2">Pages</p>
          <Link
            href="/dashboard"
            className={`group w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
              isActive('/dashboard')
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2 transition-transform duration-200 group-hover:translate-x-0.5">
              <LayoutDashboard className="h-4 w-4" />
              <span>Home</span>
            </div>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] opacity-40 group-hover:opacity-70 transition-opacity">
              1
            </kbd>
          </Link>
          <Link
            href="/dashboard/benchmarks"
            className={`group w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
              isActive('/dashboard/benchmarks')
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2 transition-transform duration-200 group-hover:translate-x-0.5">
              <Target className="h-4 w-4" />
              <span>Benchmarks</span>
            </div>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] opacity-40 group-hover:opacity-70 transition-opacity">
              2
            </kbd>
          </Link>
          <Link
            href="/dashboard/trades"
            className={`group w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
              isActive('/dashboard/trades')
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2 transition-transform duration-200 group-hover:translate-x-0.5">
              <Calendar className="h-4 w-4" />
              <span>Trades</span>
            </div>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] opacity-40 group-hover:opacity-70 transition-opacity">
              3
            </kbd>
          </Link>
          <Link
            href="/dashboard/analytics"
            className={`group w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
              isActive('/dashboard/analytics')
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2 transition-transform duration-200 group-hover:translate-x-0.5">
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </div>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] opacity-40 group-hover:opacity-70 transition-opacity">
              4
            </kbd>
          </Link>
          <Link
            href="/dashboard/projections"
            className={`group w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
              isActive('/dashboard/projections')
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2 transition-transform duration-200 group-hover:translate-x-0.5">
              <TrendingUp className="h-4 w-4" />
              <span>Projections</span>
            </div>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] opacity-40 group-hover:opacity-70 transition-opacity">
              5
            </kbd>
          </Link>
        </nav>

        {/* Customization */}
        <nav className="space-y-1 pt-4 border-t border-border">
          <p className="px-2 text-xs text-muted-foreground mb-2">Customization</p>
          <Link
            href="/dashboard/customize"
            className={`group w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
              isActive('/dashboard/customize')
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2 transition-transform duration-200 group-hover:translate-x-0.5">
              <Target className="h-4 w-4" />
              <span>Setups & Tags</span>
            </div>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] opacity-40 group-hover:opacity-70 transition-opacity">
              6
            </kbd>
          </Link>
          <Link
            href="/dashboard/preferences"
            className={`group w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
              isActive('/dashboard/preferences')
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2 transition-transform duration-200 group-hover:translate-x-0.5">
              <Palette className="h-4 w-4" />
              <span>Preferences</span>
            </div>
          </Link>
        </nav>

        {/* Settings */}
        <div className="space-y-1 pt-4 border-t border-border">
          <p className="px-2 text-xs text-muted-foreground mb-2">Settings</p>
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onOpenImport}
                  variant="ghost"
                  className="w-full justify-between gap-2 h-9 group"
                >
                  <div className="flex items-center gap-2 transition-transform duration-200 group-hover:translate-x-0.5">
                    <Upload className="h-4 w-4" />
                    <span>Import</span>
                  </div>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="text-xs">Import trades & journals from CSV/JSON</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            onClick={handleToggleTheme}
            variant="ghost"
            className="w-full justify-between gap-2 h-9 group"
          >
            <div className="flex items-center gap-2 transition-transform duration-200 group-hover:translate-x-0.5">
              {theme === 'light' ? (
                <>
                  <Moon className="h-4 w-4" />
                  <span>Dark Mode</span>
                </>
              ) : (
                <>
                  <Sun className="h-4 w-4" />
                  <span>Light Mode</span>
                </>
              )}
            </div>
          </Button>
          <Button
            onClick={onOpenShortcuts}
            variant="ghost"
            className="w-full justify-between gap-2 h-9 group"
          >
            <div className="flex items-center gap-2 transition-transform duration-200 group-hover:translate-x-0.5">
              <Keyboard className="h-4 w-4" />
              <span>Shortcuts</span>
            </div>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] opacity-40 group-hover:opacity-70 transition-opacity">
              ?
            </kbd>
          </Button>
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onOpenSettings}
                  variant="ghost"
                  className="w-full justify-between gap-2 h-9 group"
                >
                  <div className="flex items-center gap-2 transition-transform duration-200 group-hover:translate-x-0.5">
                    <Settings className="h-4 w-4" />
                    <span>Advanced</span>
                  </div>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="text-xs">Manage data & preferences</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Display Mode Toggle */}
        <div className="px-2 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Display</p>
          <div className="flex items-center gap-2">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => onDisplayModeChange('pnl')}
                    variant={displayMode === 'pnl' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 transition-all duration-200"
                  >
                    $
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p className="text-xs">Show dollar amounts</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => onDisplayModeChange('rr')}
                    variant={displayMode === 'rr' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 transition-all duration-200"
                  >
                    R
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p className="text-xs">Show R-multiples</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </aside>
  );
}

