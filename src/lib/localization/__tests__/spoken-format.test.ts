import { describe, it, expect } from 'vitest';
import {
  numberToGerman,
  timeToSpokenGerman,
  formatDateGerman,
  formatDateSpokenGerman,
} from '../spoken-format';

describe('numberToGerman', () => {
  it('converts single digits correctly', () => {
    expect(numberToGerman(0)).toBe('null');
    expect(numberToGerman(1)).toBe('eins');
    expect(numberToGerman(5)).toBe('fünf');
    expect(numberToGerman(9)).toBe('neun');
  });

  it('converts teens correctly', () => {
    expect(numberToGerman(10)).toBe('zehn');
    expect(numberToGerman(11)).toBe('elf');
    expect(numberToGerman(12)).toBe('zwölf');
    expect(numberToGerman(14)).toBe('vierzehn');
    expect(numberToGerman(17)).toBe('siebzehn');
    expect(numberToGerman(19)).toBe('neunzehn');
  });

  it('converts 20 correctly', () => {
    expect(numberToGerman(20)).toBe('zwanzig');
  });

  it('converts compound numbers (21-29) correctly', () => {
    expect(numberToGerman(21)).toBe('einundzwanzig');
    expect(numberToGerman(22)).toBe('zweiundzwanzig');
    expect(numberToGerman(25)).toBe('fünfundzwanzig');
    expect(numberToGerman(29)).toBe('neunundzwanzig');
  });

  it('converts 30-39 correctly', () => {
    expect(numberToGerman(30)).toBe('dreißig');
    expect(numberToGerman(31)).toBe('einunddreißig');
    expect(numberToGerman(35)).toBe('fünfunddreißig');
    expect(numberToGerman(39)).toBe('neununddreißig');
  });

  it('converts 40-49 correctly', () => {
    expect(numberToGerman(40)).toBe('vierzig');
    expect(numberToGerman(42)).toBe('zweiundvierzig');
    expect(numberToGerman(45)).toBe('fünfundvierzig');
  });

  it('converts 50-59 correctly', () => {
    expect(numberToGerman(50)).toBe('fünfzig');
    expect(numberToGerman(55)).toBe('fünfundfünfzig');
    expect(numberToGerman(59)).toBe('neunundfünfzig');
  });

  it('throws for numbers outside 0-59', () => {
    expect(() => numberToGerman(-1)).toThrow();
    expect(() => numberToGerman(60)).toThrow();
    expect(() => numberToGerman(100)).toThrow();
  });
});

describe('timeToSpokenGerman', () => {
  it('converts full hours correctly', () => {
    expect(timeToSpokenGerman('09:00')).toBe('neun Uhr');
    expect(timeToSpokenGerman('14:00')).toBe('vierzehn Uhr');
    expect(timeToSpokenGerman('0:00')).toBe('null Uhr');
    expect(timeToSpokenGerman('23:00')).toBe('dreiundzwanzig Uhr');
  });

  it('converts hours with minutes correctly', () => {
    expect(timeToSpokenGerman('14:30')).toBe('vierzehn Uhr dreißig');
    expect(timeToSpokenGerman('9:15')).toBe('neun Uhr fünfzehn');
    expect(timeToSpokenGerman('10:45')).toBe('zehn Uhr fünfundvierzig');
    expect(timeToSpokenGerman('08:05')).toBe('acht Uhr fünf');
  });

  it('handles leading zeros correctly', () => {
    expect(timeToSpokenGerman('08:00')).toBe('acht Uhr');
    expect(timeToSpokenGerman('08:05')).toBe('acht Uhr fünf');
    expect(timeToSpokenGerman('08:30')).toBe('acht Uhr dreißig');
  });

  it('throws for invalid time formats', () => {
    expect(() => timeToSpokenGerman('invalid')).toThrow();
    expect(() => timeToSpokenGerman('25:00')).toThrow();
    expect(() => timeToSpokenGerman('14:60')).toThrow();
    expect(() => timeToSpokenGerman('14-30')).toThrow();
  });
});

describe('formatDateGerman', () => {
  it('formats dates in German written format', () => {
    const date = new Date(2025, 0, 15); // January 15, 2025
    const result = formatDateGerman(date);
    // Format: "15. Januar 2025"
    expect(result).toMatch(/15\.\s*Januar\s*2025/);
  });

  it('formats different months correctly', () => {
    const march = new Date(2025, 2, 22);
    expect(formatDateGerman(march)).toMatch(/22\.\s*März\s*2025/);

    const december = new Date(2025, 11, 1);
    expect(formatDateGerman(december)).toMatch(/1\.\s*Dezember\s*2025/);
  });
});

describe('formatDateSpokenGerman', () => {
  it('formats dates with weekday in German', () => {
    // Wednesday, January 15, 2025
    const date = new Date(2025, 0, 15);
    const result = formatDateSpokenGerman(date);
    // Format: "Mittwoch, der 15. Januar"
    expect(result).toMatch(/Mittwoch,\s*der\s*15\.\s*Januar/);
  });

  it('formats different weekdays correctly', () => {
    // Monday, January 13, 2025
    const monday = new Date(2025, 0, 13);
    expect(formatDateSpokenGerman(monday)).toMatch(/Montag,\s*der\s*13\.\s*Januar/);

    // Friday, December 5, 2025
    const friday = new Date(2025, 11, 5);
    expect(formatDateSpokenGerman(friday)).toMatch(/Freitag,\s*der\s*5\.\s*Dezember/);
  });
});
