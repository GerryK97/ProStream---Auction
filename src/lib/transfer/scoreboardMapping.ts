/**
 * scoreboardMapping.ts
 *
 * Pure mapping helpers for transferring a completed Auction into the Scoreboard.
 *
 * Why this file exists
 * --------------------
 * The Scoreboard stores player role / batting style / bowling style as strict
 * PostgreSQL enums (`player_role`, `batting_style`, `bowling_style`). The
 * Auction stores the same concepts as free text chosen in `PlayerForm`. A value
 * the enum does not know is not silently coerced - Postgres rejects the INSERT
 * and the whole transfer fails.
 *
 * Every function here is therefore TOTAL: it always returns a value the
 * Scoreboard enum will accept. When the source value has no exact counterpart
 * the result is flagged `exact: false` with a human-readable `note`, so the
 * preview screen can show the operator precisely what was downgraded instead of
 * guessing on their behalf.
 *
 * No I/O. Everything here is unit-testable without a database.
 */

// ─── Scoreboard enum types (mirrors ProStream-Scoreboard/src/lib/db/schema.ts) ─

export type ScoreboardPlayerRole = 'batsman' | 'bowler' | 'allrounder' | 'keeper';

export type ScoreboardBattingStyle = 'right-hand' | 'left-hand';

export type ScoreboardBowlingStyle =
  | 'right-arm-fast'
  | 'right-arm-medium'
  | 'right-arm-offbreak'
  | 'right-arm-legbreak'
  | 'left-arm-fast'
  | 'left-arm-medium'
  | 'left-arm-orthodox'
  | 'left-arm-chinaman';

/** A mapped value plus whether the source matched exactly. */
export interface Mapped<T> {
  value: T;
  /** False when the source had no exact counterpart and a fallback was chosen. */
  exact: boolean;
  /** Operator-facing explanation, present only when `exact` is false. */
  note?: string;
}

const exact = <T>(value: T): Mapped<T> => ({ value, exact: true });
const approx = <T>(value: T, note: string): Mapped<T> => ({ value, exact: false, note });

/** Lowercase, collapse whitespace/underscores, strip punctuation for matching. */
function canonical(input: string): string {
  return input
    .toLowerCase()
    .replace(/[_\s]+/g, ' ')
    .replace(/[^a-z0-9 -]/g, '')
    .trim();
}

// ─── Player role ──────────────────────────────────────────────────────────────

const ROLE_EXACT: Record<string, ScoreboardPlayerRole> = {
  // Auction cricket positions (src/lib/sportPositions.ts)
  'batsman': 'batsman',
  'bowler': 'bowler',
  'all-rounder': 'allrounder',
  'all rounder': 'allrounder',
  'allrounder': 'allrounder',
  'batting all-rounder': 'allrounder',
  'batting all rounder': 'allrounder',
  'bowling all-rounder': 'allrounder',
  'bowling all rounder': 'allrounder',
  'wicket-keeper': 'keeper',
  'wicket keeper': 'keeper',
  'wicketkeeper': 'keeper',
  'wicket keeper batsman': 'keeper',
  'wicket-keeper batsman': 'keeper',
  'keeper': 'keeper',
};

/**
 * Map an Auction position string to a Scoreboard player_role.
 * Falls back to 'batsman', the Scoreboard column default.
 */
export function mapPlayerRole(position: string | null | undefined): Mapped<ScoreboardPlayerRole> {
  if (!position || !position.trim()) {
    return approx('batsman', 'No position set in the auction; defaulted to Batsman.');
  }

  const key = canonical(position);
  const hit = ROLE_EXACT[key];
  if (hit) {
    // The all-rounder variants collapse detail, so flag them as inexact.
    if (key.startsWith('batting all') || key.startsWith('bowling all')) {
      return approx('allrounder', `"${position}" narrowed to All-rounder (Scoreboard has no batting/bowling split).`);
    }
    if (key === 'wicket keeper batsman' || key === 'wicket-keeper batsman') {
      return approx('keeper', `"${position}" mapped to Keeper (Scoreboard has no keeper-batsman role).`);
    }
    return exact(hit);
  }

  // Substring fallbacks for free-typed values.
  if (key.includes('keeper')) return approx('keeper', `"${position}" matched to Keeper.`);
  if (key.includes('all')) return approx('allrounder', `"${position}" matched to All-rounder.`);
  if (key.includes('bowl')) return approx('bowler', `"${position}" matched to Bowler.`);
  if (key.includes('bat')) return approx('batsman', `"${position}" matched to Batsman.`);

  return approx('batsman', `"${position}" is not a cricket role; defaulted to Batsman.`);
}

