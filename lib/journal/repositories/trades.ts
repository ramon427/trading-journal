'use server';

import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';
import { trades, tradeTags, tradeScreenshots, customTags, customSetups } from '@/lib/db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { Trade } from '@/types/journal/trading';

/**
 * Load all trades for the current user with tags, setups, and screenshots
 */
export async function loadTrades(): Promise<Trade[]> {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Load all trades
  const dbTrades = await db
    .select({
      trade: trades,
      setup: customSetups,
    })
    .from(trades)
    .leftJoin(customSetups, eq(trades.setupId, customSetups.id))
    .where(eq(trades.userId, user.id))
    .orderBy(desc(trades.date));

  if (dbTrades.length === 0) {
    return [];
  }

  const tradeIds = dbTrades.map(t => t.trade.id);

  // Load all tags and screenshots in parallel
  const [allTags, allScreenshots] = await Promise.all([
    tradeIds.length > 0
      ? db
          .select({
            tradeId: tradeTags.tradeId,
            tag: customTags,
          })
          .from(tradeTags)
          .innerJoin(customTags, eq(tradeTags.tagId, customTags.id))
          .where(inArray(tradeTags.tradeId, tradeIds))
      : Promise.resolve([]),
    tradeIds.length > 0
      ? db
          .select()
          .from(tradeScreenshots)
          .where(inArray(tradeScreenshots.tradeId, tradeIds))
      : Promise.resolve([]),
  ]);

  // Create lookup maps
  const tagsByTradeId = new Map<number, string[]>();
  const screenshotsByTradeId = new Map<number, { before?: string; after?: string }>();

  for (const { tradeId, tag } of allTags) {
    if (!tagsByTradeId.has(tradeId)) {
      tagsByTradeId.set(tradeId, []);
    }
    tagsByTradeId.get(tradeId)!.push(tag.name);
  }

  for (const screenshot of allScreenshots) {
    if (!screenshotsByTradeId.has(screenshot.tradeId)) {
      screenshotsByTradeId.set(screenshot.tradeId, {});
    }
    const screens = screenshotsByTradeId.get(screenshot.tradeId)!;
    if (screenshot.kind === 'before') {
      screens.before = screenshot.url;
    } else if (screenshot.kind === 'after') {
      screens.after = screenshot.url;
    }
  }

  // Convert DB format to Trade format
  return dbTrades.map(({ trade, setup }) => {
    const screens = screenshotsByTradeId.get(trade.id) || {};
    return {
      id: trade.id.toString(),
      name: trade.name || undefined,
      date: trade.date,
      entryTime: trade.entryTime || undefined,
      exitDate: trade.exitDate || undefined,
      exitTime: trade.exitTime || undefined,
      symbol: trade.symbol,
      type: trade.type,
      entryPrice: Number(trade.entryPrice),
      exitPrice: trade.exitPrice ? Number(trade.exitPrice) : null,
      pnl: Number(trade.pnl),
      rr: trade.rr ? Number(trade.rr) : undefined,
      notes: trade.notes || '',
      tags: tagsByTradeId.get(trade.id) || [],
      setup: setup?.name || '',
      stopLoss: trade.stopLoss ? Number(trade.stopLoss) : undefined,
      target: trade.target ? Number(trade.target) : undefined,
      status: trade.status || 'closed',
      entryMode: trade.entryMode || 'detailed',
      screenshotBefore: screens.before || trade.screenshotBefore || undefined,
      screenshotAfter: screens.after || trade.screenshotAfter || undefined,
      missedTrade: trade.missedTrade || false,
      potentialPnl: trade.potentialPnl ? Number(trade.potentialPnl) : undefined,
      potentialRR: trade.potentialRr ? Number(trade.potentialRr) : undefined,
    };
  });
}

/**
 * Save a single trade (creates or updates)
 */
