import { Trade } from '../types/trading';

export interface SetupCategory {
  id: string;
  name: string;
  color?: string;
  emoji?: string;
  isActive: boolean;
  createdAt: string;
}

export interface TagCategory {
  id: string;
  name: string;
  color?: string;
  isActive: boolean;
  createdAt: string;
}

export interface SetupPlaybook {
  entryRules: string[];
  exitRules: string[];
  invalidationConditions: string[];
  requiredChecklist: string[];
  notes?: string;
}

export interface CustomSetup {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string; // UTF-8 character icon
  categoryId?: string; // Reference to SetupCategory
  isActive: boolean;
  isFavorite: boolean;
  createdAt: string;
  usageCount: number;
  winRate?: number;
  avgRR?: number;
  totalPnl?: number;
  // Playbook features
  playbook?: SetupPlaybook;
}

export interface TagRelationships {
  mutuallyExclusiveWith: string[]; // Tag IDs that can't be used together
  suggestedWith: string[]; // Tag IDs to suggest when this tag is used
  requiredWith: string[]; // Tag IDs that should be used together
}

export interface CustomTag {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string; // UTF-8 character icon
  categoryId?: string; // Reference to TagCategory
  isActive: boolean;
  isFavorite: boolean;
  createdAt: string;
  usageCount: number;
  // Relationship features
  relationships?: TagRelationships;
}

const CUSTOM_SETUPS_KEY = 'trading-journal-custom-setups';
const CUSTOM_TAGS_KEY = 'trading-journal-custom-tags';
const SETUP_CATEGORIES_KEY = 'trading-journal-setup-categories';
const TAG_CATEGORIES_KEY = 'trading-journal-tag-categories';
const MIGRATION_KEY = 'trading-journal-customization-migrated';

// Default setup categories
export const DEFAULT_SETUP_CATEGORIES: Omit<SetupCategory, 'id' | 'createdAt'>[] = [
  { name: 'Breakout', color: '#10b981', isActive: true },
  { name: 'Reversal', color: '#f59e0b', isActive: true },
  { name: 'Trend', color: '#3b82f6', isActive: true },
  { name: 'Scalp', color: '#8b5cf6', isActive: true },
  { name: 'Range', color: '#6366f1', isActive: true },
  { name: 'Other', color: '#64748b', isActive: true },
];

// Default tag categories
export const DEFAULT_TAG_CATEGORIES: Omit<TagCategory, 'id' | 'createdAt'>[] = [
  { name: 'Market Condition', color: '#10b981', isActive: true },
  { name: 'Timeframe', color: '#06b6d4', isActive: true },
  { name: 'Asset Class', color: '#8b5cf6', isActive: true },
  { name: 'Strategy', color: '#f59e0b', isActive: true },
  { name: 'Other', color: '#64748b', isActive: true },
];

