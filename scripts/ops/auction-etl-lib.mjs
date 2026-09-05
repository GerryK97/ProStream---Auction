import { createHash } from 'node:crypto';

export const SOURCE_COLLECTIONS = {
  tournaments: 'tournaments',
  teams: 'teams',
  players: 'players',
  auctionStates: 'auctionstates',
  customers: 'customers',
  invoices: 'invoices',
  quotations: 'quotations',
  overlayConfigs: 'overlayconfigs',
  overlayScenes: 'overlayscenes',
  overlayHistory: 'overlayhistories',
  overlayAnalytics: 'overlayanalytics',
  overlayLibrary: 'overlaylibraries',
  overlaySessions: 'overlaysessions',
};

export const TARGET_TABLES = [
  'tournaments', 'player_classes', 'bid_increments', 'direct_quick_bids',
  'player_card_templates', 'teams', 'team_officials', 'players',
  'auction_state', 'bid_history', 'completed_classes', 'overlay_configs',
  'overlay_scenes', 'overlay_history', 'overlay_analytics', 'overlay_library',
  'overlay_sessions', 'customers', 'invoices', 'invoice_line_items',
  'quotations', 'quotation_line_items',
];

const TOURNAMENT_STATUSES = new Set(['Draft', 'Completed', 'Setup', 'Pending', 'Live', 'Paused', 'Stopped', 'Archived']);
const AUCTION_STATUSES = new Set(['Pending', 'Bidding', 'Sold']);
const OFFICIAL_ROLES = new Set(['Owner', 'Manager', 'Captain']);
const INVOICE_STATUSES = new Set(['draft', 'sent', 'paid', 'overdue', 'cancelled']);
const QUOTATION_STATUSES = new Set(['draft', 'sent', 'accepted', 'rejected', 'expired']);
const PAYMENT_STATUSES = new Set(['free', 'paid', 'refunded', 'payment_failed']);
const SESSION_TYPES = new Set(['custom', 'fullscreen', 'fullscreen2', 'team_owners']);

function fail(path, message) {
  throw new Error(`${path}: ${message}`);
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date);
}

function text(value, path, { required = false, maxLength } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) fail(path, 'is required');
    return null;
  }
  const result = String(value);
  if (maxLength && result.length > maxLength) fail(path, `must be at most ${maxLength} characters`);
  return result;
}

function integer(value, path, { required = false, defaultValue = null } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required && defaultValue === null) fail(path, 'is required');
    return defaultValue;
  }
  const result = Number(value);
  if (!Number.isSafeInteger(result)) fail(path, 'must be a safe integer');
  return result;
}

function number(value, path, { required = false, defaultValue = null } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required && defaultValue === null) fail(path, 'is required');
    return defaultValue;
  }
  const result = Number(value);
  if (!Number.isFinite(result)) fail(path, 'must be a finite number');
  return result;
}

function bool(value, path, defaultValue = false) {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value !== 'boolean') fail(path, 'must be a boolean');
  return value;
}

function date(value, path, { required = false } = {}) {
  if (value === undefined || value === null) {
    if (required) fail(path, 'is required');
    return null;
  }
  const result = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(result.getTime())) fail(path, 'must be a valid date');
  return result;
}

function enumValue(value, allowed, path, fallback) {
  const result = value === undefined || value === null ? fallback : value;
  if (!allowed.has(result)) fail(path, `must be one of: ${[...allowed].join(', ')}`);
  return result;
}

function textArray(value, path) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) fail(path, 'must be an array');
  return value.map((item, index) => text(item, `${path}[${index}]`, { required: true }));
}

/** Converts BSON Maps and objects to plain JSON-safe values without dropping keys. */
export function jsonValue(value, path, { required = false, fallback = null } = {}) {
  if (value === undefined || value === null) {
    if (required) fail(path, 'is required');
    return fallback;
  }
  if (value instanceof Date) return value.toISOString();
  // `required` applies to the top-level blob. Nested values may legitimately
  // be null, for example overlayControlSettings.teamWiseTeamId.
  if (Array.isArray(value)) return value.map((item, index) => jsonValue(item, `${path}[${index}]`));
  if (value instanceof Map) return Object.fromEntries([...value].map(([key, item]) => [key, jsonValue(item, `${path}.${key}`)]));
  if (isRecord(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, jsonValue(item, `${path}.${key}`)]));
  }
  if (typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  fail(path, 'must be JSON serializable');
}

