import { describe, expect, it } from 'vitest';

import {
  canonicalAsset,
  conditionLines,
  dedupeOffers,
  formatAmount,
  formatRateDate,
  fractionToPercent,
  estimatedReward,
  isBoosted,
  isStale,
  mergeRates,
  offerId,
  offerProblem,
  parsePercent,
  summarizeChanges,
  termLabel,
  toRateRow,
  type ManualOffer,
  type RateOffer,
  type RatesFile,
} from '~/utils/rates';

const offer = (overrides: Partial<RateOffer> = {}): RateOffer => ({
  platformId: 'bybit',
  asset: 'USDT',
  product: 'Flexible Savings',
  termDays: 0,
  rate: 5,
  type: 'APR',
  ...overrides,
});

describe('number helpers', () => {
  it('converts fractions and percent strings to rounded percentages', () => {
    expect(fractionToPercent('0.06443267')).toBe(6.44);
    expect(fractionToPercent(0.035)).toBe(3.5);
    expect(parsePercent('6.93%')).toBe(6.93);
    expect(parsePercent('5.325805%')).toBe(5.33);
  });

  it('formats amounts compactly', () => {
    expect(formatAmount(500)).toBe('500');
    expect(formatAmount(1500)).toBe('1.5K');
    expect(formatAmount(300000)).toBe('300K');
    expect(formatAmount(2_000_000)).toBe('2M');
    expect(formatAmount(0.5)).toBe('0.5');
  });

  it('labels terms', () => {
    expect(termLabel(0)).toBe('Flexible');
    expect(termLabel(30)).toBe('30-day');
  });
});

describe('conditionLines', () => {
  it('describes a capped boost and the rate above it', () => {
    const tiered = offer({
      rate: 6.93,
      tiers: [
        { min: 0, max: 100, rate: 6.93 },
        { min: 100, max: null, rate: 1.93 },
      ],
    });
    expect(conditionLines(tiered)).toEqual(['Up to 100 USDT: 6.93% APR', 'Above 100: 1.93% APR']);
    expect(isBoosted(tiered)).toBe(true);
  });

  it('points at the best band when tiers are uneven', () => {
    const uneven = offer({
      rate: 10,
      tiers: [
        { min: 0, max: 1000, rate: 4 },
        { min: 1000, max: 100_000, rate: 6.2 },
        { min: 100_000, max: 110_000, rate: 10 },
        { min: 110_000, max: null, rate: 1.8 },
      ],
    });
    expect(conditionLines(uneven)).toEqual(['100K–110K USDT: 10% APR', 'Other amounts: 1.8–6.2% APR']);
    expect(isBoosted(uneven)).toBe(true);
  });

  it('describes a single capped band', () => {
    expect(conditionLines(offer({ tiers: [{ min: 0, max: 5_000_000, rate: 5 }] }))).toEqual(['Up to 5M USDT', '']);
  });

  it('falls back to "Any amount" and the note', () => {
    expect(conditionLines(offer({ note: 'On Ethereum' }))).toEqual(['Any amount', 'On Ethereum']);
    expect(isBoosted(offer())).toBe(false);
  });
});

describe('offer identity and validation', () => {
  it('builds stable ids', () => {
    expect(offerId(offer())).toBe('bybit-usdt-flexible-savings-flexible');
    expect(offerId(offer({ termDays: 30, product: 'Fixed Earn' }))).toBe('bybit-usdt-fixed-earn-30d');
  });

  it('matches asset symbols case-insensitively', () => {
    expect(canonicalAsset('usde', ['USDT', 'USDe'])).toBe('USDe');
    expect(canonicalAsset('WETH', ['ETH'])).toBeUndefined();
  });

  it('maps old tickers of renamed coins', () => {
    expect(canonicalAsset('TON', ['GRAM'])).toBe('GRAM');
    expect(canonicalAsset('gram', ['GRAM'])).toBe('GRAM');
  });

  it('flags offers that should not be published', () => {
    const assets = ['USDT'];
    const platforms = ['bybit'];
    expect(offerProblem(offer(), assets, platforms)).toBeNull();
    expect(offerProblem(offer({ asset: 'DOGE' }), assets, platforms)).toMatch(/unknown asset/);
    expect(offerProblem(offer({ platformId: 'x' }), assets, platforms)).toMatch(/unknown platform/);
    expect(offerProblem(offer({ rate: 0 }), assets, platforms)).toMatch(/rate out of range/);
    expect(offerProblem(offer({ rate: 250 }), assets, platforms)).toMatch(/rate out of range/);
    expect(offerProblem(offer({ termDays: 1.5 }), assets, platforms)).toMatch(/bad term/);
  });

  it('keeps the best rate per id', () => {
    const offers = dedupeOffers([offer({ rate: 4 }), offer({ rate: 7 }), offer({ termDays: 7, rate: 1 })]);
    expect(offers.map((o) => o.rate).sort()).toEqual([1, 7]);
  });
});

