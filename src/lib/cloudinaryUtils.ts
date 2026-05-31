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
      // Strip existing transformation segments (anything before the first path that looks like a folder/id)
      rest = rest.replace(/^[^/]+\//, (seg) =>
        /^[a-z_,]+$/.test(seg.replace(/\d+/g, '')) ? '' : seg
      )
      // Strip version prefix v1234567890/
      rest = rest.replace(/^v\d+\//, '')
      // Strip file extension
      rest = rest.replace(/\.[a-zA-Z]+$/, '')
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
      rest = rest.replace(/^[^/]+\//, (seg) =>
        /^[a-z_,]+$/.test(seg.replace(/\d+/g, '')) ? '' : seg
      )
      rest = rest.replace(/^v\d+\//, '')
      rest = rest.replace(/\.[a-zA-Z]+$/, '')
      return rest || null
    }
    return null // non-Cloudinary URL — don't store
  }
  return value
}
