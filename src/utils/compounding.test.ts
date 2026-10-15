import { describe, expect, it } from 'vitest';

import { aprToApy, apyToApr, calculate, earnings } from '~/utils/compounding';

describe('aprToApy', () => {
  it('adds the effect of compounding', () => {
    expect(aprToApy(10, 12)).toBeCloseTo(10.4713, 4);
    expect(aprToApy(10, 365)).toBeCloseTo(10.5156, 4);
    expect(aprToApy(5, 365)).toBeCloseTo(5.1267, 4);
  });

  it('returns the APR unchanged without compounding', () => {
    expect(aprToApy(10, 0)).toBe(10);
  });
});

describe('apyToApr', () => {
  it('is the inverse of aprToApy', () => {
    for (const periods of [365, 52, 12]) {
      expect(apyToApr(aprToApy(8, periods), periods)).toBeCloseTo(8, 10);
    }
  });

  it('returns the APY unchanged without compounding', () => {
    expect(apyToApr(10, 0)).toBe(10);
  });
});

describe('earnings', () => {
  it('uses simple interest without compounding', () => {
    // 600% APR for 2 days on 200 USDT, the new-user offer example.
    expect(earnings(200, 600, 2, 0)).toBeCloseTo(6.575, 3);
  });

  it('matches the APY over a full year when compounding', () => {
    expect(earnings(1000, 10, 365, 365)).toBeCloseTo(105.156, 3);
  });

  it('earns nothing on a zero amount or zero days', () => {
    expect(earnings(0, 10, 365, 365)).toBe(0);
    expect(earnings(1000, 10, 0, 365)).toBe(0);
  });
});

describe('calculate', () => {
  it('converts an APR to APY and computes earnings', () => {
    const result = calculate({ rate: 10, type: 'APR', periods: 365, amount: 1000, days: 365 });
    expect(result?.apr).toBe(10);
    expect(result?.apy).toBeCloseTo(10.5156, 4);
    expect(result?.earned).toBeCloseTo(105.156, 3);
  });

  it('converts an APY back to its APR', () => {
    const result = calculate({ rate: 10.5156, type: 'APY', periods: 365, amount: 1000, days: 365 });
    expect(result?.apr).toBeCloseTo(10, 3);
    expect(result?.earned).toBeCloseTo(105.156, 2);
  });

  it('rejects missing or negative inputs', () => {
    expect(calculate({ rate: NaN, type: 'APR', periods: 365, amount: 1000, days: 365 })).toBeNull();
    expect(calculate({ rate: 5, type: 'APR', periods: 365, amount: -1, days: 365 })).toBeNull();
  });
});
