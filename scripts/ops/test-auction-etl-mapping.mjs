#!/usr/bin/env node
import assert from 'node:assert/strict';
import { buildImportPlan, tableCounts } from './auction-etl-lib.mjs';

const at = new Date('2026-01-02T03:04:05.678Z');
const source = {
  tournaments: [{
    _id: 't1', name: 'Winter Cup', year: 2026, budgetPerTeam: 10000, squadSize: 11,
    basePricePerPlayer: 100, status: 'Setup', createdAt: at, updatedAt: at,
    playerClasses: [{ code: 'A', name: 'A Class', basePrice: 200, color: '#fff', order: 1 }],
    bidIncrements: [{ upTo: 1000, increment: 100 }], directQuickBids: [{ amount: 500 }],
    playerCardTemplates: [{ id: 'card1', name: 'Card', pngUrl: 'https://example.test/card.png' }],
    playerProfileFields: { statFields: [{ key: 'runs', label: 'Runs' }] },
  }],
  teams: [{ _id: 'team1', tournamentId: 't1', name: 'Lions', shortCode: 'LIO', currentBalance: 9000, createdAt: at, updatedAt: at, officials: [{ role: 'Owner', name: 'Ada' }] }],
  players: [{ _id: 'player1', playerNo: '001', tournamentId: 't1', name: 'Sam', isSold: true, isUnsold: false, finalPrice: 1000, winningTeamId: 'team1', stats: new Map([['runs', 12]]), createdAt: at, updatedAt: at }],
  auctionStates: [{ tournamentId: 't1', currentPlayerId: 'player1', currentBid: 1000, winningTeamId: 'team1', currentAuctionStatus: 'Sold', history: [{ teamId: 'team1', amount: 1000, timestamp: at.getTime() }], completedClasses: ['A'], createdAt: at, updatedAt: at }],
  customers: [{ _id: 'customer1', name: 'Client', email: 'client@example.test', createdBy: 'user1', address: { city: 'Kandy' }, createdAt: at, updatedAt: at }],
  invoices: [{ _id: 'invoice1', invoiceNumber: 'INV-1', customerId: 'customer1', createdBy: 'user1', issueDate: at, dueDate: at, subtotal: 1000, total: 1000, balance: 1000, items: [{ description: 'Overlay', quantity: 1, unitPrice: 1000, total: 1000 }], createdAt: at, updatedAt: at }],
  quotations: [{ _id: 'quote1', quotationNumber: 'Q-1', customerId: 'customer1', createdBy: 'user1', issueDate: at, validUntil: at, subtotal: 1000, total: 1000, items: [{ description: 'Overlay', quantity: 1, unitPrice: 1000, total: 1000 }], createdAt: at, updatedAt: at }],
  overlayConfigs: [{ _id: 'config1', name: 'Ticker', overlayType: 'ticker', category: 'tickers', position: { x: 0, y: 0, unit: 'px' }, size: { width: 1920, height: 1080, unit: 'px' }, createdBy: 'user1', tournamentId: 't1', createdAt: at, updatedAt: at }],
  overlayScenes: [{ _id: 'scene1', name: 'Main', overlayIds: ['config1'], createdAt: at, updatedAt: at }],
  overlayHistory: [{ _id: 'history1', overlayConfigId: 'config1', version: 1, changes: { color: 'red' }, changedBy: 'user1', changedAt: at }],
  overlayAnalytics: [{ overlayConfigId: 'config1', createdAt: at, updatedAt: at }],
  overlayLibrary: [{ _id: 'library1', name: 'Ticker', description: 'Ticker', route: '/overlays/ticker', category: 'tickers', dimensions: { width: 1920, height: 1080 }, createdAt: at, updatedAt: at }],
  overlaySessions: [{ _id: 'session1', tournamentId: 't1', label: 'OBS', createdBy: 'user1', overlayType: 'fullscreen', paymentStatus: 'free', createdAt: at }],
};

const plan = buildImportPlan(source);
const counts = tableCounts(plan);
assert.equal(counts.tournaments, 1);
assert.equal(counts.player_classes, 1);
assert.equal(counts.team_officials, 1);
assert.equal(counts.bid_history, 1);
assert.equal(plan.tables.bid_history[0].bid_at_epoch_ms, at.getTime());
assert.equal(plan.tables.bid_history[0].player_id, null, 'history has no source player id and must not be guessed');
assert.deepEqual(plan.tables.players[0].stats, { runs: 12 });
assert.equal(counts.invoice_line_items, 1);
assert.equal(counts.quotation_line_items, 1);
assert.equal(counts.overlay_sessions, 1);
const orphanPlan = buildImportPlan({
  ...source,
  players: [{ ...source.players[0], tournamentId: 'deleted-tournament' }],
});
assert.equal(orphanPlan.tables.players.length, 0);
assert.equal(orphanPlan.tables.migration_legacy_records.length, 2, 'the dependent auction state is also quarantined');
assert.equal(orphanPlan.tables.migration_legacy_records[0].source_collection, 'players');
const legacyBracketPlan = buildImportPlan({
  ...source,
  tournaments: [{
    ...source.tournaments[0],
    biddingMode: 'team',
    bidIncrements: [{ upTo: 0, increment: 0 }, { upTo: 50000, increment: 5000 }],
  }],
});
assert.equal(legacyBracketPlan.tables.bid_increments.length, 1, 'inert legacy {0,0} bracket placeholders are not valid target rows');
assert.equal(legacyBracketPlan.normalizations.length, 1, 'every legacy placeholder must be reported');
const duplicateQuickBidPlan = buildImportPlan({
  ...source,
  tournaments: [{
    ...source.tournaments[0],
    directQuickBids: [{ amount: 500 }, { amount: 500 }, { amount: 1000 }],
  }],
});
assert.deepEqual(
  duplicateQuickBidPlan.tables.direct_quick_bids,
  [{ tournament_id: 't1', amount: 500 }, { tournament_id: 't1', amount: 1000 }],
  'duplicate quick-bid buttons are semantically redundant and must not violate the relational key',
);
assert.match(
  duplicateQuickBidPlan.normalizations[0],
  /ignored duplicate quick-bid amount 500/,
  'every dropped redundant button must be reported',
);
assert.throws(
  () => buildImportPlan({ ...source, players: [{ ...source.players[0], isUnsold: true }] }),
  /cannot be both sold and unsold/,
);
assert.throws(
  () => buildImportPlan({ ...source, auctionStates: [{ ...source.auctionStates[0], currentBid: -1 }] }),
  /must not be negative/,
);
console.log('Auction ETL mapping tests passed.');
