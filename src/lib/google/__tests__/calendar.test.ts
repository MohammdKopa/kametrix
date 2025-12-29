import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateAndCorrectDate } from '../calendar';

describe('validateAndCorrectDate', () => {
  const originalConsoleWarn = console.warn;

  beforeEach(() => {
    console.warn = vi.fn();
  });

  afterEach(() => {
    console.warn = originalConsoleWarn;
  });

  it('returns unchanged for current year dates', () => {
    const currentYear = new Date().getFullYear();
    const date = `${currentYear}-06-15`;
    expect(validateAndCorrectDate(date)).toBe(date);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('returns unchanged for next year dates', () => {
    const nextYear = new Date().getFullYear() + 1;
    const date = `${nextYear}-03-20`;
    expect(validateAndCorrectDate(date)).toBe(date);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('corrects 2023 to current year', () => {
    const currentYear = new Date().getFullYear();
    const pastDate = '2023-06-15';
    expect(validateAndCorrectDate(pastDate)).toBe(`${currentYear}-06-15`);
    expect(console.warn).toHaveBeenCalledWith(
      `Date year corrected from 2023 to ${currentYear}: 2023-06-15`
    );
  });

  it('corrects 2024 to current year if current year is 2025+', () => {
    const currentYear = new Date().getFullYear();
    if (currentYear >= 2025) {
      const pastDate = '2024-12-25';
      expect(validateAndCorrectDate(pastDate)).toBe(`${currentYear}-12-25`);
      expect(console.warn).toHaveBeenCalled();
    }
  });

  it('returns unchanged for invalid format but logs warning', () => {
    const invalid = 'not-a-date';
    expect(validateAndCorrectDate(invalid)).toBe(invalid);
    expect(console.warn).toHaveBeenCalledWith(
      'Invalid date format: not-a-date, expected YYYY-MM-DD'
    );
  });

  it('returns unchanged for invalid date with wrong separator', () => {
    const invalid = '2025/06/15';
    expect(validateAndCorrectDate(invalid)).toBe(invalid);
    expect(console.warn).toHaveBeenCalled();
  });

  it('allows far future dates but logs warning', () => {
    const currentYear = new Date().getFullYear();
    const farFuture = `${currentYear + 3}-06-15`;
    expect(validateAndCorrectDate(farFuture)).toBe(farFuture);
    expect(console.warn).toHaveBeenCalledWith(
      `Date is more than a year in the future: ${farFuture}`
    );
  });

  it('preserves month and day when correcting year', () => {
    const currentYear = new Date().getFullYear();
    expect(validateAndCorrectDate('2020-01-31')).toBe(`${currentYear}-01-31`);
    expect(validateAndCorrectDate('2019-12-25')).toBe(`${currentYear}-12-25`);
    expect(validateAndCorrectDate('2023-02-14')).toBe(`${currentYear}-02-14`);
  });
});
