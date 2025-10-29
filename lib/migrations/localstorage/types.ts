/**
 * Type definitions for localStorage payload structure
 * Used for migration from localStorage to Postgres
 */

import { Trade, JournalEntry, TradeTemplate, AccountSettings } from '@/types/journal/trading';
import { CustomSetup, CustomTag, SetupCategory, TagCategory } from '@/lib/journal/customization';
import { GlobalSettings, PageFeatures } from '@/lib/journal/pagePreferences';

/**
 * Complete localStorage payload structure
 */
export interface LocalStoragePayload {
  // Core data
  trades?: Trade[];
  journalEntries?: JournalEntry[];
  accountSettings?: AccountSettings;
  
  // Customization
  customSetups?: CustomSetup[];
  customTags?: CustomTag[];
  setupCategories?: SetupCategory[];
  tagCategories?: TagCategory[];
  
  // Templates & presets
  tradeTemplates?: TradeTemplate[];
  recentSymbols?: string[];
  filterPresets?: any[]; // AdvancedTradeFilters serialized
  
  // Preferences
  globalSettings?: GlobalSettings;
  pageFeatures?: PageFeatures;
  themeCustomization?: {
    mode: 'light' | 'dark';
    colors: any; // CustomThemeColors
  };
  pinnedCards?: string[]; // Array of card IDs
  sidebarVisible?: boolean;
  tradesViewState?: any; // TradesViewState
  
  // Tracking
  smartDefaults?: any; // SmartDefaults
  
  // Activity
  dismissedRecentActivity?: any; // Dismissed recent activity IDs
}

/**
 * All localStorage keys used in the application
 */
export const LOCALSTORAGE_KEYS = {
  // Core
  TRADES: 'trading_journal_trades',
  JOURNAL_ENTRIES: 'trading_journal_entries',
  ACCOUNT_SETTINGS: 'trading_journal_account_settings',
  
  // Customization
  CUSTOM_SETUPS: 'trading-journal-custom-setups',
  CUSTOM_TAGS: 'trading-journal-custom-tags',
  SETUP_CATEGORIES: 'trading-journal-setup-categories',
  TAG_CATEGORIES: 'trading-journal-tag-categories',
  
  // Templates & presets
  TRADE_TEMPLATES: 'tradingJournal_templates',
  RECENT_SYMBOLS: 'tradingJournal_recentSymbols',
  FILTER_PRESETS: 'tradingJournal_filterPresets',
  
  // Preferences
  GLOBAL_SETTINGS: 'trading-journal-global-settings',
  PAGE_FEATURES: 'trading-journal-page-features',
  THEME_CUSTOMIZATION: 'trading-journal-theme-customization',
  PINNED_CARDS: 'trading_journal_pinned_cards',
  SIDEBAR_VISIBLE: 'trading-journal-sidebar-visible',
  TRADES_VIEW_STATE: 'trading-journal-trades-view-state',
  
  // Tracking
  SMART_DEFAULTS: 'trading-journal-smart-defaults',
  
  // Activity
  DISMISSED_RECENTS: 'trading-journal-dismissed-recents',
  
  // Other
  THEME: 'trading_journal_theme',
  MIGRATION_VERSION: 'trading_journal_migration_version',
  CUSTOMIZATION_MIGRATED: 'trading-journal-customization-migrated',
} as const;

