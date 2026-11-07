import { describe, expect, it } from 'vitest';

import { platforms } from '~/data/platforms';
import { summarizeAsset } from '~/utils/assetPages';
import {
  platformAnswerLine,
  platformAssets,
  platformFaq,
  platformPageDescription,
  platformPageTitle,
  platformsWithOffers,
  sortByAssetThenRate,
} from '~/utils/platformPages';
import type { RateRow } from '~/utils/rates';

const row = (overrides: Partial<RateRow> = {}): RateRow => ({
  id: 'bybit-usdt-flexible',
  platformId: 'bybit',
  asset: 'USDT',
  rate: 5,
  type: 'APR',
  product: 'Flexible Savings',
  term: 'Flexible',
  termDays: 0,
  conditionTop: 'Any amount',
  conditionBottom: '',
  promotional: false,
  audience: 'all',
  maxReward: null,
  source: 'api',
  updatedAt: '2026-10-30T02:00:00.000Z',
  stale: false,
  ...overrides,
});

const rows = [
  row({ asset: 'BTC', rate: 1 }),
  row({ asset: 'USDT', rate: 7.5 }),
  row({ asset: 'USDT', rate: 9, termDays: 30, term: '30-day' }),
  row({ asset: 'USDT', rate: 100, termDays: 7, audience: 'new-user', maxReward: 3.84 }),
];

describe('platform page lists', () => {
  it('keeps platforms with offers, in the given order', () => {
    expect(platformsWithOffers([{ id: 'okx' }, { id: 'bybit' }], rows)).toEqual([{ id: 'bybit' }]);
  });

  it('orders coins and rows like the coin list', () => {
    const order = ['USDT', 'USDC', 'BTC'];
    expect(platformAssets(rows, order)).toEqual(['USDT', 'BTC']);
    expect(sortByAssetThenRate(rows, order).map((r) => `${r.asset} ${r.rate}`)).toEqual([
      'USDT 100',
      'USDT 9',
      'USDT 7.5',
      'BTC 1',
    ]);
  });
});

describe('platform page text', () => {
  const summary = summarizeAsset(rows);

  it('keeps every title within 60 characters with the site suffix', () => {
    for (const platform of platforms) {
      expect(`${platformPageTitle(platform.name)} | YieldBasics`.length, platform.id).toBeLessThanOrEqual(60);
    }
  });

  it('writes a description within 160 characters with the best rate', () => {
    const description = platformPageDescription('Bybit', summary, 2);
    expect(description).toBe(
      'Compare 3 Bybit earn offers on 2 coins, updated daily. Best right now: 7.50% APR on USDT.'
    );
    const long = platformPageDescription('X'.repeat(80), summary, 2);
    expect(long.length).toBeLessThanOrEqual(160);
    expect(long).not.toContain('Best right now');
  });

  it('answers with the best flexible and fixed rates', () => {
    expect(platformAnswerLine('Bybit', summary, 'Oct 30, 2026')).toBe(
      'Updated Oct 30, 2026: the best flexible rate on Bybit is 7.50% APR on USDT, and the best fixed-term rate is 9.00% APR on USDT for 30 days.'
    );
    expect(platformAnswerLine('Bybit', summarizeAsset([rows[3]]), 'Oct 30, 2026')).toBeUndefined();
  });

  it('builds the FAQ from the data', () => {
    const faq = platformFaq({
      name: 'WEEX',
      summary,
      coins: ['USDT', 'BTC'],
      updated: 'Oct 30, 2026',
      manual: true,
      hasFlexible: true,
      hasFixed: true,
      proofOfReserves: 'https://www.weex.com/proof-of-reserves',
    });
    const titles = faq.map((item) => item.title);
    expect(titles).toEqual([
      'What is the best WEEX earn rate today?',
      'Which coins can I earn on with WEEX?',
      'Does WEEX have flexible and fixed-term earn?',
      'Is there a WEEX offer for new users?',
      'Is it safe to earn on WEEX?',
      'How often are these WEEX rates updated?',
    ]);
    expect(faq[1].description).toContain('USDT and BTC');
    expect(faq[3].description).toContain('worth about $3.84 in total');
    expect(faq[4].description).toContain('href="https://www.weex.com/proof-of-reserves"');
    expect(faq[5].description).toContain('check them by hand');
  });

  it('skips questions the data cannot answer', () => {
    const flexibleOnly = summarizeAsset([rows[1]]);
    const titles = platformFaq({
      name: 'Aave',
      summary: flexibleOnly,
      coins: ['USDT'],
      updated: 'Oct 30, 2026',
      manual: false,
      hasFlexible: true,
      hasFixed: false,
    }).map((item) => item.title);
    expect(titles).not.toContain('Does Aave have flexible and fixed-term earn?');
    expect(titles).not.toContain('Is there a Aave offer for new users?');
  });
});