describe('isStale', () => {
  const now = new Date('2026-10-14T06:00:00Z');
  it('is false within the window and true after it', () => {
    expect(isStale('2026-10-12T06:00:00Z', now)).toBe(false);
    expect(isStale('2026-10-10T06:00:00Z', now)).toBe(true);
  });
});

describe('mergeRates', () => {
  const now = new Date('2026-10-14T06:00:00Z');
  const previous: RatesFile = {
    generatedAt: '2026-10-13T06:00:00.000Z',
    sources: {
      gate: { status: 'ok', checkedAt: '2026-10-13T06:00:00.000Z', updatedAt: '2026-10-13T06:00:00.000Z', offers: 1 },
    },
    offers: [
      {
        ...offer({ platformId: 'gate', product: 'Simple Earn', rate: 2.4 }),
        id: 'gate-usdt-simple-earn-flexible',
        source: 'api',
        updatedAt: '2026-10-13T06:00:00.000Z',
      },
    ],
  };
  const manual: ManualOffer[] = [
    { ...offer({ platformId: 'mexc', product: 'Savings', rate: 3 }), verifiedAt: '2026-10-12' },
    // Ignored: bybit has an automatic source.
    { ...offer({ rate: 99 }), verifiedAt: '2026-10-12' },
  ];

  const merged = mergeRates({
    previous,
    results: {
      bybit: { ok: true, source: 'api', offers: [offer({ rate: 6.9 })] },
      gate: { ok: false, error: 'HTTP 503' },
    },
    manual,
    now,
  });

  it('stores fresh offers with the current time', () => {
    const bybit = merged.offers.find((o) => o.platformId === 'bybit');
    expect(bybit).toMatchObject({ rate: 6.9, source: 'api', updatedAt: now.toISOString() });
    expect(merged.sources.bybit).toMatchObject({ status: 'ok', offers: 1 });
  });

  it('keeps the previous offers of a failed source', () => {
    expect(merged.offers.find((o) => o.platformId === 'gate')).toEqual(previous.offers[0]);
    expect(merged.sources.gate).toMatchObject({
      status: 'failed',
      error: 'HTTP 503',
      updatedAt: '2026-10-13T06:00:00.000Z',
      offers: 1,
    });
  });

  it('adds manual offers only for platforms without a source', () => {
    const mexc = merged.offers.find((o) => o.platformId === 'mexc');
    expect(mexc).toMatchObject({ rate: 3, source: 'manual', updatedAt: '2026-10-12T00:00:00.000Z' });
    expect(mexc).not.toHaveProperty('verifiedAt');
    expect(merged.offers.filter((o) => o.platformId === 'bybit')).toHaveLength(1);
    expect(merged.sources.mexc).toMatchObject({ status: 'manual', offers: 1 });
  });

  it('sorts offers by id for stable diffs', () => {
    const ids = merged.offers.map((o) => o.id);
    expect(ids).toEqual([...ids].sort());
  });

  it('summarises changes and failures', () => {
    const summary = summarizeChanges(previous, merged);
    expect(summary).toContain('New: `bybit-usdt-flexible-savings-flexible` 6.9% APR');
    expect(summary).toContain('New: `mexc-usdt-savings-flexible` 3% APR');
    expect(summary).toContain('- gate: HTTP 503 (kept 1 previous offers)');
    expect(summary).not.toContain('Removed');
  });
});

