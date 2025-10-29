import { Badge } from './ui/badge';
import { getCustomTags } from '@/lib/journal/customization';
import { useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface TagBadgeProps {
  tagName: string;
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
  className?: string;
  showTooltip?: boolean;
}

export function TagBadge({ tagName, variant = 'secondary', className = '', showTooltip = true }: TagBadgeProps) {
  const tag = useMemo(() => {
    const tags = getCustomTags();
    return tags.find(t => t.name === tagName);
  }, [tagName]);

  const badge = (
    <Badge variant={variant} className={`gap-1.5 ${className}`}>
      {tag?.icon && <span>{tag.icon}</span>}
      {tagName}
    </Badge>
  );

  if (showTooltip && tag?.description) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs max-w-xs">{tag.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}