function docId(doc, path) {
  return text(doc._id, `${path}._id`, { required: true });
}

function timestamps(doc, path) {
  return {
    created_at: date(doc.createdAt, `${path}.createdAt`, { required: true }),
    updated_at: date(doc.updatedAt, `${path}.updatedAt`, { required: true }),
  };
}

function addRow(plan, table, row) {
  plan.tables[table].push(row);
}

function initPlan() {
  return {
    tables: Object.fromEntries(TARGET_TABLES.map((table) => [table, []])),
    sourceCounts: Object.fromEntries(Object.keys(SOURCE_COLLECTIONS).map((key) => [key, 0])),
    normalizations: [],
  };
}

function mapTournaments(plan, docs) {
  for (const [index, doc] of docs.entries()) {
    let path = `tournaments[${index}]`;
    const id = docId(doc, path);
    path = `tournaments[${index}, id=${id}]`;
    addRow(plan, 'tournaments', {
      id,
      name: text(doc.name, `${path}.name`, { required: true }),
      year: integer(doc.year, `${path}.year`, { required: true }),
      budget_per_team: integer(doc.budgetPerTeam, `${path}.budgetPerTeam`, { required: true }),
      squad_size: integer(doc.squadSize, `${path}.squadSize`, { required: true }),
      base_price_per_player: integer(doc.basePricePerPlayer, `${path}.basePricePerPlayer`, { required: true }),
      logo_url: text(doc.logoURL, `${path}.logoURL`),
      wheel_center_image_url: text(doc.wheelCenterImageURL, `${path}.wheelCenterImageURL`),
      created_by: text(doc.createdBy, `${path}.createdBy`),
      sport: text(doc.sport, `${path}.sport`) ?? 'cricket',
      status: enumValue(doc.status, TOURNAMENT_STATUSES, `${path}.status`, 'Draft'),
      use_player_classes: bool(doc.usePlayerClasses, `${path}.usePlayerClasses`),
      base_price_strategy: enumValue(doc.basePriceStrategy, new Set(['tournament-level', 'player-class-based']), `${path}.basePriceStrategy`, 'tournament-level'),
      overlay_theme: text(doc.overlayTheme, `${path}.overlayTheme`) ?? 'standard',
      overlay_palette: text(doc.overlayPalette, `${path}.overlayPalette`) ?? 'default',
      bidding_mode: enumValue(doc.biddingMode, new Set(['direct', 'team']), `${path}.biddingMode`, 'direct'),
      direct_bid_slab_enabled: bool(doc.directBidSlabEnabled, `${path}.directBidSlabEnabled`),
      direct_quick_bids_enabled: bool(doc.directQuickBidsEnabled, `${path}.directQuickBidsEnabled`),
      auction_date: text(doc.auctionDate, `${path}.auctionDate`),
      completed_at: date(doc.completedAt, `${path}.completedAt`),
      player_profile_fields: jsonValue(doc.playerProfileFields, `${path}.playerProfileFields`),
      team_officials_config: jsonValue(doc.teamOfficialsConfig, `${path}.teamOfficialsConfig`),
      overlay_control_settings: jsonValue(doc.overlayControlSettings, `${path}.overlayControlSettings`),
      ...timestamps(doc, path),
    });

    const playerClasses = doc.playerClasses ?? [];
    if (!Array.isArray(playerClasses)) fail(`${path}.playerClasses`, 'must be an array');
    for (const [childIndex, child] of playerClasses.entries()) {
      const childPath = `${path}.playerClasses[${childIndex}]`;
      addRow(plan, 'player_classes', {
        tournament_id: id,
        code: text(child.code, `${childPath}.code`, { required: true, maxLength: 10 }),
        name: text(child.name, `${childPath}.name`, { required: true }),
        base_price: integer(child.basePrice, `${childPath}.basePrice`),
        color: text(child.color, `${childPath}.color`, { required: true }),
        icon: text(child.icon, `${childPath}.icon`),
        sort_order: integer(child.order, `${childPath}.order`, { required: true }),
      });
    }

    const increments = doc.bidIncrements ?? [];
    if (!Array.isArray(increments)) fail(`${path}.bidIncrements`, 'must be an array');
    const seenIncrementLimits = new Set();
    let meaningfulIncrementCount = 0;
    for (const [childIndex, child] of increments.entries()) {
      const childPath = `${path}.bidIncrements[${childIndex}]`;
      const increment = integer(child.increment, `${childPath}.increment`, { required: true });
      const upTo = integer(child.upTo, `${childPath}.upTo`, { required: true });
      // The legacy bracket editor persisted new, unfilled rows as {0, 0}.
      // They are inert: bids are never below zero, so runtime skips them before
      // choosing the final meaningful bracket. Preserve that semantics without
      // importing invalid duplicate PK/check-constraint rows.
      if (upTo === 0 && increment === 0) {
        plan.normalizations.push(`${path}.bidIncrements[${childIndex}] ignored inert legacy { upTo: 0, increment: 0 } placeholder`);
        continue;
      }
      if (increment <= 0) fail(`${childPath}.increment`, 'must be positive');
      if (seenIncrementLimits.has(upTo)) fail(`${childPath}.upTo`, `duplicates a prior bid increment limit (${upTo})`);
      seenIncrementLimits.add(upTo);
      meaningfulIncrementCount += 1;
      addRow(plan, 'bid_increments', {
        tournament_id: id,
        up_to: upTo,
        increment,
      });
    }
    if ((doc.biddingMode === 'team' || (doc.biddingMode === 'direct' && doc.directBidSlabEnabled)) && meaningfulIncrementCount === 0) {
      fail(`${path}.bidIncrements`, 'has no meaningful positive increment rows while slab bidding is enabled');
    }

    const quickBids = doc.directQuickBids ?? [];
    if (!Array.isArray(quickBids)) fail(`${path}.directQuickBids`, 'must be an array');
    for (const [childIndex, child] of quickBids.entries()) {
      const amount = integer(child.amount, `${path}.directQuickBids[${childIndex}].amount`, { required: true });
      addRow(plan, 'direct_quick_bids', { tournament_id: id, amount });
    }

    const templates = doc.playerCardTemplates ?? [];
    if (!Array.isArray(templates)) fail(`${path}.playerCardTemplates`, 'must be an array');
    for (const [childIndex, child] of templates.entries()) {
      const childPath = `${path}.playerCardTemplates[${childIndex}]`;
      addRow(plan, 'player_card_templates', {
        id: text(child.id, `${childPath}.id`, { required: true }),
        tournament_id: id,
        name: text(child.name, `${childPath}.name`, { required: true }),
        png_url: text(child.pngUrl, `${childPath}.pngUrl`, { required: true }),
        layout_id: text(child.layoutId, `${childPath}.layoutId`),
      });
    }
  }
}

