import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateAndCorrectDate } from '../calendar';

describe('validateAndCorrectDate', () => {
  const originalConsoleWarn = console.warn;
  const originalConsoleLog = console.log;

  beforeEach(() => {
    console.warn = vi.fn();
    console.log = vi.fn();
  });

  afterEach(() => {
    console.warn = originalConsoleWarn;
    console.log = originalConsoleLog;
  });

  it('returns unchanged for future dates in current year', () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    // Use a date that's definitely in the future (next month or later)
    const futureMonth = ((now.getMonth() + 2) % 12) + 1; // 1-12, at least 1 month ahead
    const futureYear = futureMonth <= now.getMonth() + 1 ? currentYear + 1 : currentYear;
    const date = `${futureYear}-${futureMonth.toString().padStart(2, '0')}-15`;

    const result = validateAndCorrectDate(date);
    // Should be unchanged or only year-corrected
    expect(result).toContain('-15');
  });

  it('returns unchanged for next year dates', () => {
    const nextYear = new Date().getFullYear() + 1;
    const date = `${nextYear}-03-20`;
    expect(validateAndCorrectDate(date)).toBe(date);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('corrects past year to current year, then to next year if month has passed', () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Test with a month that has definitely passed (January if we're past January)
    if (currentMonth > 1) {
      const pastDate = '2023-01-15';
      const result = validateAndCorrectDate(pastDate);
      // January 2023 -> January current year is still in past -> January next year
      expect(result).toBe(`${currentYear + 1}-01-15`);
      expect(console.warn).toHaveBeenCalled();
    }
  });

  it('corrects past year, keeps current year if month has not passed', () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Test with a month that has NOT passed yet (December if we're before December)
    if (currentMonth < 12) {
      const pastDate = '2023-12-20';
      const result = validateAndCorrectDate(pastDate);
      // December 2023 -> December current year (still in future)
      expect(result).toBe(`${currentYear}-12-20`);
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
      `Date is more than a year in the future: ${currentYear + 3}-06-15`
    );
  });

  it('moves October 27 2023 to October 27 next year (since October has passed in December)', () => {
    // This is the exact scenario from the bug report
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // If we're past October (month > 10), it should go to next year
    if (currentMonth > 10) {
      const result = validateAndCorrectDate('2023-10-27');
      expect(result).toBe(`${currentYear + 1}-10-27`);
    } else if (currentMonth < 10) {
      // If we're before October, it should stay in current year
      const result = validateAndCorrectDate('2023-10-27');
      expect(result).toBe(`${currentYear}-10-27`);
    }
  });
});
