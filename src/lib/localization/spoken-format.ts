/**
 * German localization helpers for spoken text
 *
 * Provides conversion of numbers, times, and dates to spoken German format
 * for use in voice AI agent responses.
 */

/**
 * Convert numbers 0-59 to spoken German words
 * Used for hours and minutes in time formatting
 */
export function numberToGerman(n: number): string {
  if (n < 0 || n > 59) {
    throw new Error(`Number ${n} is outside valid range 0-59`);
  }

  // Direct mappings for 0-20
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
  };

  if (n <= 20) {
    return units[n];
  }

  // Tens for 30-50
  const tens: Record<number, string> = {
    30: 'dreißig',
    40: 'vierzig',
    50: 'fünfzig',
  };

  // Get the tens digit (e.g., 21 -> 20, 35 -> 30)
  const tensValue = Math.floor(n / 10) * 10;
  const onesValue = n % 10;

  // Pure tens (30, 40, 50)
  if (onesValue === 0) {
    return tens[tensValue];
  }

  // Compound numbers: one-and-twenty pattern
  // 21 = "einundzwanzig", 35 = "fünfunddreißig"
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
  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid time format: ${time}. Expected HH:MM.`);
  }

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(`Invalid time values: ${hours}:${minutes}`);
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
 * Format a Date to written German format using Intl.DateTimeFormat
 * @param date - JavaScript Date object
 * @returns Written format like "15. Januar 2025"
 */
export function formatDateGerman(date: Date): string {
  return new Intl.DateTimeFormat('de-DE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Format a Date to spoken German format for voice output
 * @param date - JavaScript Date object
 * @returns Spoken format like "Mittwoch, der 15. Januar"
 */
export function formatDateSpokenGerman(date: Date): string {
  const weekday = new Intl.DateTimeFormat('de-DE', { weekday: 'long' }).format(date);
  const day = date.getDate();
  const month = new Intl.DateTimeFormat('de-DE', { month: 'long' }).format(date);

  // German ordinal: "der 15. Januar" (the 15th of January)
  return `${weekday}, der ${day}. ${month}`;
}
