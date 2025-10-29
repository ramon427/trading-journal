CREATE TYPE "public"."entry_mode" AS ENUM('detailed', 'simple');--> statement-breakpoint
CREATE TYPE "public"."journal_mood" AS ENUM('excellent', 'good', 'neutral', 'poor', 'terrible');--> statement-breakpoint
CREATE TYPE "public"."playbook_rule_type" AS ENUM('entry', 'exit', 'invalidation', 'checklist');--> statement-breakpoint
CREATE TYPE "public"."trade_status" AS ENUM('open', 'closed');--> statement-breakpoint
CREATE TYPE "public"."trade_type" AS ENUM('long', 'short');--> statement-breakpoint
CREATE TABLE "achievements" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"is_unlocked" boolean DEFAULT false NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"current_value" numeric(18, 2),
	"unlocked_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_setups" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"color" varchar(32),
	"icon" varchar(64),
	"category_id" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"win_rate" numeric(6, 2),
	"avg_rr" numeric(6, 2),
	"total_pnl" numeric(18, 2),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"color" varchar(32),
	"icon" varchar(64),
	"category_id" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "filter_presets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"filters" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"date" date NOT NULL,
	"name" varchar(150),
	"mood" "journal_mood",
	"notes" text,
	"lessons_learned" text,
	"market_conditions" text,
	"did_trade" boolean,
	"followed_system" boolean,
	"is_news_day" boolean,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"journal_entry_id" integer NOT NULL,
	"name" varchar(150) NOT NULL,
	"time" time NOT NULL
);
--> statement-breakpoint
CREATE TABLE "page_features" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"show_hero_sections" boolean DEFAULT true NOT NULL,
	"home_performance_insights" boolean DEFAULT true NOT NULL,
	"home_tasks_reminders" boolean DEFAULT true NOT NULL,
	"home_open_trades" boolean DEFAULT true NOT NULL,
	"home_scratchpad" boolean DEFAULT true NOT NULL,
	"benchmarks_personal_bests" boolean DEFAULT true NOT NULL,
	"benchmarks_achievements" boolean DEFAULT true NOT NULL,
	"benchmarks_streaks" boolean DEFAULT true NOT NULL,
	"benchmarks_insights" boolean DEFAULT true NOT NULL,
	"trades_calendar" boolean DEFAULT true NOT NULL,
	"trades_list" boolean DEFAULT true NOT NULL,
	"trades_filters" boolean DEFAULT true NOT NULL,
	"trades_mistakes" boolean DEFAULT true NOT NULL,
	"trades_news" boolean DEFAULT true NOT NULL,
	"analytics_overview" boolean DEFAULT true NOT NULL,
	"analytics_setup_performance" boolean DEFAULT true NOT NULL,
	"analytics_tag_performance" boolean DEFAULT true NOT NULL,
	"analytics_time_analysis" boolean DEFAULT true NOT NULL,
	"projections_growth" boolean DEFAULT true NOT NULL,
	"projections_benchmark" boolean DEFAULT true NOT NULL,
	"projections_monthly" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "page_features_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "personal_bests" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"value" numeric(18, 2) NOT NULL,
	"date" date,
	"related_trade_ids" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pinned_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"card_id" varchar(100) NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "playbook_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"playbook_id" integer NOT NULL,
	"rule_type" "playbook_rule_type" NOT NULL,
	"rule_text" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "setup_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"color" varchar(32),
	"emoji" varchar(16),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "setup_playbooks" (
	"id" serial PRIMARY KEY NOT NULL,
	"setup_id" integer NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "setup_playbooks_setup_id_unique" UNIQUE("setup_id")
);
--> statement-breakpoint
CREATE TABLE "sidebar_state" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"is_collapsed" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sidebar_state_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "streak_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"streak_type" varchar(50) NOT NULL,
	"streak_count" integer DEFAULT 0 NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tag_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"color" varchar(32),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tag_relationships" (
	"id" serial PRIMARY KEY NOT NULL,
	"tag_id" integer NOT NULL,
	"related_tag_id" integer NOT NULL,
	"relationship_type" varchar(32) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "template_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" integer NOT NULL,
	"tag_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "theme_customization" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"mode" varchar(10) NOT NULL,
	"colors" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "theme_customization_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "trade_screenshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"trade_id" integer NOT NULL,
	"kind" varchar(16) NOT NULL,
	"url" text NOT NULL,
	"width" integer,
	"height" integer,
	"size_bytes" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trade_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"trade_id" integer NOT NULL,
	"tag_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trade_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(150) NOT NULL,
	"symbol" varchar(32),
	"type" "trade_type" NOT NULL,
	"setup_id" integer,
	"notes" text,
	"stop_loss_percent" numeric(6, 2),
	"target_percent" numeric(6, 2),
	"default_quantity" numeric(18, 6),
	"use_count" integer DEFAULT 0 NOT NULL,
	"last_used" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trades" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(150),
	"date" date NOT NULL,
	"entry_time" time,
	"exit_date" date,
	"exit_time" time,
	"symbol" varchar(32) NOT NULL,
	"type" "trade_type" NOT NULL,
	"entry_price" numeric(18, 6) NOT NULL,
	"exit_price" numeric(18, 6),
	"stop_loss" numeric(18, 6),
	"target" numeric(18, 6),
	"pnl" numeric(18, 2) DEFAULT '0' NOT NULL,
	"rr" numeric(6, 2),
	"notes" text,
	"setup_id" integer,
	"status" "trade_status" DEFAULT 'closed' NOT NULL,
	"entry_mode" "entry_mode" DEFAULT 'detailed' NOT NULL,
	"screenshot_before" text,
	"screenshot_after" text,
	"missed_trade" boolean DEFAULT false NOT NULL,
	"potential_pnl" numeric(18, 2),
	"potential_rr" numeric(6, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "view_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"trades_view_mode" varchar(20) DEFAULT 'calendar' NOT NULL,
	"display_mode" varchar(10) DEFAULT 'pnl' NOT NULL,
	"date_range" varchar(50),
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "view_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_setups" ADD CONSTRAINT "custom_setups_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_setups" ADD CONSTRAINT "custom_setups_category_id_setup_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."setup_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_tags" ADD CONSTRAINT "custom_tags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_tags" ADD CONSTRAINT "custom_tags_category_id_tag_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."tag_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filter_presets" ADD CONSTRAINT "filter_presets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_events" ADD CONSTRAINT "news_events_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_features" ADD CONSTRAINT "page_features_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_bests" ADD CONSTRAINT "personal_bests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pinned_cards" ADD CONSTRAINT "pinned_cards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playbook_rules" ADD CONSTRAINT "playbook_rules_playbook_id_setup_playbooks_id_fk" FOREIGN KEY ("playbook_id") REFERENCES "public"."setup_playbooks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setup_categories" ADD CONSTRAINT "setup_categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setup_playbooks" ADD CONSTRAINT "setup_playbooks_setup_id_custom_setups_id_fk" FOREIGN KEY ("setup_id") REFERENCES "public"."custom_setups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sidebar_state" ADD CONSTRAINT "sidebar_state_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streak_history" ADD CONSTRAINT "streak_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag_categories" ADD CONSTRAINT "tag_categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag_relationships" ADD CONSTRAINT "tag_relationships_tag_id_custom_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."custom_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag_relationships" ADD CONSTRAINT "tag_relationships_related_tag_id_custom_tags_id_fk" FOREIGN KEY ("related_tag_id") REFERENCES "public"."custom_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_tags" ADD CONSTRAINT "template_tags_template_id_trade_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."trade_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_tags" ADD CONSTRAINT "template_tags_tag_id_custom_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."custom_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theme_customization" ADD CONSTRAINT "theme_customization_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_screenshots" ADD CONSTRAINT "trade_screenshots_trade_id_trades_id_fk" FOREIGN KEY ("trade_id") REFERENCES "public"."trades"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_tags" ADD CONSTRAINT "trade_tags_trade_id_trades_id_fk" FOREIGN KEY ("trade_id") REFERENCES "public"."trades"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_tags" ADD CONSTRAINT "trade_tags_tag_id_custom_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."custom_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_templates" ADD CONSTRAINT "trade_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_templates" ADD CONSTRAINT "trade_templates_setup_id_custom_setups_id_fk" FOREIGN KEY ("setup_id") REFERENCES "public"."custom_setups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_setup_id_custom_setups_id_fk" FOREIGN KEY ("setup_id") REFERENCES "public"."custom_setups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "view_preferences" ADD CONSTRAINT "view_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;