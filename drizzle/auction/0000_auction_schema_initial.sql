CREATE SCHEMA "auction";
--> statement-breakpoint
CREATE TYPE "auction"."auction_status" AS ENUM('Pending', 'Bidding', 'Sold');--> statement-breakpoint
CREATE TYPE "auction"."base_price_strategy" AS ENUM('tournament-level', 'player-class-based');--> statement-breakpoint
CREATE TYPE "auction"."bidding_mode" AS ENUM('direct', 'team');--> statement-breakpoint
CREATE TYPE "auction"."invoice_status" AS ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled');--> statement-breakpoint
CREATE TYPE "auction"."overlay_payment_status" AS ENUM('free', 'paid', 'refunded', 'payment_failed');--> statement-breakpoint
CREATE TYPE "auction"."overlay_session_type" AS ENUM('custom', 'fullscreen', 'fullscreen2', 'team_owners');--> statement-breakpoint
CREATE TYPE "auction"."quotation_status" AS ENUM('draft', 'sent', 'accepted', 'rejected', 'expired');--> statement-breakpoint
CREATE TYPE "auction"."team_official_role" AS ENUM('Owner', 'Manager', 'Captain');--> statement-breakpoint
CREATE TYPE "auction"."tournament_status" AS ENUM('Draft', 'Completed', 'Setup', 'Pending', 'Live', 'Paused', 'Stopped', 'Archived');--> statement-breakpoint
CREATE TABLE "auction"."auction_state" (
	"tournament_id" text PRIMARY KEY NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"current_player_id" text,
	"current_bid" integer DEFAULT 0 NOT NULL,
	"winning_team_id" text,
	"current_auction_status" "auction"."auction_status" DEFAULT 'Pending' NOT NULL,
	"current_auction_class" varchar(10),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auction_state_bid_non_negative" CHECK ("auction"."auction_state"."current_bid" >= 0)
);
--> statement-breakpoint
CREATE TABLE "auction"."bid_history" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "auction"."bid_history_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tournament_id" text NOT NULL,
	"player_id" text,
	"team_id" text,
	"amount" integer NOT NULL,
	"bid_at_epoch_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auction"."bid_increments" (
	"tournament_id" text NOT NULL,
	"up_to" integer NOT NULL,
	"increment" integer NOT NULL,
	CONSTRAINT "bid_increments_tournament_id_up_to_pk" PRIMARY KEY("tournament_id","up_to"),
	CONSTRAINT "bid_increments_positive" CHECK ("auction"."bid_increments"."increment" > 0)
);
--> statement-breakpoint
CREATE TABLE "auction"."completed_classes" (
	"tournament_id" text NOT NULL,
	"class_code" varchar(10) NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "completed_classes_tournament_id_class_code_pk" PRIMARY KEY("tournament_id","class_code")
);
--> statement-breakpoint
CREATE TABLE "auction"."customers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"address" jsonb,
	"company_name" text,
	"tax_id" text,
	"created_by" text NOT NULL,
	"total_invoices" integer DEFAULT 0 NOT NULL,
	"total_paid" integer DEFAULT 0 NOT NULL,
	"total_outstanding" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auction"."direct_quick_bids" (
	"tournament_id" text NOT NULL,
	"amount" integer NOT NULL,
	CONSTRAINT "direct_quick_bids_tournament_id_amount_pk" PRIMARY KEY("tournament_id","amount")
);
--> statement-breakpoint
CREATE TABLE "auction"."invoice_line_items" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "auction"."invoice_line_items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"invoice_id" text NOT NULL,
	"line_number" integer NOT NULL,
	"description" text NOT NULL,
	"quantity" real NOT NULL,
	"unit_price" integer NOT NULL,
	"total" integer NOT NULL,
	CONSTRAINT "invoice_line_items_non_negative" CHECK ("auction"."invoice_line_items"."quantity" >= 0 AND "auction"."invoice_line_items"."unit_price" >= 0 AND "auction"."invoice_line_items"."total" >= 0)
);
--> statement-breakpoint
CREATE TABLE "auction"."invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_number" text NOT NULL,
	"customer_id" text NOT NULL,
	"created_by" text NOT NULL,
	"issue_date" timestamp with time zone NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"status" "auction"."invoice_status" DEFAULT 'draft' NOT NULL,
	"subtotal" integer NOT NULL,
	"tax" integer DEFAULT 0 NOT NULL,
	"tax_rate" real DEFAULT 0 NOT NULL,
	"discount" integer DEFAULT 0 NOT NULL,
	"total" integer NOT NULL,
	"amount_paid" integer DEFAULT 0 NOT NULL,
	"balance" integer NOT NULL,
	"notes" text,
	"terms" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_amounts_non_negative" CHECK ("auction"."invoices"."subtotal" >= 0 AND "auction"."invoices"."tax" >= 0 AND "auction"."invoices"."discount" >= 0 AND "auction"."invoices"."total" >= 0 AND "auction"."invoices"."amount_paid" >= 0 AND "auction"."invoices"."balance" >= 0),
	CONSTRAINT "invoices_tax_rate_range" CHECK ("auction"."invoices"."tax_rate" BETWEEN 0 AND 100)
);
--> statement-breakpoint
CREATE TABLE "auction"."overlay_analytics" (
	"overlay_config_id" text PRIMARY KEY NOT NULL,
	"display_count" integer DEFAULT 0 NOT NULL,
	"total_display_duration" integer DEFAULT 0 NOT NULL,
	"average_display_duration" real DEFAULT 0 NOT NULL,
	"last_displayed_at" timestamp with time zone,
	"error_count" integer DEFAULT 0 NOT NULL,
	"load_time" real DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auction"."overlay_configs" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '',
	"overlay_type" text NOT NULL,
	"category" text NOT NULL,
	"image_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_template" boolean DEFAULT false NOT NULL,
	"position" jsonb NOT NULL,
	"size" jsonb NOT NULL,
	"z_index" integer DEFAULT 1000 NOT NULL,
	"opacity" integer DEFAULT 100 NOT NULL,
	"parameters" jsonb DEFAULT '{}'::jsonb,
	"animations" jsonb,
	"display_rules" jsonb DEFAULT '[]'::jsonb,
	"tournament_id" text,
	"scene_ids" text[] DEFAULT '{}'::text[],
	"created_by" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"parent_config_id" text,
	"view_count" integer DEFAULT 0 NOT NULL,
	"last_used_at" timestamp with time zone,
	"is_locked" boolean DEFAULT false NOT NULL,
	"allowed_roles" text[] DEFAULT '{}'::text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "overlay_configs_opacity_range" CHECK ("auction"."overlay_configs"."opacity" BETWEEN 0 AND 100)
);
--> statement-breakpoint
CREATE TABLE "auction"."overlay_history" (
	"id" text PRIMARY KEY NOT NULL,
	"overlay_config_id" text NOT NULL,
	"version" integer NOT NULL,
	"changes" jsonb NOT NULL,
	"changed_by" text NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"comment" text
);
--> statement-breakpoint
CREATE TABLE "auction"."overlay_library" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"route" text NOT NULL,
	"tags" text[] DEFAULT '{}'::text[],
	"category" text NOT NULL,
	"default_params" jsonb DEFAULT '{}'::jsonb,
	"parameter_schema" jsonb DEFAULT '{}'::jsonb,
	"image_url" text,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auction"."overlay_scenes" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '',
	"overlay_ids" text[] DEFAULT '{}'::text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auction"."overlay_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"tournament_id" text NOT NULL,
	"label" text NOT NULL,
	"created_by" text NOT NULL,
	"overlay_type" "auction"."overlay_session_type" DEFAULT 'fullscreen' NOT NULL,
	"theme" text DEFAULT 'standard' NOT NULL,
	"palette" text DEFAULT 'default' NOT NULL,
	"payment_status" "auction"."overlay_payment_status" DEFAULT 'free' NOT NULL,
	"wallet_transaction_id" integer,
	"refund_transaction_id" integer,
	"price_charged" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "overlay_sessions_price_non_negative" CHECK ("auction"."overlay_sessions"."price_charged" >= 0)
);
--> statement-breakpoint
CREATE TABLE "auction"."player_card_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"tournament_id" text NOT NULL,
	"name" text NOT NULL,
	"png_url" text NOT NULL,
	"layout_id" text
);
--> statement-breakpoint
CREATE TABLE "auction"."player_classes" (
	"tournament_id" text NOT NULL,
	"code" varchar(10) NOT NULL,
	"name" text NOT NULL,
	"base_price" integer,
	"color" text NOT NULL,
	"icon" text,
	"sort_order" integer NOT NULL,
	CONSTRAINT "player_classes_tournament_id_code_pk" PRIMARY KEY("tournament_id","code")
);
--> statement-breakpoint
CREATE TABLE "auction"."players" (
	"id" text PRIMARY KEY NOT NULL,
	"player_no" varchar(10),
	"tournament_id" text NOT NULL,
	"created_by" text,
	"name" text NOT NULL,
	"position" text,
	"current_club" text,
	"photo_url" text,
	"secondary_image_url" text,
	"player_class" varchar(10),
	"age" integer,
	"is_sold" boolean DEFAULT false NOT NULL,
	"is_unsold" boolean DEFAULT false NOT NULL,
	"final_price" integer,
	"winning_team_id" text,
	"is_iconic" boolean DEFAULT false NOT NULL,
	"batting_style" text,
	"bowling_style" text,
	"stats" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "players_not_both_sold_and_unsold" CHECK (NOT ("auction"."players"."is_sold" AND "auction"."players"."is_unsold")),
	CONSTRAINT "players_sold_has_price_and_team" CHECK (("auction"."players"."is_sold" = false) OR ("auction"."players"."final_price" IS NOT NULL AND "auction"."players"."winning_team_id" IS NOT NULL)),
	CONSTRAINT "players_final_price_non_negative" CHECK ("auction"."players"."final_price" IS NULL OR "auction"."players"."final_price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "auction"."quotation_line_items" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "auction"."quotation_line_items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"quotation_id" text NOT NULL,
	"line_number" integer NOT NULL,
	"description" text NOT NULL,
	"quantity" real NOT NULL,
	"unit_price" integer NOT NULL,
	"total" integer NOT NULL,
	CONSTRAINT "quotation_line_items_non_negative" CHECK ("auction"."quotation_line_items"."quantity" >= 0 AND "auction"."quotation_line_items"."unit_price" >= 0 AND "auction"."quotation_line_items"."total" >= 0)
);
--> statement-breakpoint
CREATE TABLE "auction"."quotations" (
	"id" text PRIMARY KEY NOT NULL,
	"quotation_number" text NOT NULL,
	"customer_id" text NOT NULL,
	"created_by" text NOT NULL,
	"issue_date" timestamp with time zone NOT NULL,
	"valid_until" timestamp with time zone NOT NULL,
	"status" "auction"."quotation_status" DEFAULT 'draft' NOT NULL,
	"subtotal" integer NOT NULL,
	"tax" integer DEFAULT 0 NOT NULL,
	"tax_rate" real DEFAULT 0 NOT NULL,
	"discount" integer DEFAULT 0 NOT NULL,
	"total" integer NOT NULL,
	"notes" text,
	"terms" text,
	"converted_to_invoice_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quotations_amounts_non_negative" CHECK ("auction"."quotations"."subtotal" >= 0 AND "auction"."quotations"."tax" >= 0 AND "auction"."quotations"."discount" >= 0 AND "auction"."quotations"."total" >= 0),
	CONSTRAINT "quotations_tax_rate_range" CHECK ("auction"."quotations"."tax_rate" BETWEEN 0 AND 100)
);
--> statement-breakpoint
CREATE TABLE "auction"."team_officials" (
	"team_id" text NOT NULL,
	"role" "auction"."team_official_role" NOT NULL,
	"name" text NOT NULL,
	"photo_url" text,
	CONSTRAINT "team_officials_team_id_role_pk" PRIMARY KEY("team_id","role")
);
--> statement-breakpoint
CREATE TABLE "auction"."teams" (
	"id" text PRIMARY KEY NOT NULL,
	"tournament_id" text NOT NULL,
	"created_by" text,
	"name" text NOT NULL,
	"short_code" text NOT NULL,
	"owner_name" text,
	"logo_url" text,
	"initial_budget" integer,
	"current_balance" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "teams_balance_non_negative" CHECK ("auction"."teams"."current_balance" >= 0)
);
--> statement-breakpoint
CREATE TABLE "auction"."tournaments" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"year" integer NOT NULL,
	"budget_per_team" integer NOT NULL,
	"squad_size" integer NOT NULL,
	"base_price_per_player" integer NOT NULL,
	"logo_url" text,
	"wheel_center_image_url" text,
	"created_by" text,
	"sport" text DEFAULT 'cricket',
	"status" "auction"."tournament_status" DEFAULT 'Draft' NOT NULL,
	"use_player_classes" boolean DEFAULT false NOT NULL,
	"base_price_strategy" "auction"."base_price_strategy" DEFAULT 'tournament-level' NOT NULL,
	"overlay_theme" text DEFAULT 'standard',
	"overlay_palette" text DEFAULT 'default',
	"bidding_mode" "auction"."bidding_mode" DEFAULT 'direct' NOT NULL,
	"direct_bid_slab_enabled" boolean DEFAULT false NOT NULL,
	"direct_quick_bids_enabled" boolean DEFAULT false NOT NULL,
	"auction_date" text,
	"completed_at" timestamp with time zone,
	"player_profile_fields" jsonb,
	"team_officials_config" jsonb,
	"overlay_control_settings" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tournaments_squad_size_positive" CHECK ("auction"."tournaments"."squad_size" > 0),
	CONSTRAINT "tournaments_budget_non_negative" CHECK ("auction"."tournaments"."budget_per_team" >= 0)
);
--> statement-breakpoint
ALTER TABLE "auction"."auction_state" ADD CONSTRAINT "auction_state_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "auction"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auction"."auction_state" ADD CONSTRAINT "auction_state_current_player_id_players_id_fk" FOREIGN KEY ("current_player_id") REFERENCES "auction"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auction"."auction_state" ADD CONSTRAINT "auction_state_winning_team_id_teams_id_fk" FOREIGN KEY ("winning_team_id") REFERENCES "auction"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auction"."bid_history" ADD CONSTRAINT "bid_history_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "auction"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auction"."bid_history" ADD CONSTRAINT "bid_history_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "auction"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auction"."bid_history" ADD CONSTRAINT "bid_history_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "auction"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auction"."bid_increments" ADD CONSTRAINT "bid_increments_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "auction"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auction"."completed_classes" ADD CONSTRAINT "completed_classes_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "auction"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auction"."direct_quick_bids" ADD CONSTRAINT "direct_quick_bids_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "auction"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auction"."invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "auction"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auction"."invoices" ADD CONSTRAINT "invoices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "auction"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auction"."overlay_analytics" ADD CONSTRAINT "overlay_analytics_overlay_config_id_overlay_configs_id_fk" FOREIGN KEY ("overlay_config_id") REFERENCES "auction"."overlay_configs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auction"."overlay_configs" ADD CONSTRAINT "overlay_configs_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "auction"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auction"."overlay_history" ADD CONSTRAINT "overlay_history_overlay_config_id_overlay_configs_id_fk" FOREIGN KEY ("overlay_config_id") REFERENCES "auction"."overlay_configs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auction"."overlay_sessions" ADD CONSTRAINT "overlay_sessions_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "auction"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auction"."player_card_templates" ADD CONSTRAINT "player_card_templates_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "auction"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auction"."player_classes" ADD CONSTRAINT "player_classes_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "auction"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auction"."players" ADD CONSTRAINT "players_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "auction"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auction"."players" ADD CONSTRAINT "players_winning_team_id_teams_id_fk" FOREIGN KEY ("winning_team_id") REFERENCES "auction"."teams"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auction"."quotation_line_items" ADD CONSTRAINT "quotation_line_items_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "auction"."quotations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auction"."quotations" ADD CONSTRAINT "quotations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "auction"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auction"."quotations" ADD CONSTRAINT "quotations_converted_to_invoice_id_invoices_id_fk" FOREIGN KEY ("converted_to_invoice_id") REFERENCES "auction"."invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auction"."team_officials" ADD CONSTRAINT "team_officials_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "auction"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auction"."teams" ADD CONSTRAINT "teams_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "auction"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bid_history_tournament_idx" ON "auction"."bid_history" USING btree ("tournament_id","id");--> statement-breakpoint
CREATE INDEX "bid_history_player_idx" ON "auction"."bid_history" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "customers_created_by_created_idx" ON "auction"."customers" USING btree ("created_by","created_at");--> statement-breakpoint
CREATE INDEX "customers_email_idx" ON "auction"."customers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "customers_name_idx" ON "auction"."customers" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "invoice_line_items_invoice_line_idx" ON "auction"."invoice_line_items" USING btree ("invoice_id","line_number");--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_number_idx" ON "auction"."invoices" USING btree ("invoice_number");--> statement-breakpoint
CREATE INDEX "invoices_created_by_created_idx" ON "auction"."invoices" USING btree ("created_by","created_at");--> statement-breakpoint
CREATE INDEX "invoices_customer_created_idx" ON "auction"."invoices" USING btree ("customer_id","created_at");--> statement-breakpoint
CREATE INDEX "invoices_status_due_idx" ON "auction"."invoices" USING btree ("status","due_date");--> statement-breakpoint
CREATE INDEX "invoices_created_by_status_idx" ON "auction"."invoices" USING btree ("created_by","status");--> statement-breakpoint
CREATE INDEX "overlay_configs_created_by_idx" ON "auction"."overlay_configs" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "overlay_configs_tournament_idx" ON "auction"."overlay_configs" USING btree ("tournament_id");--> statement-breakpoint
CREATE INDEX "overlay_configs_type_idx" ON "auction"."overlay_configs" USING btree ("overlay_type");--> statement-breakpoint
CREATE INDEX "overlay_configs_category_idx" ON "auction"."overlay_configs" USING btree ("category");--> statement-breakpoint
CREATE INDEX "overlay_configs_template_idx" ON "auction"."overlay_configs" USING btree ("is_template");--> statement-breakpoint
CREATE INDEX "overlay_history_config_version_idx" ON "auction"."overlay_history" USING btree ("overlay_config_id","version");--> statement-breakpoint
CREATE INDEX "overlay_library_category_idx" ON "auction"."overlay_library" USING btree ("category");--> statement-breakpoint
CREATE INDEX "overlay_library_active_idx" ON "auction"."overlay_library" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "overlay_sessions_tournament_active_idx" ON "auction"."overlay_sessions" USING btree ("tournament_id","is_active");--> statement-breakpoint
CREATE INDEX "overlay_sessions_tournament_type_active_idx" ON "auction"."overlay_sessions" USING btree ("tournament_id","overlay_type","is_active");--> statement-breakpoint
CREATE INDEX "player_card_templates_tournament_idx" ON "auction"."player_card_templates" USING btree ("tournament_id");--> statement-breakpoint
CREATE INDEX "player_classes_order_idx" ON "auction"."player_classes" USING btree ("tournament_id","sort_order");--> statement-breakpoint
CREATE INDEX "players_tournament_idx" ON "auction"."players" USING btree ("tournament_id");--> statement-breakpoint
CREATE UNIQUE INDEX "players_tournament_player_no_idx" ON "auction"."players" USING btree ("tournament_id","player_no");--> statement-breakpoint
CREATE INDEX "players_created_by_idx" ON "auction"."players" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "players_tournament_sold_idx" ON "auction"."players" USING btree ("tournament_id","is_sold");--> statement-breakpoint
CREATE INDEX "players_tournament_sold_team_idx" ON "auction"."players" USING btree ("tournament_id","is_sold","winning_team_id");--> statement-breakpoint
CREATE INDEX "players_tournament_sold_updated_idx" ON "auction"."players" USING btree ("tournament_id","is_sold","updated_at");--> statement-breakpoint
CREATE INDEX "players_tournament_unsold_updated_idx" ON "auction"."players" USING btree ("tournament_id","is_unsold","updated_at");--> statement-breakpoint
CREATE INDEX "players_tournament_class_idx" ON "auction"."players" USING btree ("tournament_id","player_class","is_sold","is_unsold");--> statement-breakpoint
CREATE UNIQUE INDEX "quotation_line_items_quotation_line_idx" ON "auction"."quotation_line_items" USING btree ("quotation_id","line_number");--> statement-breakpoint
CREATE UNIQUE INDEX "quotations_number_idx" ON "auction"."quotations" USING btree ("quotation_number");--> statement-breakpoint
CREATE INDEX "quotations_created_by_created_idx" ON "auction"."quotations" USING btree ("created_by","created_at");--> statement-breakpoint
CREATE INDEX "quotations_customer_created_idx" ON "auction"."quotations" USING btree ("customer_id","created_at");--> statement-breakpoint
CREATE INDEX "quotations_status_valid_idx" ON "auction"."quotations" USING btree ("status","valid_until");--> statement-breakpoint
CREATE INDEX "quotations_created_by_status_idx" ON "auction"."quotations" USING btree ("created_by","status");--> statement-breakpoint
CREATE INDEX "teams_tournament_idx" ON "auction"."teams" USING btree ("tournament_id");--> statement-breakpoint
CREATE INDEX "teams_created_by_idx" ON "auction"."teams" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "tournaments_created_by_idx" ON "auction"."tournaments" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "tournaments_status_idx" ON "auction"."tournaments" USING btree ("status");