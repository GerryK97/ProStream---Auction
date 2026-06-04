/**
 * Shared Cloudinary URL builder for the Auction app.
 *
 * Handles all storage formats that may appear in the DB:
 * 1. Full URL  → 'https://res.cloudinary.com/.../public_id.jpg' (old Auction format)
 * 2. Public ID → 'prostream-auction/users/xxx' (new unified format)
 * 3. Public ID → 'prostream/team-logos/xxx' (Scoreboard format)
 * 4. Placeholder/external URL → pass through as-is
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? ''

/**
 * Build a Cloudinary transformation URL from any stored value.
 * Returns the original value if it's not a recognised Cloudinary resource.
 */
export function buildImageUrl(
  value: string | null | undefined,
  options: { width?: number; height?: number; fit?: 'fill' | 'thumb' | 'crop' } = {}
): string {
  if (!value) return ''

  const { width = 200, height = 200, fit = 'fill' } = options

  // Already a full Cloudinary URL — extract public_id and rebuild with our transforms
  if (value.startsWith('https://res.cloudinary.com/') || value.startsWith('http://res.cloudinary.com/')) {
    const uploadIdx = value.indexOf('/upload/')
    if (uploadIdx !== -1) {
      let rest = value.slice(uploadIdx + '/upload/'.length)
      // Strip existing Cloudinary transform segments (e.g. c_fill,w_200,h_200,f_webp)
      rest = rest.replace(/^(?:[a-z]+_[^/]+,?)+\//, '')
      // Strip version prefix v1234567890/
      rest = rest.replace(/^v\d+\//, '')
      // Strip file extension
      rest = rest.replace(/\.[a-zA-Z]{2,5}$/, '')
      return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/c_${fit},w_${width},h_${height},f_webp/${rest}`
    }
    return value // fallback: return as-is
  }

  // External URL (placehold.co etc.) or data URL — pass through
  if (value.startsWith('http') || value.startsWith('data:')) {
    return value
  }

  // Bare public_id (prostream-auction/users/xxx or prostream/team-logos/xxx)
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/c_${fit},w_${width},h_${height},f_webp/${value}`
}

/**
 * Normalise any stored value to a bare public_id before saving to DB.
 * Strips full URLs down to just the public_id path.
 */
export function normalizePublicId(value: string | null | undefined): string | null {
  if (!value) return null
  if (value.startsWith('https://') || value.startsWith('http://')) {
    if (value.includes('/upload/')) {
      let rest = value.slice(value.indexOf('/upload/') + '/upload/'.length)
      // Strip all leading Cloudinary transform segments (e.g. c_fill,w_200,h_200,f_webp)
      // A transform segment contains a Cloudinary param like c_, w_, h_, f_, q_, etc.
      rest = rest.replace(/^(?:[a-z]+_[^/]+,?)+\//, '')
      // Strip version prefix v1234567890/
      rest = rest.replace(/^v\d+\//, '')
      // Strip file extension
      rest = rest.replace(/\.[a-zA-Z]{2,5}$/, '')
      return rest || null
    }
    return null // non-Cloudinary URL — don't store
  }
  return value
}

/**
 * Resolve any stored image value (bare publicId or full URL) to a full
 * Cloudinary delivery URL suitable for <img src>. Server-safe — uses
 * CLOUDINARY_CLOUD_NAME (falls back to NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME).
 * Returns null if value is empty.
 */
export function resolveImageUrl(
  value: string | null | undefined,
  options: { width?: number; height?: number; fit?: 'fill' | 'thumb' | 'crop' } = {}
): string | null {
  if (!value) return null
  // Already a non-cloudinary external URL — keep as-is
  if ((value.startsWith('http') || value.startsWith('data:')) && !value.includes('cloudinary.com')) {
    return value
  }
  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME ??
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ??
    ''
  if (!cloudName) return value
  const { width = 400, height = 400, fit = 'fill' } = options
  const transform = `c_${fit},w_${width},h_${height},f_webp`

  // Full cloudinary URL → rebuild with transforms
  if (value.includes('res.cloudinary.com')) {
    const uploadIdx = value.indexOf('/upload/')
    if (uploadIdx === -1) return value
    let rest = value.slice(uploadIdx + '/upload/'.length)
    // Strip existing transform segments
    rest = rest.replace(/^(?:[a-z_]+_[^/]+,?)+\//, '')
    // Strip version prefix
    rest = rest.replace(/^v\d+\//, '')
    // Strip extension
    rest = rest.replace(/\.[a-zA-Z]{2,5}$/, '')
    return `https://res.cloudinary.com/${cloudName}/image/upload/${transform}/${rest}`
  }

  // Bare public_id
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transform}/${value}`
}

/**
 * Serialize a player/team/tournament document for API responses.
 * Resolves all image fields to full delivery URLs so every consumer
 * (overlays, manage pages, mobile app) always gets a usable <img src>.
 */
export function serializePlayer(doc: Record<string, any>): Record<string, any> {
  return {
    ...doc,
    photoURL: resolveImageUrl(doc.photoURL, { width: 600, height: 600 }) ?? doc.photoURL ?? null,
    secondaryImageURL: resolveImageUrl(doc.secondaryImageURL, { width: 800, height: 450, fit: 'fill' }) ?? doc.secondaryImageURL ?? null,
  }
}

export function serializeTeam(doc: Record<string, any>): Record<string, any> {
  return {
    ...doc,
    logoURL: resolveImageUrl(doc.logoURL, { width: 400, height: 400 }) ?? doc.logoURL ?? null,
  }
}

export function serializeTournament(doc: Record<string, any>): Record<string, any> {
  return {
    ...doc,
    logoURL: resolveImageUrl(doc.logoURL, { width: 400, height: 400 }) ?? doc.logoURL ?? null,
  }
}
