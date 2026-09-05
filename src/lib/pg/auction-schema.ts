/**
 * auction-schema.ts
 *
 * PostgreSQL schema for the Auction application's own data, currently in
 * MongoDB. See docs/MONGO_TO_POSTGRES_MIGRATION_PLAN.md for the full plan.
 *
 * Lives in a dedicated `auction` schema, NOT `public`. Scoreboard already owns
 * `tournaments`/`teams`/`players` in `public` for cricket identity; these are
 * different entities that happen to share names. Same database means one
 * backup and one connection pool, while the separate schema prevents
 * collisions.
 *
 * Design rule carried over from the Scoreboard migration:
 *   money and integrity  -> real columns + constraints
 *   presentation config  -> jsonb
 *
 * Nothing here is applied to a live database yet. Phase D-A only.
 */

import { sql } from 'drizzle-orm';
import {
  boolean,
  bigint,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgSchema,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

export const auction = pgSchema('auction');

/**
 * Raw, immutable preservation for legacy Mongo records whose parent was
 * deleted before the relational migration. These rows are intentionally kept
 * out of live tables because inventing a tournament/team parent would make
 * them appear live to the application. ETL reconciliation covers this table.
 */
export const migrationLegacyRecords = auction.table(
  'migration_legacy_records',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    sourceCollection: text('source_collection').notNull(),
    sourceId: text('source_id').notNull(),
    reason: text('reason').notNull(),
    record: jsonb('record').notNull(),
    archivedAt: timestamp('archived_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    sourceRecordIdx: uniqueIndex('migration_legacy_records_source_id_idx').on(
      table.sourceCollection,
      table.sourceId,
    ),
    sourceCollectionIdx: index('migration_legacy_records_collection_idx').on(table.sourceCollection),
  }),
);

/* ── Enums ──────────────────────────────────────────────────────────────── */

export const tournamentStatusEnum = auction.enum('tournament_status', [
  'Draft',
  'Completed',
  'Setup',
  'Pending',
  'Live',
  'Paused',
  'Stopped',
  'Archived',
]);

export const basePriceStrategyEnum = auction.enum('base_price_strategy', [
  'tournament-level',
  'player-class-based',
]);

export const biddingModeEnum = auction.enum('bidding_mode', ['direct', 'team']);

export const auctionStatusEnum = auction.enum('auction_status', [
  'Pending',
  'Bidding',
  'Sold',
]);

export const teamOfficialRoleEnum = auction.enum('team_official_role', [
  'Owner',
  'Manager',
  'Captain',
]);

export const invoiceStatusEnum = auction.enum('invoice_status', [
  'draft',
  'sent',
  'paid',
  'overdue',
  'cancelled',
]);

export const quotationStatusEnum = auction.enum('quotation_status', [
  'draft',
  'sent',
  'accepted',
  'rejected',
  'expired',
]);

export const overlayPaymentStatusEnum = auction.enum('overlay_payment_status', [
  'free',
  'paid',
  'refunded',
  'payment_failed',
]);

export const overlaySessionTypeEnum = auction.enum('overlay_session_type', [
  'custom',
  'fullscreen',
  'fullscreen2',
  'team_owners',
]);

/* ── Tournaments ────────────────────────────────────────────────────────── */

export const tournaments = auction.table(
  'tournaments',
  {
    // Mongo _id is already a string everywhere. No ObjectId remapping needed.
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    year: integer('year').notNull(),
    budgetPerTeam: integer('budget_per_team').notNull(),
    squadSize: integer('squad_size').notNull(),
    basePricePerPlayer: integer('base_price_per_player').notNull(),
    logoUrl: text('logo_url'),
    wheelCenterImageUrl: text('wheel_center_image_url'),
    createdBy: text('created_by'),
    sport: text('sport').default('cricket'),
    status: tournamentStatusEnum('status').notNull().default('Draft'),
    usePlayerClasses: boolean('use_player_classes').notNull().default(false),
    basePriceStrategy: basePriceStrategyEnum('base_price_strategy')
      .notNull()
      .default('tournament-level'),
    overlayTheme: text('overlay_theme').default('standard'),
    overlayPalette: text('overlay_palette').default('default'),
    biddingMode: biddingModeEnum('bidding_mode').notNull().default('direct'),
    directBidSlabEnabled: boolean('direct_bid_slab_enabled').notNull().default(false),
    directQuickBidsEnabled: boolean('direct_quick_bids_enabled').notNull().default(false),
    auctionDate: text('auction_date'),
    completedAt: timestamp('completed_at', { withTimezone: true }),

    // Read-whole config blobs, never filtered on individual fields.
    playerProfileFields: jsonb('player_profile_fields'),
    teamOfficialsConfig: jsonb('team_officials_config'),
    overlayControlSettings: jsonb('overlay_control_settings'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    createdByIdx: index('tournaments_created_by_idx').on(table.createdBy),
    statusIdx: index('tournaments_status_idx').on(table.status),
    positiveSquadSize: check('tournaments_squad_size_positive', sql`${table.squadSize} > 0`),
    nonNegativeBudget: check('tournaments_budget_non_negative', sql`${table.budgetPerTeam} >= 0`),
  }),
);

