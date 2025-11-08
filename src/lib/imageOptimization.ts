/**
 * Cloudinary Image Optimization Utility
 * Generates optimized image URLs with dynamic transformations based on usage context
 */

export type ImageSize =
  | 'thumbnail' // 64x64 - Small avatars, icons
  | 'small'     // 150x150 - List items, small cards
  | 'medium'    // 300x300 - Medium cards, previews
  | 'large'     // 600x600 - Large cards, detail views
  | 'hero'      // 1200x1200 - Hero images, banners
  | 'original'; // No transformation

interface TransformOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'scale' | 'limit';
  quality?: 'auto' | number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
}

const SIZE_PRESETS: Record<Exclude<ImageSize, 'original'>, TransformOptions> = {
  thumbnail: { width: 64, height: 64, crop: 'fill', quality: 'auto', format: 'auto' },
  small: { width: 150, height: 150, crop: 'fill', quality: 'auto', format: 'auto' },
  medium: { width: 300, height: 300, crop: 'limit', quality: 'auto', format: 'auto' },
  large: { width: 600, height: 600, crop: 'limit', quality: 'auto', format: 'auto' },
  hero: { width: 1200, height: 1200, crop: 'limit', quality: 'auto', format: 'auto' },
};

/**
 * Check if URL is a Cloudinary URL
 */
function isCloudinaryUrl(url: string): boolean {
  return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
}

/**
 * Optimize Cloudinary image URL with transformations
 * @param url - Original image URL (Cloudinary or external)
 * @param size - Preset size or custom options
 * @returns Optimized image URL
 */
export function optimizeImage(
  url: string,
  size: ImageSize | TransformOptions = 'medium'
): string {
  // Return original URL if not a Cloudinary URL
  if (!url || !isCloudinaryUrl(url)) {
    return url;
  }

  // Get transformation options
  const options: TransformOptions = typeof size === 'string' && size !== 'original'
    ? SIZE_PRESETS[size]
    : typeof size === 'string'
    ? {}
    : size;

  // If no transformations needed, return original
  if (Object.keys(options).length === 0) {
    return url;
  }

  // Build transformation string
  const transformations: string[] = [];

  if (options.width) transformations.push(`w_${options.width}`);
  if (options.height) transformations.push(`h_${options.height}`);
  if (options.crop) transformations.push(`c_${options.crop}`);
  if (options.quality) transformations.push(`q_${options.quality}`);
  if (options.format) transformations.push(`f_${options.format}`);

  const transformString = transformations.join(',');

  // Insert transformation into Cloudinary URL
  // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/{path}
  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex === -1) {
    // If URL doesn't have /upload/, return original
    return url;
  }

  const beforeUpload = url.substring(0, uploadIndex + 8); // includes '/upload/'
  const afterUpload = url.substring(uploadIndex + 8);

  // Check if transformations already exist
  const existingTransformIndex = afterUpload.indexOf('/');
  if (existingTransformIndex > 0 && afterUpload.substring(0, existingTransformIndex).includes('_')) {
    // Remove existing transformations
    const pathStart = afterUpload.indexOf('/', existingTransformIndex);
    const cleanPath = afterUpload.substring(pathStart);
    return `${beforeUpload}${transformString}${cleanPath}`;
  }

  return `${beforeUpload}${transformString}/${afterUpload}`;
}

/**
 * Get optimized image props for img elements
 */
export function getOptimizedImageProps(
  url: string,
  size: ImageSize | TransformOptions = 'medium',
  alt: string = ''
) {
  return {
    src: optimizeImage(url, size),
    alt,
    loading: 'lazy' as const,
    decoding: 'async' as const,
  };
}

/**
 * Context-specific image optimization helpers
 */
export const imageOptimizers = {
  // Player images
  playerThumbnail: (url: string) => optimizeImage(url, 'thumbnail'),
  playerCard: (url: string) => optimizeImage(url, 'medium'),
  playerDetail: (url: string) => optimizeImage(url, 'large'),
  playerOverlay: (url: string) => optimizeImage(url, 'hero'),

  // Team logos
  teamThumbnail: (url: string) => optimizeImage(url, 'thumbnail'),
  teamCard: (url: string) => optimizeImage(url, 'small'),
  teamLogo: (url: string) => optimizeImage(url, 'medium'),
  teamHero: (url: string) => optimizeImage(url, 'large'),

  // Generic
  listItem: (url: string) => optimizeImage(url, 'small'),
  preview: (url: string) => optimizeImage(url, 'medium'),
  full: (url: string) => optimizeImage(url, 'large'),
};
