import { describe, expect, it } from 'vitest';

import { addDay, formatMonth, historyDate, historyMonthOf, mergeMonths, snapshotOf } from '~/utils/rateHistory';
import type { RatesFile, StoredOffer } from '~/utils/rates';

const NOW = '2026-10-30T02:36:24.721Z';

const stored = (id: string, rate: number, overrides: Partial<StoredOffer> = {}): StoredOffer => ({
  platformId: id.split('-')[0],
  asset: 'USDT',
  product: 'Simple Earn',
  termDays: 0,
  rate,
  type: 'APR',
  id,
  source: 'api',
  updatedAt: NOW,
  ...overrides,
});

const ratesFile = (generatedAt: string, offers: StoredOffer[]): RatesFile => ({ generatedAt, sources: {}, offers });

describe('snapshotOf', () => {
  it('keeps fresh and manual offers, sorted by id, and drops offers kept from a failed source', () => {
    const rates = ratesFile(NOW, [
      stored('okx-usdt', 3.5),
      stored('binance-usdt', 7.54),
      stored('bybit-usdt', 6.97, { updatedAt: '2026-10-28T02:14:27.576Z' }),
      stored('weex-usdt', 10, { source: 'manual', updatedAt: '2026-10-30T00:00:00.000Z' }),
    ]);
    const day = snapshotOf(rates);
    expect(day).toEqual({ 'binance-usdt': 7.54, 'okx-usdt': 3.5, 'weex-usdt': 10 });
    expect(Object.keys(day)).toEqual(['binance-usdt', 'okx-usdt', 'weex-usdt']);
  });
});

describe('dates', () => {
  it('uses the UTC date of generatedAt and its month', () => {
    expect(historyDate(ratesFile('2026-10-31T23:59:00.000Z', []))).toBe('2026-10-31');
    expect(historyMonthOf('2026-11-01')).toBe('2026-11');
  });
});

describe('month helpers', () => {
  it('adds a day in date order and replaces the same day', () => {
    let month = addDay({}, '2026-10-30', { a: 1 });
    month = addDay(month, '2026-10-28', { a: 2 });
    month = addDay(month, '2026-10-30', { a: 3 });
    expect(Object.keys(month)).toEqual(['2026-10-28', '2026-10-30']);
    expect(month['2026-10-30']).toEqual({ a: 3 });
  });

  it('merges two months, the primary winning on shared days', () => {
    const merged = mergeMonths({ '2026-10-28': { a: 1 } }, { '2026-10-28': { a: 9 }, '2026-10-27': { a: 2 } });
    expect(merged).toEqual({ '2026-10-27': { a: 2 }, '2026-10-28': { a: 1 } });
    expect(Object.keys(merged)).toEqual(['2026-10-27', '2026-10-28']);
  });

  it('writes one line per day that parses back to the same data', () => {
    const month = { '2026-10-27': { a: 1.5 }, '2026-10-28': { a: 2, b: 3 } };
    const text = formatMonth(month);
    expect(text).toBe('{\n  "2026-10-27": {"a":1.5},\n  "2026-10-28": {"a":2,"b":3}\n}\n');
    expect(JSON.parse(text)).toEqual(month);
    expect(formatMonth({})).toBe('{}\n');
  });
});
