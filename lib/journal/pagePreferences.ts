// Page-specific feature visibility preferences

export interface GlobalSettings {
  showHeroSections: boolean;
}

export interface PageFeatures {
  home: {
    performanceInsights: boolean;
    tasksReminders: boolean;
    openTrades: boolean;
    scratchpad: boolean;
  };
  benchmarks: {
    personalBests: boolean;
    achievements: boolean;
    streaks: boolean;
    insights: boolean;
  };
  trades: {
    calendar: boolean;
    list: boolean;
    filters: boolean;
    mistakes: boolean;
    news: boolean;
  };
  analytics: {
    overview: boolean;
    setupPerformance: boolean;
    tagPerformance: boolean;
    timeAnalysis: boolean;
  };
  projections: {
    growthProjection: boolean;
    benchmarkComparison: boolean;
    monthlyBreakdown: boolean;
  };
}

const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  showHeroSections: true,
};

const DEFAULT_FEATURES: PageFeatures = {
  home: {
    performanceInsights: true,
    tasksReminders: true,
    openTrades: true,
    scratchpad: true,
  },
  benchmarks: {
    personalBests: true,
    achievements: true,
    streaks: true,
    insights: true,
  },
  trades: {
    calendar: true,
    list: true,
    filters: true,
    mistakes: true,
    news: true,
  },
  analytics: {
    overview: true,
    setupPerformance: true,
    tagPerformance: true,
    timeAnalysis: true,
  },
  projections: {
    growthProjection: true,
    benchmarkComparison: true,
    monthlyBreakdown: true,
  },
};

const GLOBAL_SETTINGS_KEY = 'trading-journal-global-settings';
const FEATURES_KEY = 'trading-journal-page-features';

// Global Settings
export const loadGlobalSettings = (): GlobalSettings => {
  try {
    const stored = localStorage.getItem(GLOBAL_SETTINGS_KEY);
    if (!stored) return DEFAULT_GLOBAL_SETTINGS;
    
    const parsed = JSON.parse(stored);
    return { ...DEFAULT_GLOBAL_SETTINGS, ...parsed };
  } catch (e) {
    console.error('Failed to load global settings:', e);
    return DEFAULT_GLOBAL_SETTINGS;
  }
};

export const saveGlobalSettings = (settings: GlobalSettings): void => {
  try {
    localStorage.setItem(GLOBAL_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save global settings:', e);
  }
};

// Page Features
export const loadPageFeatures = (): PageFeatures => {
  try {
    const stored = localStorage.getItem(FEATURES_KEY);
    if (!stored) return DEFAULT_FEATURES;
    
    const parsed = JSON.parse(stored);
    // Merge with defaults to ensure all features exist
    return {
      home: { ...DEFAULT_FEATURES.home, ...parsed.home },
      benchmarks: { ...DEFAULT_FEATURES.benchmarks, ...parsed.benchmarks },
      trades: { ...DEFAULT_FEATURES.trades, ...parsed.trades },
      analytics: { ...DEFAULT_FEATURES.analytics, ...parsed.analytics },
      projections: { ...DEFAULT_FEATURES.projections, ...parsed.projections },
    };
  } catch (e) {
    console.error('Failed to load page features:', e);
    return DEFAULT_FEATURES;
  }
};

export const savePageFeatures = (features: PageFeatures): void => {
  try {
    localStorage.setItem(FEATURES_KEY, JSON.stringify(features));
  } catch (e) {
    console.error('Failed to save page features:', e);
  }
};

export const resetPageFeatures = (): PageFeatures => {
  savePageFeatures(DEFAULT_FEATURES);
  return DEFAULT_FEATURES;
};

export const resetGlobalSettings = (): GlobalSettings => {
  saveGlobalSettings(DEFAULT_GLOBAL_SETTINGS);
  return DEFAULT_GLOBAL_SETTINGS;
};

// Feature labels for UI
export const FEATURE_LABELS: Record<keyof PageFeatures, Record<string, string>> = {
  home: {
    performanceInsights: 'Performance Insights',
    tasksReminders: 'Tasks & Reminders',
    openTrades: 'Open Trades',
    scratchpad: 'Scratchpad / Daily Notes',
  },
  benchmarks: {
    personalBests: 'Personal Bests',
    achievements: 'Achievements',
    streaks: 'Streaks',
    insights: 'Key Insights',
  },
  trades: {
    calendar: 'Calendar View',
    list: 'List View',
    filters: 'Advanced Filters',
    mistakes: 'Mistakes Section',
    news: 'News Section (Calendar)',
  },
  analytics: {
    overview: 'Overview Statistics',
    setupPerformance: 'Setup Performance',
    tagPerformance: 'Tag Performance',
    timeAnalysis: 'Time Analysis',
  },
  projections: {
    growthProjection: 'Growth Projection Chart',
    benchmarkComparison: 'Benchmark Comparison',
    monthlyBreakdown: 'Monthly Breakdown',
  },
};

// Page labels for UI
export const PAGE_LABELS: Record<keyof PageFeatures, string> = {
  home: 'Home',
  benchmarks: 'Benchmarks',
  trades: 'Trades',
  analytics: 'Analytics',
  projections: 'Projections',
};