// ─── Batting style ────────────────────────────────────────────────────────────

/**
 * Map an Auction batting style to a Scoreboard batting_style.
 * Auction uses 'Right-handed' / 'Left-handed'.
 */
export function mapBattingStyle(style: string | null | undefined): Mapped<ScoreboardBattingStyle> {
  if (!style || !style.trim()) {
    return approx('right-hand', 'No batting style set; defaulted to Right-hand.');
  }

  const key = canonical(style);
  if (key === 'right-handed' || key === 'right hand' || key === 'right-hand' || key === 'rhb') {
    return exact('right-hand');
  }
  if (key === 'left-handed' || key === 'left hand' || key === 'left-hand' || key === 'lhb') {
    return exact('left-hand');
  }
  if (key.includes('left')) return approx('left-hand', `"${style}" matched to Left-hand.`);
  if (key.includes('right')) return approx('right-hand', `"${style}" matched to Right-hand.`);

  return approx('right-hand', `"${style}" is not a known batting style; defaulted to Right-hand.`);
}

// ─── Bowling style ────────────────────────────────────────────────────────────

const BOWLING_EXACT: Record<string, ScoreboardBowlingStyle> = {
  'right-arm fast': 'right-arm-fast',
  'right-arm medium': 'right-arm-medium',
  'right-arm off-spin': 'right-arm-offbreak',
  'right-arm offbreak': 'right-arm-offbreak',
  'left-arm fast': 'left-arm-fast',
  'left-arm medium': 'left-arm-medium',
  'left-arm orthodox': 'left-arm-orthodox',
  'left-arm chinaman': 'left-arm-chinaman',
};

/**
 * Map an Auction bowling style to a Scoreboard bowling_style.
 *
 * Returns null for "does not bowl", which the Scoreboard column allows
 * (bowling_style is nullable). Note that Auction offers
 * 'Right-arm Medium-fast', which has no exact Scoreboard counterpart and is
 * deliberately downgraded to 'right-arm-medium'.
 */
export function mapBowlingStyle(style: string | null | undefined): Mapped<ScoreboardBowlingStyle | null> {
  if (!style || !style.trim()) {
    // Not an approximation: no bowling style genuinely means "unset".
    return exact(null);
  }

  const key = canonical(style);

  const direct = BOWLING_EXACT[key];
  if (direct) return exact(direct);

  // 'Leg-spin' in Auction has no arm prefix; Scoreboard only models the
  // right-arm variant, so this is an assumption worth surfacing.
  if (key === 'leg-spin' || key === 'leg spin' || key === 'legspin' || key === 'leg break') {
    return approx('right-arm-legbreak', '"Leg-spin" assumed right-arm (Scoreboard has no arm-neutral leg-spin).');
  }

  // Medium-fast has no target: Scoreboard offers only fast or medium.
  if (key.includes('medium-fast') || key.includes('medium fast') || key.includes('fast-medium') || key.includes('fast medium')) {
    const left = key.includes('left');
    return approx(
      left ? 'left-arm-medium' : 'right-arm-medium',
      `"${style}" has no Scoreboard equivalent; recorded as ${left ? 'Left' : 'Right'}-arm Medium.`,
    );
  }

  const left = key.includes('left');

  if (key.includes('chinaman') || (left && key.includes('wrist'))) {
    return approx('left-arm-chinaman', `"${style}" matched to Left-arm Chinaman.`);
  }
  if (key.includes('orthodox') || (left && key.includes('spin') && !key.includes('leg'))) {
    return approx('left-arm-orthodox', `"${style}" matched to Left-arm Orthodox.`);
  }
  if (key.includes('off-spin') || key.includes('off spin') || key.includes('offbreak') || key.includes('off break')) {
    return approx('right-arm-offbreak', `"${style}" matched to Right-arm Offbreak.`);
  }
  if (key.includes('leg-spin') || key.includes('leg spin') || key.includes('legbreak') || key.includes('googly')) {
    return approx('right-arm-legbreak', `"${style}" matched to Right-arm Legbreak.`);
  }
  if (key.includes('fast')) {
    return approx(left ? 'left-arm-fast' : 'right-arm-fast', `"${style}" matched to ${left ? 'Left' : 'Right'}-arm Fast.`);
  }
  if (key.includes('medium')) {
    return approx(left ? 'left-arm-medium' : 'right-arm-medium', `"${style}" matched to ${left ? 'Left' : 'Right'}-arm Medium.`);
  }
  if (key.includes('spin')) {
    return approx(left ? 'left-arm-orthodox' : 'right-arm-offbreak', `"${style}" matched to ${left ? 'Left-arm Orthodox' : 'Right-arm Offbreak'}.`);
  }

  return approx('right-arm-medium', `"${style}" is not a known bowling style; recorded as Right-arm Medium.`);
}