/**
 * Player classes are a child table, not jsonb: `playerClass` on a player is
 * matched against `code` in queries, and classes are individually edited.
 */
export const playerClasses = auction.table(
  'player_classes',
  {
    tournamentId: text('tournament_id')
      .notNull()
      .references(() => tournaments.id, { onDelete: 'cascade' }),
    code: varchar('code', { length: 10 }).notNull(),
    name: text('name').notNull(),
    basePrice: integer('base_price'),
    color: text('color').notNull(),
    icon: text('icon'),
    sortOrder: integer('sort_order').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.tournamentId, table.code] }),
    orderIdx: index('player_classes_order_idx').on(table.tournamentId, table.sortOrder),
  }),
);

/** Ordered bid increment slabs. Child table so ordering is explicit. */
export const bidIncrements = auction.table(
  'bid_increments',
  {
    tournamentId: text('tournament_id')
      .notNull()
      .references(() => tournaments.id, { onDelete: 'cascade' }),
    upTo: integer('up_to').notNull(),
    increment: integer('increment').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.tournamentId, table.upTo] }),
    positiveIncrement: check('bid_increments_positive', sql`${table.increment} > 0`),
  }),
);

export const directQuickBids = auction.table(
  'direct_quick_bids',
  {
    tournamentId: text('tournament_id')
      .notNull()
      .references(() => tournaments.id, { onDelete: 'cascade' }),
    amount: integer('amount').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.tournamentId, table.amount] }),
  }),
);

export const playerCardTemplates = auction.table(
  'player_card_templates',
  {
    id: text('id').primaryKey(),
    tournamentId: text('tournament_id')
      .notNull()
      .references(() => tournaments.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    pngUrl: text('png_url').notNull(),
    layoutId: text('layout_id'),
  },
  (table) => ({
    tournamentIdx: index('player_card_templates_tournament_idx').on(table.tournamentId),
  }),
);

/* ── Teams ──────────────────────────────────────────────────────────────── */

export const teams = auction.table(
  'teams',
  {
    id: text('id').primaryKey(),
    tournamentId: text('tournament_id')
      .notNull()
      .references(() => tournaments.id, { onDelete: 'cascade' }),
    createdBy: text('created_by'),
    name: text('name').notNull(),
    shortCode: text('short_code').notNull(),
    // Kept for backward compatibility; derived from the Owner official.
    ownerName: text('owner_name'),
    logoUrl: text('logo_url'),
    initialBudget: integer('initial_budget'),
    currentBalance: integer('current_balance'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tournamentIdx: index('teams_tournament_idx').on(table.tournamentId),
    createdByIdx: index('teams_created_by_idx').on(table.createdBy),
    // The whole point of moving money to Postgres: an over-spend becomes
    // impossible at the database level, not merely checked in application code.
    balanceNonNegative: check('teams_balance_non_negative', sql`${table.currentBalance} >= 0`),
  }),
);

export const teamOfficials = auction.table(
  'team_officials',
  {
    teamId: text('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    role: teamOfficialRoleEnum('role').notNull(),
    name: text('name').notNull(),
    photoUrl: text('photo_url'),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.teamId, table.role] }),
  }),
);

/* ── Players ────────────────────────────────────────────────────────────── */

