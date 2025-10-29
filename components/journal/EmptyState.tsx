import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  tips?: string[];
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  tips 
}: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 px-4">
        <div className="rounded-full bg-muted p-6 mb-4">
          <Icon className="h-12 w-12 text-muted-foreground" />
        </div>
        
        <h3 className="mb-2 text-center">{title}</h3>
        <p className="text-muted-foreground text-center mb-6 max-w-md">
          {description}
        </p>
        
        {actionLabel && onAction && (
          <Button onClick={onAction} size="lg" className="mb-6">
            {actionLabel}
          </Button>
        )}
        
        {tips && tips.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-4 max-w-md w-full">
            <h4 className="mb-2">Quick Tips:</h4>
            <ul className="space-y-1.5 text-muted-foreground">
              {tips.map((tip, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
