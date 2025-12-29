# Testing Patterns

**Analysis Date:** 2025-12-29

## Test Framework

**Runner:**
- Vitest 4.0.16
- No explicit vitest.config.ts (uses defaults)

**Assertion Library:**
- Vitest built-in expect
- Matchers: `toBe`, `toEqual`, `toThrow`, `toHaveBeenCalled`, `toHaveBeenCalledWith`

**Run Commands:**
```bash
npm test                              # Run all tests
npm run test:watch                    # Watch mode (vitest)
npm test -- path/to/file.test.ts     # Single file
```

## Test File Organization

**Location:**
- Colocated in `__tests__/` directories alongside source
- Pattern: `src/lib/{module}/__tests__/{module}.test.ts`

**Naming:**
- `*.test.ts` for all test files

**Structure:**
```
src/
  lib/
    google/
      calendar.ts
      __tests__/
        calendar.test.ts
    localization/
      spoken-format.ts
      __tests__/
        spoken-format.test.ts
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('ModuleName', () => {
  describe('functionName', () => {
    beforeEach(() => {
      // setup - mock console, reset state
    });

    afterEach(() => {
      // teardown - restore mocks
    });

    it('should handle success case', () => {
      // arrange
      const input = 'test';

      // act
      const result = functionName(input);

      // assert
      expect(result).toBe('expected');
    });

    it('should handle error case', () => {
      expect(() => functionName(null)).toThrow();
    });
  });
});
```

**Patterns:**
- Use `beforeEach` for per-test setup
- Use `afterEach` to restore mocks
- Arrange/act/assert structure

## Mocking

**Framework:**
- Vitest built-in mocking (`vi`)

**Patterns:**
```typescript
const originalConsoleWarn = console.warn;

beforeEach(() => {
  console.warn = vi.fn();
});

afterEach(() => {
  console.warn = originalConsoleWarn;
});

it('logs warning', () => {
  functionThatWarns();
  expect(console.warn).toHaveBeenCalledWith('expected message');
});
```

**What to Mock:**
- Console methods (warn, error, log)
- External API calls
- Date/time (for date validation tests)

**What NOT to Mock:**
- Pure functions under test
- Internal utilities

## Fixtures and Factories

**Test Data:**
```typescript
// Inline test data for simple cases
const currentYear = new Date().getFullYear();
const date = `${currentYear}-06-15`;

// Factory pattern for complex data
function createTestDate(year: number, month: string, day: string): string {
  return `${year}-${month}-${day}`;
}
```

**Location:**
- Inline in test files for simple data
- No separate fixtures directory currently

## Coverage

**Requirements:**
- No enforced coverage target
- Coverage tracked for awareness only

**Current Status:**
- 2 test files total
- ~1.4% coverage (142 source files, 2 test files)
- Critical gaps in payment and credit logic

**Untested Areas:**
- API routes (0 tests)
- Authentication logic (0 tests)
- Credit deduction (`src/lib/credits.ts`)
- Stripe webhook handler (`src/app/api/webhooks/stripe/route.ts`)
- Vapi webhook handler (`src/app/api/webhooks/vapi/route.ts`)
- React components (0 tests)

## Test Types

**Unit Tests:**
- Test single function in isolation
- Mock external dependencies
- Current examples:
  - `calendar.test.ts`: Tests `validateAndCorrectDate()` function (8 tests)
  - `spoken-format.test.ts`: Tests German formatting functions

**Integration Tests:**
- None currently

**E2E Tests:**
- None currently

## Common Patterns

**Async Testing:**
```typescript
it('should handle async operation', async () => {
  const result = await asyncFunction();
  expect(result).toBe('expected');
});
```

**Error Testing:**
```typescript
it('should throw on invalid input', () => {
  expect(() => functionCall()).toThrow('error message');
});
```

**Date Testing:**
```typescript
it('corrects past year dates', () => {
  const currentYear = new Date().getFullYear();
  const pastDate = '2023-06-15';
  expect(validateAndCorrectDate(pastDate)).toBe(`${currentYear}-06-15`);
});
```

**Conditional Tests:**
```typescript
it('corrects 2024 to current year if current year is 2025+', () => {
  const currentYear = new Date().getFullYear();
  if (currentYear >= 2025) {
    const pastDate = '2024-12-25';
    expect(validateAndCorrectDate(pastDate)).toBe(`${currentYear}-12-25`);
  }
});
```

## Existing Test Files

**`src/lib/google/__tests__/calendar.test.ts`:**
- Tests `validateAndCorrectDate()` function
- 8 test cases covering:
  - Current year dates (unchanged)
  - Next year dates (unchanged)
  - 2023 correction to current year
  - 2024 correction (if current year >= 2025)
  - Invalid format handling
  - Wrong separator handling
  - Far future date warnings
  - Month/day preservation during correction

**`src/lib/localization/__tests__/spoken-format.test.ts`:**
- Tests German localization functions
- Covers:
  - `numberToGerman()`: 0-59 number conversion
  - `timeToSpokenGerman()`: Time formatting
  - `dateToSpokenGerman()`: Date with weekday formatting
  - Edge cases and error conditions

---

*Testing analysis: 2025-12-29*
*Update when test patterns change*