// Load setup categories
export function loadSetupCategories(): SetupCategory[] {
  try {
    const stored = localStorage.getItem(SETUP_CATEGORIES_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading setup categories:', error);
    return [];
  }
}

// Get all setup categories (alias for loadSetupCategories for consistency)
export function getSetupCategories(): SetupCategory[] {
  return loadSetupCategories();
}

// Save setup categories
export function saveSetupCategories(categories: SetupCategory[]): void {
  try {
    localStorage.setItem(SETUP_CATEGORIES_KEY, JSON.stringify(categories));
  } catch (error) {
    console.error('Error saving setup categories:', error);
  }
}

// Load tag categories
export function loadTagCategories(): TagCategory[] {
  try {
    const stored = localStorage.getItem(TAG_CATEGORIES_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading tag categories:', error);
    return [];
  }
}

// Get all tag categories (alias for loadTagCategories for consistency)
export function getTagCategories(): TagCategory[] {
  return loadTagCategories();
}

// Save tag categories
export function saveTagCategories(categories: TagCategory[]): void {
  try {
    localStorage.setItem(TAG_CATEGORIES_KEY, JSON.stringify(categories));
  } catch (error) {
    console.error('Error saving tag categories:', error);
  }
}

// Load custom setups from localStorage
export function loadCustomSetups(): CustomSetup[] {
  try {
    const stored = localStorage.getItem(CUSTOM_SETUPS_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading custom setups:', error);
    return [];
  }
}

// Get all custom setups (alias for loadCustomSetups for consistency)
export function getCustomSetups(): CustomSetup[] {
  return loadCustomSetups();
}

// Save custom setups to localStorage
export function saveCustomSetups(setups: CustomSetup[]): void {
  try {
    localStorage.setItem(CUSTOM_SETUPS_KEY, JSON.stringify(setups));
  } catch (error) {
    console.error('Error saving custom setups:', error);
  }
}

// Load custom tags from localStorage
export function loadCustomTags(): CustomTag[] {
  try {
    const stored = localStorage.getItem(CUSTOM_TAGS_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading custom tags:', error);
    return [];
  }
}

// Get all custom tags (alias for loadCustomTags for consistency)
export function getCustomTags(): CustomTag[] {
  return loadCustomTags();
}

// Save custom tags to localStorage
export function saveCustomTags(tags: CustomTag[]): void {
  try {
    localStorage.setItem(CUSTOM_TAGS_KEY, JSON.stringify(tags));
  } catch (error) {
    console.error('Error saving custom tags:', error);
  }
}

// Check if migration has been done
function isMigrated(): boolean {
  return localStorage.getItem(MIGRATION_KEY) === 'true';
}

// Mark migration as complete
function setMigrated(): void {
  localStorage.setItem(MIGRATION_KEY, 'true');
}

// Initialize with defaults if first time
export function initializeCustomization(): { 
  setups: CustomSetup[], 
  tags: CustomTag[],
  setupCategories: SetupCategory[],
  tagCategories: TagCategory[]
} {
  let setupCategories = loadSetupCategories();
  let tagCategories = loadTagCategories();
  let setups = loadCustomSetups();
  let tags = loadCustomTags();
  
  // If no setup categories exist, create defaults
  if (setupCategories.length === 0) {
    setupCategories = DEFAULT_SETUP_CATEGORIES.map(cat => ({
      ...cat,
      id: `setupcat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    }));
    saveSetupCategories(setupCategories);
  }
  
  // If no tag categories exist, create defaults
  if (tagCategories.length === 0) {
    tagCategories = DEFAULT_TAG_CATEGORIES.map(cat => ({
      ...cat,
      id: `tagcat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    }));
    saveTagCategories(tagCategories);
  }
  
  // If no custom setups exist, create some defaults using the first available categories
  if (setups.length === 0 && setupCategories.length > 0) {
    const breakoutCat = setupCategories.find(c => c.name === 'Breakout');
    const trendCat = setupCategories.find(c => c.name === 'Trend');
    const reversalCat = setupCategories.find(c => c.name === 'Reversal');
    const scalpCat = setupCategories.find(c => c.name === 'Scalp');
    const rangeCat = setupCategories.find(c => c.name === 'Range');
    const otherCat = setupCategories.find(c => c.name === 'Other');
    
    setups = [
      { name: 'Resistance Breakout', categoryId: breakoutCat?.id, color: '#10b981', isActive: true, isFavorite: true, description: 'Trading breakouts above key resistance levels' },
      { name: 'Support Breakout', categoryId: breakoutCat?.id, color: '#059669', isActive: true, isFavorite: false, description: 'Trading breakdowns below key support levels' },
      { name: 'Trend Continuation', categoryId: trendCat?.id, color: '#3b82f6', isActive: true, isFavorite: true, description: 'Following established uptrends or downtrends' },
      { name: 'Support Bounce', categoryId: reversalCat?.id, color: '#f59e0b', isActive: true, isFavorite: false, description: 'Buying at support levels' },
      { name: 'Resistance Rejection', categoryId: reversalCat?.id, color: '#dc2626', isActive: true, isFavorite: false, description: 'Shorting at resistance levels' },
      { name: 'Range Trade', categoryId: rangeCat?.id, color: '#6366f1', isActive: true, isFavorite: false, description: 'Trading within established price ranges' },
      { name: 'Gap Fill', categoryId: otherCat?.id, color: '#ec4899', isActive: true, isFavorite: false, description: 'Trading gap fills after overnight or weekend gaps' },
      { name: 'Scalp', categoryId: scalpCat?.id, color: '#8b5cf6', isActive: true, isFavorite: false, description: 'Quick in and out trades for small profits' },
      { name: 'News Play', categoryId: otherCat?.id, color: '#14b8a6', isActive: true, isFavorite: false, description: 'Trading based on news catalysts' },
      { name: 'Earnings Play', categoryId: otherCat?.id, color: '#f97316', isActive: true, isFavorite: false, description: 'Trading around earnings announcements' },
    ].map(setup => ({
      ...setup,
      id: `setup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      usageCount: 0,
    }));
    saveCustomSetups(setups);
  }
  
  // If no custom tags exist, create some defaults using the first available categories
  if (tags.length === 0 && tagCategories.length > 0) {
    const marketCat = tagCategories.find(c => c.name === 'Market Condition');
    const timeframeCat = tagCategories.find(c => c.name === 'Timeframe');
    const assetCat = tagCategories.find(c => c.name === 'Asset Class');
    const strategyCat = tagCategories.find(c => c.name === 'Strategy');
    const otherCat = tagCategories.find(c => c.name === 'Other');
    
    tags = [
      // Market Conditions
      { name: 'Trending Market', categoryId: marketCat?.id, color: '#10b981', isActive: true, isFavorite: true },
      { name: 'Choppy Market', categoryId: marketCat?.id, color: '#f59e0b', isActive: true, isFavorite: false },
      { name: 'High Volatility', categoryId: marketCat?.id, color: '#ef4444', isActive: true, isFavorite: true },
      { name: 'Low Volatility', categoryId: marketCat?.id, color: '#6366f1', isActive: true, isFavorite: false },
      { name: 'Pre-Market', categoryId: marketCat?.id, color: '#06b6d4', isActive: true, isFavorite: false },
      { name: 'After-Hours', categoryId: marketCat?.id, color: '#8b5cf6', isActive: true, isFavorite: false },
      
      // Asset Classes
      { name: 'Large Cap', categoryId: assetCat?.id, color: '#3b82f6', isActive: true, isFavorite: true },
      { name: 'Small Cap', categoryId: assetCat?.id, color: '#8b5cf6', isActive: true, isFavorite: false },
      { name: 'Tech Stocks', categoryId: assetCat?.id, color: '#06b6d4', isActive: true, isFavorite: false },
      { name: 'ETF', categoryId: assetCat?.id, color: '#f59e0b', isActive: true, isFavorite: false },
      { name: 'Index', categoryId: assetCat?.id, color: '#10b981', isActive: true, isFavorite: false },
      { name: 'Crypto', categoryId: assetCat?.id, color: '#f97316', isActive: true, isFavorite: false },
      { name: 'Options', categoryId: assetCat?.id, color: '#ec4899', isActive: true, isFavorite: false },
      
      // Timeframes
      { name: '1min', categoryId: timeframeCat?.id, color: '#06b6d4', isActive: true, isFavorite: false },
      { name: '5min', categoryId: timeframeCat?.id, color: '#0891b2', isActive: true, isFavorite: true },
      { name: '15min', categoryId: timeframeCat?.id, color: '#0e7490', isActive: true, isFavorite: false },
      { name: '1H', categoryId: timeframeCat?.id, color: '#155e75', isActive: true, isFavorite: false },
      { name: 'Daily', categoryId: timeframeCat?.id, color: '#164e63', isActive: true, isFavorite: false },
      
      // Strategy Tags
      { name: 'With Trend', categoryId: strategyCat?.id, color: '#10b981', isActive: true, isFavorite: true },
      { name: 'Counter-Trend', categoryId: strategyCat?.id, color: '#f59e0b', isActive: true, isFavorite: false },
      { name: 'News Catalyst', categoryId: strategyCat?.id, color: '#ef4444', isActive: true, isFavorite: false },
      { name: 'Earnings', categoryId: strategyCat?.id, color: '#8b5cf6', isActive: true, isFavorite: false },
      { name: 'Oversold Bounce', categoryId: strategyCat?.id, color: '#14b8a6', isActive: true, isFavorite: false },
      { name: 'Overbought Fade', categoryId: strategyCat?.id, color: '#dc2626', isActive: true, isFavorite: false },
      
      // Psychology/Mistakes
      { name: 'FOMO', categoryId: otherCat?.id, color: '#dc2626', isActive: true, isFavorite: false, description: 'Fear of missing out' },
      { name: 'Revenge Trade', categoryId: otherCat?.id, color: '#991b1b', isActive: true, isFavorite: false, description: 'Trading to recover losses' },
      { name: 'Overtrading', categoryId: otherCat?.id, color: '#f59e0b', isActive: true, isFavorite: false, description: 'Taking too many trades' },
      { name: 'Perfect Execution', categoryId: otherCat?.id, color: '#10b981', isActive: true, isFavorite: false, description: 'Trade executed perfectly' },
    ].map(tag => ({
      ...tag,
      id: `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      usageCount: 0,
    }));
    saveCustomTags(tags);
  }
  
  return { setups, tags, setupCategories, tagCategories };
}

// Migrate existing trade data to custom setups/tags
export function migrateFromTrades(trades: Trade[]): { 
  migratedSetups: CustomSetup[], 
  migratedTags: CustomTag[],
  shouldPrompt: boolean 
} {
  // Check if already migrated
  if (isMigrated()) {
    return { migratedSetups: [], migratedTags: [], shouldPrompt: false };
  }
  
  const existingSetups = loadCustomSetups();
  const existingTags = loadCustomTags();
  const setupCategories = loadSetupCategories();
  const tagCategories = loadTagCategories();
  
  // Extract unique setups from trades
  const uniqueSetups = new Set<string>();
  const uniqueTags = new Set<string>();
  
  trades.forEach(trade => {
    if (trade.setup && trade.setup.trim()) {
      uniqueSetups.add(trade.setup.trim());
    }
    if (trade.tags && trade.tags.length > 0) {
      trade.tags.forEach(tag => uniqueTags.add(tag.trim()));
    }
  });
  
  // Create custom setups from trade data
  const migratedSetups: CustomSetup[] = [];
  uniqueSetups.forEach(setupName => {
    // Skip if already exists
    if (existingSetups.some(s => s.name.toLowerCase() === setupName.toLowerCase())) {
      return;
    }
    
    const relatedTrades = trades.filter(t => t.setup === setupName && t.status === 'closed');
    const wins = relatedTrades.filter(t => (t.pnl || 0) > 0).length;
    const totalTrades = relatedTrades.length;
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : undefined;
    const totalRR = relatedTrades.reduce((sum, t) => sum + (t.rr || 0), 0);
    const avgRR = totalTrades > 0 ? totalRR / totalTrades : undefined;
    const totalPnl = relatedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    
    // Try to guess category based on name
    let categoryId: string | undefined;
    const lowerName = setupName.toLowerCase();
    
    if (lowerName.includes('break')) {
      categoryId = setupCategories.find(c => c.name === 'Breakout')?.id;
    } else if (lowerName.includes('reversal') || lowerName.includes('reverse')) {
      categoryId = setupCategories.find(c => c.name === 'Reversal')?.id;
    } else if (lowerName.includes('trend') || lowerName.includes('momentum')) {
      categoryId = setupCategories.find(c => c.name === 'Trend')?.id;
    } else if (lowerName.includes('scalp')) {
      categoryId = setupCategories.find(c => c.name === 'Scalp')?.id;
    } else if (lowerName.includes('range') || lowerName.includes('support') || lowerName.includes('resistance')) {
      categoryId = setupCategories.find(c => c.name === 'Range')?.id;
    } else {
      categoryId = setupCategories.find(c => c.name === 'Other')?.id;
    }
    
    migratedSetups.push({
      id: `setup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: setupName,
      categoryId,
      color: '#64748b',
      isActive: true,
      isFavorite: false,
      createdAt: new Date().toISOString(),
      usageCount: totalTrades,
      winRate,
      avgRR,
      totalPnl,
    });
  });
  
  // Create custom tags from trade data
  const migratedTags: CustomTag[] = [];
  uniqueTags.forEach(tagName => {
    // Skip if already exists
    if (existingTags.some(t => t.name.toLowerCase() === tagName.toLowerCase())) {
      return;
    }
    
    const relatedTrades = trades.filter(t => t.tags?.includes(tagName));
    
    // Try to guess category based on name
    let categoryId: string | undefined;
    const lowerName = tagName.toLowerCase();
    
    if (lowerName.includes('trend') || lowerName.includes('chop') || lowerName.includes('volatil')) {
      categoryId = tagCategories.find(c => c.name === 'Market Condition')?.id;
    } else if (lowerName.includes('min') || lowerName.includes('hour') || lowerName.includes('day') || lowerName.includes('h') || lowerName.includes('m')) {
      categoryId = tagCategories.find(c => c.name === 'Timeframe')?.id;
    } else if (lowerName.includes('stock') || lowerName.includes('forex') || lowerName.includes('crypto') || lowerName.includes('option')) {
      categoryId = tagCategories.find(c => c.name === 'Asset Class')?.id;
    } else if (lowerName.includes('strategy') || lowerName.includes('system')) {
      categoryId = tagCategories.find(c => c.name === 'Strategy')?.id;
    } else {
      categoryId = tagCategories.find(c => c.name === 'Other')?.id;
    }
    
    migratedTags.push({
      id: `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: tagName,
      categoryId,
      color: '#64748b',
      isActive: true,
      isFavorite: false,
      createdAt: new Date().toISOString(),
      usageCount: relatedTrades.length,
    });
  });
  
  // Auto-migrate without prompting
  if (migratedSetups.length > 0 || migratedTags.length > 0) {
    completeMigration(migratedSetups, migratedTags);
  } else {
    // Mark as migrated even if nothing to migrate
    setMigrated();
  }
  
  return { migratedSetups: [], migratedTags: [], shouldPrompt: false };
}

// Complete the migration
export function completeMigration(setups: CustomSetup[], tags: CustomTag[]): void {
  const existingSetups = loadCustomSetups();
  const existingTags = loadCustomTags();
  
  saveCustomSetups([...existingSetups, ...setups]);
  saveCustomTags([...existingTags, ...tags]);
  setMigrated();
}

// Calculate statistics for setups
export function calculateSetupStats(setup: CustomSetup, trades: Trade[]): CustomSetup {
  const relatedTrades = trades.filter(t => t.setup === setup.name && t.status === 'closed');
  const wins = relatedTrades.filter(t => (t.pnl || 0) > 0).length;
  const totalTrades = relatedTrades.length;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : undefined;
  const totalRR = relatedTrades.reduce((sum, t) => sum + (t.rr || 0), 0);
  const avgRR = totalTrades > 0 ? totalRR / totalTrades : undefined;
  const totalPnl = relatedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  
  return {
    ...setup,
    usageCount: totalTrades,
    winRate,
    avgRR,
    totalPnl,
  };
}

// Calculate statistics for tags
export function calculateTagStats(tag: CustomTag, trades: Trade[]): CustomTag {
  const relatedTrades = trades.filter(t => t.tags?.includes(tag.name));
  
  return {
    ...tag,
    usageCount: relatedTrades.length,
  };
}

// Refresh all stats
export function refreshAllStats(trades: Trade[]): void {
  const setups = loadCustomSetups();
  const tags = loadCustomTags();
  
  const updatedSetups = setups.map(setup => calculateSetupStats(setup, trades));
  const updatedTags = tags.map(tag => calculateTagStats(tag, trades));
  
  saveCustomSetups(updatedSetups);
  saveCustomTags(updatedTags);
}

// Get setups grouped by category
export function getSetupsByCategory(setups: CustomSetup[], categories: SetupCategory[]): Record<string, { category: SetupCategory, setups: CustomSetup[] }> {
  // Don't filter by isActive here - filtering is done in the component
  const activeCategories = categories.filter(c => c.isActive);
  const grouped: Record<string, { category: SetupCategory, setups: CustomSetup[] }> = {};
  
  // Create groups for each active category
  activeCategories.forEach(category => {
    grouped[category.id] = {
      category,
      setups: setups.filter(s => s.categoryId === category.id),
    };
  });
  
  // Add uncategorized setups
  const uncategorized = setups.filter(s => !s.categoryId || !activeCategories.find(c => c.id === s.categoryId));
  if (uncategorized.length > 0) {
    grouped['uncategorized'] = {
      category: {
        id: 'uncategorized',
        name: 'Uncategorized',
        color: '#64748b',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      setups: uncategorized,
    };
  }
  
  return grouped;
}

// Get favorite setups
export function getFavoriteSetups(setups: CustomSetup[]): CustomSetup[] {
  return setups.filter(s => s.isFavorite && s.isActive);
}

// Get tags grouped by category
export function getTagsByCategory(tags: CustomTag[], categories: TagCategory[]): Record<string, { category: TagCategory, tags: CustomTag[] }> {
  // Don't filter by isActive here - filtering is done in the component
  const activeCategories = categories.filter(c => c.isActive);
  const grouped: Record<string, { category: TagCategory, tags: CustomTag[] }> = {};
  
  // Create groups for each active category
  activeCategories.forEach(category => {
    grouped[category.id] = {
      category,
      tags: tags.filter(t => t.categoryId === category.id),
    };
  });
  
  // Add uncategorized tags
  const uncategorized = tags.filter(t => !t.categoryId || !activeCategories.find(c => c.id === t.categoryId));
  if (uncategorized.length > 0) {
    grouped['uncategorized'] = {
      category: {
        id: 'uncategorized',
        name: 'Uncategorized',
        color: '#64748b',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      tags: uncategorized,
    };
  }
  
  return grouped;
}

// Get favorite tags
export function getFavoriteTags(tags: CustomTag[]): CustomTag[] {
  return tags.filter(t => t.isFavorite && t.isActive);
}

// Export setups and tags as JSON
export function exportCustomization(): string {
  const setups = loadCustomSetups();
  const tags = loadCustomTags();
  const setupCategories = loadSetupCategories();
  const tagCategories = loadTagCategories();
  
  return JSON.stringify({
    version: 2,
    exportDate: new Date().toISOString(),
    setups,
    tags,
    setupCategories,
    tagCategories,
  }, null, 2);
}

// Import setups and tags from JSON
export function importCustomization(json: string): { 
  setups: CustomSetup[], 
  tags: CustomTag[],
  setupCategories?: SetupCategory[],
  tagCategories?: TagCategory[]
} {
  try {
    const data = JSON.parse(json);
    
    if (!data.setups || !data.tags) {
      throw new Error('Invalid import format');
    }
    
    return {
      setups: data.setups,
      tags: data.tags,
      setupCategories: data.setupCategories || [],
      tagCategories: data.tagCategories || [],
    };
  } catch (error) {
    console.error('Error importing customization:', error);
    throw new Error('Failed to import: Invalid format');
  }
}

// Tag Relationship Validation
export interface TagValidationResult {
  isValid: boolean;
  conflicts: string[]; // Tag names that conflict
  suggestions: string[]; // Tag names to suggest
  required: string[]; // Tag names that are required
}

export function validateTagSelection(
  selectedTagIds: string[],
  newTagId: string,
  allTags: CustomTag[]
): TagValidationResult {
  const result: TagValidationResult = {
    isValid: true,
    conflicts: [],
    suggestions: [],
    required: [],
  };
  
  const newTag = allTags.find(t => t.id === newTagId);
  if (!newTag) return result;
  
  const selectedTags = allTags.filter(t => selectedTagIds.includes(t.id));
  
  // Check for mutually exclusive conflicts
  if (newTag.relationships?.mutuallyExclusiveWith) {
    selectedTags.forEach(tag => {
      if (newTag.relationships!.mutuallyExclusiveWith.includes(tag.id)) {
        result.isValid = false;
        result.conflicts.push(tag.name);
      }
    });
  }
  
  // Check if any selected tags are mutually exclusive with the new tag
  selectedTags.forEach(tag => {
    if (tag.relationships?.mutuallyExclusiveWith?.includes(newTagId)) {
      result.isValid = false;
      result.conflicts.push(tag.name);
    }
  });
  
  // Get suggestions
  if (newTag.relationships?.suggestedWith) {
    const suggestedTags = allTags.filter(t => 
      newTag.relationships!.suggestedWith.includes(t.id) &&
      !selectedTagIds.includes(t.id) &&
      t.isActive
    );
    result.suggestions = suggestedTags.map(t => t.name);
  }
  
  // Get required tags
  if (newTag.relationships?.requiredWith) {
    const requiredTags = allTags.filter(t => 
      newTag.relationships!.requiredWith.includes(t.id) &&
      !selectedTagIds.includes(t.id) &&
      t.isActive
    );
    result.required = requiredTags.map(t => t.name);
  }
  
  return result;
}

export function getSuggestedTags(
  selectedTagIds: string[],
  allTags: CustomTag[]
): CustomTag[] {
  const suggestions = new Set<string>();
  
  selectedTagIds.forEach(tagId => {
    const tag = allTags.find(t => t.id === tagId);
    if (tag?.relationships?.suggestedWith) {
      tag.relationships.suggestedWith.forEach(suggestedId => {
        if (!selectedTagIds.includes(suggestedId)) {
          suggestions.add(suggestedId);
        }
      });
    }
  });
  
  return allTags.filter(t => suggestions.has(t.id) && t.isActive);
}


