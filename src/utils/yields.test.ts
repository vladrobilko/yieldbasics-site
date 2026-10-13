import { describe, expect, it } from 'vitest';

import { assets, rateRows } from '~/data/yields';
import { formatRate, productsLabel, ratesForAsset, sortByRate, sortLabel } from '~/utils/yields';

describe('formatRate', () => {
  it('always shows two decimals', () => {
    expect(formatRate(12.5)).toBe('12.50%');
    expect(formatRate(10)).toBe('10.00%');
    expect(formatRate(7.256)).toBe('7.26%');
  });
});

describe('sortByRate', () => {
  const items = [{ rate: 2 }, { rate: 10 }, { rate: 6.8 }];

  it('sorts highest first by default', () => {
    expect(sortByRate(items).map((i) => i.rate)).toEqual([10, 6.8, 2]);
  });

  it('sorts lowest first when descending is false', () => {
    expect(sortByRate(items, false).map((i) => i.rate)).toEqual([2, 6.8, 10]);
  });

  it('does not mutate the input', () => {
    sortByRate(items);
    expect(items.map((i) => i.rate)).toEqual([2, 10, 6.8]);
  });
});

describe('ratesForAsset', () => {
  it('returns only rows of the asset, highest rate first', () => {
    const rows = ratesForAsset(rateRows, 'usdt');
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.asset === 'USDT')).toBe(true);
    expect(rows.map((r) => r.rate)).toEqual([...rows.map((r) => r.rate)].sort((a, b) => b - a));
  });

  it('returns an empty list for an asset without offers', () => {
    expect(ratesForAsset(rateRows, 'DOGE')).toEqual([]);
  });
});

describe('productsLabel', () => {
  it('handles plural, singular and empty', () => {
    expect(productsLabel(5)).toBe('5 products across leading exchanges');
    expect(productsLabel(1)).toBe('1 product across leading exchanges');
    expect(productsLabel(0)).toBe('No products listed yet');
  });
});

describe('sortLabel', () => {
  it('names the current order', () => {
    expect(sortLabel(true)).toBe('Highest APR');
    expect(sortLabel(false)).toBe('Lowest APR');
  });
});

describe('sample data', () => {
  it('has unique row ids', () => {
    expect(new Set(rateRows.map((r) => r.id)).size).toBe(rateRows.length);
  });

  it('only uses assets that exist in the selector', () => {
    const symbols = new Set(assets.map((a) => a.symbol));
    expect(rateRows.every((r) => symbols.has(r.asset))).toBe(true);
  });
});
