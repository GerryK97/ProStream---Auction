/**
 * scoreboardMapping.ts
 *
 * Pure mapping helpers for transferring a completed Auction into the Scoreboard.
 *
 * Scope: only the fields the operator asked to transfer - player name, primary
 * photo, position and which team. Batting/bowling styles are deliberately NOT
 * transferred; those columns are nullable in the Scoreboard and are left to
 * their own defaults.
 *
 * Why this file exists
 * --------------------
 * The Auction's "position" is the Scoreboard's "role", and the Scoreboard
 * stores it as a strict PostgreSQL enum (`player_role`) while the Auction
 * stores free text. A value the enum does not know is not silently coerced -
 * Postgres rejects the INSERT and the whole transfer fails.
 *
 * `mapPlayerRole` is therefore TOTAL: it always returns a value the enum will
 * accept. When the source has no exact counterpart the result is flagged
 * `exact: false` with a human-readable `note`, so the preview screen can show
 * the operator what was narrowed instead of guessing on their behalf.
 *
 * No I/O. Everything here is unit-testable without a database.
 */

// ─── Scoreboard enum types (mirrors ProStream-Scoreboard/src/lib/db/schema.ts) ─

export type ScoreboardPlayerRole = 'batsman' | 'bowler' | 'allrounder' | 'keeper';

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
 *
 * The Auction calls this field "position"; the Scoreboard calls it "role".
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
  const truncationNote = truncated
    ? `Short code "${source}" truncated to "${candidate}" (Scoreboard allows 3 characters).`
    : '';

  if (!taken.has(candidate)) {
    taken.add(candidate);
    return truncated ? approx(candidate, truncationNote) : exact(candidate);
  }

  // Collision: walk the last character through 0-9 then A-Z for determinism.
  // Report the truncation too, otherwise the operator only learns about the
  // collision and cannot tell their 6-character code was shortened as well.
  const suffixes = '23456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  for (const suffix of suffixes) {
    const alt = `${candidate.slice(0, 2)}${suffix}`;
    if (!taken.has(alt)) {
      taken.add(alt);
      const collisionNote = `Short code "${candidate}" is already used in this tournament; used "${alt}" instead.`;
      return approx(alt, truncated ? `${truncationNote} ${collisionNote}` : collisionNote);
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
 * Normalise an Auction image reference to a bare Cloudinary public_id.
 *
 * Auction images are served through the media.prostream.lk CDN, which fronts
 * Cloudinary and adds a routing prefix:
 *
 *   https://media.prostream.lk/cloudinary-backfill/prostream-auction/players/abc
 *                              └── CDN prefix ──┘ └──── real public_id ────┘
 *
 * The Scoreboard stores public_ids and rebuilds URLs against res.cloudinary.com,
 * and several of its pages do so inline rather than through cloudinaryUrl(), so
 * storing a full URL renders a broken image. 94% of auction images use this CDN
 * form, so the prefix must be stripped to the real public_id, which is verified
 * to resolve on Cloudinary directly.
 */
export function normalizeImageRef(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    // Cloudinary's own delivery URL: strip transforms/version/extension.
    if (trimmed.includes('cloudinary.com')) {
      const uploadIdx = trimmed.indexOf('/upload/');
      if (uploadIdx === -1) return trimmed;
      let rest = trimmed.slice(uploadIdx + '/upload/'.length);
      rest = rest.replace(/^(?:[a-z]+_[^/]+,?)+\//, ''); // transforms
      rest = rest.replace(/^v\d+\//, '');                 // version
      rest = rest.replace(/\.[a-zA-Z]{2,5}$/i, '');       // extension
      return rest || trimmed;
    }

    // media.prostream.lk (and any other host fronting Cloudinary) serves the
    // auction's images. Only treat a host as a Cloudinary CDN when the path
    // actually looks like an auction public_id, so an unrelated external image
    // URL is preserved verbatim rather than mangled into a bogus id.
    let path: string;
    try {
      path = new URL(trimmed).pathname.replace(/^\/+/, '');
    } catch {
      return trimmed;
    }
    if (!path) return trimmed;

    // Cloudflare Image Resizing puts a transform segment in front of the real
    // path, e.g. /cdn-cgi/image/width=600,fit=cover/cloudinary-backfill/...
    path = path.replace(/^cdn-cgi\/image\/[^/]*\//, '');

    // Only assets served under /cloudinary-backfill/ were migrated into
    // Cloudinary, so only those can be reduced to a public_id. Verified against
    // production: 4191 player photos carry that prefix and resolve on
    // res.cloudinary.com, while 401 are served directly from R2 and 404 there.
    // Reducing an R2-only asset to a public_id would break the image, so those
    // keep their full URL, which the Scoreboard renders as-is.
    if (!path.startsWith('cloudinary-backfill/')) {
      return trimmed;
    }

    const withoutPrefix = path.replace(/^cloudinary-backfill\//, '');
    const isAuctionAsset = /^prostream(-auction)?\//.test(withoutPrefix);
    if (!isAuctionAsset) {
      // Not one of ours: hand back the original URL untouched.
      return trimmed;
    }

    return withoutPrefix.replace(/\.[a-zA-Z]{2,5}$/i, '') || trimmed;
  }

  // Already a bare public_id.
  return trimmed;
}
