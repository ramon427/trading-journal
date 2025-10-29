import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Keyboard } from 'lucide-react';

interface KeyboardShortcutsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shortcuts = [
  {
    category: 'Navigation',
    items: [
      { key: '1', description: 'Go to Home tab' },
      { key: '2', description: 'Go to Benchmarks tab' },
      { key: '3', description: 'Go to Trades tab' },
      { key: '4', description: 'Go to Analytics tab' },
      { key: '5', description: 'Go to Projections tab' },
    ],
  },
  {
    category: 'Actions',
    items: [
      { key: 'N', description: 'Quick add trade / New item' },
      { key: 'J', description: 'Add journal entry for today' },
      { key: '/', description: 'Focus search/filter' },
      { key: '?', description: 'Show keyboard shortcuts' },
    ],
  },
  {
    category: 'Calendar',
    items: [
      { key: 'Alt + ←', description: 'Previous month' },
      { key: 'Alt + →', description: 'Next month' },
    ],
  },
  {
    category: 'General',
    items: [
      { key: 'Esc', description: 'Close dialogs/modals' },
    ],
  },
];

export function KeyboardShortcuts({ open, onOpenChange }: KeyboardShortcutsProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate and perform actions quickly
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {shortcuts.map((category) => (
            <div key={category.category}>
              <h4 className="mb-3">{category.category}</h4>
              <div className="space-y-2">
                {category.items.map((shortcut) => (
                  <div
                    key={shortcut.key}
                    className="flex items-center justify-between py-2 px-3 rounded-lg border border-border"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <Badge variant="secondary" className="font-mono">
                      {shortcut.key}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
