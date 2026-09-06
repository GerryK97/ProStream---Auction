/**
 * Pure, network-free helpers for the Cloudinary -> R2 media backfill.
 *
 * Kept separate from the CLI so field scanning and value parsing can be unit
 * tested without a database, Cloudinary, or R2 connection.
 */

/** Every field this backfill knows how to read and safely rewrite. */
export const MEDIA_FIELDS = [
  { collection: 'players', path: 'photoURL', kind: 'scalar' },
  { collection: 'players', path: 'secondaryImageURL', kind: 'scalar' },
  { collection: 'teams', path: 'logoURL', kind: 'scalar' },
  { collection: 'teams', path: 'officials', kind: 'array', field: 'photoURL' },
  { collection: 'tournaments', path: 'logoURL', kind: 'scalar' },
  { collection: 'tournaments', path: 'wheelCenterImageURL', kind: 'scalar' },
  { collection: 'tournaments', path: 'playerCardTemplates', kind: 'array', field: 'pngUrl' },
];

export function isR2Value(value, r2PublicBaseUrl) {
  return typeof value === 'string' && value.startsWith(`${r2PublicBaseUrl}/`);
}

/** True only for values this backfill should copy: legacy Cloudinary URLs or bare public IDs. */
export function isLegacyCloudinaryValue(value, r2PublicBaseUrl) {
  if (typeof value !== 'string' || value.length === 0) return false;
  if (isR2Value(value, r2PublicBaseUrl)) return false;
  if (value.startsWith('data:')) return false;
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value.includes('cloudinary.com');
  }
  // The only bare-string scheme this app stores is a Cloudinary public_id.
  return true;
}

const EXTENSION_BY_CONTENT_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export function extensionForContentType(contentType) {
  return EXTENSION_BY_CONTENT_TYPE[contentType?.split(';')[0]?.trim().toLowerCase()] ?? 'jpg';
}

/**
 * Extracts the Cloudinary public_id from any stored value. Mirrors
 * src/lib/cloudinaryUtils.ts's parsing so the exact same asset is targeted.
 */
export function extractCloudinaryPublicId(value) {
  if (!value.startsWith('http://') && !value.startsWith('https://')) return value;
  const uploadIdx = value.indexOf('/upload/');
  if (uploadIdx === -1) return null;
  let rest = value.slice(uploadIdx + '/upload/'.length);
  rest = rest.replace(/^(?:[a-z]+_[^/]+,?)+\//, '');
  rest = rest.replace(/^v\d+\//, '');
  rest = rest.replace(/\.[a-zA-Z]{2,5}$/, '');
  return rest || null;
}

export function cloudinaryOriginalUrl(cloudName, publicId) {
  return `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;
}

/** Reads every legacy Cloudinary value at a described field path from one document. */
export function readFieldValues(doc, descriptor) {
  if (descriptor.kind === 'scalar') {
    const value = doc[descriptor.path];
    return typeof value === 'string' && value ? [value] : [];
  }
  const items = Array.isArray(doc[descriptor.path]) ? doc[descriptor.path] : [];
  return items.map((item) => item?.[descriptor.field]).filter((value) => typeof value === 'string' && value);
}

/** Returns a new array with every matching element's field replaced, or null if nothing changed. */
export function rewriteArrayField(items, descriptor, valueMap) {
  if (!Array.isArray(items)) return null;
  let changed = false;
  const next = items.map((item) => {
    const current = item?.[descriptor.field];
    const replacement = typeof current === 'string' ? valueMap.get(current) : undefined;
    if (replacement === undefined) return item;
    changed = true;
    return { ...item, [descriptor.field]: replacement };
  });
  return changed ? next : null;
}