function mapTeams(plan, docs) {
  for (const [index, doc] of docs.entries()) {
    let path = `teams[${index}]`;
    const id = docId(doc, path);
    path = `teams[${index}, id=${id}]`;
    const balance = integer(doc.currentBalance, `${path}.currentBalance`);
    if (balance !== null && balance < 0) fail(`${path}.currentBalance`, 'must not be negative');
    addRow(plan, 'teams', {
      id,
      tournament_id: text(doc.tournamentId, `${path}.tournamentId`, { required: true }),
      created_by: text(doc.createdBy, `${path}.createdBy`),
      name: text(doc.name, `${path}.name`, { required: true }),
      short_code: text(doc.shortCode, `${path}.shortCode`, { required: true }),
      owner_name: text(doc.ownerName, `${path}.ownerName`),
      logo_url: text(doc.logoURL, `${path}.logoURL`),
      initial_budget: integer(doc.initialBudget, `${path}.initialBudget`),
      current_balance: balance,
      ...timestamps(doc, path),
    });
    const officials = doc.officials ?? [];
    if (!Array.isArray(officials)) fail(`${path}.officials`, 'must be an array');
    for (const [childIndex, official] of officials.entries()) {
      const childPath = `${path}.officials[${childIndex}]`;
      addRow(plan, 'team_officials', {
        team_id: id,
        role: enumValue(official.role, OFFICIAL_ROLES, `${childPath}.role`),
        name: text(official.name, `${childPath}.name`, { required: true }),
        photo_url: text(official.photoURL, `${childPath}.photoURL`),
      });
    }
  }
}

