import { prisma } from './prisma';

/**
 * Site setting keys
 */
export const SETTING_KEYS = {
  CENTS_PER_MINUTE: 'cents_per_minute',
} as const;

/**
 * Default cents per minute if not set in database
 * $0.15 per minute = 15 cents per minute
 */
export const DEFAULT_CENTS_PER_MINUTE = 15;

/**
 * Cache for settings values to avoid repeated database queries
 */
const globalForSettings = globalThis as unknown as {
  centsPerMinuteCache: { value: number; timestamp: number } | undefined;
};

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Get the current cents per minute setting
 * Caches result for performance
 *
 * @returns cents per minute value
 */
export async function getCentsPerMinute(): Promise<number> {
  const now = Date.now();

  // Check cache first
  if (
    globalForSettings.centsPerMinuteCache &&
    now - globalForSettings.centsPerMinuteCache.timestamp < CACHE_TTL
  ) {
    return globalForSettings.centsPerMinuteCache.value;
  }

  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: SETTING_KEYS.CENTS_PER_MINUTE },
    });

    const value = setting ? parseInt(setting.value, 10) : DEFAULT_CENTS_PER_MINUTE;

    // Validate parsed value, fallback to default if invalid
    const finalValue = isNaN(value) || value <= 0 ? DEFAULT_CENTS_PER_MINUTE : value;

    // Update cache
    globalForSettings.centsPerMinuteCache = {
      value: finalValue,
      timestamp: now,
    };

    return finalValue;
  } catch (error) {
    console.error('Error fetching cents per minute setting:', error);
    // Return cached value if available, otherwise default
    return globalForSettings.centsPerMinuteCache?.value ?? DEFAULT_CENTS_PER_MINUTE;
  }
}

/**
 * Set the cents per minute setting
 *
 * @param value - cents per minute (must be positive integer)
 * @throws Error if value is invalid
 */
export async function setCentsPerMinute(value: number): Promise<void> {
  // Validate value is positive integer
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error('Cents per minute must be a positive integer');
  }

  await prisma.siteSetting.upsert({
    where: { key: SETTING_KEYS.CENTS_PER_MINUTE },
    update: { value: value.toString() },
    create: {
      key: SETTING_KEYS.CENTS_PER_MINUTE,
      value: value.toString(),
    },
  });

  // Clear cache so next read gets fresh value
  globalForSettings.centsPerMinuteCache = undefined;
}

/**
 * Clear the settings cache
 * Useful for testing or when settings are updated externally
 */
export function clearSettingsCache(): void {
  globalForSettings.centsPerMinuteCache = undefined;
}
