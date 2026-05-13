import { describe, it, expect } from 'vitest';
import { toMoneyNumber } from '../money';

describe('toMoneyNumber', () => {
  it('returns 0 for null/undefined', () => {
    expect(toMoneyNumber(null)).toBe(0);
    expect(toMoneyNumber(undefined)).toBe(0);
  });

  it('parses numbers and numeric strings', () => {
    expect(toMoneyNumber(123)).toBe(123);
    expect(toMoneyNumber('  456 ')).toBe(456);
    expect(toMoneyNumber('not-a-number')).toBe(0);
  });

  it('uses toNumber when provided', () => {
    const obj = { toNumber: () => 789 } as any;
    expect(toMoneyNumber(obj)).toBe(789);
  });
});