function mapPlayers(plan, docs) {
  for (const [index, doc] of docs.entries()) {
    const path = `players[${index}]`;
    const id = docId(doc, path);
    const isSold = bool(doc.isSold, `${path}.isSold`);
    const isUnsold = bool(doc.isUnsold, `${path}.isUnsold`);
    const finalPrice = integer(doc.finalPrice, `${path}.finalPrice`);
    const winningTeamId = text(doc.winningTeamId, `${path}.winningTeamId`);
    if (isSold && (finalPrice === null || winningTeamId === null)) fail(path, 'sold player requires finalPrice and winningTeamId');
    if (isSold && isUnsold) fail(path, 'player cannot be both sold and unsold');
    if (finalPrice !== null && finalPrice < 0) fail(`${path}.finalPrice`, 'must not be negative');
    addRow(plan, 'players', {
      id,
      player_no: text(doc.playerNo, `${path}.playerNo`, { maxLength: 10 }),
      tournament_id: text(doc.tournamentId, `${path}.tournamentId`, { required: true }),
      created_by: text(doc.createdBy, `${path}.createdBy`),
      name: text(doc.name, `${path}.name`, { required: true }),
      position: text(doc.position, `${path}.position`),
      current_club: text(doc.currentClub, `${path}.currentClub`),
      photo_url: text(doc.photoURL, `${path}.photoURL`),
      secondary_image_url: text(doc.secondaryImageURL, `${path}.secondaryImageURL`),
      player_class: text(doc.playerClass, `${path}.playerClass`, { maxLength: 10 }),
      age: integer(doc.age, `${path}.age`),
      is_sold: isSold,
      is_unsold: isUnsold,
      final_price: finalPrice,
      winning_team_id: winningTeamId,
      is_iconic: bool(doc.isIconic, `${path}.isIconic`),
      batting_style: text(doc.battingStyle, `${path}.battingStyle`),
      bowling_style: text(doc.bowlingStyle, `${path}.bowlingStyle`),
      stats: jsonValue(doc.stats, `${path}.stats`),
      ...timestamps(doc, path),
    });
  }
}

function mapAuctionStates(plan, docs) {
  for (const [index, doc] of docs.entries()) {
    const path = `auctionStates[${index}]`;
    const tournamentId = text(doc.tournamentId, `${path}.tournamentId`, { required: true });
    const currentBid = integer(doc.currentBid, `${path}.currentBid`, { defaultValue: 0 });
    if (currentBid < 0) fail(`${path}.currentBid`, 'must not be negative');
    addRow(plan, 'auction_state', {
      tournament_id: tournamentId,
      revision: integer(doc.revision, `${path}.revision`, { defaultValue: 0 }),
      current_player_id: text(doc.currentPlayerId, `${path}.currentPlayerId`),
      current_bid: currentBid,
      winning_team_id: text(doc.winningTeamId, `${path}.winningTeamId`),
      current_auction_status: enumValue(doc.currentAuctionStatus, AUCTION_STATUSES, `${path}.currentAuctionStatus`, 'Pending'),
      current_auction_class: text(doc.currentAuctionClass, `${path}.currentAuctionClass`, { maxLength: 10 }),
      ...timestamps(doc, path),
    });
    const history = doc.history ?? [];
    if (!Array.isArray(history)) fail(`${path}.history`, 'must be an array');
    for (const [childIndex, bid] of history.entries()) {
      const childPath = `${path}.history[${childIndex}]`;
      const amount = integer(bid.amount, `${childPath}.amount`, { required: true });
      if (amount < 0) fail(`${childPath}.amount`, 'must not be negative');
      addRow(plan, 'bid_history', {
        tournament_id: tournamentId,
        // The Mongo Bid schema carries no player ID. Do not guess one from currentPlayerId.
        player_id: null,
        team_id: text(bid.teamId, `${childPath}.teamId`),
        amount,
        bid_at_epoch_ms: integer(bid.timestamp, `${childPath}.timestamp`, { required: true }),
        created_at: date(bid.timestamp, `${childPath}.timestamp`, { required: true }),
      });
    }
    const completed = doc.completedClasses ?? [];
    if (!Array.isArray(completed)) fail(`${path}.completedClasses`, 'must be an array');
    for (const [childIndex, code] of completed.entries()) {
      addRow(plan, 'completed_classes', {
        tournament_id: tournamentId,
        class_code: text(code, `${path}.completedClasses[${childIndex}]`, { required: true, maxLength: 10 }),
        completed_at: date(doc.updatedAt, `${path}.updatedAt`, { required: true }),
      });
    }
  }
}

