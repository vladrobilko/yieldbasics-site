import { describe, expect, it } from 'vitest';

import type { RateRow } from '~/utils/rates';
import { X_MAX_LENGTH, dailyPostText, ratesSignature } from '~/utils/xPost';

const row = (over: Partial<RateRow>): RateRow => ({
  id: over.id ?? `${over.platformId}-${over.asset}-${over.termDays ?? 0}`,
  platformId: 'weex',
  asset: 'USDT',
  rate: 5,
  type: 'APR',
  product: 'Earn',
  term: 'Flexible',
  termDays: 0,
  conditionTop: 'Any amount',
  conditionBottom: '',
  promotional: false,
  audience: 'all',
  maxReward: null,
  source: 'api',
  updatedAt: '2026-10-25T00:00:00Z',
  stale: false,
  ...over,
});

const rows: RateRow[] = [
  row({ platformId: 'weex', asset: 'USDT', rate: 10 }),
  row({ platformId: 'aave', asset: 'USDC', rate: 12.32, type: 'APY' }),
  row({ platformId: 'weex', asset: 'BTC', rate: 8 }),
  row({ platformId: 'coinw', asset: 'BTC', rate: 15.79, termDays: 365 }),
  row({ platformId: 'okx', asset: 'ETH', rate: 3 }),
  row({ platformId: 'bybit', asset: 'USDT', rate: 600, termDays: 3, audience: 'new-user' }),
];
const names: Record<string, string> = { weex: 'WEEX', aave: 'Aave', coinw: 'CoinW', okx: 'OKX', bybit: 'Bybit' };
const name = (id: string) => names[id] ?? id;
const day = (n: number) => new Date(n * 86_400_000 + 12 * 3_600_000);

describe('dailyPostText', () => {
  const results = [0, 1, 2].map((n) => dailyPostText(rows, null, day(n), name));
  const posts = results.map((result) => result?.text ?? '');
  const replies = results.map((result) => result?.reply ?? '');

  it('rotates through three templates by day', () => {
    expect(new Set(posts).size).toBe(3);
    expect(posts.some((post) => post.startsWith('Best flexible stablecoin earn rates today:'))).toBe(true);
    expect(posts.some((post) => post.startsWith('Best earn rates for Bitcoin and Ether today:'))).toBe(true);
    expect(
      posts.some((post) => post.startsWith('Today we track 6 crypto earn offers for 4 coins on 5 platforms.'))
    ).toBe(true);
  });

  it('stays within 280 characters, has no link and points to the reply', () => {
    for (const post of posts) {
      expect(post.length).toBeGreaterThan(0);
      expect(post.length).toBeLessThanOrEqual(X_MAX_LENGTH);
      expect(post).not.toMatch(/https?:|www\.|\.com/);
      expect(post).toContain('in the reply 👇');
    }
  });

  it('puts the matching links in the reply', () => {
    const replyFor = (start: string) => replies[posts.findIndex((post) => post.startsWith(start))];
    expect(replyFor('Best flexible stablecoin')).toBe(
      'All USDT rates: https://yieldbasics.com/rates/usdt\nAll USDC rates: https://yieldbasics.com/rates/usdc'
    );
    expect(replyFor('Best earn rates for Bitcoin')).toBe(
      'All BTC rates: https://yieldbasics.com/rates/btc\nAll ETH rates: https://yieldbasics.com/rates/eth'
    );
    expect(replyFor('Today we track')).toBe('Full table: https://yieldbasics.com');
  });

  it('links only the coins that have offers', () => {
    const noEth = rows.filter((r) => r.asset !== 'ETH');
    const replies = [0, 1, 2].map((n) => dailyPostText(noEth, null, day(n), name)?.reply ?? '');
    expect(replies).toContain('All BTC rates: https://yieldbasics.com/rates/btc');
  });

  it('uses the numbers from the rates, and never a new-user rate', () => {
    const text = posts.join('\n');
    expect(text).toContain('$USDT: 10.00% APR on WEEX');
    expect(text).toContain('$USDC: 12.32% APY on Aave');
    expect(text).toContain('$BTC: 8.00% APR flexible on WEEX, 15.79% APR for 365 days on CoinW');
    expect(text).toContain('$ETH: 3.00% APR flexible on OKX');
    expect(text).not.toContain('600');
  });

  it('returns null when no rate changed, and posts when one did', () => {
    expect(dailyPostText(rows, [...rows].reverse(), day(0), name)).toBeNull();
    const changed = rows.map((r) => (r.asset === 'ETH' ? { ...r, rate: 3.1 } : r));
    expect(dailyPostText(changed, rows, day(0), name)).not.toBeNull();
  });

  it('skips a template whose coins have no offers', () => {
    const noStables = rows.filter((r) => r.asset !== 'USDT' && r.asset !== 'USDC');
    for (const n of [0, 1, 2]) {
      expect(dailyPostText(noStables, null, day(n), name)?.text).not.toMatch(/stablecoin/);
    }
  });

  it('returns null for an empty table', () => {
    expect(dailyPostText([], null, day(0), name)).toBeNull();
  });
});

describe('ratesSignature', () => {
  it('ignores row order but not rate or type changes', () => {
    expect(ratesSignature(rows)).toBe(ratesSignature([...rows].reverse()));
    expect(ratesSignature(rows)).not.toBe(ratesSignature([{ ...rows[0], type: 'APY' }, ...rows.slice(1)]));
  });
});
