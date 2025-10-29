import { useState } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { X } from 'lucide-react';
import { cn } from './ui/utils';

// Common UTF-8 character icons organized by category
const ICON_CATEGORIES = [
  {
    name: 'Arrows & Directions',
    icons: ['↑', '↓', '→', '←', '↗', '↘', '↖', '↙', '⇧', '⇩', '⇨', '⇦', '↻', '↺', '⟲', '⟳'],
  },
  {
    name: 'Shapes & Symbols',
    icons: ['●', '○', '◆', '◇', '■', '□', '▲', '△', '▼', '▽', '★', '☆', '◉', '◎', '⬟', '⬢'],
  },
  {
    name: 'Math & Technical',
    icons: ['✓', '✕', '±', '×', '÷', '∞', '≈', '≠', '≤', '≥', '∑', '∫', '∆', '∇', '√', '∂'],
  },
  {
    name: 'Charts & Graphs',
    icons: ['⊕', '⊖', '⊗', '⊙', '⊚', '⊛', '⊜', '⊝', '⊞', '⊟', '⊠', '⊡', '▬', '▭', '▮', '▯'],
  },
  {
    name: 'Misc',
    icons: ['⚡', '⚑', '⚐', '⚠', '☼', '☾', '☽', '⌘', '⌥', '⌃', '⎋', '⏎', '⏏', '⏸', '⏹', '⏺'],
  },
];

interface IconPickerProps {
  value?: string;
  onChange: (icon: string | undefined) => void;
  label?: string;
}

export function IconPicker({ value, onChange, label = 'Icon' }: IconPickerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{label} (optional)</Label>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(undefined)}
            className="h-6 px-2 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Current Icon Display */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-16 w-16 flex items-center justify-center"
        >
          {value ? (
            <span className="text-3xl">{value}</span>
          ) : (
            <span className="text-xs text-muted-foreground">None</span>
          )}
        </Button>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">
            {value ? 'Click to change icon' : 'Click to select an icon'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Simple symbols for visual identification
          </p>
        </div>
      </div>

      {/* Icon Grid */}
      {isExpanded && (
        <Card className="p-4 space-y-4">
          {ICON_CATEGORIES.map((category) => (
            <div key={category.name} className="space-y-2">
              <Label className="text-xs text-muted-foreground">{category.name}</Label>
              <div className="grid grid-cols-8 gap-1">
                {category.icons.map((icon) => (
                  <Button
                    key={icon}
                    type="button"
                    variant={value === icon ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      onChange(icon);
                      setIsExpanded(false);
                    }}
                    className={cn(
                      'h-10 w-10 p-0 text-xl',
                      value === icon && 'ring-2 ring-primary ring-offset-2'
                    )}
                  >
                    {icon}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