// ─── Display name ─────────────────────────────────────────────────────────────

/**
 * Scoreboard requires a NOT NULL `display_name`; the Auction has no such field.
 * Produce a short broadcast-friendly name: "Kumar Sangakkara" -> "K Sangakkara".
 * Single-word names are used as-is.
 */
export function deriveDisplayName(fullName: string): string {
  const cleaned = fullName.trim().replace(/\s+/g, ' ');
  if (!cleaned) return 'Unknown';

  const parts = cleaned.split(' ');
  if (parts.length === 1) return parts[0].slice(0, 40);

  const surname = parts[parts.length - 1];
  const initial = parts[0][0]?.toUpperCase() ?? '';
  const candidate = `${initial} ${surname}`;

  // Prefer the full name when it is already short enough to read on screen.
  return (cleaned.length <= 18 ? cleaned : candidate).slice(0, 40);
}

// ─── Short code ───────────────────────────────────────────────────────────────

/**
 * Scoreboard `teams.short_code` is char(3); the Auction allows up to 6 chars.
 * Derive a deterministic 3-character code and resolve collisions against codes
 * already taken within the same tournament.
 */
export function deriveShortCode(
  preferred: string | null | undefined,
  teamName: string,
  taken: Set<string>,
): Mapped<string> {
  const source = (preferred ?? '').trim();
  const base = sanitizeCode(source) || initialsFrom(teamName) || 'TBD';

  let candidate = base.slice(0, 3).padEnd(3, 'X');
  const truncated = sanitizeCode(source).length > 3;

  if (!taken.has(candidate)) {
    taken.add(candidate);
    return truncated
      ? approx(candidate, `Short code "${source}" truncated to "${candidate}" (Scoreboard allows 3 characters).`)
      : exact(candidate);
  }

  // Collision: walk the last character through 0-9 then A-Z for determinism.
  const suffixes = '23456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  for (const suffix of suffixes) {
    const alt = `${candidate.slice(0, 2)}${suffix}`;
    if (!taken.has(alt)) {
      taken.add(alt);
      return approx(alt, `Short code "${candidate}" already used in this tournament; used "${alt}".`);
    }
  }

  taken.add(candidate);
  return approx(candidate, `Could not find a unique short code; reused "${candidate}".`);
}

function sanitizeCode(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function initialsFrom(teamName: string): string {
  const words = teamName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (words.length === 1) return sanitizeCode(words[0]).slice(0, 3);
  return sanitizeCode(words.map(w => w[0]).join('')).slice(0, 3);
}

// ─── Images ───────────────────────────────────────────────────────────────────

/**
 * The Scoreboard stores Cloudinary public_ids but its `cloudinaryUrl()` helper
 * also accepts full URLs, so no re-upload is needed. We still normalise to a
 * bare public_id when possible to match how the Scoreboard stores its own
 * uploads. Mirrors normalizePublicId() in ProStream-Scoreboard.
 */
export function normalizeImageRef(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    if (!trimmed.includes('cloudinary.com')) {
      // A non-Cloudinary URL still renders: cloudinaryUrl() returns it as-is.
      return trimmed;
    }
    const uploadIdx = trimmed.indexOf('/upload/');
    if (uploadIdx === -1) return trimmed;

    let rest = trimmed.slice(uploadIdx + '/upload/'.length);
    rest = rest.replace(/^(?:[a-z]+_[^/]+,?)+\//, ''); // transforms
    rest = rest.replace(/^v\d+\//, '');                 // version
    rest = rest.replace(/\.[a-zA-Z]{2,5}$/i, '');       // extension
    return rest || trimmed;
  }

  return trimmed;
}
