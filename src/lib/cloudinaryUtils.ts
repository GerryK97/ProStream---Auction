/**
 * Backward-compatible public image URL builder.
 *
 * Stored values may be legacy Cloudinary public IDs or URLs, new R2 public
 * URLs, external URLs, or data URLs. Existing Cloudinary values remain fully
 * supported while new R2 media is delivered through Cloudflare Images.
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? process.env.CLOUDINARY_CLOUD_NAME ?? 'diitsd6nz';
const R2_PUBLIC_BASE_URL = (process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL ?? process.env.R2_PUBLIC_BASE_URL ?? 'https://media.prostream.lk').replace(/\/+$/, '');

export type ImageFit = 'fill' | 'thumb' | 'crop' | 'fit' | 'scale' | 'limit';
export type ImageFormat = 'auto' | 'webp' | 'jpg' | 'png';
export interface ImageUrlOptions {
  width?: number;
  height?: number;
  fit?: ImageFit;
  format?: ImageFormat;
}

function isCloudinaryUrl(value: string): boolean {
  return value.includes('cloudinary.com') || value.includes('res.cloudinary.com');
}

/** True only for media served from this application's configured R2 domain. */
export function isR2MediaUrl(value: string | null | undefined): boolean {
  if (!value?.startsWith('http')) return false;
  try {
    return new URL(value).origin === R2_PUBLIC_BASE_URL;
  } catch {
    return false;
  }
}

function r2ObjectPath(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.origin !== R2_PUBLIC_BASE_URL) return null;
    if (url.pathname.startsWith('/cdn-cgi/image/')) {
      // Serialized API responses already carry a delivery transform. Recover
      // the underlying R2 key so a subsequent form save never persists a
      // derived URL or nests transforms around transforms.
      const transformed = url.pathname.slice('/cdn-cgi/image/'.length);
      const optionEnd = transformed.indexOf('/');
      return optionEnd === -1 ? null : transformed.slice(optionEnd + 1);
    }
    return url.pathname.replace(/^\/+/, '');
  } catch {
    return null;
  }
}

function cloudflareFit(fit: ImageFit): string {
  switch (fit) {
    case 'fill':
    case 'thumb':
      return 'cover';
    case 'crop':
      return 'crop';
    case 'fit':
      return 'contain';
    case 'scale':
      return 'squeeze';
    case 'limit':
      return 'scale-down';
  }
}

function cloudflareFormat(format: ImageFormat): string {
  return format === 'jpg' ? 'jpeg' : format;
}

function cloudinaryFormat(format: ImageFormat): string {
  // Preserve the existing Cloudinary contract. Cloudflare uses format=auto,
  // but prior Auction URLs deliberately requested WebP for the default path.
  if (format === 'auto') return 'webp';
  return format === 'jpg' ? 'jpg' : format;
}

function cloudinaryPublicId(value: string): string | null {
  const uploadIdx = value.indexOf('/upload/');
  if (uploadIdx === -1) return null;
  let rest = value.slice(uploadIdx + '/upload/'.length);
  rest = rest.replace(/^(?:[a-z]+_[^/]+,?)+\//, '');
  rest = rest.replace(/^v\d+\//, '');
  rest = rest.replace(/\.[a-zA-Z]{2,5}$/, '');
  return rest || null;
}

/**
 * Builds an optimized delivery URL for a legacy Cloudinary value or an R2
 * public URL. Non-managed external/data URLs are deliberately passed through.
 */
export function buildImageUrl(value: string | null | undefined, options: ImageUrlOptions = {}): string {
  if (!value) return '';

  const { width = 200, height = 200, fit = 'fill', format = 'auto' } = options;
  const r2Path = r2ObjectPath(value);
  if (r2Path) {
    const transforms = [
      `width=${width}`,
      `height=${height}`,
      `fit=${cloudflareFit(fit)}`,
      `format=${cloudflareFormat(format)}`,
      // If the Images service is temporarily unavailable, show the original
      // R2 object rather than breaking an operator or overlay view.
      'onerror=redirect',
    ].join(',');
    return `${R2_PUBLIC_BASE_URL}/cdn-cgi/image/${transforms}/${r2Path}`;
  }

  if (isCloudinaryUrl(value)) {
    const publicId = cloudinaryPublicId(value);
    if (!publicId) return value;
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/c_${fit},w_${width},h_${height},f_${cloudinaryFormat(format)}/${publicId}`;
  }

  // External URLs and data URLs are not owned by this media system.
  if (value.startsWith('http') || value.startsWith('data:')) return value;

  // Bare values are legacy Cloudinary public IDs. New R2 uploads always store
  // full public URLs so these old records keep their existing semantics.
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/c_${fit},w_${width},h_${height},f_${cloudinaryFormat(format)}/${value}`;
}

/**
 * Normalises image values before persistence. Legacy Cloudinary URLs become
 * bare public IDs as before. New R2 URLs remain complete public URLs, which
 * keeps them distinguishable from legacy Cloudinary IDs.
 */
export function normalizePublicId(value: string | null | undefined): string | null {
  if (!value) return null;

  const r2Path = r2ObjectPath(value);
  if (r2Path) return `${R2_PUBLIC_BASE_URL}/${r2Path}`;

  if (value.startsWith('https://') || value.startsWith('http://')) {
    if (isCloudinaryUrl(value)) return cloudinaryPublicId(value);
    return null;
  }
  return value;
}

/** Returns a full optimized delivery URL suitable for API responses and img tags. */
export function resolveImageUrl(value: string | null | undefined, options: ImageUrlOptions = {}): string | null {
  return value ? buildImageUrl(value, { width: 400, height: 400, fit: 'fill', ...options }) : null;
}

/** Serialize image fields so web, overlays, and mobile receive usable URLs. */
export function serializePlayer(doc: Record<string, any>): Record<string, any> {
  return {
    ...doc,
    photoURL: resolveImageUrl(doc.photoURL, { width: 600, height: 600 }) ?? doc.photoURL ?? null,
    secondaryImageURL: resolveImageUrl(doc.secondaryImageURL, { width: 800, height: 450, fit: 'fill' }) ?? doc.secondaryImageURL ?? null,
  };
}

export function serializeTeam(doc: Record<string, any>): Record<string, any> {
  return {
    ...doc,
    logoURL: resolveImageUrl(doc.logoURL, { width: 400, height: 400 }) ?? doc.logoURL ?? null,
  };
}

export function serializeTournament(doc: Record<string, any>): Record<string, any> {
  return {
    ...doc,
    logoURL: resolveImageUrl(doc.logoURL, { width: 400, height: 400 }) ?? doc.logoURL ?? null,
    wheelCenterImageURL: resolveImageUrl(doc.wheelCenterImageURL, { width: 400, height: 400 }) ?? doc.wheelCenterImageURL ?? null,
  };
}
