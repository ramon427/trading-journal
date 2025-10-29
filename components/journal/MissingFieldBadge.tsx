import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface MissingFieldBadgeProps {
  show: boolean;
  variant?: 'error' | 'warning' | 'info';
  tooltip?: string;
  className?: string;
}

export function MissingFieldBadge({ show, variant = 'warning', tooltip, className }: MissingFieldBadgeProps) {
  if (!show) return null;

  const variantStyles = {
    error: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
    warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  };

  const badge = (
    <Badge 
      variant="outline" 
      className={`h-5 px-1.5 text-[10px] gap-1 ${variantStyles[variant]} ${className || ''}`}
    >
      <span className="font-bold">!</span>
      {variant === 'error' ? 'Required' : 'Missing'}
    </Badge>
  );

  if (tooltip) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger>
            {badge}
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}
