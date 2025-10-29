import { motion, useSpring, useTransform, useInView, useMotionValueEvent } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { LucideIcon } from 'lucide-react';

interface AnimatedStatCardProps {
  label: string;
  value: number;
  previousValue?: number;
  formatValue: (value: number) => string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  isPositive?: boolean;
  delay?: number;
  subtitle?: string;
  showChange?: boolean;
  compact?: boolean;
}

export function AnimatedStatCard({
  label,
  value,
  previousValue,
  formatValue,
  icon: Icon,
  trend,
  isPositive,
  delay = 0,
  subtitle,
  showChange = false,
  compact = false,
}: AnimatedStatCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [hasAnimated, setHasAnimated] = useState(false);
  const [displayValue, setDisplayValue] = useState(formatValue(0));

  // Animated counter using spring physics
  const spring = useSpring(0, {
    damping: 30,
    stiffness: 100,
  });

  // Subscribe to spring value changes and update display
  useMotionValueEvent(spring, 'change', (latest) => {
    setDisplayValue(formatValue(Math.round(latest * 100) / 100));
  });

  useEffect(() => {
    if (isInView && !hasAnimated) {
      const timer = setTimeout(() => {
        spring.set(value);
        setHasAnimated(true);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [isInView, value, spring, delay, hasAnimated]);

  // Calculate change
  const change = previousValue !== undefined ? value - previousValue : undefined;
  const changePercent = previousValue !== undefined && previousValue !== 0 
    ? ((value - previousValue) / Math.abs(previousValue)) * 100 
    : undefined;

  // Determine colors based on value and trend
  const getColors = () => {
    if (trend === 'neutral' || (value === 0 && !isPositive)) {
      return {
        text: 'text-foreground',
        glow: 'rgba(115, 115, 115, 0.1)',
        border: 'border-border',
        icon: 'text-muted-foreground',
      };
    }

    const shouldBeGreen = isPositive !== undefined ? isPositive : value >= 0;
    
    if (shouldBeGreen) {
      return {
        text: 'text-green-600 dark:text-green-500',
        glow: 'rgba(16, 185, 129, 0.15)',
        border: 'border-green-200 dark:border-green-900/50',
        icon: 'text-green-600 dark:text-green-500',
      };
    } else {
      return {
        text: 'text-red-600 dark:text-red-500',
        glow: 'rgba(220, 38, 38, 0.15)',
        border: 'border-red-200 dark:border-red-900/50',
        icon: 'text-red-600 dark:text-red-500',
      };
    }
  };

  const colors = getColors();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{
        duration: 0.5,
        delay: delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      whileHover={{
        scale: 1.02,
        y: -2,
        transition: { duration: 0.2, ease: 'easeOut' },
      }}
      whileTap={{ scale: 0.98 }}
      className={`relative overflow-hidden rounded-lg border ${colors.border} bg-card transition-all duration-300 hover:shadow-lg group cursor-default`}
      style={{
        boxShadow: `0 0 0 0 ${colors.glow}`,
      }}
    >
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${colors.glow}, transparent 70%)`,
        }}
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <div className={`relative ${compact ? 'p-4' : 'p-6'}`}>
        {/* Header with icon */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground">{label}</p>
          {Icon && (
            <motion.div
              className={`p-2 rounded-md bg-muted/50 ${colors.icon}`}
              whileHover={{
                rotate: [0, -10, 10, -10, 0],
                scale: 1.1,
              }}
              transition={{ duration: 0.5 }}
            >
              <Icon className="h-4 w-4" />
            </motion.div>
          )}
        </div>

        {/* Main value with counter animation */}
        <div className="flex items-baseline gap-2 mb-1">
          <motion.h2
            className={`mb-0 ${colors.text} ${compact ? 'text-xl' : 'text-2xl'}`}
            animate={
              isInView && value !== 0
                ? {
                    textShadow: [
                      '0 0 0px rgba(0,0,0,0)',
                      `0 0 8px ${colors.glow}`,
                      '0 0 0px rgba(0,0,0,0)',
                    ],
                  }
                : {}
            }
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
            }}
          >
            {displayValue}
          </motion.h2>

          {/* Trend indicator */}
          {trend && trend !== 'neutral' && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.3 }}
            >
              <motion.svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                className={colors.text}
                animate={{
                  y: trend === 'up' ? [-1, 1, -1] : [1, -1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                {trend === 'up' ? (
                  <path
                    d="M8 3L12 7H9V13H7V7H4L8 3Z"
                    fill="currentColor"
                  />
                ) : (
                  <path
                    d="M8 13L4 9H7V3H9V9H12L8 13Z"
                    fill="currentColor"
                  />
                )}
              </motion.svg>
            </motion.div>
          )}
        </div>

        {/* Subtitle or change */}
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}

        {showChange && change !== undefined && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ delay: delay + 0.4 }}
            className="mt-2 pt-2 border-t border-border"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Change</span>
              <span className={change >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}>
                {change >= 0 ? '+' : ''}
                {formatValue(change)}
                {changePercent !== undefined && changePercent !== Infinity && (
                  <span className="ml-1 opacity-70">
                    ({changePercent >= 0 ? '+' : ''}
                    {changePercent.toFixed(1)}%)
                  </span>
                )}
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Shimmer effect on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full"
        animate={{
          translateX: ['-100%', '100%'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 5,
          ease: 'easeInOut',
        }}
        style={{
          opacity: 0,
        }}
        whileHover={{
          opacity: 1,
        }}
      />

      {/* Pulse ring on mount */}
      {isInView && (
        <motion.div
          className="absolute inset-0 rounded-lg border-2"
          style={{
            borderColor: colors.glow,
          }}
          initial={{ opacity: 0.5, scale: 1 }}
          animate={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 1, delay: delay }}
        />
      )}
    </motion.div>
  );
}

interface AnimatedProgressStatProps {
  label: string;
  current: number;
  target: number;
  formatValue: (value: number) => string;
  icon?: LucideIcon;
  delay?: number;
  color?: string;
}

export function AnimatedProgressStat({
  label,
  current,
  target,
  formatValue,
  icon: Icon,
  delay = 0,
  color = 'blue',
}: AnimatedProgressStatProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [hasAnimated, setHasAnimated] = useState(false);
  const [progressDisplayValue, setProgressDisplayValue] = useState(0);

  const progress = Math.min((current / target) * 100, 100);

  const spring = useSpring(0, {
    damping: 30,
    stiffness: 80,
  });

  // Subscribe to spring value changes
  useMotionValueEvent(spring, 'change', (latest) => {
    setProgressDisplayValue(Math.round(latest));
  });

  useEffect(() => {
    if (isInView && !hasAnimated) {
      const timer = setTimeout(() => {
        spring.set(progress);
        setHasAnimated(true);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [isInView, progress, spring, delay, hasAnimated]);

  const colorClasses = {
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      fill: 'bg-blue-600 dark:bg-blue-500',
      text: 'text-blue-600 dark:text-blue-500',
    },
    green: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      fill: 'bg-green-600 dark:bg-green-500',
      text: 'text-green-600 dark:text-green-500',
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      fill: 'bg-purple-600 dark:bg-purple-500',
      text: 'text-purple-600 dark:text-purple-500',
    },
    amber: {
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      fill: 'bg-amber-600 dark:bg-amber-500',
      text: 'text-amber-600 dark:text-amber-500',
    },
  };

  const colors = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-all cursor-default"
    >
      <div className="flex items-center gap-3 mb-3">
        {Icon && (
          <motion.div
            className={`p-2 rounded-md ${colors.bg}`}
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <Icon className={`h-4 w-4 ${colors.text}`} />
          </motion.div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm truncate">{label}</h4>
          <p className="text-xs text-muted-foreground">
            {formatValue(current)} / {formatValue(target)}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className={`h-2 rounded-full ${colors.bg} overflow-hidden`}>
          <motion.div
            className={`h-full ${colors.fill} rounded-full`}
            initial={{ width: '0%' }}
            animate={{ width: `${progressDisplayValue}%` }}
            transition={{ duration: 1, delay, ease: 'easeOut' }}
          />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Progress</span>
          <span className={colors.text}>
            {progressDisplayValue}%
          </span>
        </div>
      </div>
    </motion.div>
  );
}
