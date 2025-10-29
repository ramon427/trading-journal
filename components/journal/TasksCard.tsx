import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Task } from '@/lib/journal/taskDetection';
import { CheckCircle2, AlertCircle, Bell, Flame, FileQuestion, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';

interface TasksCardProps {
  tasks: Task[];
}

export function TasksCard({ tasks }: TasksCardProps) {
  const router = useRouter();
  const pushRoute = (route: any) => {
    switch (route.type) {
      case 'benchmarks':
        router.push('/dashboard/benchmarks');
        break;
      case 'trades':
        router.push('/dashboard/trades');
        break;
      case 'quick-add-trade':
        router.push(`/dashboard/trades/quick-add${route.date ? `?date=${encodeURIComponent(route.date)}` : ''}`);
        break;
      case 'add-trade':
        if (route.tradeId) router.push(`/dashboard/trades/${encodeURIComponent(route.tradeId)}`);
        else router.push(`/dashboard/trades/add${route.date ? `?date=${encodeURIComponent(route.date)}` : ''}`);
        break;
      case 'add-journal':
        router.push(`/dashboard/journal/add${route.date ? `?date=${encodeURIComponent(route.date)}` : ''}`);
        break;
      default:
        router.push('/dashboard');
    }
  };
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [expandedLowPriority, setExpandedLowPriority] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (tasks.length === 0 || isDismissed) {
    return null;
  }

  const toggleExpanded = (taskId: string) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const getTaskIcon = (type: Task['type']) => {
    switch (type) {
      case 'open-trade':
        return AlertCircle;
      case 'journal':
        return Bell;
      case 'reflection':
        return CheckCircle2;
      case 'streak':
        return Flame;
      case 'incomplete-data':
        return FileQuestion;
      default:
        return Bell;
    }
  };

  const getTaskColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 dark:text-red-500';
      case 'medium':
        return 'text-amber-600 dark:text-amber-500';
      case 'low':
        return 'text-blue-600 dark:text-blue-500';
      default:
        return 'text-muted-foreground';
    }
  };

  // Group tasks by priority
  const highPriorityTasks = tasks.filter(t => t.priority === 'high');
  const mediumPriorityTasks = tasks.filter(t => t.priority === 'medium');
  const lowPriorityTasks = tasks.filter(t => t.priority === 'low');
  
  // Count total items across all tasks
  const totalItems = tasks.reduce((sum, task) => sum + (task.count || 1), 0);

  const renderTask = (task: Task, index: number, delayBase: number) => {
    const Icon = getTaskIcon(task.type);
    const isExpanded = expandedTasks[task.id];
    // Don't show details for journal entries - keep them simple
    const hasDetails = task.type !== 'journal' && (
      (task.relatedItems && task.relatedItems.length > 0) || 
      (task.missingFields && task.missingFields.length > 0)
    );

    return (
      <motion.div
        key={task.id}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ 
          delay: (delayBase + index) * 0.03,
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1]
        }}
        whileHover={{ 
          scale: 1.01,
          transition: { duration: 0.2 }
        }}
        className="rounded-md border border-border/50 bg-card/50 transition-colors"
      >
        <Collapsible open={isExpanded} onOpenChange={() => hasDetails && toggleExpanded(task.id)}>
          <div className="p-2.5">
            <div className="flex items-start gap-2.5">
              <motion.div 
                className={`p-1 rounded bg-muted/50 flex-shrink-0 ${getTaskColor(task.priority)}`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.2 }}
              >
                <Icon className="h-3.5 w-3.5" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                  <h4 className="text-sm leading-tight">{task.title}</h4>
                  {/* Only show count as simple text for tasks with multiple items */}
                  {task.count && task.count > 1 && (
                    <motion.span 
                      className="text-[10px] text-muted-foreground"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      ({task.count})
                    </motion.span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground mb-1.5 line-clamp-1">
                  {task.description}
                </p>

                <div className="flex items-center gap-1.5">
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-xs px-2.5 transition-all duration-200 hover:bg-accent hover:text-accent-foreground"
                      onClick={() => pushRoute(task.action.route as any)}
                    >
                      {task.action.label}
                    </Button>
                  </motion.div>
                  
                  {hasDetails && (
                    <CollapsibleTrigger asChild>
                      <motion.button 
                        className="text-[10px] text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-accent/50"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {isExpanded ? 'Hide' : 'Details'}
                      </motion.button>
                    </CollapsibleTrigger>
                  )}
                </div>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {hasDetails && isExpanded && (
              <CollapsibleContent forceMount>
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-2.5 pb-2.5 pt-1.5 border-t border-border/30 bg-muted/10">
                    {task.missingFields && task.missingFields.length > 0 && (
                      <motion.div 
                        className="mb-1.5"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                      >
                        <p className="text-[10px] text-muted-foreground mb-1">Missing fields:</p>
                        <div className="flex flex-wrap gap-1">
                          {task.missingFields.slice(0, 5).map((field, i) => (
                            <motion.span 
                              key={i}
                              className="text-[10px] text-muted-foreground"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.03 }}
                            >
                              {field}{i < Math.min(task.missingFields!.length, 5) - 1 ? ' •' : ''}
                            </motion.span>
                          ))}
                          {task.missingFields.length > 5 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{task.missingFields.length - 5}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {task.relatedItems && task.relatedItems.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <p className="text-[10px] text-muted-foreground mb-1">
                          {task.relatedItems.length} item{task.relatedItems.length > 1 ? 's' : ''}:
                        </p>
                        <div className="space-y-1">
                          {task.relatedItems.slice(0, 2).map((item, i) => (
                            <motion.div 
                              key={item.id}
                              className="p-1.5 rounded bg-background/50 border border-border/30 hover:border-border/60 transition-all cursor-pointer"
                              onClick={() => pushRoute({ 
                                type: task.type === 'journal' ? 'add-journal' : 'add-trade',
                                tradeId: task.type !== 'journal' ? item.id : undefined,
                                date: task.type === 'journal' ? task.action.route.date : undefined
                              } as any)}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              whileHover={{ 
                                scale: 1.02,
                                x: 2,
                                transition: { duration: 0.15 }
                              }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs truncate">{item.label}</span>
                                {item.missingFields && item.missingFields.length > 0 && (
                                  <span className="text-[10px] text-amber-600 dark:text-amber-400 flex-shrink-0">
                                    {item.missingFields.length} missing
                                  </span>
                                )}
                              </div>
                            </motion.div>
                          ))}
                          {task.relatedItems.length > 2 && (
                            <p className="text-[10px] text-muted-foreground text-center pt-0.5">
                              +{task.relatedItems.length - 2} more
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </CollapsibleContent>
            )}
          </AnimatePresence>
        </Collapsible>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      <Card className="border-amber-500/30 bg-gradient-to-br from-amber-50/30 via-amber-50/20 to-transparent dark:from-amber-950/20 dark:via-amber-950/10 dark:to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <motion.div 
                className="p-1.5 rounded-md bg-amber-500/10 border border-amber-500/20"
                whileHover={{ scale: 1.1, rotate: 10 }}
                transition={{ duration: 0.2 }}
              >
                <Bell className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </motion.div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">
                  Tasks & Reminders
                </CardTitle>
                <div className="flex items-center gap-1.5">
                  <AnimatePresence>
                    {highPriorityTasks.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800">
                          {highPriorityTasks.length} urgent
                        </Badge>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: 0.05 }}
                  >
                    <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                      {totalItems} total
                    </Badge>
                  </motion.div>
                </div>
              </div>
            </div>
            <motion.div
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsDismissed(true)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </motion.div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {/* High Priority Tasks */}
            <AnimatePresence mode="popLayout">
              {highPriorityTasks.length > 0 && (
                <motion.div 
                  className="space-y-2"
                  layout
                >
                  {highPriorityTasks.map((task, index) => renderTask(task, index, 0))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Medium Priority Tasks */}
            <AnimatePresence mode="popLayout">
              {mediumPriorityTasks.length > 0 && (
                <motion.div 
                  className="space-y-2"
                  layout
                >
                  {mediumPriorityTasks.map((task, index) => renderTask(task, index, highPriorityTasks.length))}
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Low Priority Tasks - Show collapsed summary if there are any */}
            {lowPriorityTasks.length > 0 && (
              <Collapsible open={expandedLowPriority} onOpenChange={setExpandedLowPriority}>
                <motion.div 
                  className="pt-2 border-t border-border/50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <CollapsibleTrigger asChild>
                    <motion.button 
                      className="w-full text-center py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-accent/30"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <motion.span
                        animate={{ 
                          opacity: expandedLowPriority ? 0.7 : 1 
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        {expandedLowPriority 
                          ? `Hide ${lowPriorityTasks.length} task${lowPriorityTasks.length > 1 ? 's' : ''}`
                          : `${lowPriorityTasks.length} more task${lowPriorityTasks.length > 1 ? 's' : ''}`
                        }
                      </motion.span>
                    </motion.button>
                  </CollapsibleTrigger>
                </motion.div>
                <AnimatePresence>
                  {expandedLowPriority && (
                    <CollapsibleContent forceMount>
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2 mt-2">
                          {lowPriorityTasks.map((task, index) => renderTask(task, index, highPriorityTasks.length + mediumPriorityTasks.length))}
                        </div>
                      </motion.div>
                    </CollapsibleContent>
                  )}
                </AnimatePresence>
              </Collapsible>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
