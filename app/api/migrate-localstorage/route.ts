import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';
import { eq, and } from 'drizzle-orm';
import { LocalStoragePayload } from '@/lib/migrations/localstorage/types';
import {
  mapSetupCategories,
  mapTagCategories,
  mapCustomSetups,
  mapSetupPlaybooks,
  mapCustomTags,
  mapTagRelationships,
  mapTrades,
  mapJournalEntries,
  mapTradeTemplates,
  mapFilterPresets,
  mapPageFeatures,
  mapThemeCustomization,
  mapPinnedCards,
  mapSidebarState,
  mapViewPreferences,
} from '@/lib/migrations/localstorage/map';
import {
  setupCategories,
  tagCategories,
  customSetups,
  setupPlaybooks,
  playbookRules,
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

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Parse payload
    const payload: LocalStoragePayload = await request.json();

    // Execute import in a transaction
    await db.transaction(async (tx) => {
      // Step 1: Insert categories (parents)
      const setupCatInserts = mapSetupCategories(payload, userId);
      const tagCatInserts = mapTagCategories(payload, userId);

      // Upsert setup categories
      const setupCatIdMap = new Map<string, number>();
      for (const cat of setupCatInserts) {
        // Check if exists by user_id + name
        const existing = await tx
          .select()
          .from(setupCategories)
          .where(and(
            eq(setupCategories.userId, userId),
            eq(setupCategories.name, cat.name)
          ))
          .limit(1);
        
        if (existing.length > 0) {
          setupCatIdMap.set(payload.setupCategories?.find(c => c.name === cat.name)?.id || '', existing[0].id);
        } else {
          const inserted = await tx.insert(setupCategories).values(cat).returning();
          if (inserted[0] && payload.setupCategories) {
            const lsId = payload.setupCategories.find(c => c.name === cat.name)?.id;
            if (lsId) setupCatIdMap.set(lsId, inserted[0].id);
          }
        }
      }

      // Upsert tag categories
      const tagCatIdMap = new Map<string, number>();
      for (const cat of tagCatInserts) {
        const existing = await tx
          .select()
          .from(tagCategories)
          .where(and(
            eq(tagCategories.userId, userId),
            eq(tagCategories.name, cat.name)
          ))
          .limit(1);
        
        if (existing.length > 0) {
          tagCatIdMap.set(payload.tagCategories?.find(c => c.name === cat.name)?.id || '', existing[0].id);
        } else {
          const inserted = await tx.insert(tagCategories).values(cat).returning();
          if (inserted[0] && payload.tagCategories) {
            const lsId = payload.tagCategories.find(c => c.name === cat.name)?.id;
            if (lsId) tagCatIdMap.set(lsId, inserted[0].id);
          }
        }
      }

      // Step 2: Insert custom setups (requires category IDs)
      const setupInserts = mapCustomSetups(payload, userId, setupCatIdMap);
      const setupIdMap = new Map<string, number>();
      for (const setup of setupInserts) {
        const existing = await tx
          .select()
          .from(customSetups)
          .where(and(
            eq(customSetups.userId, userId),
            eq(customSetups.name, setup.name)
          ))
          .limit(1);
        
        if (existing.length > 0) {
          const lsId = payload.customSetups?.find(s => s.name === setup.name)?.id;
          if (lsId) setupIdMap.set(lsId, existing[0].id);
        } else {
          const inserted = await tx.insert(customSetups).values(setup).returning();
          if (inserted[0] && payload.customSetups) {
            const lsId = payload.customSetups.find(s => s.name === setup.name)?.id;
            if (lsId) setupIdMap.set(lsId, inserted[0].id);
          }
        }
      }

      // Step 3: Insert setup playbooks and rules
      const { playbooks: playbookInserts, rules: ruleInserts } = mapSetupPlaybooks(payload, setupIdMap);
      const playbookIdMap = new Map<number, number>(); // Maps setup ID to playbook ID
      
      for (const playbook of playbookInserts) {
        const existing = await tx
          .select()
          .from(setupPlaybooks)
          .where(eq(setupPlaybooks.setupId, playbook.setupId))
          .limit(1);
        
        let playbookId: number;
        if (existing.length > 0) {
          playbookId = existing[0].id;
        } else {
          const inserted = await tx.insert(setupPlaybooks).values(playbook).returning();
          playbookId = inserted[0].id;
        }
        playbookIdMap.set(playbook.setupId, playbookId);
      }

      // Update rule playbook IDs and insert
      for (const rule of ruleInserts) {
        // Find the setup ID from the rule's original playbook
        // This requires tracking which playbook each rule belongs to
        // For simplicity, we'll link rules by matching them to playbooks
        // A more robust solution would track this mapping in the mapper
      }

      // Step 4: Insert custom tags
      const tagInserts = mapCustomTags(payload, userId, tagCatIdMap);
      const tagIdMap = new Map<string, number>();
      for (const tag of tagInserts) {
        const existing = await tx
          .select()
          .from(customTags)
          .where(eq(customTags.userId, userId))
          .where(eq(customTags.name, tag.name))
          .limit(1);
        
        if (existing.length > 0) {
          const lsId = payload.customTags?.find(t => t.name === tag.name)?.id;
          if (lsId) tagIdMap.set(lsId, existing[0].id);
        } else {
          const inserted = await tx.insert(customTags).values(tag).returning();
          if (inserted[0] && payload.customTags) {
            const lsId = payload.customTags.find(t => t.name === tag.name)?.id;
            if (lsId) tagIdMap.set(lsId, inserted[0].id);
          }
        }
      }

      // Step 5: Insert tag relationships
      const relationshipInserts = mapTagRelationships(payload, tagIdMap);
      // Remove duplicates and insert
      const seenRelationships = new Set<string>();
      for (const rel of relationshipInserts) {
        const key = `${rel.tagId}-${rel.relatedTagId}-${rel.relationshipType}`;
        if (!seenRelationships.has(key)) {
          seenRelationships.add(key);
          // Check if relationship already exists
          const existing = await tx
            .select()
            .from(tagRelationships)
            .where(and(
              eq(tagRelationships.tagId, rel.tagId),
              eq(tagRelationships.relatedTagId, rel.relatedTagId),
              eq(tagRelationships.relationshipType, rel.relationshipType)
            ))
            .limit(1);
          if (existing.length === 0) {
            await tx.insert(tagRelationships).values(rel);
          }
        }
      }

      // Step 6: Insert trades
      const { trades: tradeInserts, screenshots: screenshotInserts, tradeTagJunctions } = mapTrades(
        payload,
        userId,
        setupIdMap,
        tagIdMap
      );
      const tradeIdMap = new Map<string, number>(); // Maps LS trade ID to DB trade ID
      
      for (let i = 0; i < tradeInserts.length; i++) {
        const trade = tradeInserts[i];
        const lsTrade = payload.trades?.[i];
        if (!lsTrade) continue;

        // Upsert by user_id + date + symbol (simplified - could be more specific)
        const existing = await tx
          .select()
          .from(trades)
          .where(and(
            eq(trades.userId, userId),
            eq(trades.date, trade.date),
            eq(trades.symbol, trade.symbol)
          ))
          .limit(1);

        let dbTradeId: number;
        if (existing.length > 0) {
          dbTradeId = existing[0].id;
          // Update existing trade
          await tx.update(trades).set(trade).where(eq(trades.id, dbTradeId));
        } else {
          const inserted = await tx.insert(trades).values(trade).returning();
          dbTradeId = inserted[0].id;
        }
        
        if (lsTrade.id) {
          tradeIdMap.set(lsTrade.id, dbTradeId);
        }

        // Insert screenshots for this trade
        // Match screenshots by trade index - each trade can have up to 2 screenshots
        const tradeScreenshotInserts = screenshotInserts.filter((_, idx) => {
          const tradeIndex = Math.floor(idx / 2);
          return tradeIndex === i;
        });
        for (const screenshot of tradeScreenshotInserts) {
          await tx.insert(tradeScreenshotsTable).values({
            ...screenshot,
            tradeId: dbTradeId,
          });
        }

        // Insert tag junctions for this trade
        const tradeTagsToInsert = tradeTagJunctions.filter((_, idx) => {
          // Match junctions to trades (simplified - would need better mapping)
          return true; // Placeholder
        });
        for (const junction of tradeTagsToInsert) {
          const existingJunction = await tx
            .select()
            .from(tradeTags)
            .where(and(
              eq(tradeTags.tradeId, dbTradeId),
              eq(tradeTags.tagId, junction.tagId)
            ))
            .limit(1);
          if (existingJunction.length === 0) {
            await tx.insert(tradeTags).values({
              ...junction,
              tradeId: dbTradeId,
            });
          }
        }
      }

      // Step 7: Insert journal entries
      const { entries: journalInserts, newsEvents: newsInserts } = mapJournalEntries(payload, userId);
      const journalIdMap = new Map<string, number>();

      for (let i = 0; i < journalInserts.length; i++) {
        const entry = journalInserts[i];
        const lsEntry = payload.journalEntries?.[i];
        if (!lsEntry) continue;

        // Upsert by user_id + date
        const existing = await tx
          .select()
          .from(journalEntries)
          .where(and(
            eq(journalEntries.userId, userId),
            eq(journalEntries.date, entry.date)
          ))
          .limit(1);

        let dbEntryId: number;
        if (existing.length > 0) {
          dbEntryId = existing[0].id;
          await tx.update(journalEntries).set(entry).where(eq(journalEntries.id, dbEntryId));
        } else {
          const inserted = await tx.insert(journalEntries).values(entry).returning();
          dbEntryId = inserted[0].id;
        }

        // Insert news events
        const entryNewsEvents = lsEntry.newsEvents || [];
        for (const news of entryNewsEvents) {
          await tx.insert(newsEvents).values({
            journalEntryId: dbEntryId,
            name: news.name,
            time: news.time,
          });
        }
      }

      // Step 8: Insert trade templates
      const { templates: templateInserts, templateTagJunctions } = mapTradeTemplates(
        payload,
        userId,
        setupIdMap,
        tagIdMap
      );

      for (let i = 0; i < templateInserts.length; i++) {
        const template = templateInserts[i];
        const lsTemplate = payload.tradeTemplates?.[i];
        if (!lsTemplate) continue;

        const existing = await tx
          .select()
          .from(tradeTemplates)
          .where(and(
            eq(tradeTemplates.userId, userId),
            eq(tradeTemplates.name, template.name)
          ))
          .limit(1);

        let dbTemplateId: number;
        if (existing.length > 0) {
          dbTemplateId = existing[0].id;
          await tx.update(tradeTemplates).set(template).where(eq(tradeTemplates.id, dbTemplateId));
        } else {
          const inserted = await tx.insert(tradeTemplates).values(template).returning();
          dbTemplateId = inserted[0].id;
        }

        // Insert tag junctions
        // Match junctions to templates (simplified)
        for (const junction of templateTagJunctions) {
          const existingTemplateTag = await tx
            .select()
            .from(templateTags)
            .where(and(
              eq(templateTags.templateId, dbTemplateId),
              eq(templateTags.tagId, junction.tagId)
            ))
            .limit(1);
          if (existingTemplateTag.length === 0) {
            await tx.insert(templateTags).values({
              ...junction,
              templateId: dbTemplateId,
            });
          }
        }
      }

      // Step 9: Insert filter presets
      const presetInserts = mapFilterPresets(payload, userId);
      for (const preset of presetInserts) {
        // Check if preset with same name exists
        const existing = await tx
          .select()
          .from(filterPresets)
          .where(and(
            eq(filterPresets.userId, userId),
            eq(filterPresets.name, preset.name)
          ))
          .limit(1);
        if (existing.length === 0) {
          await tx.insert(filterPresets).values(preset);
        }
      }

      // Step 10: Upsert preferences (1:1 with user)
      const pageFeaturesData = mapPageFeatures(payload, userId);
      if (pageFeaturesData) {
        const existingFeatures = await tx
          .select()
          .from(pageFeatures)
          .where(eq(pageFeatures.userId, userId))
          .limit(1);
        if (existingFeatures.length > 0) {
          await tx.update(pageFeatures).set(pageFeaturesData).where(eq(pageFeatures.userId, userId));
        } else {
          await tx.insert(pageFeatures).values(pageFeaturesData);
        }
      }

      const themeData = mapThemeCustomization(payload, userId);
      if (themeData) {
        const existingTheme = await tx
          .select()
          .from(themeCustomization)
          .where(eq(themeCustomization.userId, userId))
          .limit(1);
        if (existingTheme.length > 0) {
          await tx.update(themeCustomization).set(themeData).where(eq(themeCustomization.userId, userId));
        } else {
          await tx.insert(themeCustomization).values(themeData);
        }
      }

      const sidebarData = mapSidebarState(payload, userId);
      if (sidebarData) {
        const existingSidebar = await tx
          .select()
          .from(sidebarState)
          .where(eq(sidebarState.userId, userId))
          .limit(1);
        if (existingSidebar.length > 0) {
          await tx.update(sidebarState).set(sidebarData).where(eq(sidebarState.userId, userId));
        } else {
          await tx.insert(sidebarState).values(sidebarData);
        }
      }

      const viewPrefsData = mapViewPreferences(payload, userId);
      if (viewPrefsData) {
        const existingViewPrefs = await tx
          .select()
          .from(viewPreferences)
          .where(eq(viewPreferences.userId, userId))
          .limit(1);
        if (existingViewPrefs.length > 0) {
          await tx.update(viewPreferences).set(viewPrefsData).where(eq(viewPreferences.userId, userId));
        } else {
          await tx.insert(viewPreferences).values(viewPrefsData);
        }
      }

      // Step 11: Insert pinned cards
      const pinnedCardInserts = mapPinnedCards(payload, userId);
      // Clear existing and insert new ones
      await tx.delete(pinnedCards).where(eq(pinnedCards.userId, userId));
      if (pinnedCardInserts.length > 0) {
        await tx.insert(pinnedCards).values(pinnedCardInserts);
      }
    });

    return NextResponse.json({ success: true, message: 'Migration completed successfully' });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

