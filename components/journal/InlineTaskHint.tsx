import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lightbulb, Sparkles } from 'lucide-react';
import { Button } from './ui/button';

interface InlineTaskHintProps {
  id: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'info' | 'suggestion' | 'tip';
  dismissible?: boolean;
}

const DISMISSED_HINTS_KEY = 'trading-journal-dismissed-hints';

export function InlineTaskHint({ 
  id, 
  message, 
  action, 
  variant = 'info',
  dismissible = true 
}: InlineTaskHintProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = JSON.parse(localStorage.getItem(DISMISSED_HINTS_KEY) || '[]');
    if (dismissed.includes(id)) {
      setIsDismissed(true);
    }
  }, [id]);

  const handleDismiss = () => {
    const dismissed = JSON.parse(localStorage.getItem(DISMISSED_HINTS_KEY) || '[]');
    dismissed.push(id);
    localStorage.setItem(DISMISSED_HINTS_KEY, JSON.stringify(dismissed));
    setIsDismissed(true);
  };

  if (isDismissed) return null;

  const Icon = variant === 'suggestion' ? Sparkles : Lightbulb;
  
  const colors = {
    info: 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-800/30 text-blue-700 dark:text-blue-400',
    suggestion: 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-200/50 dark:border-purple-800/30 text-purple-700 dark:text-purple-400',
    tip: 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/30 text-amber-700 dark:text-amber-400',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
        animate={{ opacity: 1, height: 'auto', marginBottom: '0.75rem' }}
        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
        transition={{ duration: 0.2 }}
        className={`rounded-lg border px-3 py-2 ${colors[variant]}`}
      >
        <div className="flex items-start gap-2">
          <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs leading-relaxed">{message}</p>
            {action && (
              <Button
                onClick={action.onClick}
                variant="ghost"
                size="sm"
                className="h-6 px-2 mt-1.5 text-xs"
              >
                {action.label}
              </Button>
            )}
          </div>
          {dismissible && (
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-0.5 rounded hover:bg-background/50 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