export const players = auction.table(
  'players',
  {
    id: text('id').primaryKey(),
    // Sequential per tournament ("001", "002", ...).
    playerNo: varchar('player_no', { length: 10 }),
    tournamentId: text('tournament_id')
      .notNull()
      .references(() => tournaments.id, { onDelete: 'cascade' }),
    createdBy: text('created_by'),
    name: text('name').notNull(),
    position: text('position'),
    currentClub: text('current_club'),
    photoUrl: text('photo_url'),
    secondaryImageUrl: text('secondary_image_url'),
    playerClass: varchar('player_class', { length: 10 }),
    age: integer('age'),
    isSold: boolean('is_sold').notNull().default(false),
    isUnsold: boolean('is_unsold').notNull().default(false),
    finalPrice: integer('final_price'),
    // Intentionally NOT a foreign key with cascade: a team deletion must never
    // silently erase the sale record. Cleanup is an explicit application step.
    winningTeamId: text('winning_team_id').references(() => teams.id, {
      onDelete: 'restrict',
    }),
    isIconic: boolean('is_iconic').notNull().default(false),
    battingStyle: text('batting_style'),
    bowlingStyle: text('bowling_style'),
    // Keys match tournament playerProfileFields.statFields[].key. Free-form.
    stats: jsonb('stats'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    // Mirrors the seven Mongo indexes, including the hot-path compounds used by
    // sell / undo / mark-unsold / select-class.
    tournamentIdx: index('players_tournament_idx').on(table.tournamentId),
    playerNoIdx: uniqueIndex('players_tournament_player_no_idx').on(
      table.tournamentId,
      table.playerNo,
    ),
    createdByIdx: index('players_created_by_idx').on(table.createdBy),
    soldIdx: index('players_tournament_sold_idx').on(table.tournamentId, table.isSold),
    soldTeamIdx: index('players_tournament_sold_team_idx').on(
      table.tournamentId,
      table.isSold,
      table.winningTeamId,
    ),
    soldUpdatedIdx: index('players_tournament_sold_updated_idx').on(
      table.tournamentId,
      table.isSold,
      table.updatedAt,
    ),
    unsoldUpdatedIdx: index('players_tournament_unsold_updated_idx').on(
      table.tournamentId,
      table.isUnsold,
      table.updatedAt,
    ),
    classIdx: index('players_tournament_class_idx').on(
      table.tournamentId,
      table.playerClass,
      table.isSold,
      table.isUnsold,
    ),
    // A player cannot be both sold and unsold.
    notBothSoldStates: check(
      'players_not_both_sold_and_unsold',
      sql`NOT (${table.isSold} AND ${table.isUnsold})`,
    ),
    // A sold player must have both a price and a buyer.
    soldHasPriceAndTeam: check(
      'players_sold_has_price_and_team',
      sql`(${table.isSold} = false) OR (${table.finalPrice} IS NOT NULL AND ${table.winningTeamId} IS NOT NULL)`,
    ),
    nonNegativePrice: check(
      'players_final_price_non_negative',
      sql`${table.finalPrice} IS NULL OR ${table.finalPrice} >= 0`,
    ),
  }),
);

/* ── Live auction state (the CAS hot path) ──────────────────────────────── */

export const auctionState = auction.table(
  'auction_state',
  {
    tournamentId: text('tournament_id')
      .primaryKey()
      .references(() => tournaments.id, { onDelete: 'cascade' }),
    // Incremented on every state mutation; the optimistic-concurrency token.
    revision: integer('revision').notNull().default(0),
    currentPlayerId: text('current_player_id').references(() => players.id, {
      onDelete: 'set null',
    }),
    currentBid: integer('current_bid').notNull().default(0),
    winningTeamId: text('winning_team_id').references(() => teams.id, {
      onDelete: 'set null',
    }),
    currentAuctionStatus: auctionStatusEnum('current_auction_status')
      .notNull()
      .default('Pending'),
    currentAuctionClass: varchar('current_auction_class', { length: 10 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    nonNegativeBid: check('auction_state_bid_non_negative', sql`${table.currentBid} >= 0`),
  }),
);

/**
 * Bid history as a child table rather than an embedded array.
 *
 * In Mongo this is `history: [bidSchema]` on the auction state document, which
 * grows without bound and rewrites the whole document on every bid. As rows it
 * stays append-only, queryable, and does not contend with the CAS update on
 * `auction_state` that every bid also performs.
 */
export const bidHistory = auction.table(
  'bid_history',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    tournamentId: text('tournament_id')
      .notNull()
      .references(() => tournaments.id, { onDelete: 'cascade' }),
    playerId: text('player_id').references(() => players.id, { onDelete: 'set null' }),
    teamId: text('team_id').references(() => teams.id, { onDelete: 'set null' }),
    amount: integer('amount').notNull(),
    // Mongo stored a numeric epoch; keep it alongside a real timestamp so the
    // migrated values remain byte-comparable against the source during ETL.
    // A millisecond epoch is already ~1.7e12, beyond PostgreSQL `integer`.
    bidAtEpochMs: bigint('bid_at_epoch_ms', { mode: 'number' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tournamentIdx: index('bid_history_tournament_idx').on(table.tournamentId, table.id),
    playerIdx: index('bid_history_player_idx').on(table.playerId),
  }),
);

/** Class codes whose players are all sold or unsold. */
export const completedClasses = auction.table(
  'completed_classes',
  {
    tournamentId: text('tournament_id')
      .notNull()
      .references(() => tournaments.id, { onDelete: 'cascade' }),
    classCode: varchar('class_code', { length: 10 }).notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.tournamentId, table.classCode] }),
  }),
);

