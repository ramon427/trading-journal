import { Badge } from './ui/badge';
import { getCustomSetups } from '@/lib/journal/customization';
import { useMemo } from 'react';

interface SetupBadgeProps {
  setupName: string;
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
  className?: string;
}

export function SetupBadge({ setupName, variant = 'outline', className = '' }: SetupBadgeProps) {
  const setup = useMemo(() => {
    const setups = getCustomSetups();
    return setups.find(s => s.name === setupName);
  }, [setupName]);

  return (
    <Badge variant={variant} className={`gap-1.5 ${className}`}>
      {setup?.icon && <span>{setup.icon}</span>}
      {setupName}
    </Badge>
  );
}