function mapCustomers(plan, docs) {
  for (const [index, doc] of docs.entries()) {
    const path = `customers[${index}]`;
    addRow(plan, 'customers', {
      id: docId(doc, path),
      name: text(doc.name, `${path}.name`, { required: true }),
      email: text(doc.email, `${path}.email`, { required: true }),
      phone: text(doc.phone, `${path}.phone`),
      address: jsonValue(doc.address, `${path}.address`),
      company_name: text(doc.companyName, `${path}.companyName`),
      tax_id: text(doc.taxId, `${path}.taxId`),
      created_by: text(doc.createdBy, `${path}.createdBy`, { required: true }),
      total_invoices: integer(doc.totalInvoices, `${path}.totalInvoices`, { defaultValue: 0 }),
      total_paid: integer(doc.totalPaid, `${path}.totalPaid`, { defaultValue: 0 }),
      total_outstanding: integer(doc.totalOutstanding, `${path}.totalOutstanding`, { defaultValue: 0 }),
      ...timestamps(doc, path),
    });
  }
}

function mapFinancialDocuments(plan, docs, kind) {
  const isInvoice = kind === 'invoice';
  const table = isInvoice ? 'invoices' : 'quotations';
  const lineTable = isInvoice ? 'invoice_line_items' : 'quotation_line_items';
  const pathRoot = isInvoice ? 'invoices' : 'quotations';
  const statuses = isInvoice ? INVOICE_STATUSES : QUOTATION_STATUSES;
  for (const [index, doc] of docs.entries()) {
    const path = `${pathRoot}[${index}]`;
    const id = docId(doc, path);
    const documentNumber = text(doc[isInvoice ? 'invoiceNumber' : 'quotationNumber'], `${path}.${isInvoice ? 'invoiceNumber' : 'quotationNumber'}`, { required: true });
    const common = {
      id,
      [isInvoice ? 'invoice_number' : 'quotation_number']: documentNumber,
      customer_id: text(doc.customerId, `${path}.customerId`, { required: true }),
      created_by: text(doc.createdBy, `${path}.createdBy`, { required: true }),
      issue_date: date(doc.issueDate, `${path}.issueDate`, { required: true }),
      [isInvoice ? 'due_date' : 'valid_until']: date(doc[isInvoice ? 'dueDate' : 'validUntil'], `${path}.${isInvoice ? 'dueDate' : 'validUntil'}`, { required: true }),
      status: enumValue(doc.status, statuses, `${path}.status`, 'draft'),
      subtotal: integer(doc.subtotal, `${path}.subtotal`, { required: true }),
      tax: integer(doc.tax, `${path}.tax`, { defaultValue: 0 }),
      tax_rate: number(doc.taxRate, `${path}.taxRate`, { defaultValue: 0 }),
      discount: integer(doc.discount, `${path}.discount`, { defaultValue: 0 }),
      total: integer(doc.total, `${path}.total`, { required: true }),
      notes: text(doc.notes, `${path}.notes`),
      terms: text(doc.terms, `${path}.terms`),
      ...timestamps(doc, path),
    };
    if (isInvoice) {
      common.amount_paid = integer(doc.amountPaid, `${path}.amountPaid`, { defaultValue: 0 });
      common.balance = integer(doc.balance, `${path}.balance`, { required: true });
    } else {
      common.converted_to_invoice_id = text(doc.convertedToInvoiceId, `${path}.convertedToInvoiceId`);
    }
    for (const [field, value] of Object.entries(common)) {
      if (['subtotal', 'tax', 'discount', 'total', 'amount_paid', 'balance'].includes(field) && value < 0) fail(`${path}.${field}`, 'must not be negative');
    }
    if (common.tax_rate < 0 || common.tax_rate > 100) fail(`${path}.taxRate`, 'must be between 0 and 100');
    addRow(plan, table, common);
    const items = doc.items ?? [];
    if (!Array.isArray(items) || items.length === 0) fail(`${path}.items`, 'must be a non-empty array');
    for (const [itemIndex, item] of items.entries()) {
      const itemPath = `${path}.items[${itemIndex}]`;
      const row = {
        [isInvoice ? 'invoice_id' : 'quotation_id']: id,
        line_number: itemIndex + 1,
        description: text(item.description, `${itemPath}.description`, { required: true }),
        quantity: number(item.quantity, `${itemPath}.quantity`, { required: true }),
        unit_price: integer(item.unitPrice, `${itemPath}.unitPrice`, { required: true }),
        total: integer(item.total, `${itemPath}.total`, { required: true }),
      };
      for (const [field, value] of Object.entries(row)) {
        if (['quantity', 'unit_price', 'total'].includes(field) && value < 0) fail(`${itemPath}.${field}`, 'must not be negative');
      }
      addRow(plan, lineTable, row);
    }
  }
}

