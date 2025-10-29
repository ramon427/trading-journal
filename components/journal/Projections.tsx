import { motion } from 'motion/react';
import { Trade, Statistics } from '@/types/journal/trading';
import { DisplayMode } from '@/lib/journal/settings';
import { GrowthProjection } from './GrowthProjection';
import { TrendingUp } from 'lucide-react';
import { useGlobalSettings } from '@/lib/journal/useGlobalSettings';

interface ProjectionsProps {
  trades: Trade[];
  stats: Statistics;
  displayMode: DisplayMode;
}

export function Projections({ trades, stats, displayMode }: ProjectionsProps) {
  const globalSettings = useGlobalSettings();
  
  return (
    <div className="space-y-6 pb-8">
      {/* Hero Section or Simple Header */}
      {globalSettings.showHeroSections ? (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-card via-card/50 to-background p-8 shadow-sm"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 shadow-sm"
              >
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-500" />
              </motion.div>
              <div>
                <h1 className="mb-0.5 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  Growth Projections
                </h1>
                <p className="text-sm text-muted-foreground">
                  Project your future account growth based on current performance
                </p>
              </div>
            </div>
          </div>
          
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-500/8 via-blue-500/5 to-transparent rounded-full blur-3xl -z-0" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-500/8 via-purple-500/5 to-transparent rounded-full blur-3xl -z-0" />
        </motion.div>
      ) : (
        <div className="pb-4 border-b border-border">
          <h1 className="mb-1">Growth Projections</h1>
          <p className="text-sm text-muted-foreground">
            Project your future account growth based on current performance
          </p>
        </div>
      )}

      {/* Projections */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <GrowthProjection trades={trades} stats={stats} displayMode={displayMode} />
      </motion.div>
    </div>
  );
}
