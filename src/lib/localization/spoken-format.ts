/**
 * German localization helpers for spoken text
 *
 * Provides conversion of numbers, times, and dates to spoken German format
 * for use in voice AI agent responses.
 */

/**
 * Convert numbers 0-59 to spoken German words
 * Used for hours and minutes in time formatting
 *
 * @param n - Number to convert (0-59, or 0-23 for hours)
 * @param extendedRange - If true, allows 0-23 range for 24-hour time (default: false)
 * @returns Spoken German word for the number
 */
export function numberToGerman(n: number, extendedRange: boolean = false): string {
  // Validate input
  if (typeof n !== 'number' || isNaN(n)) {
    throw new Error(`Invalid number: ${n}`);
  }

  // Round to nearest integer if float
  n = Math.round(n);

  // Standard range is 0-59 (for minutes), but hours can go to 23
  const maxValue = extendedRange ? 23 : 59;
  if (n < 0 || n > maxValue) {
    throw new Error(`Number ${n} is outside valid range 0-${maxValue}`);
  }

  // Direct mappings for 0-23 (covers all hours and common minutes)
  const units: Record<number, string> = {
    0: 'null',
    1: 'eins',
    2: 'zwei',
    3: 'drei',
    4: 'vier',
    5: 'fünf',
    6: 'sechs',
    7: 'sieben',
    8: 'acht',
    9: 'neun',
    10: 'zehn',
    11: 'elf',
    12: 'zwölf',
    13: 'dreizehn',
    14: 'vierzehn',
    15: 'fünfzehn',
    16: 'sechzehn',
    17: 'siebzehn',
    18: 'achtzehn',
    19: 'neunzehn',
    20: 'zwanzig',
    21: 'einundzwanzig',
    22: 'zweiundzwanzig',
    23: 'dreiundzwanzig',
  };

  if (n <= 23) {
    return units[n];
  }

  // Tens for 30-50
  const tens: Record<number, string> = {
    30: 'dreißig',
    40: 'vierzig',
    50: 'fünfzig',
  };

  // Get the tens digit (e.g., 24 -> 20, 35 -> 30)
  const tensValue = Math.floor(n / 10) * 10;
  const onesValue = n % 10;

  // Pure tens (30, 40, 50)
  if (onesValue === 0) {
    return tens[tensValue];
  }

  // Compound numbers: one-and-twenty pattern
  // 24 = "vierundzwanzig", 35 = "fünfunddreißig"
  const onesWord = onesValue === 1 ? 'ein' : units[onesValue];
  const tensWord = tensValue === 20 ? 'zwanzig' : tens[tensValue];

  return `${onesWord}und${tensWord}`;
}

/**
 * Convert 24-hour time string to spoken German
 * @param time - Time in "HH:MM" format (e.g., "14:30")
 * @returns Spoken German time (e.g., "vierzehn Uhr dreißig")
 */
export function timeToSpokenGerman(time: string): string {
  // Validate input
  if (!time || typeof time !== 'string') {
    throw new Error(`Invalid time input: ${time}. Expected string in HH:MM format.`);
  }

  const match = time.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid time format: ${time}. Expected HH:MM.`);
  }

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  if (isNaN(hours) || isNaN(minutes)) {
    throw new Error(`Could not parse time values from: ${time}`);
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(`Invalid time values: ${hours}:${minutes}. Hours must be 0-23, minutes 0-59.`);
  }

  const hoursWord = numberToGerman(hours);

  // For :00 minutes, just say "neun Uhr"
  if (minutes === 0) {
    return `${hoursWord} Uhr`;
  }

  // For other minutes, say "vierzehn Uhr dreißig"
  const minutesWord = numberToGerman(minutes);
  return `${hoursWord} Uhr ${minutesWord}`;
}

/**
 * Safely convert time to spoken German with fallback
 * Use this when you want to avoid throwing errors
 * @param time - Time in "HH:MM" format
 * @returns Spoken German time or the original string if parsing fails
 */
export function timeToSpokenGermanSafe(time: string): string {
  try {
    return timeToSpokenGerman(time);
  } catch {
    console.warn(`Failed to convert time to spoken German: ${time}`);
    return time;
  }
}

/**
 * Format a Date to written German format using Intl.DateTimeFormat
 * @param date - JavaScript Date object
 * @returns Written format like "15. Januar 2025"
 */
export function formatDateGerman(date: Date): string {
  // Validate input
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${date}`);
  }

  return new Intl.DateTimeFormat('de-DE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Safely format a Date to written German format with fallback
 * @param date - JavaScript Date object
 * @returns Written format or fallback string if invalid
 */
export function formatDateGermanSafe(date: Date | string | null | undefined): string {
  try {
    // Handle string inputs
    if (typeof date === 'string') {
      date = new Date(date);
    }

    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return 'Unbekanntes Datum';
    }

    return formatDateGerman(date);
  } catch {
    console.warn(`Failed to format date: ${date}`);
    return 'Unbekanntes Datum';
  }
}

/**
 * Format a Date to spoken German format for voice output
 * @param date - JavaScript Date object
 * @returns Spoken format like "Mittwoch, der 15. Januar"
 */
export function formatDateSpokenGerman(date: Date): string {
  // Validate input
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${date}`);
  }

  const weekday = new Intl.DateTimeFormat('de-DE', { weekday: 'long' }).format(date);
  const day = date.getDate();
  const month = new Intl.DateTimeFormat('de-DE', { month: 'long' }).format(date);

  // German ordinal: "der 15. Januar" (the 15th of January)
  return `${weekday}, der ${day}. ${month}`;
}

/**
 * Safely format a Date to spoken German format with fallback
 * @param date - JavaScript Date object
 * @returns Spoken format or fallback string if invalid
 */
export function formatDateSpokenGermanSafe(date: Date | string | null | undefined): string {
  try {
    // Handle string inputs
    if (typeof date === 'string') {
      date = new Date(date);
    }

    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return 'Unbekanntes Datum';
    }

    return formatDateSpokenGerman(date);
  } catch {
    console.warn(`Failed to format spoken date: ${date}`);
    return 'Unbekanntes Datum';
  }
}
