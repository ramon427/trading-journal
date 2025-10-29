/**
 * Data migration utilities to handle schema changes
 */

import { Trade, JournalEntry } from '../types/trading';
import { getTodayDate } from './formatters';

const MIGRATION_VERSION_KEY = 'trading_journal_migration_version';
const CURRENT_VERSION = 3; // Bumped to force data reload with newsEvents

/**
 * Get current migration version
 */
export const getMigrationVersion = (): number => {
  if (typeof window === 'undefined') return CURRENT_VERSION;
  const version = localStorage.getItem(MIGRATION_VERSION_KEY);
  return version ? parseInt(version, 10) : 0;
};

/**
 * Set migration version
 */
export const setMigrationVersion = (version: number): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MIGRATION_VERSION_KEY, version.toString());
};

/**
 * Migrate a single trade to current schema
 */
export const migrateTrade = (trade: any): Trade => {
  const migrated = { ...trade };
  
  // Migration 1: Add status field for trades without it
  if (migrated.status === undefined) {
    // Determine status based on exitPrice
    if (migrated.exitPrice !== null && migrated.exitPrice !== undefined) {
      migrated.status = 'closed';
    } else {
      migrated.status = 'open';
    }
  }
  
  // Migration 2: Ensure exitDate is set for closed trades
  if (migrated.status === 'closed' && !migrated.exitDate) {
    // Use the date field as fallback
    migrated.exitDate = migrated.date;
  }
  
  // Migration 3: Add entryMode field for trades without it
  if (migrated.entryMode === undefined) {
    migrated.entryMode = 'detailed';
  }
  
  // Migration 4: Ensure tags is an array
  if (!Array.isArray(migrated.tags)) {
    migrated.tags = [];
  }
  
  // Migration 5: Ensure rr is a number or null
  if (migrated.rr !== null && migrated.rr !== undefined) {
    migrated.rr = Number(migrated.rr);
  }
  
  // Migration 6: Ensure pnl is a number
  migrated.pnl = Number(migrated.pnl) || 0;
  
  return migrated as Trade;
};

/**
 * Migrate a single journal entry to current schema
 */
export const migrateJournalEntry = (entry: any): JournalEntry => {
  const migrated = { ...entry };
  
  // Ensure all required fields exist with defaults
  if (migrated.mood === undefined) {
    migrated.mood = 'neutral';
  }
  
  if (migrated.notes === undefined) {
    migrated.notes = '';
  }
  
  if (migrated.lessonsLearned === undefined) {
    migrated.lessonsLearned = '';
  }
  
  if (migrated.marketConditions === undefined) {
    migrated.marketConditions = '';
  }
  
  if (migrated.didTrade === undefined) {
    migrated.didTrade = false;
  }
  
  if (migrated.followedSystem === undefined) {
    migrated.followedSystem = true;
  }
  
  if (migrated.isNewsDay === undefined) {
    migrated.isNewsDay = false;
  }
  
  // Preserve optional fields like newsEvents, name, etc.
  // newsEvents is already preserved by the spread operator above
  // Just ensure it's an array if it exists
  if (migrated.newsEvents && !Array.isArray(migrated.newsEvents)) {
    migrated.newsEvents = [];
  }
  
  // Migration 3: Add sample newsEvents to dummy data entries that are marked as news days but don't have events
  if (migrated.isNewsDay && (!migrated.newsEvents || migrated.newsEvents.length === 0)) {
    // Add sample news events based on the date
    const newsEventsByDate: { [key: string]: any[] } = {
      '2025-10-01': [{ name: 'NFP Report', time: '8:30 AM' }, { name: 'ISM Manufacturing', time: '10:00 AM' }],
      '2025-10-03': [{ name: 'CPI Data', time: '8:30 AM' }],
      '2025-10-08': [{ name: 'EIA', time: '10:30 AM' }, { name: 'Agricultural Report', time: '3:00 PM' }],
      '2025-10-11': [{ name: 'FOMC Minutes', time: '12:00 PM' }, { name: 'Powell Speech', time: '2:30 PM' }],
      '2025-10-14': [{ name: 'Retail Sales', time: '8:30 AM' }, { name: 'Fed Beige Book', time: '2:00 PM' }],
    };
    
    if (newsEventsByDate[migrated.date]) {
      migrated.newsEvents = newsEventsByDate[migrated.date];
      if (process.env.NODE_ENV === 'development') {
        console.log(`Migration: Added news events to ${migrated.date}`);
      }
    }
  }
  
  return migrated as JournalEntry;
};

/**
 * Migrate all trades
 */
export const migrateTrades = (trades: any[]): Trade[] => {
  return trades.map(migrateTrade);
};

/**
 * Migrate all journal entries
 */
export const migrateJournalEntries = (entries: any[]): JournalEntry[] => {
  return entries.map(migrateJournalEntry);
};

/**
 * Run all necessary migrations
 */
export const runMigrations = (
  trades: any[],
  journalEntries: any[]
): { trades: Trade[]; journalEntries: JournalEntry[]; migrated: boolean } => {
  const currentVersion = getMigrationVersion();
  
  if (currentVersion >= CURRENT_VERSION) {
    // No migration needed
    return {
      trades: trades as Trade[],
      journalEntries: journalEntries as JournalEntry[],
      migrated: false
    };
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`Running migrations from version ${currentVersion} to ${CURRENT_VERSION}`);
  }
  
  const migratedTrades = migrateTrades(trades);
  const migratedJournalEntries = migrateJournalEntries(journalEntries);
  
  setMigrationVersion(CURRENT_VERSION);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`Migrated ${migratedTrades.length} trades and ${migratedJournalEntries.length} journal entries`);
  }
  
  return {
    trades: migratedTrades,
    journalEntries: migratedJournalEntries,
    migrated: true
  };
};
