'use server';

import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';
import { journalEntries, newsEvents } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { JournalEntry } from '@/types/journal/trading';

/**
 * Load all journal entries for the current user
 */
export async function loadJournalEntries(): Promise<JournalEntry[]> {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const dbEntries = await db
    .select()
    .from(journalEntries)
    .where(eq(journalEntries.userId, user.id))
    .orderBy(desc(journalEntries.date));

  // Get news events for each entry
  const entriesWithNews = await Promise.all(
    dbEntries.map(async (entry) => {
      const entryNews = await db
        .select()
        .from(newsEvents)
        .where(eq(newsEvents.journalEntryId, entry.id));

      return {
        date: entry.date,
        name: entry.name || undefined,
        mood: entry.mood || 'neutral',
        notes: entry.notes || '',
        lessonsLearned: entry.lessonsLearned || '',
        marketConditions: entry.marketConditions || '',
        didTrade: entry.didTrade ?? false,
        followedSystem: entry.followedSystem ?? false,
        isNewsDay: entry.isNewsDay ?? false,
        newsEvents: entryNews.map(n => ({
          name: n.name,
          time: n.time,
        })),
      };
    })
  );

  return entriesWithNews;
}

/**
 * Save journal entries (creates or updates)
 */
export async function saveJournalEntries(entries: JournalEntry[]): Promise<void> {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  for (const entry of entries) {
    // Check if entry exists for this date
    const existing = await db
      .select()
      .from(journalEntries)
      .where(and(
        eq(journalEntries.userId, user.id),
        eq(journalEntries.date, entry.date)
      ))
      .limit(1);

    const entryData = {
      userId: user.id,
      date: entry.date,
      name: entry.name || null,
      mood: entry.mood || null,
      notes: entry.notes || null,
      lessonsLearned: entry.lessonsLearned || null,
      marketConditions: entry.marketConditions || null,
      didTrade: entry.didTrade ?? null,
      followedSystem: entry.followedSystem ?? null,
      isNewsDay: entry.isNewsDay ?? null,
      updatedAt: new Date(),
    };

    if (existing.length > 0) {
      // Update existing
      await db.update(journalEntries)
        .set(entryData)
        .where(eq(journalEntries.id, existing[0].id));

      // Update news events
      await db.delete(newsEvents)
        .where(eq(newsEvents.journalEntryId, existing[0].id));
    } else {
      // Insert new
      const [inserted] = await db.insert(journalEntries)
        .values({
          ...entryData,
          createdAt: new Date(),
        })
        .returning();

      // Insert news events if any
      if (entry.newsEvents && entry.newsEvents.length > 0) {
        await db.insert(newsEvents).values(
          entry.newsEvents.map(news => ({
            journalEntryId: inserted.id,
            name: news.name,
            time: news.time,
          }))
        );
      }
    }
  }
}

/**
 * Delete a journal entry
 */
export async function deleteJournalEntry(date: string): Promise<void> {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const entry = await db
    .select()
    .from(journalEntries)
    .where(and(
      eq(journalEntries.userId, user.id),
      eq(journalEntries.date, date)
    ))
    .limit(1);

  if (entry.length > 0) {
    await db.delete(journalEntries)
      .where(eq(journalEntries.id, entry[0].id));
  }
}