/* ── Overlays ───────────────────────────────────────────────────────────── */

export const overlayConfigs = auction.table(
  'overlay_configs',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description').default(''),
    overlayType: text('overlay_type').notNull(),
    category: text('category').notNull(),
    imageUrl: text('image_url'),
    isActive: boolean('is_active').notNull().default(true),
    isTemplate: boolean('is_template').notNull().default(false),

    // Layout and customization are presentation config: read whole, never
    // filtered by inner field, so jsonb rather than a wide column set.
    position: jsonb('position').notNull(),
    size: jsonb('size').notNull(),
    zIndex: integer('z_index').notNull().default(1000),
    opacity: integer('opacity').notNull().default(100),
    parameters: jsonb('parameters').default(sql`'{}'::jsonb`),
    animations: jsonb('animations'),
    displayRules: jsonb('display_rules').default(sql`'[]'::jsonb`),

    tournamentId: text('tournament_id').references(() => tournaments.id, {
      onDelete: 'cascade',
    }),
    sceneIds: text('scene_ids').array().default(sql`'{}'::text[]`),

    createdBy: text('created_by').notNull(),
    version: integer('version').notNull().default(1),
    parentConfigId: text('parent_config_id'),

    viewCount: integer('view_count').notNull().default(0),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),

    isLocked: boolean('is_locked').notNull().default(false),
    allowedRoles: text('allowed_roles').array().default(sql`'{}'::text[]`),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    createdByIdx: index('overlay_configs_created_by_idx').on(table.createdBy),
    tournamentIdx: index('overlay_configs_tournament_idx').on(table.tournamentId),
    typeIdx: index('overlay_configs_type_idx').on(table.overlayType),
    categoryIdx: index('overlay_configs_category_idx').on(table.category),
    templateIdx: index('overlay_configs_template_idx').on(table.isTemplate),
    opacityRange: check(
      'overlay_configs_opacity_range',
      sql`${table.opacity} BETWEEN 0 AND 100`,
    ),
  }),
);