export async function saveTrade(trade: Trade): Promise<Trade> {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Resolve setup ID from name if provided
  let setupId: number | null = null;
  if (trade.setup) {
    const setup = await db
      .select()
      .from(customSetups)
      .where(and(
        eq(customSetups.userId, user.id),
        eq(customSetups.name, trade.setup)
      ))
      .limit(1);
    if (setup.length > 0) {
      setupId = setup[0].id;
    }
  }

  const tradeId = parseInt(trade.id) || undefined;
  const tradeData = {
    userId: user.id,
    name: trade.name || null,
    date: trade.date,
    entryTime: trade.entryTime || null,
    exitDate: trade.exitDate || null,
    exitTime: trade.exitTime || null,
    symbol: trade.symbol,
    type: trade.type,
    entryPrice: trade.entryPrice.toString(),
    exitPrice: trade.exitPrice?.toString() || null,
    stopLoss: trade.stopLoss?.toString() || null,
    target: trade.target?.toString() || null,
    pnl: trade.pnl.toString(),
    rr: trade.rr?.toString() || null,
    notes: trade.notes || null,
    setupId,
    status: trade.status || 'closed',
    entryMode: trade.entryMode || 'detailed',
    screenshotBefore: null, // Screenshots go to trade_screenshots table
    screenshotAfter: null,
    missedTrade: trade.missedTrade || false,
    potentialPnl: trade.potentialPnl?.toString() || null,
    potentialRr: trade.potentialRR?.toString() || null,
    updatedAt: new Date(),
  };

  let savedTradeId: number | undefined;

  await db.transaction(async (tx) => {
    if (tradeId) {
      // Update existing
      await tx.update(trades)
        .set(tradeData)
        .where(eq(trades.id, tradeId));
      savedTradeId = tradeId;

      // Delete existing tags and screenshots
      await tx.delete(tradeTags).where(eq(tradeTags.tradeId, tradeId));
      await tx.delete(tradeScreenshots).where(eq(tradeScreenshots.tradeId, tradeId));
    } else {
      // Insert new
      const [inserted] = await tx.insert(trades).values({
        ...tradeData,
        createdAt: new Date(),
      }).returning();
      savedTradeId = inserted.id;
    }

    // Save tags
    if (trade.tags && trade.tags.length > 0) {
      // Get tag IDs from names
      const tagIds = await tx
        .select({ id: customTags.id })
        .from(customTags)
        .where(and(
          eq(customTags.userId, user.id),
          inArray(customTags.name, trade.tags)
        ));

      // Insert tag junctions
      if (tagIds.length > 0) {
        await tx.insert(tradeTags).values(
          tagIds.map(tag => ({
            tradeId: savedTradeId,
            tagId: tag.id,
          }))
        );
      }
    }

    // Save screenshots
    if (trade.screenshotBefore) {
      await tx.insert(tradeScreenshots).values({
        tradeId: savedTradeId,
        kind: 'before',
        url: trade.screenshotBefore,
        width: null,
        height: null,
        sizeBytes: null,
        createdAt: new Date(),
      });
    }
    if (trade.screenshotAfter) {
      await tx.insert(tradeScreenshots).values({
        tradeId: savedTradeId,
        kind: 'after',
        url: trade.screenshotAfter,
        width: null,
        height: null,
        sizeBytes: null,
        createdAt: new Date(),
      });
    }
  });

  // Return the saved trade
  if (typeof savedTradeId === 'undefined') {
    throw new Error('Failed to save trade');
  }

  return {
    ...trade,
    id: savedTradeId.toString(),
  };
}

/**
 * Save multiple trades (creates or updates)
 */
export async function saveTrades(tradesData: Trade[]): Promise<void> {
  for (const trade of tradesData) {
    await saveTrade(trade);
  }
}

/**
 * Delete a trade
 */
export async function deleteTrade(tradeId: string): Promise<void> {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const tradeIdNum = parseInt(tradeId);
  if (isNaN(tradeIdNum)) {
    throw new Error('Invalid trade ID');
  }

  await db.delete(trades)
    .where(and(
      eq(trades.id, tradeIdNum),
      eq(trades.userId, user.id)
    ));
}
