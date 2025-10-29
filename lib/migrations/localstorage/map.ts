/**
 * Mappers to convert localStorage data structures to Drizzle insert types
 */

import {
  setupCategories,
  customSetups,
  setupPlaybooks,
  playbookRules,
  tagCategories,
  customTags,
  tagRelationships,
  trades,
  tradeScreenshots,
  tradeTags,
  journalEntries,
  newsEvents,
  tradeTemplates,
  templateTags,
  filterPresets,
  pageFeatures,
  themeCustomization,
  pinnedCards,
  sidebarState,
  viewPreferences,
} from '@/lib/db/schema';
import { LocalStoragePayload } from './types';
import { Trade, JournalEntry, TradeTemplate } from '@/types/journal/trading';
import { CustomSetup, CustomTag } from '@/lib/journal/customization';

/**
 * Helper to parse numeric values safely
 */
function parseNumeric(value: any): string | null {
  if (value === null || value === undefined) return null;
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(num) ? null : num.toString();
}

/**
 * Helper to parse date strings
 */
function parseDate(value: string | undefined | null): string | null {
  if (!value) return null;
  return value.split('T')[0]; // Extract YYYY-MM-DD part
}

/**
 * Helper to parse time strings (HH:MM format)
 */
function parseTime(value: string | undefined | null): string | null {
  if (!value) return null;
  // Convert HH:MM AM/PM to HH:MM if needed
  if (value.includes('AM') || value.includes('PM')) {
    // Simple conversion - could be enhanced
    return value.split(' ')[0];
  }
  return value;
}

/**
 * Map setup categories
 */
export function mapSetupCategories(
  payload: LocalStoragePayload,
  userId: number
): typeof setupCategories.$inferInsert[] {
  if (!payload.setupCategories) return [];
  
  return payload.setupCategories.map((cat) => ({
    userId,
    name: cat.name,
    color: cat.color || null,
    emoji: cat.emoji || null,
    isActive: cat.isActive ?? true,
    createdAt: cat.createdAt ? new Date(cat.createdAt) : new Date(),
  }));
}

/**
 * Map tag categories
 */
export function mapTagCategories(
  payload: LocalStoragePayload,
  userId: number
): typeof tagCategories.$inferInsert[] {
  if (!payload.tagCategories) return [];
  
  return payload.tagCategories.map((cat) => ({
    userId,
    name: cat.name,
    color: cat.color || null,
    isActive: cat.isActive ?? true,
    createdAt: cat.createdAt ? new Date(cat.createdAt) : new Date(),
  }));
}

/**
 * Map custom setups (requires category IDs to be resolved)
 */
export function mapCustomSetups(
  payload: LocalStoragePayload,
  userId: number,
  categoryIdMap: Map<string, number>
): typeof customSetups.$inferInsert[] {
  if (!payload.customSetups) return [];
  
  return payload.customSetups.map((setup) => ({
    userId,
    name: setup.name,
    description: setup.description || null,
    color: setup.color || null,
    icon: setup.icon || null,
    categoryId: setup.categoryId ? categoryIdMap.get(setup.categoryId) || null : null,
    isActive: setup.isActive ?? true,
    isFavorite: setup.isFavorite ?? false,
    usageCount: setup.usageCount ?? 0,
    winRate: setup.winRate ? parseNumeric(setup.winRate) : null,
    avgRr: setup.avgRR ? parseNumeric(setup.avgRR) : null,
    totalPnl: setup.totalPnl ? parseNumeric(setup.totalPnl) : null,
    createdAt: setup.createdAt ? new Date(setup.createdAt) : new Date(),
  }));
}

/**
 * Map setup playbooks
 */
export function mapSetupPlaybooks(
  payload: LocalStoragePayload,
  setupIdMap: Map<string, number>
): { playbooks: typeof setupPlaybooks.$inferInsert[]; rules: typeof playbookRules.$inferInsert[] } {
  if (!payload.customSetups) {
    return { playbooks: [], rules: [] };
  }
  
  const playbooks: typeof setupPlaybooks.$inferInsert[] = [];
  const rules: typeof playbookRules.$inferInsert[] = [];
  
  for (const setup of payload.customSetups) {
    if (!setup.playbook) continue;
    
    const dbSetupId = setupIdMap.get(setup.id);
    if (!dbSetupId) continue;
    
    playbooks.push({
      setupId: dbSetupId,
      notes: setup.playbook.notes || null,
      createdAt: new Date(),
    });
    
    // Map rules
    let order = 0;
    for (const rule of setup.playbook.entryRules || []) {
      rules.push({
        playbookId: 0, // Will be set after playbook is inserted
        ruleType: 'entry' as const,
        ruleText: rule,
        displayOrder: order++,
      });
    }
    for (const rule of setup.playbook.exitRules || []) {
      rules.push({
        playbookId: 0,
        ruleType: 'exit' as const,
        ruleText: rule,
        displayOrder: order++,
      });
    }
    for (const rule of setup.playbook.invalidationConditions || []) {
      rules.push({
        playbookId: 0,
        ruleType: 'invalidation' as const,
        ruleText: rule,
        displayOrder: order++,
      });
    }
    for (const rule of setup.playbook.requiredChecklist || []) {
      rules.push({
        playbookId: 0,
        ruleType: 'checklist' as const,
        ruleText: rule,
        displayOrder: order++,
      });
    }
  }
  
  return { playbooks, rules };
}

