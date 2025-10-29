import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { 
  X, 
  Filter, 
  ChevronDown, 
  Save, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Calendar as CalendarIcon,
  Tag as TagIcon,
  Search,
  Bookmark,
  Check,
  Settings2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { toast } from 'sonner';

export interface AdvancedTradeFilters {
  // Existing filters
  dateFrom?: string;
  dateTo?: string;
  symbols?: string[]; // Multi-select
  setups?: string[]; // Multi-select
  tags?: string[]; // Multi-select
  searchQuery?: string;
  
  // Advanced filters
  outcome?: 'all' | 'wins' | 'losses' | 'breakeven';
  status?: 'all' | 'open' | 'closed';
  tradeType?: 'all' | 'long' | 'short';
  
  // Range filters
  pnlMin?: number;
  pnlMax?: number;
  rrMin?: number;
  rrMax?: number;
  
  // Rule-based
  ruleBreaking?: boolean;
  hasNotes?: boolean;
  hasTags?: boolean;
  hasScreenshots?: boolean;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: AdvancedTradeFilters;
  createdAt: string;
}

interface AdvancedFiltersProps {
  filters: AdvancedTradeFilters;
  onFiltersChange: (filters: AdvancedTradeFilters) => void;
  availableSymbols: string[];
  availableSetups: string[];
  availableTags: string[];
  presets?: FilterPreset[];
  onSavePreset?: (name: string, filters: AdvancedTradeFilters) => void;
  onLoadPreset?: (preset: FilterPreset) => void;
  onDeletePreset?: (presetId: string) => void;
  horizontal?: boolean;
}

// Multi-select popover component
function MultiSelectPopover({
  label,
  icon: Icon,
  options,
  selected,
  onToggle,
  searchPlaceholder,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  searchPlaceholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = options.filter(opt => 
    opt.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="justify-start gap-2 h-8 w-[110px]">
          <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm flex-1 text-left">{label}</span>
          {selected.length > 0 && (
            <Badge variant="secondary" className="h-4 px-1.5 text-xs flex-shrink-0">
              {selected.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-8"
            />
          </div>
        </div>
        <ScrollArea className="h-64">
          <div className="p-2 space-y-1">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No options found
              </p>
            ) : (
              filtered.map((option) => (
                <button
                  key={option}
                  onClick={() => onToggle(option)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent transition-colors"
                >
                  <div className={`h-4 w-4 border rounded flex items-center justify-center ${
                    selected.includes(option) ? 'bg-primary border-primary' : 'border-input'
                  }`}>
                    {selected.includes(option) && (
                      <Check className="h-3 w-3 text-primary-foreground" />
                    )}
                  </div>
                  <span>{option}</span>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
        {selected.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  selected.forEach(s => onToggle(s));
                  setSearch('');
                }}
                className="w-full h-8 text-xs"
              >
                Clear all ({selected.length})
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function AdvancedFilters({ 
  filters, 
  onFiltersChange, 
  availableSymbols, 
  availableSetups,
  availableTags,
  presets = [],
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
  horizontal = false,
}: AdvancedFiltersProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [savePresetName, setSavePresetName] = useState('');

  // Quick date ranges
  const applyQuickDateRange = (range: string) => {
    const today = new Date();
    let fromDate = new Date();
    let toDate = new Date();
    
    switch (range) {
      case 'today':
        fromDate = toDate = new Date();
        break;
      case 'last-7':
        fromDate = new Date(today);
        fromDate.setDate(today.getDate() - 7);
        toDate = new Date();
        break;
      case 'last-30':
        fromDate = new Date(today);
        fromDate.setDate(today.getDate() - 30);
        toDate = new Date();
        break;
      case 'this-month':
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
        toDate = new Date();
        break;
      case 'last-month':
        fromDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        toDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'this-quarter':
        const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
        fromDate = new Date(today.getFullYear(), quarterStartMonth, 1);
        toDate = new Date();
        break;
      case 'all':
        onFiltersChange({
          ...filters,
          dateFrom: undefined,
          dateTo: undefined,
        });
        return;
    }
    
    onFiltersChange({
      ...filters,
      dateFrom: fromDate.toISOString().split('T')[0],
      dateTo: toDate.toISOString().split('T')[0],
    });
  };

  const toggleArrayFilter = (key: 'symbols' | 'setups' | 'tags', value: string) => {
    const current = filters[key] || [];
    const newValue = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    
    onFiltersChange({
      ...filters,
      [key]: newValue.length > 0 ? newValue : undefined,
    });
  };

  const removeFilter = (key: keyof AdvancedTradeFilters) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    onFiltersChange({});
    toast.success('Filters cleared');
  };

  const handleSavePreset = () => {
    if (!savePresetName.trim()) {
      toast.error('Please enter a preset name');
      return;
    }
    
    if (onSavePreset) {
      onSavePreset(savePresetName, filters);
      setSavePresetName('');
      setPresetsOpen(false);
      toast.success(`Preset "${savePresetName}" saved`);
    }
  };

  // Count active filters
  const activeFilterCount = Object.keys(filters).filter(key => {
    const value = filters[key as keyof AdvancedTradeFilters];
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'boolean') return value === true;
    if (typeof value === 'number') return true;
    if (typeof value === 'string') return value.length > 0 && value !== 'all';
    return false;
  }).length;

  // Active filter chips
  const getActiveFilterChips = () => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];

    if (filters.outcome && filters.outcome !== 'all') {
      chips.push({
        key: 'outcome',
        label: filters.outcome.charAt(0).toUpperCase() + filters.outcome.slice(1),
        onRemove: () => removeFilter('outcome'),
      });
    }

    if (filters.dateFrom || filters.dateTo) {
      const dateLabel = filters.dateFrom && filters.dateTo 
        ? `${filters.dateFrom} to ${filters.dateTo}`
        : filters.dateFrom 
        ? `From ${filters.dateFrom}`
        : `To ${filters.dateTo}`;
      chips.push({
        key: 'date',
        label: dateLabel,
        onRemove: () => {
          onFiltersChange({ ...filters, dateFrom: undefined, dateTo: undefined });
        },
      });
    }

    if (filters.symbols && filters.symbols.length > 0) {
      chips.push({
        key: 'symbols',
        label: `${filters.symbols.length} symbol${filters.symbols.length > 1 ? 's' : ''}`,
        onRemove: () => removeFilter('symbols'),
      });
    }

    if (filters.setups && filters.setups.length > 0) {
      chips.push({
        key: 'setups',
        label: `${filters.setups.length} setup${filters.setups.length > 1 ? 's' : ''}`,
        onRemove: () => removeFilter('setups'),
      });
    }

    if (filters.tags && filters.tags.length > 0) {
      chips.push({
        key: 'tags',
        label: `${filters.tags.length} tag${filters.tags.length > 1 ? 's' : ''}`,
        onRemove: () => removeFilter('tags'),
      });
    }

    if (filters.status && filters.status !== 'all') {
      chips.push({
        key: 'status',
        label: `Status: ${filters.status}`,
        onRemove: () => removeFilter('status'),
      });
    }

    if (filters.tradeType && filters.tradeType !== 'all') {
      chips.push({
        key: 'tradeType',
        label: `Type: ${filters.tradeType}`,
        onRemove: () => removeFilter('tradeType'),
      });
    }

    return chips;
  };

  const activeChips = getActiveFilterChips();

  // Horizontal compact layout
  if (horizontal) {
    return (
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            {/* Search - Fixed width */}
            <div className="relative w-[240px] flex-shrink-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search trades..."
                value={filters.searchQuery || ''}
                onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
                className="pl-8 h-8 text-sm w-full"
              />
            </div>

            {/* Quick Filters - Fixed widths */}
            <div className="flex gap-1.5 flex-shrink-0">
              <Button
                variant={(!filters.outcome || filters.outcome === 'all') ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFiltersChange({ ...filters, outcome: 'all' })}
                className="h-8 w-[52px]"
              >
                All
              </Button>
              <Button
                variant={filters.outcome === 'wins' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFiltersChange({ ...filters, outcome: 'wins' })}
                className="h-8 w-[68px] gap-1"
              >
                <TrendingUp className="h-3 w-3" />
                Wins
              </Button>
              <Button
                variant={filters.outcome === 'losses' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFiltersChange({ ...filters, outcome: 'losses' })}
                className="h-8 w-[80px] gap-1"
              >
                <TrendingDown className="h-3 w-3" />
                Losses
              </Button>
            </div>

            {/* Multi-select filters - Fixed positions */}
            <div className="flex gap-1.5 flex-shrink-0">
              <MultiSelectPopover
                label="Symbols"
                icon={DollarSign}
                options={availableSymbols}
                selected={filters.symbols || []}
                onToggle={(value) => toggleArrayFilter('symbols', value)}
                searchPlaceholder="Search symbols..."
              />
              <MultiSelectPopover
                label="Setups"
                icon={Target}
                options={availableSetups}
                selected={filters.setups || []}
                onToggle={(value) => toggleArrayFilter('setups', value)}
                searchPlaceholder="Search setups..."
              />
              <MultiSelectPopover
                label="Tags"
                icon={TagIcon}
                options={availableTags}
                selected={filters.tags || []}
                onToggle={(value) => toggleArrayFilter('tags', value)}
                searchPlaceholder="Search tags..."
              />
            </div>

            {/* Date Range Quick Select */}
            <Select onValueChange={applyQuickDateRange}>
              <SelectTrigger className="w-[130px] h-8 flex-shrink-0">
                <SelectValue placeholder="Date range..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="last-7">Last 7 days</SelectItem>
                <SelectItem value="last-30">Last 30 days</SelectItem>
                <SelectItem value="this-month">This month</SelectItem>
              </SelectContent>
            </Select>

            {/* Spacer */}
            <div className="flex-1 min-w-[8px]" />

            {/* Actions - Fixed to right */}
            <div className="flex gap-1.5 flex-shrink-0">
              {onSavePreset && (
                <Popover open={presetsOpen} onOpenChange={setPresetsOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5 h-8 px-2.5">
                      <Bookmark className="h-3.5 w-3.5" />
                      {presets.length > 0 && (
                        <Badge variant="secondary" className="h-4 px-1 text-xs">
                          {presets.length}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-3" align="end">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm">Filter Presets</h4>
                      </div>
                      
                      {presets.length > 0 && (
                        <>
                          <ScrollArea className="max-h-64">
                            <div className="space-y-1.5">
                              {presets.map((preset) => (
                                <div
                                  key={preset.id}
                                  className="flex items-center gap-2 p-2 border rounded-md hover:bg-accent/50 transition-colors"
                                >
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      onLoadPreset && onLoadPreset(preset);
                                      setPresetsOpen(false);
                                      toast.success(`Applied preset: ${preset.name}`);
                                    }}
                                    className="flex-1 justify-start h-auto py-1 px-2"
                                  >
                                    <span className="text-sm truncate">{preset.name}</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onDeletePreset && onDeletePreset(preset.id)}
                                    className="h-7 w-7 p-0 hover:text-destructive flex-shrink-0"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                          <Separator />
                        </>
                      )}

                      {activeFilterCount > 0 ? (
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Save current filters</Label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Preset name..."
                              value={savePresetName}
                              onChange={(e) => setSavePresetName(e.target.value)}
                              className="h-8"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSavePreset();
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              onClick={handleSavePreset}
                              className="h-8 px-3"
                            >
                              <Save className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground text-center py-3">
                          {presets.length === 0 
                            ? "Apply some filters to save your first preset" 
                            : "Apply filters to create a new preset"}
                        </p>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              
              {activeFilterCount > 0 && (
                <>
                  <Badge variant="secondary" className="h-8 px-2 flex items-center gap-1.5">
                    <Filter className="h-3 w-3" />
                    {activeFilterCount}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-8 px-2.5"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Active Filter Chips */}
          {activeChips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2 mt-2 border-t">
              {activeChips.map((chip) => (
                <Badge
                  key={chip.key}
                  variant="secondary"
                  className="gap-1.5 pr-1 pl-2 h-5"
                >
                  <span className="text-xs">{chip.label}</span>
                  <button
                    onClick={chip.onRemove}
                    className="hover:bg-background/80 rounded p-0.5"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Original vertical layout
  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Header with Presets */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            {onSavePreset && (
              <Popover open={presetsOpen} onOpenChange={setPresetsOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 h-8">
                    <Bookmark className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Presets</span>
                    {presets.length > 0 && (
                      <Badge variant="secondary" className="h-4 px-1 text-xs ml-0.5">
                        {presets.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-3" align="end">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm">Filter Presets</h4>
                    </div>
                    
                    {presets.length > 0 && (
                      <>
                        <ScrollArea className="max-h-64">
                          <div className="space-y-1.5">
                            {presets.map((preset) => (
                              <div
                                key={preset.id}
                                className="flex items-center gap-2 p-2 border rounded-md hover:bg-accent/50 transition-colors"
                              >
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    onLoadPreset && onLoadPreset(preset);
                                    setPresetsOpen(false);
                                    toast.success(`Applied preset: ${preset.name}`);
                                  }}
                                  className="flex-1 justify-start h-auto py-1 px-2"
                                >
                                  <span className="text-sm truncate">{preset.name}</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onDeletePreset && onDeletePreset(preset.id)}
                                  className="h-7 w-7 p-0 hover:text-destructive flex-shrink-0"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                        <Separator />
                      </>
                    )}

                    {/* Save Current Filters */}
                    {activeFilterCount > 0 ? (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Save current filters</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Preset name..."
                            value={savePresetName}
                            onChange={(e) => setSavePresetName(e.target.value)}
                            className="h-8"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSavePreset();
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={handleSavePreset}
                            className="h-8 px-3"
                          >
                            <Save className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-3">
                        {presets.length === 0 
                          ? "Apply some filters to save your first preset" 
                          : "Apply filters to create a new preset"}
                      </p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            )}
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 gap-1.5"
              >
                <X className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </Button>
            )}
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeChips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {activeChips.map((chip) => (
              <Badge
                key={chip.key}
                variant="secondary"
                className="gap-1.5 pr-1 pl-2 h-6"
              >
                <span className="text-xs">{chip.label}</span>
                <button
                  onClick={chip.onRemove}
                  className="hover:bg-background/80 rounded p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search symbols, setups, notes..."
            value={filters.searchQuery || ''}
            onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
            className="pl-9 h-9"
          />
        </div>

        {/* Quick Outcome Filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={(!filters.outcome || filters.outcome === 'all') ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFiltersChange({ ...filters, outcome: 'all' })}
            className="h-8"
          >
            All
          </Button>
          <Button
            variant={filters.outcome === 'wins' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFiltersChange({ ...filters, outcome: 'wins' })}
            className="h-8 gap-1.5"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Wins
          </Button>
          <Button
            variant={filters.outcome === 'losses' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFiltersChange({ ...filters, outcome: 'losses' })}
            className="h-8 gap-1.5"
          >
            <TrendingDown className="h-3.5 w-3.5" />
            Losses
          </Button>
          <Button
            variant={filters.outcome === 'breakeven' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFiltersChange({ ...filters, outcome: 'breakeven' })}
            className="h-8"
          >
            Breakeven
          </Button>
        </div>

        <Separator />

        {/* Main Filters */}
        <div className="space-y-3">
          {/* Date Range */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-2">
              <CalendarIcon className="h-3.5 w-3.5" />
              Date Range
            </Label>
            <div className="flex flex-wrap gap-2">
              <Select onValueChange={applyQuickDateRange}>
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue placeholder="Quick select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="last-7">Last 7 days</SelectItem>
                  <SelectItem value="last-30">Last 30 days</SelectItem>
                  <SelectItem value="this-month">This month</SelectItem>
                  <SelectItem value="last-month">Last month</SelectItem>
                  <SelectItem value="this-quarter">This quarter</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                placeholder="From"
                value={filters.dateFrom || ''}
                onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value })}
                className="w-[140px] h-8"
              />
              <Input
                type="date"
                placeholder="To"
                value={filters.dateTo || ''}
                onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value })}
                className="w-[140px] h-8"
              />
            </div>
          </div>

          {/* Multi-selects */}
          <div className="flex flex-wrap gap-2">
            <MultiSelectPopover
              label="Symbols"
              icon={DollarSign}
              options={availableSymbols}
              selected={filters.symbols || []}
              onToggle={(value) => toggleArrayFilter('symbols', value)}
              searchPlaceholder="Search symbols..."
            />
            <MultiSelectPopover
              label="Setups"
              icon={Target}
              options={availableSetups}
              selected={filters.setups || []}
              onToggle={(value) => toggleArrayFilter('setups', value)}
              searchPlaceholder="Search setups..."
            />
            <MultiSelectPopover
              label="Tags"
              icon={TagIcon}
              options={availableTags}
              selected={filters.tags || []}
              onToggle={(value) => toggleArrayFilter('tags', value)}
              searchPlaceholder="Search tags..."
            />
          </div>

          {/* Status & Type */}
          <div className="flex flex-wrap gap-2">
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => onFiltersChange({ 
                ...filters, 
                status: value === 'all' ? undefined : value as 'open' | 'closed'
              })}
            >
              <SelectTrigger className="w-[120px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.tradeType || 'all'}
              onValueChange={(value) => onFiltersChange({ 
                ...filters, 
                tradeType: value === 'all' ? undefined : value as 'long' | 'short'
              })}
            >
              <SelectTrigger className="w-[120px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="long">Long</SelectItem>
                <SelectItem value="short">Short</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced Filters (Collapsible) */}
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between h-8 px-2 -mx-2">
              <span className="flex items-center gap-2 text-sm">
                <Settings2 className="h-3.5 w-3.5" />
                Advanced Options
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            {/* P&L Range */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">P&L Range ($)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.pnlMin ?? ''}
                  onChange={(e) => onFiltersChange({ 
                    ...filters, 
                    pnlMin: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                  className="h-8"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.pnlMax ?? ''}
                  onChange={(e) => onFiltersChange({ 
                    ...filters, 
                    pnlMax: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                  className="h-8"
                />
              </div>
            </div>

            {/* R:R Range */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Risk:Reward Range (R)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Min"
                  value={filters.rrMin ?? ''}
                  onChange={(e) => onFiltersChange({ 
                    ...filters, 
                    rrMin: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                  className="h-8"
                />
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Max"
                  value={filters.rrMax ?? ''}
                  onChange={(e) => onFiltersChange({ 
                    ...filters, 
                    rrMax: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                  className="h-8"
                />
              </div>
            </div>

            {/* Conditions */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Conditions</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rule-breaking"
                    checked={filters.ruleBreaking || false}
                    onCheckedChange={(checked) => onFiltersChange({ 
                      ...filters, 
                      ruleBreaking: checked === true ? true : undefined 
                    })}
                  />
                  <Label htmlFor="rule-breaking" className="text-sm cursor-pointer">
                    Rule-breaking days only
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has-notes"
                    checked={filters.hasNotes || false}
                    onCheckedChange={(checked) => onFiltersChange({ 
                      ...filters, 
                      hasNotes: checked === true ? true : undefined 
                    })}
                  />
                  <Label htmlFor="has-notes" className="text-sm cursor-pointer">
                    Has notes
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has-tags"
                    checked={filters.hasTags || false}
                    onCheckedChange={(checked) => onFiltersChange({ 
                      ...filters, 
                      hasTags: checked === true ? true : undefined 
                    })}
                  />
                  <Label htmlFor="has-tags" className="text-sm cursor-pointer">
                    Has tags
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has-screenshots"
                    checked={filters.hasScreenshots || false}
                    onCheckedChange={(checked) => onFiltersChange({ 
                      ...filters, 
                      hasScreenshots: checked === true ? true : undefined 
                    })}
                  />
                  <Label htmlFor="has-screenshots" className="text-sm cursor-pointer">
                    Has screenshots
                  </Label>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
