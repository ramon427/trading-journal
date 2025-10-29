import { useState, useEffect } from 'react';
import { loadPageFeatures, type PageFeatures } from './pagePreferences';

/**
 * Custom hooks for checking page feature visibility preferences
 * 
 * USAGE EXAMPLES:
 * 
 * 1. Check if a single feature is enabled:
 *    const showPerformance = usePageFeature('home', 'performanceInsights');
 *    return showPerformance ? <PerformanceInsights /> : null;
 * 
 * 2. Get all features for a page:
 *    const features = usePageFeatures('home');
 *    return (
 *      <>
 *        {features.performanceInsights && <PerformanceInsights />}
 *        {features.tasksReminders && <TasksCard />}
 *        {features.openTrades && <OpenTrades />}
 *      </>
 *    );
 * 
 * 3. Use in conditional rendering:
 *    const showScratchpad = usePageFeature('home', 'scratchpad');
 *    if (!showScratchpad) return <EmptyState />;
 * 
 * Available pages and their features:
 * - home: performanceInsights, tasksReminders, openTrades, scratchpad
 * - benchmarks: personalBests, achievements, streaks
 * - trades: calendar, list, filters
 * - analytics: overview, setupPerformance, tagPerformance, timeAnalysis
 * - projections: growthProjection, benchmarkComparison, monthlyBreakdown
 */

/**
 * Hook to check if a specific feature is enabled on a page
 * @param page The page to check (e.g., 'home', 'benchmarks')
 * @param feature The feature key to check (e.g., 'performanceInsights', 'tasksReminders')
 * @returns boolean indicating if the feature is visible/enabled
 */
export function usePageFeature<P extends keyof PageFeatures>(
  page: P,
  feature: keyof PageFeatures[P]
): boolean {
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    const features = loadPageFeatures();
    setIsEnabled(features[page][feature] as boolean);

    // Listen for storage changes from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'trading-journal-page-features') {
        const features = loadPageFeatures();
        setIsEnabled(features[page][feature] as boolean);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [page, feature]);

  return isEnabled;
}

/**
 * Hook to get all features for a specific page
 * @param page The page to get features for
 * @returns Object with all feature flags for that page
 */
export function usePageFeatures<P extends keyof PageFeatures>(
  page: P
): PageFeatures[P] {
  const [features, setFeatures] = useState<PageFeatures[P]>({} as PageFeatures[P]);

  useEffect(() => {
    const allFeatures = loadPageFeatures();
    setFeatures(allFeatures[page]);

    // Listen for storage changes from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'trading-journal-page-features') {
        const allFeatures = loadPageFeatures();
        setFeatures(allFeatures[page]);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [page]);

  return features;
}