/**
 * Map custom tags (requires category IDs to be resolved)
 */
export function mapCustomTags(
  payload: LocalStoragePayload,
  userId: number,
  categoryIdMap: Map<string, number>
): typeof customTags.$inferInsert[] {
  if (!payload.customTags) return [];
  
  return payload.customTags.map((tag) => ({
    userId,
    name: tag.name,
    description: tag.description || null,
    color: tag.color || null,
    icon: tag.icon || null,
    categoryId: tag.categoryId ? categoryIdMap.get(tag.categoryId) || null : null,
    isActive: tag.isActive ?? true,
    isFavorite: tag.isFavorite ?? false,
    usageCount: tag.usageCount ?? 0,
    createdAt: tag.createdAt ? new Date(tag.createdAt) : new Date(),
  }));
}

/**
 * Map tag relationships
 */
export function mapTagRelationships(
  payload: LocalStoragePayload,
  tagIdMap: Map<string, number>
): typeof tagRelationships.$inferInsert[] {
  if (!payload.customTags) return [];
  
  const relationships: typeof tagRelationships.$inferInsert[] = [];
  
  for (const tag of payload.customTags) {
    if (!tag.relationships) continue;
    
    const dbTagId = tagIdMap.get(tag.id);
    if (!dbTagId) continue;
    
    // Map mutually exclusive tags
    for (const relatedId of tag.relationships.mutuallyExclusiveWith || []) {
      const dbRelatedId = tagIdMap.get(relatedId);
      if (dbRelatedId) {
        relationships.push({
          tagId: dbTagId,
          relatedTagId: dbRelatedId,
          relationshipType: 'mutually_exclusive',
        });
      }
    }
    
    // Map suggested tags
    for (const relatedId of tag.relationships.suggestedWith || []) {
      const dbRelatedId = tagIdMap.get(relatedId);
      if (dbRelatedId) {
        relationships.push({
          tagId: dbTagId,
          relatedTagId: dbRelatedId,
          relationshipType: 'suggested',
        });
      }
    }
    
    // Map required tags
    for (const relatedId of tag.relationships.requiredWith || []) {
      const dbRelatedId = tagIdMap.get(relatedId);
      if (dbRelatedId) {
        relationships.push({
          tagId: dbTagId,
          relatedTagId: dbRelatedId,
          relationshipType: 'required',
        });
      }
    }
  }
  
  return relationships;
}

/**
 * Map trades (requires setup and tag IDs to be resolved)
 */
