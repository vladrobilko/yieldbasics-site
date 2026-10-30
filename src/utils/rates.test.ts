import { describe, expect, it } from 'vitest';

import {
  applyManualOffers,
  canonicalAsset,
  conditionLines,
  dedupeOffers,
  formatAmount,
  formatRateDate,
  fractionToPercent,
  estimatedReward,
  isBoosted,
  isStale,
  manualExpiries,
  mergeRates,
  offerId,
  offerProblem,
  parsePercent,
  holdReasons,
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
    expect(formatAmount(0.003)).toBe('0.003');
    expect(formatAmount(0.005)).toBe('0.005');
    expect(formatAmount(0.0125)).toBe('0.0125');
    expect(formatAmount(0.12345)).toBe('0.123');
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
    { ...offer({ platformId: 'weex', product: 'Savings', rate: 3 }), verifiedAt: '2026-10-12' },
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
    const weex = merged.offers.find((o) => o.platformId === 'weex');
    expect(weex).toMatchObject({ rate: 3, source: 'manual', updatedAt: '2026-10-12T00:00:00.000Z' });
    expect(weex).not.toHaveProperty('verifiedAt');
    expect(merged.offers.filter((o) => o.platformId === 'bybit')).toHaveLength(1);
    expect(merged.sources.weex).toMatchObject({ status: 'manual', offers: 1 });
  });

  it('sorts offers by id for stable diffs', () => {
    const ids = merged.offers.map((o) => o.id);
    expect(ids).toEqual([...ids].sort());
  });

  it('summarises changes and failures', () => {
    const summary = summarizeChanges(previous, merged);
    expect(summary).toContain('### New offers (2)');
    expect(summary).toContain('- `bybit-usdt-flexible-savings-flexible` 6.9% APR');
    expect(summary).toContain('- `weex-usdt-savings-flexible` 3% APR');
    expect(summary).toContain('- gate: HTTP 503 (kept 1 previous offers, last success Oct 13, 2026)');
    expect(summary).toContain('### Removed offers (0)\nNone.');
    expect(summary.startsWith('**Needs review:** 1 failed source.')).toBe(true);
  });

  it('flags big moves and explains removals', () => {
    const stored = (id: string, platformId: string, rate: number) => ({
      ...offer({ platformId, rate }),
      id,
      source: 'api' as const,
      updatedAt: now.toISOString(),
    });
    const sources = {
      gate: { status: 'ok' as const, checkedAt: now.toISOString(), offers: 2 },
      weex: { status: 'manual' as const, checkedAt: now.toISOString(), offers: 0 },
    };
    const before: RatesFile = {
      generatedAt: now.toISOString(),
      sources,
      offers: [
        stored('gate-trx', 'gate', 8.17),
        stored('gate-usdt', 'gate', 2.46),
        stored('gate-usds', 'gate', 5),
        stored('weex-usdt', 'weex', 10),
        stored('old-usdt', 'old', 4),
      ],
    };
    const after: RatesFile = {
      ...before,
      offers: [stored('gate-trx', 'gate', 1.3), stored('gate-usdt', 'gate', 2.43)],
    };

    const summary = summarizeChanges(before, after);
    expect(summary).toContain('### Big moves (1)\n- `gate-trx`: 8.17% → 1.3% APR');
    expect(summary).toContain('### Rate changes (1)\n- `gate-usdt`: 2.46% → 2.43% APR');
    expect(summary).toContain('- `gate-usds`: no longer listed by gate');
    expect(summary).toContain('- `weex-usdt`: removed from manual-rates.json or verified more than 30 days ago');
    expect(summary).toContain('- `old-usdt`: old has no source any more');
    expect(summary).toContain('### Failed sources (0)\nNone.');
    expect(holdReasons(before, after)).toEqual(['1 big move', '3 removed offers']);
  });

  it('lets a quiet day through: only small rate changes and new offers', () => {
    const stored = (id: string, rate: number) => ({
      ...offer({ platformId: 'gate', rate }),
      id,
      source: 'api' as const,
      updatedAt: now.toISOString(),
    });
    const sources = { gate: { status: 'ok' as const, checkedAt: now.toISOString(), offers: 2 } };
    const before: RatesFile = { generatedAt: now.toISOString(), sources, offers: [stored('gate-usdt', 2.46)] };
    const after: RatesFile = { ...before, offers: [stored('gate-usdt', 2.43), stored('gate-btc', 1)] };

    expect(holdReasons(before, after)).toEqual([]);
    expect(summarizeChanges(before, after).startsWith('**Quiet day:**')).toBe(true);
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
  const weex = offer({
    platformId: 'weex',
    product: 'Fixed Savings',
    termDays: 2,
    rate: 600,
    audience: 'new-user',
    maxAmount: 200,
  });

  it('estimates the most a new user can earn', () => {
    expect(estimatedReward(weex)).toBe(6.58);
    expect(estimatedReward(offer({ audience: 'new-user', rate: 100 }))).toBeNull();
    expect(estimatedReward(offer({ audience: 'new-user', termDays: 7, rate: 100 }))).toBeNull();
  });

  it('describes the cap and the reward', () => {
    expect(conditionLines(weex)).toEqual(['New users · max 200 USDT', '2 days · ≈ $6.58 total']);
    expect(conditionLines(offer({ audience: 'new-user', termDays: 7, rate: 100 }))).toEqual([
      'New users only',
      '7 days',
    ]);
  });

  it('gets its own id and is never marked as a promo', () => {
    expect(offerId(weex)).toBe('weex-usdt-fixed-savings-2d-new-user');
    expect(
      isBoosted({
        ...weex,
        tiers: [
          { min: 0, max: 100, rate: 600 },
          { min: 100, max: null, rate: 1 },
        ],
      })
    ).toBe(false);
  });

  it('allows high rates for USDT/USDC only', () => {
    const assets = ['USDT', 'BTC'];
    expect(offerProblem(weex, assets, ['weex'])).toBeNull();
    expect(offerProblem({ ...weex, rate: 1500 }, assets, ['weex'])).toMatch(/rate out of range/);
    expect(offerProblem({ ...weex, asset: 'BTC' }, assets, ['weex'])).toMatch('USDT/USDC only');
    expect(offerProblem({ ...weex, audience: undefined }, assets, ['weex'])).toMatch(/rate out of range/);
  });

  it('turns into a new-user row with its reward', () => {
    const row = toRateRow(
      { ...weex, id: offerId(weex), source: 'web', updatedAt: '2026-10-14T06:00:00.000Z' },
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

describe('applyManualOffers', () => {
  const now = new Date('2026-10-30T12:00:00Z');
  const stored = (platformId: string, source: 'api' | 'manual', rate: number, updatedAt: string) => ({
    ...offer({ platformId, rate }),
    id: `${platformId}-usdt`,
    source,
    updatedAt,
  });
  const file: RatesFile = {
    generatedAt: '2026-10-30T02:00:00.000Z',
    sources: {
      bybit: { status: 'ok', checkedAt: '2026-10-30T02:00:00.000Z', offers: 1 },
      gate: { status: 'failed', checkedAt: '2026-10-30T02:00:00.000Z', error: 'HTTP 503', offers: 1 },
      weex: { status: 'manual', checkedAt: '2026-10-30T02:00:00.000Z', offers: 1 },
      walt: { status: 'manual', checkedAt: '2026-10-30T02:00:00.000Z', offers: 1 },
    },
    offers: [
      stored('bybit', 'api', 6, '2026-10-30T02:00:00.000Z'),
      stored('gate', 'api', 2, '2026-10-28T02:00:00.000Z'),
      stored('walt', 'manual', 4, '2026-10-21T00:00:00.000Z'),
      stored('weex', 'manual', 10, '2026-10-21T00:00:00.000Z'),
    ],
  };
  const manual = (platformId: string, rate: number, verifiedAt: string): ManualOffer => ({
    ...offer({ platformId, rate }),
    verifiedAt,
  });

  it('replaces manual offers and keeps fetched ones and generatedAt', () => {
    const next = applyManualOffers(
      file,
      [manual('weex', 12, '2026-10-30'), manual('bybit', 99, '2026-10-30'), manual('walt', 4, '2026-09-20')],
      now
    );
    expect(next.generatedAt).toBe(file.generatedAt);
    expect(next.offers.filter((o) => o.source === 'api')).toEqual(file.offers.slice(0, 2));
    expect(next.offers.find((o) => o.platformId === 'weex')).toMatchObject({
      rate: 12,
      source: 'manual',
      updatedAt: '2026-10-30T00:00:00.000Z',
    });
    // Too old: Walt is dropped along with its source entry.
    expect(next.offers.some((o) => o.platformId === 'walt')).toBe(false);
    expect(Object.keys(next.sources)).toEqual(['bybit', 'gate', 'weex']);
    expect(next.sources.gate).toEqual(file.sources.gate);
    expect(next.sources.weex).toMatchObject({ status: 'manual', offers: 1, checkedAt: now.toISOString() });
  });

  it('gives mergeRates the same manual offers', () => {
    const manualList = [manual('weex', 12, '2026-10-30')];
    const merged = mergeRates({ previous: null, results: {}, manual: manualList, now });
    expect(applyManualOffers({ ...merged, offers: [], sources: {} }, manualList, now)).toEqual(merged);
  });
});

describe('manual rates expiry warning', () => {
  const withManual = (generatedAt: string, ...verified: [string, string][]): RatesFile => ({
    generatedAt,
    sources: {},
    offers: verified.map(([platformId, updatedAt], index) => ({
      ...offer({ platformId }),
      id: `${platformId}-${index}`,
      source: 'manual' as const,
      updatedAt,
    })),
  });

  it('warns from 7 days before the oldest offer of a platform drops off', () => {
    const at = (generatedAt: string) =>
      manualExpiries(
        withManual(generatedAt, ['walt', '2026-10-21T00:00:00.000Z'], ['walt', '2026-10-30T00:00:00.000Z'])
      );
    expect(at('2026-11-12T00:00:00.000Z')).toEqual([]); // 8 days left
    expect(at('2026-11-13T00:00:00.000Z')).toEqual([{ platformId: 'walt', dropsOn: '2026-11-20', daysLeft: 7 }]);
    expect(at('2026-11-19T02:00:00.000Z')).toEqual([{ platformId: 'walt', dropsOn: '2026-11-20', daysLeft: 1 }]);
    expect(at('2026-11-20T00:00:00.000Z')[0].daysLeft).toBe(0);
  });

  it('puts the warning in the PR summary and asks for review', () => {
    const next = withManual(
      '2026-11-16T02:00:00.000Z',
      ['weex', '2026-10-30T00:00:00.000Z'],
      ['walt', '2026-10-21T00:00:00.000Z']
    );
    expect(holdReasons(next, next)).toEqual(['manual rates expiring (walt)']);
    const summary = summarizeChanges(next, next);
    expect(summary.startsWith('**Needs review:** manual rates expiring (walt).')).toBe(true);
    expect(summary).toContain('### Manual rates to re-check (1)\n- walt: drops off on Nov 20, 2026 (4 days left)');
    expect(summarizeChanges(next, withManual('2026-11-01T00:00:00.000Z'))).not.toContain('Manual rates to re-check');
  });
});
