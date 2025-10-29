import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { X, Filter, Search, TrendingUp, TrendingDown, AlertTriangle, AlertCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

export interface TradeFilters {
  dateFrom?: string;
  dateTo?: string;
  symbol?: string;
  setup?: string;
  tag?: string;
  period?: 'all' | 'this-week' | 'last-week' | 'this-month' | 'last-month' | 'this-quarter' | 'last-quarter';
  searchQuery?: string;
  quickFilter?: 'all' | 'wins' | 'losses' | 'rule-breaking';
}

interface TradeFilterProps {
  filters: TradeFilters;
  onFiltersChange: (filters: TradeFilters) => void;
  availableSymbols: string[];
  availableSetups: string[];
  availableTags: string[];
}

export function TradeFilter({ 
  filters, 
  onFiltersChange, 
  availableSymbols, 
  availableSetups,
  availableTags 
}: TradeFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handlePeriodChange = (period: string) => {
    const newFilters = { ...filters, period: period as TradeFilters['period'] };
    
    if (period !== 'all') {
      const today = new Date();
      let fromDate = new Date();
      let toDate = new Date();
      
      switch (period) {
        case 'this-week': {
          // Start of this week (Sunday)
          const dayOfWeek = today.getDay();
          fromDate = new Date(today);
          fromDate.setDate(today.getDate() - dayOfWeek);
          toDate = new Date(today);
          break;
        }
        case 'last-week': {
          // Last Sunday to Last Saturday
          const dayOfWeek = today.getDay();
          fromDate = new Date(today);
          fromDate.setDate(today.getDate() - dayOfWeek - 7);
          toDate = new Date(today);
          toDate.setDate(today.getDate() - dayOfWeek - 1);
          break;
        }
        case 'this-month': {
          // Start of current month
          fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
          toDate = new Date(today);
          break;
        }
        case 'last-month': {
          // Start and end of last month
          fromDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          toDate = new Date(today.getFullYear(), today.getMonth(), 0);
          break;
        }
        case 'this-quarter': {
          // Start of current quarter
          const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
          fromDate = new Date(today.getFullYear(), quarterStartMonth, 1);
          toDate = new Date(today);
          break;
        }
        case 'last-quarter': {
          // Start and end of last quarter
          const currentQuarterStart = Math.floor(today.getMonth() / 3) * 3;
          const lastQuarterStart = currentQuarterStart - 3;
          fromDate = new Date(today.getFullYear(), lastQuarterStart, 1);
          toDate = new Date(today.getFullYear(), currentQuarterStart, 0);
          break;
        }
      }
      
      newFilters.dateFrom = fromDate.toISOString().split('T')[0];
      newFilters.dateTo = toDate.toISOString().split('T')[0];
    } else {
      delete newFilters.dateFrom;
      delete newFilters.dateTo;
    }
    
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    onFiltersChange({ period: 'all', quickFilter: 'all' });
  };

  // Count only manually set filters (not auto-set by period selection)
  const activeFilterCount = Object.keys(filters).filter(key => {
    if (key === 'period' || key === 'quickFilter') return false;
    // If a period is selected, don't count dateFrom/dateTo as they're auto-set
    if ((key === 'dateFrom' || key === 'dateTo') && filters.period && filters.period !== 'all') return false;
    return !!filters[key as keyof TradeFilters];
  }).length;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <h4>Filters</h4>
              {activeFilterCount > 0 && (
                <Badge variant="secondary">{activeFilterCount}</Badge>
              )}
            </div>
            <div className="flex gap-2">
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="min-h-9"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="min-h-9"
              >
                {isExpanded ? 'Less' : 'More'}
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by symbol, setup, or notes..."
              value={filters.searchQuery || ''}
              onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
              className="pl-10"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={(!filters.quickFilter || filters.quickFilter === 'all') ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFiltersChange({ ...filters, quickFilter: 'all' })}
              className="min-h-9"
            >
              All Trades
            </Button>
            <Button
              variant={filters.quickFilter === 'wins' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFiltersChange({ ...filters, quickFilter: 'wins' })}
              className="min-h-9 gap-1.5"
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Wins Only
            </Button>
            <Button
              variant={filters.quickFilter === 'losses' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFiltersChange({ ...filters, quickFilter: 'losses' })}
              className="min-h-9 gap-1.5"
            >
              <TrendingDown className="h-3.5 w-3.5" />
              Losses Only
            </Button>
            <Button
              variant={filters.quickFilter === 'rule-breaking' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFiltersChange({ ...filters, quickFilter: 'rule-breaking' })}
              className="min-h-9 gap-1.5"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Rule-Breaking
            </Button>
          </div>

          {/* Quick Period Filter */}
          <div className="flex flex-wrap gap-2">
            {(['all', 'this-week', 'last-week', 'this-month', 'last-month', 'this-quarter', 'last-quarter'] as const).map(period => {
              const labels = {
                'all': 'All Time',
                'this-week': 'This Week',
                'last-week': 'Last Week',
                'this-month': 'This Month',
                'last-month': 'Last Month',
                'this-quarter': 'This Quarter',
                'last-quarter': 'Last Quarter'
              };
              
              return (
                <Button
                  key={period}
                  variant={filters.period === period ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePeriodChange(period)}
                  className="min-h-9"
                >
                  {labels[period]}
                </Button>
              );
            })}
          </div>

          {/* Expanded Filters */}
          {isExpanded && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
              {/* Date Range */}
              <div className="space-y-2">
                <Label>From Date</Label>
                <Input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value, period: undefined })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>To Date</Label>
                <Input
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value, period: undefined })}
                />
              </div>

              {/* Symbol Filter */}
              <div className="space-y-2">
                <Label>Symbol</Label>
                <Select
                  value={filters.symbol || 'all'}
                  onValueChange={(value) => onFiltersChange({ 
                    ...filters, 
                    symbol: value === 'all' ? undefined : value 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All symbols" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All symbols</SelectItem>
                    {availableSymbols.map(symbol => (
                      <SelectItem key={symbol} value={symbol}>{symbol}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Setup Filter */}
              <div className="space-y-2">
                <Label>Setup</Label>
                <Select
                  value={filters.setup || 'all'}
                  onValueChange={(value) => onFiltersChange({ 
                    ...filters, 
                    setup: value === 'all' ? undefined : value 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All setups" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All setups</SelectItem>
                    {availableSetups.map(setup => (
                      <SelectItem key={setup} value={setup}>{setup}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tag Filter */}
              <div className="space-y-2">
                <Label>Tag</Label>
                <Select
                  value={filters.tag || 'all'}
                  onValueChange={(value) => onFiltersChange({ 
                    ...filters, 
                    tag: value === 'all' ? undefined : value 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All tags" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All tags</SelectItem>
                    {availableTags.map(tag => (
                      <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