describe('toRateRow', () => {
  const stored = {
    ...offer({
      rate: 6.93,
      tiers: [
        { min: 0, max: 100, rate: 6.93 },
        { min: 100, max: null, rate: 1.93 },
      ],
    }),
    id: 'bybit-usdt-flexible-savings-flexible',
    source: 'api' as const,
    updatedAt: '2026-10-14T06:00:00.000Z',
  };

  it('builds a table row with condition text, term label and promo flag', () => {
    expect(toRateRow(stored, new Date('2026-10-14T12:00:00Z'))).toEqual({
      id: 'bybit-usdt-flexible-savings-flexible',
      platformId: 'bybit',
      asset: 'USDT',
      rate: 6.93,
      type: 'APR',
      product: 'Flexible Savings',
      term: 'Flexible',
      termDays: 0,
      conditionTop: 'Up to 100 USDT: 6.93% APR',
      conditionBottom: 'Above 100: 1.93% APR',
      promotional: true,
      audience: 'all',
      maxReward: null,
      source: 'api',
      updatedAt: '2026-10-14T06:00:00.000Z',
      stale: false,
    });
  });

  it('marks old rates as stale', () => {
    expect(toRateRow(stored, new Date('2026-10-20T00:00:00Z')).stale).toBe(true);
  });
});

describe('formatRateDate', () => {
  it('formats in UTC', () => {
    expect(formatRateDate('2026-10-14T23:30:00.000Z')).toBe('Oct 14, 2026');
  });
});

describe('new-user offers', () => {
  const mexc = offer({
    platformId: 'mexc',
    product: 'Fixed Savings',
    termDays: 2,
    rate: 600,
    audience: 'new-user',
    maxAmount: 200,
  });

  it('estimates the most a new user can earn', () => {
    expect(estimatedReward(mexc)).toBe(6.58);
    expect(estimatedReward(offer({ audience: 'new-user', rate: 100 }))).toBeNull();
    expect(estimatedReward(offer({ audience: 'new-user', termDays: 7, rate: 100 }))).toBeNull();
  });

  it('describes the cap and the reward', () => {
    expect(conditionLines(mexc)).toEqual(['New users · max 200 USDT', '2 days · ≈ $6.58 total']);
    expect(conditionLines(offer({ audience: 'new-user', termDays: 7, rate: 100 }))).toEqual([
      'New users only',
      '7 days',
    ]);
  });

  it('gets its own id and is never marked as a promo', () => {
    expect(offerId(mexc)).toBe('mexc-usdt-fixed-savings-2d-new-user');
    expect(
      isBoosted({
        ...mexc,
        tiers: [
          { min: 0, max: 100, rate: 600 },
          { min: 100, max: null, rate: 1 },
        ],
      })
    ).toBe(false);
  });

  it('allows high rates for USDT/USDC only', () => {
    const assets = ['USDT', 'BTC'];
    expect(offerProblem(mexc, assets, ['mexc'])).toBeNull();
    expect(offerProblem({ ...mexc, rate: 1500 }, assets, ['mexc'])).toMatch(/rate out of range/);
    expect(offerProblem({ ...mexc, asset: 'BTC' }, assets, ['mexc'])).toMatch('USDT/USDC only');
    expect(offerProblem({ ...mexc, audience: undefined }, assets, ['mexc'])).toMatch(/rate out of range/);
  });

  it('turns into a new-user row with its reward', () => {
    const row = toRateRow(
      { ...mexc, id: offerId(mexc), source: 'web', updatedAt: '2026-10-14T06:00:00.000Z' },
      new Date('2026-10-14T07:00:00Z')
    );
    expect(row).toMatchObject({ audience: 'new-user', maxReward: 6.58, promotional: false, term: '2-day' });
  });
});

describe('manual offer age', () => {
  const now = new Date('2026-10-14T06:00:00Z');
  const manual = (verifiedAt: string): ManualOffer => ({
    ...offer({ platformId: 'weex', product: 'Auto Earn' }),
    verifiedAt,
  });

  it('keeps manual offers for 30 days after they were verified', () => {
    const merged = (verifiedAt: string) =>
      mergeRates({ previous: null, results: {}, manual: [manual(verifiedAt)], now });
    expect(merged('2026-09-15T06:00:00Z').offers).toHaveLength(1);
    expect(merged('2026-09-13T06:00:00Z').offers).toHaveLength(0);
  });
});
