/**
 * Tests for the Auction → Scoreboard mapping layer.
 *
 * Run: npm run test:scoreboard-mapping
 *
 * Scope: the transfer moves only player name, photo, position and team.
 * The Auction's "position" becomes the Scoreboard's "role", which is a strict
 * pg enum - an unmapped value aborts the whole transfer, so every real Auction
 * position value is asserted here.
 */

import { strict as assert } from 'node:assert';
import {
  mapPlayerRole,
  deriveDisplayName,
  deriveShortCode,
  normalizeImageRef,
} from '../src/lib/transfer/scoreboardMapping';

// Authoritative Scoreboard enum members (schema.ts).
const VALID_ROLES = new Set(['batsman', 'bowler', 'allrounder', 'keeper']);

// Real Auction vocabularies.
const AUCTION_POSITIONS = [
  'Batsman', 'Bowler', 'All-rounder', 'Batting All-rounder',
  'Bowling All-rounder', 'Wicket-keeper', 'Wicket Keeper Batsman',
];

let passed = 0;
const check = (name: string, fn: () => void) => {
  try { fn(); passed++; console.log(`  ok  ${name}`); }
  catch (err) { console.error(`  FAIL ${name}`); throw err; }
};

console.log('\nPlayer role — every Auction cricket position produces a valid enum');
for (const pos of AUCTION_POSITIONS) {
  check(`role: ${pos}`, () => {
    const r = mapPlayerRole(pos);
    assert.ok(VALID_ROLES.has(r.value), `"${pos}" produced invalid role "${r.value}"`);
  });
}
check('role: specific mappings', () => {
  assert.equal(mapPlayerRole('Batsman').value, 'batsman');
  assert.equal(mapPlayerRole('Bowler').value, 'bowler');
  assert.equal(mapPlayerRole('All-rounder').value, 'allrounder');
  assert.equal(mapPlayerRole('Wicket-keeper').value, 'keeper');
  assert.equal(mapPlayerRole('Wicket Keeper Batsman').value, 'keeper');
  assert.equal(mapPlayerRole('Batting All-rounder').value, 'allrounder');
});
check('role: detail-losing maps are flagged inexact', () => {
  assert.equal(mapPlayerRole('Batting All-rounder').exact, false);
  assert.equal(mapPlayerRole('Wicket Keeper Batsman').exact, false);
  assert.ok(mapPlayerRole('Batting All-rounder').note);
});
check('role: clean maps are exact', () => {
  assert.equal(mapPlayerRole('Batsman').exact, true);
  assert.equal(mapPlayerRole('All-rounder').exact, true);
});
check('role: null/empty/garbage still valid', () => {
  for (const v of [null, undefined, '', '   ', 'Goalkeeper', '12345']) {
    const r = mapPlayerRole(v as string);
    assert.ok(VALID_ROLES.has(r.value));
    assert.equal(r.exact, false);
  }
});

console.log('\nDisplay name');
check('displayName: short names kept whole', () => {
  assert.equal(deriveDisplayName('Kusal Mendis'), 'Kusal Mendis');
});
check('displayName: long names abbreviated', () => {
  assert.equal(deriveDisplayName('Kumar Chokshanada Sangakkara'), 'K Sangakkara');
});
check('displayName: single word', () => {
  assert.equal(deriveDisplayName('Ronaldo'), 'Ronaldo');
});
check('displayName: whitespace collapsed, never empty', () => {
  assert.equal(deriveDisplayName('  Nuwan   Pradeep  '), 'Nuwan Pradeep');
  assert.equal(deriveDisplayName('   '), 'Unknown');
});
check('displayName: respects column length', () => {
  const long = deriveDisplayName('A'.repeat(120));
  assert.ok(long.length <= 40);
});

console.log('\nShort code — char(3), unique per tournament');
check('shortCode: 3-char preferred code used as-is', () => {
  const taken = new Set<string>();
  const r = deriveShortCode('CSK', 'Chennai Super Kings', taken);
  assert.equal(r.value, 'CSK');
  assert.equal(r.exact, true);
});
check('shortCode: 6-char auction code truncated and flagged', () => {
  const taken = new Set<string>();
  const r = deriveShortCode('KANDYX', 'Kandy Warriors', taken);
  assert.equal(r.value.length, 3);
  assert.equal(r.exact, false);
  assert.ok(r.note?.includes('truncated'));
});
check('shortCode: derived from team name when missing', () => {
  const taken = new Set<string>();
  const r = deriveShortCode(null, 'Colombo Kings United', taken);
  assert.equal(r.value, 'CKU');
});
check('shortCode: collisions resolved uniquely', () => {
  const taken = new Set<string>();
  const a = deriveShortCode('KAN', 'Kandy A', taken);
  const b = deriveShortCode('KAN', 'Kandy B', taken);
  const c = deriveShortCode('KAN', 'Kandy C', taken);
  assert.equal(a.value, 'KAN');
  assert.notEqual(b.value, a.value);
  assert.notEqual(c.value, a.value);
  assert.notEqual(c.value, b.value);
  assert.equal(b.exact, false);
});
check('shortCode: always exactly 3 chars', () => {
  const taken = new Set<string>();
  for (const [code, name] of [[null, 'X'], ['A', 'Ab'], ['', ''], ['TOOLONG', 'Some Team']] as const) {
    const r = deriveShortCode(code, name, taken);
    assert.equal(r.value.length, 3, `"${code}"/"${name}" produced "${r.value}"`);
  }
});
check('shortCode: strips punctuation/spaces', () => {
  const taken = new Set<string>();
  const r = deriveShortCode('C-S K', 'Chennai', taken);
  assert.ok(/^[A-Z0-9]{3}$/.test(r.value), `got "${r.value}"`);
});

console.log('\nImage refs — no re-upload, normalise to public_id');
check('image: full Cloudinary URL stripped to public_id', () => {
  const url = 'https://res.cloudinary.com/diitsd6nz/image/upload/c_fill,w_400,h_400/v1699999999/prostream-auction/players/abc123.jpg';
  assert.equal(normalizeImageRef(url), 'prostream-auction/players/abc123');
});
check('image: URL without transforms/version', () => {
  const url = 'https://res.cloudinary.com/diitsd6nz/image/upload/prostream-auction/players/xyz.png';
  assert.equal(normalizeImageRef(url), 'prostream-auction/players/xyz');
});
check('image: bare public_id passed through', () => {
  assert.equal(normalizeImageRef('prostream-auction/players/abc'), 'prostream-auction/players/abc');
});
check('image: non-Cloudinary URL preserved', () => {
  assert.equal(normalizeImageRef('https://example.com/a.jpg'), 'https://example.com/a.jpg');
});
check('image: empty is null', () => {
  assert.equal(normalizeImageRef(null), null);
  assert.equal(normalizeImageRef(''), null);
  assert.equal(normalizeImageRef('   '), null);
});

console.log(`\n${passed} assertions passed.\n`);
