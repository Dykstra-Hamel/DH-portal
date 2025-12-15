/**
 * Image Transformation Utility
 *
 * Provides helper functions for applying Supabase image transformations
 * to campaign landing page images. Supports automatic resizing, quality
 * optimization, and WebP conversion.
 */

export interface ImageTransformConfig {
  width: number;
  height: number;
  resize: 'cover' | 'contain' | 'fill';
  quality: number;
  format?: 'webp' | 'origin';
}

/**
 * Standard image transformation configurations for campaign landing pages.
 * These dimensions and quality settings are optimized for web performance
 * and visual quality.
 */
export const IMAGE_CONFIGS = {
  // Campaign landing page images
  hero: { width: 522, height: 418, resize: 'cover' as const, quality: 85 },
  features: { width: 1516, height: 1134, resize: 'cover' as const, quality: 80 },
  additionalServices: { width: 1516, height: 1134, resize: 'cover' as const, quality: 80 },

  // Thumbnail and preview sizes for image library
  thumbnail: { width: 200, height: 200, resize: 'cover' as const, quality: 70 },
  preview: { width: 600, height: 400, resize: 'contain' as const, quality: 75 },
} as const;

/**
 * Generates an optimized image URL with Supabase transformation parameters.
 *
 * @param baseUrl - The original Supabase storage URL
 * @param configKey - The image configuration to apply (hero, features, etc.)
 * @returns Transformed image URL with query parameters, or null if baseUrl is null
 *
 * @example
 * const heroUrl = getOptimizedImageUrl(
 *   'https://...supabase.co/storage/v1/object/public/campaign-landing-pages/123/hero.jpg',
 *   'hero'
 * );
 * // Returns: https://...?width=522&height=418&resize=cover&quality=85
 */
export function getOptimizedImageUrl(
  baseUrl: string | null,
  configKey: keyof typeof IMAGE_CONFIGS
): string | null {
  if (!baseUrl) return null;

  const config = IMAGE_CONFIGS[configKey];
  const params = new URLSearchParams({
    width: config.width.toString(),
    height: config.height.toString(),
    resize: config.resize,
    quality: config.quality.toString(),
  });

  // Supabase automatically converts to WebP if client supports it
  // Can force WebP with format=webp parameter if needed

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Calculates the aspect ratio for a given image configuration.
 *
 * @param configKey - The image configuration key
 * @returns The aspect ratio as width/height
 *
 * @example
 * const heroRatio = getAspectRatio('hero'); // Returns 1.25 (5:4 ratio)
 * const featuresRatio = getAspectRatio('features'); // Returns 1.33 (4:3 ratio)
 */
export function getAspectRatio(configKey: keyof typeof IMAGE_CONFIGS): number {
  const config = IMAGE_CONFIGS[configKey];
  return config.width / config.height;
}

/**
 * Checks if an image's aspect ratio matches the required ratio within tolerance.
 *
 * @param imageWidth - The image's actual width
 * @param imageHeight - The image's actual height
 * @param requiredRatio - The required aspect ratio (e.g., 16/9)
 * @param tolerance - The allowed tolerance (default: 0.05 = 5%)
 * @returns True if the aspect ratio matches within tolerance
 *
 * @example
 * isAspectRatioMatch(1920, 1080, 16/9); // Returns true
 * isAspectRatioMatch(1920, 1200, 16/9); // Returns false
 */
export function isAspectRatioMatch(
  imageWidth: number,
  imageHeight: number,
  requiredRatio: number,
  tolerance: number = 0.05
): boolean {
  const imageRatio = imageWidth / imageHeight;
  const difference = Math.abs(imageRatio - requiredRatio) / requiredRatio;
  return difference <= tolerance;
}

/**
 * Formats an aspect ratio as a human-readable string.
 *
 * @param width - The width dimension
 * @param height - The height dimension
 * @returns Formatted aspect ratio string (e.g., "16:9", "4:3")
 *
 * @example
 * formatAspectRatio(1920, 1080); // Returns "16:9"
 * formatAspectRatio(1200, 900); // Returns "4:3"
 */
export function formatAspectRatio(width: number, height: number): string {
  // Find GCD to simplify ratio
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  const w = width / divisor;
  const h = height / divisor;
  return `${w}:${h}`;
}

/**
 * Calculates crop dimensions to achieve a target aspect ratio.
 *
 * @param imageWidth - The original image width
 * @param imageHeight - The original image height
 * @param targetRatio - The desired aspect ratio (width/height)
 * @returns Crop dimensions {width, height, x, y} centered on the image
 *
 * @example
 * const crop = calculateCropDimensions(1920, 1440, 16/9);
 * // Returns: { width: 1920, height: 1080, x: 0, y: 180 }
 */
export function calculateCropDimensions(
  imageWidth: number,
  imageHeight: number,
  targetRatio: number
): { width: number; height: number; x: number; y: number } {
  const imageRatio = imageWidth / imageHeight;

  let cropWidth: number;
  let cropHeight: number;
  let x: number;
  let y: number;

  if (imageRatio > targetRatio) {
    // Image is wider than target, crop width
    cropHeight = imageHeight;
    cropWidth = cropHeight * targetRatio;
    x = (imageWidth - cropWidth) / 2;
    y = 0;
  } else {
    // Image is taller than target, crop height
    cropWidth = imageWidth;
    cropHeight = cropWidth / targetRatio;
    x = 0;
    y = (imageHeight - cropHeight) / 2;
  }

  return {
    width: Math.round(cropWidth),
    height: Math.round(cropHeight),
    x: Math.round(x),
    y: Math.round(y),
  };
}
