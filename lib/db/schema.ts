import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  numeric,
  date,
  time,
  pgEnum
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
});

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
}));

export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
}

// =======================
// Trading Journal Schema
// =======================

// Enums
export const tradeTypeEnum = pgEnum('trade_type', ['long', 'short']);
export const tradeStatusEnum = pgEnum('trade_status', ['open', 'closed']);
export const moodEnum = pgEnum('journal_mood', ['excellent', 'good', 'neutral', 'poor', 'terrible']);
export const ruleTypeEnum = pgEnum('playbook_rule_type', ['entry', 'exit', 'invalidation', 'checklist']);
export const entryModeEnum = pgEnum('entry_mode', ['detailed', 'simple']);

// Core entities
export const setupCategories = pgTable('setup_categories', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  color: varchar('color', { length: 32 }),
  emoji: varchar('emoji', { length: 16 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const customSetups = pgTable('custom_setups', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  color: varchar('color', { length: 32 }),
  icon: varchar('icon', { length: 64 }),
  categoryId: integer('category_id').references(() => setupCategories.id, { onDelete: 'set null' }),
  isActive: boolean('is_active').notNull().default(true),
  isFavorite: boolean('is_favorite').notNull().default(false),
  usageCount: integer('usage_count').notNull().default(0),
  winRate: numeric('win_rate', { precision: 6, scale: 2 }),
  avgRr: numeric('avg_rr', { precision: 6, scale: 2 }),
  totalPnl: numeric('total_pnl', { precision: 18, scale: 2 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const setupPlaybooks = pgTable('setup_playbooks', {
  id: serial('id').primaryKey(),
  setupId: integer('setup_id').notNull().references(() => customSetups.id, { onDelete: 'cascade' }).unique(),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const playbookRules = pgTable('playbook_rules', {
  id: serial('id').primaryKey(),
  playbookId: integer('playbook_id').notNull().references(() => setupPlaybooks.id, { onDelete: 'cascade' }),
  ruleType: ruleTypeEnum('rule_type').notNull(),
  ruleText: text('rule_text').notNull(),
  displayOrder: integer('display_order').notNull().default(0),
});

export const tagCategories = pgTable('tag_categories', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  color: varchar('color', { length: 32 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const customTags = pgTable('custom_tags', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  color: varchar('color', { length: 32 }),
  icon: varchar('icon', { length: 64 }),
  categoryId: integer('category_id').references(() => tagCategories.id, { onDelete: 'set null' }),
  isActive: boolean('is_active').notNull().default(true),
  isFavorite: boolean('is_favorite').notNull().default(false),
  usageCount: integer('usage_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const tagRelationships = pgTable('tag_relationships', {
  id: serial('id').primaryKey(),
  tagId: integer('tag_id').notNull().references(() => customTags.id, { onDelete: 'cascade' }),
  relatedTagId: integer('related_tag_id').notNull().references(() => customTags.id, { onDelete: 'cascade' }),
  relationshipType: varchar('relationship_type', { length: 32 }).notNull(), // mutually_exclusive, suggested, required
});

export const trades = pgTable('trades', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 150 }),
  date: date('date').notNull(),
  entryTime: time('entry_time'),
  exitDate: date('exit_date'),
  exitTime: time('exit_time'),
  symbol: varchar('symbol', { length: 32 }).notNull(),
  type: tradeTypeEnum('type').notNull(),
  entryPrice: numeric('entry_price', { precision: 18, scale: 6 }).notNull(),
  exitPrice: numeric('exit_price', { precision: 18, scale: 6 }),
  stopLoss: numeric('stop_loss', { precision: 18, scale: 6 }),
  target: numeric('target', { precision: 18, scale: 6 }),
  pnl: numeric('pnl', { precision: 18, scale: 2 }).notNull().default('0'),
  rr: numeric('rr', { precision: 6, scale: 2 }),
  notes: text('notes'),
  setupId: integer('setup_id').references(() => customSetups.id, { onDelete: 'set null' }),
  status: tradeStatusEnum('status').notNull().default('closed'),
  entryMode: entryModeEnum('entry_mode').notNull().default('detailed'),
  screenshotBefore: text('screenshot_before'),
  screenshotAfter: text('screenshot_after'),
  missedTrade: boolean('missed_trade').notNull().default(false),
  potentialPnl: numeric('potential_pnl', { precision: 18, scale: 2 }),
  potentialRr: numeric('potential_rr', { precision: 6, scale: 2 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const tradeScreenshots = pgTable('trade_screenshots', {
  id: serial('id').primaryKey(),
  tradeId: integer('trade_id').notNull().references(() => trades.id, { onDelete: 'cascade' }),
  kind: varchar('kind', { length: 16 }).notNull(), // before | after | other
  url: text('url').notNull(),
  width: integer('width'),
  height: integer('height'),
  sizeBytes: integer('size_bytes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const tradeTags = pgTable('trade_tags', {
  id: serial('id').primaryKey(),
  tradeId: integer('trade_id').notNull().references(() => trades.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id').notNull().references(() => customTags.id, { onDelete: 'cascade' }),
});

export const journalEntries = pgTable('journal_entries', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  name: varchar('name', { length: 150 }),
  mood: moodEnum('mood'),
  notes: text('notes'),
  lessonsLearned: text('lessons_learned'),
  marketConditions: text('market_conditions'),
  didTrade: boolean('did_trade'),
  followedSystem: boolean('followed_system'),
  isNewsDay: boolean('is_news_day'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const newsEvents = pgTable('news_events', {
  id: serial('id').primaryKey(),
  journalEntryId: integer('journal_entry_id').notNull().references(() => journalEntries.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 150 }).notNull(),
  time: time('time').notNull(),
});

// Templates & presets
export const tradeTemplates = pgTable('trade_templates', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 150 }).notNull(),
  symbol: varchar('symbol', { length: 32 }),
  type: tradeTypeEnum('type').notNull(),
  setupId: integer('setup_id').references(() => customSetups.id, { onDelete: 'set null' }),
  notes: text('notes'),
  stopLossPercent: numeric('stop_loss_percent', { precision: 6, scale: 2 }),
  targetPercent: numeric('target_percent', { precision: 6, scale: 2 }),
  defaultQuantity: numeric('default_quantity', { precision: 18, scale: 6 }),
  useCount: integer('use_count').notNull().default(0),
  lastUsed: timestamp('last_used'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const templateTags = pgTable('template_tags', {
  id: serial('id').primaryKey(),
  templateId: integer('template_id').notNull().references(() => tradeTemplates.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id').notNull().references(() => customTags.id, { onDelete: 'cascade' }),
});

export const filterPresets = pgTable('filter_presets', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  filters: text('filters').notNull(), // JSON string of AdvancedTradeFilters
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Preferences
export const pageFeatures = pgTable('page_features', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  showHeroSections: boolean('show_hero_sections').notNull().default(true),
  homePerformanceInsights: boolean('home_performance_insights').notNull().default(true),
  homeTasksReminders: boolean('home_tasks_reminders').notNull().default(true),
  homeOpenTrades: boolean('home_open_trades').notNull().default(true),
  homeScratchpad: boolean('home_scratchpad').notNull().default(true),
  benchmarksPersonalBests: boolean('benchmarks_personal_bests').notNull().default(true),
  benchmarksAchievements: boolean('benchmarks_achievements').notNull().default(true),
  benchmarksStreaks: boolean('benchmarks_streaks').notNull().default(true),
  benchmarksInsights: boolean('benchmarks_insights').notNull().default(true),
  tradesCalendar: boolean('trades_calendar').notNull().default(true),
  tradesList: boolean('trades_list').notNull().default(true),
  tradesFilters: boolean('trades_filters').notNull().default(true),
  tradesMistakes: boolean('trades_mistakes').notNull().default(true),
  tradesNews: boolean('trades_news').notNull().default(true),
  analyticsOverview: boolean('analytics_overview').notNull().default(true),
  analyticsSetupPerformance: boolean('analytics_setup_performance').notNull().default(true),
  analyticsTagPerformance: boolean('analytics_tag_performance').notNull().default(true),
  analyticsTimeAnalysis: boolean('analytics_time_analysis').notNull().default(true),
  projectionsGrowth: boolean('projections_growth').notNull().default(true),
  projectionsBenchmark: boolean('projections_benchmark').notNull().default(true),
  projectionsMonthly: boolean('projections_monthly').notNull().default(true),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const themeCustomization = pgTable('theme_customization', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  mode: varchar('mode', { length: 10 }).notNull(), // light | dark
  colors: text('colors').notNull(), // JSON string of CustomThemeColors
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const pinnedCards = pgTable('pinned_cards', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  cardId: varchar('card_id', { length: 100 }).notNull(),
  displayOrder: integer('display_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const sidebarState = pgTable('sidebar_state', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  isCollapsed: boolean('is_collapsed').notNull().default(false),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const viewPreferences = pgTable('view_preferences', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  tradesViewMode: varchar('trades_view_mode', { length: 20 }).notNull().default('calendar'), // calendar | list
  displayMode: varchar('display_mode', { length: 10 }).notNull().default('pnl'), // pnl | rr
  dateRange: varchar('date_range', { length: 50 }),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Tracking & activity
export const achievements = pgTable('achievements', {
  id: varchar('id', { length: 100 }).primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  isUnlocked: boolean('is_unlocked').notNull().default(false),
  progress: integer('progress').notNull().default(0),
  currentValue: numeric('current_value', { precision: 18, scale: 2 }),
  unlockedAt: timestamp('unlocked_at'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const personalBests = pgTable('personal_bests', {
  id: varchar('id', { length: 100 }).primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  value: numeric('value', { precision: 18, scale: 2 }).notNull(),
  date: date('date'),
  relatedTradeIds: text('related_trade_ids'), // JSON string array
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const streakHistory = pgTable('streak_history', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  streakType: varchar('streak_type', { length: 50 }).notNull(),
  streakCount: integer('streak_count').notNull().default(0),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
