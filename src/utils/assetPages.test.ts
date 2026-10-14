import { describe, expect, it } from 'vitest';

import {
  assetFaq,
  assetsWithOffers,
  assetPageDescription,
  assetPageTitle,
  assetSlug,
  summarizeAsset,
} from '~/utils/assetPages';
import type { RateRow } from '~/utils/rates';

const row = (overrides: Partial<RateRow>): RateRow => ({
  id: 'x',
  platformId: 'bybit',
  asset: 'USDT',
  rate: 5,
  type: 'APR',
  product: 'Savings',
  term: 'Flexible',
  termDays: 0,
  conditionTop: '',
  conditionBottom: '',
  promotional: false,
  audience: 'all',
  maxReward: null,
  source: 'api',
  updatedAt: '2026-10-14T06:00:00.000Z',
  stale: false,
  ...overrides,
});

const names: Record<string, string> = { bybit: 'Bybit', okx: 'OKX', mexc: 'MEXC', kucoin: 'KuCoin' };
const platformName = (id: string) => names[id] ?? id;

const rows = [
  row({ platformId: 'bybit', rate: 6.93 }),
  row({ platformId: 'okx', rate: 3.5 }),
  row({ platformId: 'kucoin', rate: 4.1, termDays: 365, term: '365-day' }),
  row({ platformId: 'mexc', rate: 600, termDays: 2, term: '2-day', audience: 'new-user', maxReward: 6.58 }),
  row({ platformId: 'kucoin', rate: 100, termDays: 7, term: '7-day', audience: 'new-user', maxReward: 1.92 }),
];

describe('assetSlug', () => {
  it('lowercases the symbol', () => {
    expect(assetSlug('USDT')).toBe('usdt');
    expect(assetSlug('USDe')).toBe('usde');
  });
});

describe('summarizeAsset', () => {
  const summary = summarizeAsset(rows);

  it('counts regular offers and platforms only', () => {
    expect(summary.offerCount).toBe(3);
    expect(summary.platformCount).toBe(3);
  });

  it('picks the best flexible, fixed and new-user (by reward) offers', () => {
    expect(summary.bestFlexible?.platformId).toBe('bybit');
    expect(summary.bestFixed?.platformId).toBe('kucoin');
    expect(summary.bestNewUser?.platformId).toBe('mexc');
  });

  it('handles a coin without fixed or new-user offers', () => {
    const only = summarizeAsset([row({})]);
    expect(only.bestFixed).toBeUndefined();
    expect(only.bestNewUser).toBeUndefined();
  });
});

describe('page text', () => {
  const summary = summarizeAsset(rows);

  it('keeps the title within 60 characters with the site suffix', () => {
    expect(`${assetPageTitle('USDT')} — YieldBasics`.length).toBeLessThanOrEqual(60);
  });

  it('writes a description of at most 160 characters naming the best offer', () => {
    const text = assetPageDescription('USDT', 'Tether', summary, platformName);
    expect(text).toBe(
      'Compare 3 USDT (Tether) earn offers from 3 platforms, updated daily. Best right now: 6.93% APR on Bybit.'
    );
    expect(text.length).toBeLessThanOrEqual(160);
  });

  it('answers FAQs from the data', () => {
    const faq = assetFaq('USDT', summary, platformName, 'Oct 14, 2026');
    expect(faq.map((item) => item.title)).toEqual([
      'What is the best USDT earn rate today?',
      'Should I choose flexible or fixed-term USDT savings?',
      'Are there USDT offers for new users?',
      'How often are these rates updated?',
      'What is the difference between APR and APY?',
    ]);
    expect(faq[0].description).toContain('the best flexible USDT rate is 6.93% APR on Bybit');
    expect(faq[0].description).toContain('4.10% APR on KuCoin for 365-day');
    expect(faq[2].description).toContain('600.00% APR on MEXC, worth about $6.58 in total');
  });

  it('skips the new-user question when there are none', () => {
    const faq = assetFaq('BTC', summarizeAsset([row({ asset: 'BTC' })]), platformName, 'Oct 14, 2026');
    expect(faq.some((item) => item.title.includes('new users'))).toBe(false);
  });
});

describe('assetsWithOffers', () => {
  it('keeps coins with at least one regular offer', () => {
    const coins = [{ symbol: 'USDT' }, { symbol: 'BTC' }, { symbol: 'DOGE' }];
    const offers = [
      { asset: 'USDT', audience: 'all' as const },
      { asset: 'BTC', audience: 'new-user' as const },
    ];
    expect(assetsWithOffers(coins, offers).map((c) => c.symbol)).toEqual(['USDT']);
  });
});