export function mapTrades(
  payload: LocalStoragePayload,
  userId: number,
  setupIdMap: Map<string, number>,
  tagIdMap: Map<string, number>
): {
  trades: typeof trades.$inferInsert[];
  screenshots: typeof tradeScreenshots.$inferInsert[];
  tradeTagJunctions: typeof tradeTags.$inferInsert[];
} {
  if (!payload.trades) {
    return { trades: [], screenshots: [], tradeTagJunctions: [] };
  }
  
  const mappedTrades: typeof trades.$inferInsert[] = [];
  const screenshots: typeof tradeScreenshots.$inferInsert[] = [];
  const tradeTagJunctions: typeof tradeTags.$inferInsert[] = [];
  
  for (const trade of payload.trades) {
    const tradeId = 0; // Will be set after insert, using temp for screenshot references
    
    mappedTrades.push({
      userId,
      name: trade.name || null,
      date: parseDate(trade.date)!,
      entryTime: parseTime(trade.entryTime) || null,
      exitDate: trade.exitDate ? parseDate(trade.exitDate) : null,
      exitTime: trade.exitTime ? parseTime(trade.exitTime) : null,
      symbol: trade.symbol,
      type: trade.type,
      entryPrice: parseNumeric(trade.entryPrice)!,
      exitPrice: trade.exitPrice ? parseNumeric(trade.exitPrice) : null,
      stopLoss: trade.stopLoss ? parseNumeric(trade.stopLoss) : null,
      target: trade.target ? parseNumeric(trade.target) : null,
      pnl: parseNumeric(trade.pnl)!,
      rr: trade.rr ? parseNumeric(trade.rr) : null,
      notes: trade.notes || null,
      setupId: trade.setup ? setupIdMap.get(trade.setup) || null : null,
      status: trade.status || 'closed',
      entryMode: trade.entryMode || 'detailed',
      screenshotBefore: null, // Moved to trade_screenshots
      screenshotAfter: null, // Moved to trade_screenshots
      missedTrade: trade.missedTrade ?? false,
      potentialPnl: trade.potentialPnl ? parseNumeric(trade.potentialPnl) : null,
      potentialRr: trade.potentialRR ? parseNumeric(trade.potentialRR) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // Map screenshots - store reference to trade.id will be updated after insert
    if (trade.screenshotBefore) {
      screenshots.push({
        tradeId: 0, // Will be updated after trade insert
        kind: 'before',
        url: trade.screenshotBefore.startsWith('http') ? trade.screenshotBefore : '', // If data URI, needs rehosting
        width: null,
        height: null,
        sizeBytes: null,
        createdAt: new Date(),
      });
    }
    if (trade.screenshotAfter) {
      screenshots.push({
        tradeId: 0,
        kind: 'after',
        url: trade.screenshotAfter.startsWith('http') ? trade.screenshotAfter : '',
        width: null,
        height: null,
        sizeBytes: null,
        createdAt: new Date(),
      });
    }
    
    // Map tag junctions
    for (const tagName of trade.tags || []) {
      // Find tag ID by name (tags are stored as strings in trades)
      for (const [lsTagId, lsTag] of payload.customTags?.entries() || []) {
        if (lsTag.name === tagName) {
          const dbTagId = tagIdMap.get(lsTag.id);
          if (dbTagId) {
            tradeTagJunctions.push({
              tradeId: 0, // Will be updated after trade insert
              tagId: dbTagId,
            });
            break;
          }
        }
      }
    }
  }
  
  return { trades: mappedTrades, screenshots, tradeTagJunctions };
}

/**
 * Map journal entries
 */
export function mapJournalEntries(
  payload: LocalStoragePayload,
  userId: number
): {
  entries: typeof journalEntries.$inferInsert[];
  newsEvents: typeof newsEvents.$inferInsert[];
} {
  if (!payload.journalEntries) {
    return { entries: [], newsEvents: [] };
  }
  
  const entries: typeof journalEntries.$inferInsert[] = [];
  const newsEvents: typeof newsEvents.$inferInsert[] = [];
  
  for (const entry of payload.journalEntries) {
    const entryId = 0; // Will be set after insert
    
    entries.push({
      userId,
      date: parseDate(entry.date)!,
      name: entry.name || null,
      mood: entry.mood || null,
      notes: entry.notes || null,
      lessonsLearned: entry.lessonsLearned || null,
      marketConditions: entry.marketConditions || null,
      didTrade: entry.didTrade ?? null,
      followedSystem: entry.followedSystem ?? null,
      isNewsDay: entry.isNewsDay ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // Map news events
    for (const news of entry.newsEvents || []) {
      newsEvents.push({
        journalEntryId: 0, // Will be updated after entry insert
        name: news.name,
        time: parseTime(news.time)!,
      });
    }
  }
  
  return { entries, newsEvents };
}

/**
 * Map trade templates
 */
export function mapTradeTemplates(
  payload: LocalStoragePayload,
  userId: number,
  setupIdMap: Map<string, number>,
  tagIdMap: Map<string, number>
): {
  templates: typeof tradeTemplates.$inferInsert[];
  templateTagJunctions: typeof templateTags.$inferInsert[];
} {
  if (!payload.tradeTemplates) {
    return { templates: [], templateTagJunctions: [] };
  }
  
  const templates: typeof tradeTemplates.$inferInsert[] = [];
  const templateTagJunctions: typeof templateTags.$inferInsert[] = [];
  
  for (const template of payload.tradeTemplates) {
    const templateId = 0; // Will be set after insert
    
    templates.push({
      userId,
      name: template.name,
      symbol: template.symbol || null,
      type: template.type,
      setupId: template.setup ? setupIdMap.get(template.setup) || null : null,
      notes: template.notes || null,
      stopLossPercent: template.stopLossPercent ? parseNumeric(template.stopLossPercent) : null,
      targetPercent: template.targetPercent ? parseNumeric(template.targetPercent) : null,
      defaultQuantity: template.defaultQuantity ? parseNumeric(template.defaultQuantity) : null,
      useCount: template.useCount ?? 0,
      lastUsed: template.lastUsed ? new Date(template.lastUsed) : null,
      createdAt: template.createdAt ? new Date(template.createdAt) : new Date(),
    });
    
    // Map tag junctions
    for (const tagName of template.tags || []) {
      for (const [lsTagId, lsTag] of payload.customTags?.entries() || []) {
        if (lsTag.name === tagName) {
          const dbTagId = tagIdMap.get(lsTag.id);
          if (dbTagId) {
            templateTagJunctions.push({
              templateId: 0, // Will be updated after template insert
              tagId: dbTagId,
            });
            break;
          }
        }
      }
    }
  }
  
  return { templates, templateTagJunctions };
}

/**
 * Map filter presets
 */
export function mapFilterPresets(
  payload: LocalStoragePayload,
  userId: number
): typeof filterPresets.$inferInsert[] {
  if (!payload.filterPresets) return [];
  
  return payload.filterPresets.map((preset: any) => ({
    userId,
    name: preset.name || 'Untitled Preset',
    filters: JSON.stringify(preset.filters || preset), // Serialize filters object
    createdAt: new Date(),
  }));
}

/**
 * Map page features
 */
export function mapPageFeatures(
  payload: LocalStoragePayload,
  userId: number
): typeof pageFeatures.$inferInsert | null {
  if (!payload.pageFeatures || !payload.globalSettings) return null;
  
  return {
    userId,
    showHeroSections: payload.globalSettings.showHeroSections ?? true,
    homePerformanceInsights: payload.pageFeatures.home?.performanceInsights ?? true,
    homeTasksReminders: payload.pageFeatures.home?.tasksReminders ?? true,
    homeOpenTrades: payload.pageFeatures.home?.openTrades ?? true,
    homeScratchpad: payload.pageFeatures.home?.scratchpad ?? true,
    benchmarksPersonalBests: payload.pageFeatures.benchmarks?.personalBests ?? true,
    benchmarksAchievements: payload.pageFeatures.benchmarks?.achievements ?? true,
    benchmarksStreaks: payload.pageFeatures.benchmarks?.streaks ?? true,
    benchmarksInsights: payload.pageFeatures.benchmarks?.insights ?? true,
    tradesCalendar: payload.pageFeatures.trades?.calendar ?? true,
    tradesList: payload.pageFeatures.trades?.list ?? true,
    tradesFilters: payload.pageFeatures.trades?.filters ?? true,
    tradesMistakes: payload.pageFeatures.trades?.mistakes ?? true,
    tradesNews: payload.pageFeatures.trades?.news ?? true,
    analyticsOverview: payload.pageFeatures.analytics?.overview ?? true,
    analyticsSetupPerformance: payload.pageFeatures.analytics?.setupPerformance ?? true,
    analyticsTagPerformance: payload.pageFeatures.analytics?.tagPerformance ?? true,
    analyticsTimeAnalysis: payload.pageFeatures.analytics?.timeAnalysis ?? true,
    projectionsGrowth: payload.pageFeatures.projections?.growthProjection ?? true,
    projectionsBenchmark: payload.pageFeatures.projections?.benchmarkComparison ?? true,
    projectionsMonthly: payload.pageFeatures.projections?.monthlyBreakdown ?? true,
    updatedAt: new Date(),
  };
}

/**
 * Map theme customization
 */
export function mapThemeCustomization(
  payload: LocalStoragePayload,
  userId: number
): typeof themeCustomization.$inferInsert | null {
  if (!payload.themeCustomization) return null;
  
  return {
    userId,
    mode: payload.themeCustomization.mode || 'light',
    colors: JSON.stringify(payload.themeCustomization.colors || {}),
    updatedAt: new Date(),
  };
}

/**
 * Map pinned cards
 */
export function mapPinnedCards(
  payload: LocalStoragePayload,
  userId: number
): typeof pinnedCards.$inferInsert[] {
  if (!payload.pinnedCards || !Array.isArray(payload.pinnedCards)) return [];
  
  return payload.pinnedCards.map((cardId, index) => ({
    userId,
    cardId,
    displayOrder: index,
    createdAt: new Date(),
  }));
}

/**
 * Map sidebar state
 */
export function mapSidebarState(
  payload: LocalStoragePayload,
  userId: number
): typeof sidebarState.$inferInsert | null {
  if (payload.sidebarVisible === undefined) return null;
  
  return {
    userId,
    isCollapsed: !payload.sidebarVisible, // Invert since we track visibility not collapsed
    updatedAt: new Date(),
  };
}

/**
 * Map view preferences
 */
export function mapViewPreferences(
  payload: LocalStoragePayload,
  userId: number
): typeof viewPreferences.$inferInsert | null {
  if (!payload.tradesViewState) return null;
  
  return {
    userId,
    tradesViewMode: payload.tradesViewState.viewMode || 'calendar',
    displayMode: payload.tradesViewState.displayMode || 'pnl',
    dateRange: payload.tradesViewState.dateRange || null,
    updatedAt: new Date(),
  };
}