function mapOverlays(plan, source) {
  for (const [index, doc] of (source.overlayConfigs ?? []).entries()) {
    const path = `overlayConfigs[${index}]`;
    addRow(plan, 'overlay_configs', {
      id: docId(doc, path), name: text(doc.name, `${path}.name`, { required: true }),
      description: text(doc.description, `${path}.description`) ?? '', overlay_type: text(doc.overlayType, `${path}.overlayType`, { required: true }),
      category: text(doc.category, `${path}.category`, { required: true }), image_url: text(doc.imageURL, `${path}.imageURL`),
      is_active: bool(doc.isActive, `${path}.isActive`, true), is_template: bool(doc.isTemplate, `${path}.isTemplate`),
      position: jsonValue(doc.position, `${path}.position`, { required: true }), size: jsonValue(doc.size, `${path}.size`, { required: true }),
      z_index: integer(doc.zIndex, `${path}.zIndex`, { defaultValue: 1000 }), opacity: integer(doc.opacity, `${path}.opacity`, { defaultValue: 100 }),
      parameters: jsonValue(doc.parameters, `${path}.parameters`, { fallback: {} }), animations: jsonValue(doc.animations, `${path}.animations`),
      display_rules: jsonValue(doc.displayRules, `${path}.displayRules`, { fallback: [] }), tournament_id: text(doc.tournamentId, `${path}.tournamentId`),
      scene_ids: textArray(doc.sceneIds, `${path}.sceneIds`), created_by: text(doc.createdBy, `${path}.createdBy`, { required: true }),
      version: integer(doc.version, `${path}.version`, { defaultValue: 1 }), parent_config_id: text(doc.parentConfigId, `${path}.parentConfigId`),
      view_count: integer(doc.viewCount, `${path}.viewCount`, { defaultValue: 0 }), last_used_at: date(doc.lastUsedAt, `${path}.lastUsedAt`),
      is_locked: bool(doc.isLocked, `${path}.isLocked`), allowed_roles: textArray(doc.allowedRoles, `${path}.allowedRoles`), ...timestamps(doc, path),
    });
  }
  for (const [index, doc] of (source.overlayScenes ?? []).entries()) {
    const path = `overlayScenes[${index}]`;
    addRow(plan, 'overlay_scenes', { id: docId(doc, path), name: text(doc.name, `${path}.name`, { required: true }), description: text(doc.description, `${path}.description`) ?? '', overlay_ids: textArray(doc.overlayIds, `${path}.overlayIds`), ...timestamps(doc, path) });
  }
  for (const [index, doc] of (source.overlayHistory ?? []).entries()) {
    const path = `overlayHistory[${index}]`;
    addRow(plan, 'overlay_history', { id: docId(doc, path), overlay_config_id: text(doc.overlayConfigId, `${path}.overlayConfigId`, { required: true }), version: integer(doc.version, `${path}.version`, { required: true }), changes: jsonValue(doc.changes, `${path}.changes`, { required: true }), changed_by: text(doc.changedBy, `${path}.changedBy`, { required: true }), changed_at: date(doc.changedAt, `${path}.changedAt`, { required: true }), comment: text(doc.comment, `${path}.comment`) });
  }
  for (const [index, doc] of (source.overlayAnalytics ?? []).entries()) {
    const path = `overlayAnalytics[${index}]`;
    addRow(plan, 'overlay_analytics', { overlay_config_id: text(doc.overlayConfigId, `${path}.overlayConfigId`, { required: true }), display_count: integer(doc.displayCount, `${path}.displayCount`, { defaultValue: 0 }), total_display_duration: integer(doc.totalDisplayDuration, `${path}.totalDisplayDuration`, { defaultValue: 0 }), average_display_duration: number(doc.averageDisplayDuration, `${path}.averageDisplayDuration`, { defaultValue: 0 }), last_displayed_at: date(doc.lastDisplayedAt, `${path}.lastDisplayedAt`), error_count: integer(doc.errorCount, `${path}.errorCount`, { defaultValue: 0 }), load_time: number(doc.loadTime, `${path}.loadTime`, { defaultValue: 0 }), ...timestamps(doc, path) });
  }
  for (const [index, doc] of (source.overlayLibrary ?? []).entries()) {
    const path = `overlayLibrary[${index}]`;
    const dimensions = doc.dimensions;
    if (!isRecord(dimensions)) fail(`${path}.dimensions`, 'is required');
    addRow(plan, 'overlay_library', { id: docId(doc, path), name: text(doc.name, `${path}.name`, { required: true }), description: text(doc.description, `${path}.description`, { required: true }), route: text(doc.route, `${path}.route`, { required: true }), tags: textArray(doc.tags, `${path}.tags`), category: text(doc.category, `${path}.category`, { required: true }), default_params: jsonValue(doc.defaultParams, `${path}.defaultParams`, { fallback: {} }), parameter_schema: jsonValue(doc.parameterSchema, `${path}.parameterSchema`, { fallback: {} }), image_url: text(doc.imageURL, `${path}.imageURL`), width: integer(dimensions.width, `${path}.dimensions.width`, { required: true }), height: integer(dimensions.height, `${path}.dimensions.height`, { required: true }), is_active: bool(doc.isActive, `${path}.isActive`, true), created_by: text(doc.createdBy, `${path}.createdBy`), ...timestamps(doc, path) });
  }
  for (const [index, doc] of (source.overlaySessions ?? []).entries()) {
    const path = `overlaySessions[${index}]`;
    const priceCharged = integer(doc.priceCharged, `${path}.priceCharged`, { defaultValue: 0 });
    if (priceCharged < 0) fail(`${path}.priceCharged`, 'must not be negative');
    addRow(plan, 'overlay_sessions', { id: docId(doc, path), tournament_id: text(doc.tournamentId, `${path}.tournamentId`, { required: true }), label: text(doc.label, `${path}.label`, { required: true }), created_by: text(doc.createdBy, `${path}.createdBy`, { required: true }), overlay_type: enumValue(doc.overlayType, SESSION_TYPES, `${path}.overlayType`, 'fullscreen'), theme: text(doc.theme, `${path}.theme`) ?? 'standard', palette: text(doc.palette, `${path}.palette`) ?? 'default', payment_status: enumValue(doc.paymentStatus, PAYMENT_STATUSES, `${path}.paymentStatus`, 'free'), wallet_transaction_id: integer(doc.walletTransactionId, `${path}.walletTransactionId`), refund_transaction_id: integer(doc.refundTransactionId, `${path}.refundTransactionId`), price_charged: priceCharged, is_active: bool(doc.isActive, `${path}.isActive`, true), created_at: date(doc.createdAt, `${path}.createdAt`, { required: true }), revoked_at: date(doc.revokedAt, `${path}.revokedAt`) });
  }
}

/**
 * Maps a complete Mongo export into explicit PostgreSQL rows. This is pure and
 * side-effect-free so `--dry-run` validates the exact data before any database
 * is opened for writing.
 */
export function buildImportPlan(source) {
  const plan = initPlan();
  for (const key of Object.keys(SOURCE_COLLECTIONS)) {
    const docs = source[key] ?? [];
    if (!Array.isArray(docs)) fail(key, 'must be an array of Mongo documents');
    plan.sourceCounts[key] = docs.length;
  }
  mapTournaments(plan, source.tournaments ?? []);
  mapTeams(plan, source.teams ?? []);
  mapPlayers(plan, source.players ?? []);
  mapAuctionStates(plan, source.auctionStates ?? []);
  mapCustomers(plan, source.customers ?? []);
  mapFinancialDocuments(plan, source.invoices ?? [], 'invoice');
  mapFinancialDocuments(plan, source.quotations ?? [], 'quotation');
  mapOverlays(plan, source);
  return plan;
}

export function tableCounts(plan) {
  return Object.fromEntries(TARGET_TABLES.map((table) => [table, plan.tables[table].length]));
}

export function planFingerprint(plan) {
  return createHash('sha256').update(JSON.stringify(plan.tables)).digest('hex');
}