export const overlayScenes = auction.table('overlay_scenes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').default(''),
  overlayIds: text('overlay_ids').array().default(sql`'{}'::text[]`),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const overlayHistory = auction.table(
  'overlay_history',
  {
    id: text('id').primaryKey(),
    overlayConfigId: text('overlay_config_id')
      .notNull()
      .references(() => overlayConfigs.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    changes: jsonb('changes').notNull(),
    changedBy: text('changed_by').notNull(),
    changedAt: timestamp('changed_at', { withTimezone: true }).defaultNow().notNull(),
    comment: text('comment'),
  },
  (table) => ({
    configVersionIdx: index('overlay_history_config_version_idx').on(
      table.overlayConfigId,
      table.version,
    ),
  }),
);

export const overlayAnalytics = auction.table('overlay_analytics', {
  overlayConfigId: text('overlay_config_id')
    .primaryKey()
    .references(() => overlayConfigs.id, { onDelete: 'cascade' }),
  displayCount: integer('display_count').notNull().default(0),
  totalDisplayDuration: integer('total_display_duration').notNull().default(0),
  averageDisplayDuration: real('average_display_duration').notNull().default(0),
  lastDisplayedAt: timestamp('last_displayed_at', { withTimezone: true }),
  errorCount: integer('error_count').notNull().default(0),
  loadTime: real('load_time').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const overlayLibrary = auction.table(
  'overlay_library',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    route: text('route').notNull(),
    tags: text('tags').array().default(sql`'{}'::text[]`),
    category: text('category').notNull(),
    defaultParams: jsonb('default_params').default(sql`'{}'::jsonb`),
    parameterSchema: jsonb('parameter_schema').default(sql`'{}'::jsonb`),
    imageUrl: text('image_url'),
    width: integer('width').notNull(),
    height: integer('height').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdBy: text('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    categoryIdx: index('overlay_library_category_idx').on(table.category),
    activeIdx: index('overlay_library_active_idx').on(table.isActive),
  }),
);

export const overlaySessions = auction.table(
  'overlay_sessions',
  {
    // The session token (UUID v4) is the primary key, as in Mongo.
    id: text('id').primaryKey(),
    tournamentId: text('tournament_id')
      .notNull()
      .references(() => tournaments.id, { onDelete: 'cascade' }),
    label: text('label').notNull(),
    createdBy: text('created_by').notNull(),
    overlayType: overlaySessionTypeEnum('overlay_type').notNull().default('fullscreen'),
    // Locked at creation; a different theme requires a new session.
    theme: text('theme').notNull().default('standard'),
    // Mutable without re-purchasing.
    palette: text('palette').notNull().default('default'),
    paymentStatus: overlayPaymentStatusEnum('payment_status').notNull().default('free'),
    // References public.wallet_transactions.id, which the shared Scoreboard
    // schema owns. Left as a plain integer to avoid a cross-schema FK during
    // migration; integrity is enforced by the wallet code path.
    walletTransactionId: integer('wallet_transaction_id'),
    refundTransactionId: integer('refund_transaction_id'),
    priceCharged: integer('price_charged').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (table) => ({
    tournamentActiveIdx: index('overlay_sessions_tournament_active_idx').on(
      table.tournamentId,
      table.isActive,
    ),
    tournamentTypeActiveIdx: index('overlay_sessions_tournament_type_active_idx').on(
      table.tournamentId,
      table.overlayType,
      table.isActive,
    ),
    nonNegativePrice: check(
      'overlay_sessions_price_non_negative',
      sql`${table.priceCharged} >= 0`,
    ),
  }),
);

/* ── Invoicing ──────────────────────────────────────────────────────────── */

export const customers = auction.table(
  'customers',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: text('phone'),
    // Flat address block, always read together.
    address: jsonb('address'),
    companyName: text('company_name'),
    taxId: text('tax_id'),
    createdBy: text('created_by').notNull(),
    // Denormalized rollups, as in Mongo. Recomputed by the invoicing code.
    totalInvoices: integer('total_invoices').notNull().default(0),
    totalPaid: integer('total_paid').notNull().default(0),
    totalOutstanding: integer('total_outstanding').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    createdByCreatedIdx: index('customers_created_by_created_idx').on(
      table.createdBy,
      table.createdAt,
    ),
    emailIdx: index('customers_email_idx').on(table.email),
    nameIdx: index('customers_name_idx').on(table.name),
  }),
);

export const invoices = auction.table(
  'invoices',
  {
    id: text('id').primaryKey(),
    invoiceNumber: text('invoice_number').notNull(),
    customerId: text('customer_id')
      .notNull()
      // Financial records must not vanish when a customer is removed.
      .references(() => customers.id, { onDelete: 'restrict' }),
    createdBy: text('created_by').notNull(),

    issueDate: timestamp('issue_date', { withTimezone: true }).notNull(),
    dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
    status: invoiceStatusEnum('status').notNull().default('draft'),

    subtotal: integer('subtotal').notNull(),
    tax: integer('tax').notNull().default(0),
    taxRate: real('tax_rate').notNull().default(0),
    discount: integer('discount').notNull().default(0),
    total: integer('total').notNull(),

    amountPaid: integer('amount_paid').notNull().default(0),
    balance: integer('balance').notNull(),

    notes: text('notes'),
    terms: text('terms'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    numberIdx: uniqueIndex('invoices_number_idx').on(table.invoiceNumber),
    createdByCreatedIdx: index('invoices_created_by_created_idx').on(
      table.createdBy,
      table.createdAt,
    ),
    customerCreatedIdx: index('invoices_customer_created_idx').on(
      table.customerId,
      table.createdAt,
    ),
    statusDueIdx: index('invoices_status_due_idx').on(table.status, table.dueDate),
    createdByStatusIdx: index('invoices_created_by_status_idx').on(
      table.createdBy,
      table.status,
    ),
    nonNegativeAmounts: check(
      'invoices_amounts_non_negative',
      sql`${table.subtotal} >= 0 AND ${table.tax} >= 0 AND ${table.discount} >= 0 AND ${table.total} >= 0 AND ${table.amountPaid} >= 0 AND ${table.balance} >= 0`,
    ),
    taxRateRange: check('invoices_tax_rate_range', sql`${table.taxRate} BETWEEN 0 AND 100`),
  }),
);

/** Line items as rows, not jsonb: needed for reporting and tax breakdowns. */
export const invoiceLineItems = auction.table(
  'invoice_line_items',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    invoiceId: text('invoice_id')
      .notNull()
      .references(() => invoices.id, { onDelete: 'cascade' }),
    lineNumber: integer('line_number').notNull(),
    description: text('description').notNull(),
    quantity: real('quantity').notNull(),
    unitPrice: integer('unit_price').notNull(),
    total: integer('total').notNull(),
  },
  (table) => ({
    invoiceLineIdx: uniqueIndex('invoice_line_items_invoice_line_idx').on(
      table.invoiceId,
      table.lineNumber,
    ),
    nonNegative: check(
      'invoice_line_items_non_negative',
      sql`${table.quantity} >= 0 AND ${table.unitPrice} >= 0 AND ${table.total} >= 0`,
    ),
  }),
);

export const quotations = auction.table(
  'quotations',
  {
    id: text('id').primaryKey(),
    quotationNumber: text('quotation_number').notNull(),
    customerId: text('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'restrict' }),
    createdBy: text('created_by').notNull(),

    issueDate: timestamp('issue_date', { withTimezone: true }).notNull(),
    validUntil: timestamp('valid_until', { withTimezone: true }).notNull(),
    status: quotationStatusEnum('status').notNull().default('draft'),

    subtotal: integer('subtotal').notNull(),
    tax: integer('tax').notNull().default(0),
    taxRate: real('tax_rate').notNull().default(0),
    discount: integer('discount').notNull().default(0),
    total: integer('total').notNull(),

    notes: text('notes'),
    terms: text('terms'),

    convertedToInvoiceId: text('converted_to_invoice_id').references(() => invoices.id, {
      onDelete: 'set null',
    }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    numberIdx: uniqueIndex('quotations_number_idx').on(table.quotationNumber),
    createdByCreatedIdx: index('quotations_created_by_created_idx').on(
      table.createdBy,
      table.createdAt,
    ),
    customerCreatedIdx: index('quotations_customer_created_idx').on(
      table.customerId,
      table.createdAt,
    ),
    statusValidIdx: index('quotations_status_valid_idx').on(table.status, table.validUntil),
    createdByStatusIdx: index('quotations_created_by_status_idx').on(
      table.createdBy,
      table.status,
    ),
    nonNegativeAmounts: check(
      'quotations_amounts_non_negative',
      sql`${table.subtotal} >= 0 AND ${table.tax} >= 0 AND ${table.discount} >= 0 AND ${table.total} >= 0`,
    ),
    taxRateRange: check('quotations_tax_rate_range', sql`${table.taxRate} BETWEEN 0 AND 100`),
  }),
);

export const quotationLineItems = auction.table(
  'quotation_line_items',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    quotationId: text('quotation_id')
      .notNull()
      .references(() => quotations.id, { onDelete: 'cascade' }),
    lineNumber: integer('line_number').notNull(),
    description: text('description').notNull(),
    quantity: real('quantity').notNull(),
    unitPrice: integer('unit_price').notNull(),
    total: integer('total').notNull(),
  },
  (table) => ({
    quotationLineIdx: uniqueIndex('quotation_line_items_quotation_line_idx').on(
      table.quotationId,
      table.lineNumber,
    ),
    nonNegative: check(
      'quotation_line_items_non_negative',
      sql`${table.quantity} >= 0 AND ${table.unitPrice} >= 0 AND ${table.total} >= 0`,
    ),
  }),
);

/* ── Inferred types ─────────────────────────────────────────────────────── */

export type AuctionTournament = typeof tournaments.$inferSelect;
export type NewAuctionTournament = typeof tournaments.$inferInsert;
export type AuctionTeam = typeof teams.$inferSelect;
export type NewAuctionTeam = typeof teams.$inferInsert;
export type AuctionPlayer = typeof players.$inferSelect;
export type NewAuctionPlayer = typeof players.$inferInsert;
export type AuctionStateRow = typeof auctionState.$inferSelect;
export type NewAuctionStateRow = typeof auctionState.$inferInsert;
export type AuctionBidHistory = typeof bidHistory.$inferSelect;
export type AuctionCustomer = typeof customers.$inferSelect;
export type AuctionInvoice = typeof invoices.$inferSelect;
export type AuctionQuotation = typeof quotations.$inferSelect;
export type AuctionOverlayConfig = typeof overlayConfigs.$inferSelect;
export type AuctionOverlaySession = typeof overlaySessions.$inferSelect;
