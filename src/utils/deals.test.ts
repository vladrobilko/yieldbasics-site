import { describe, expect, it } from 'vitest';

import { deals } from '~/data/deals';
import { platforms } from '~/data/platforms';
import {
  formatDealTime,
  xLength,
  hasEnded,
  isUpcoming,
  platformHighlights,
  timeLeftLabel,
  validateDeals,
  visibleDeals,
  xPostText,
  type Deal,
} from '~/utils/deals';

const deal = (overrides: Partial<Deal> = {}): Deal => ({
  id: 'mexc-zec-launchpad',
  platformId: 'mexc',
  kind: 'launchpad',
  title: 'ZEC Launchpad',
  asset: 'ZEC',
  headline: 'Up to 70% off',
  audience: 'new-user',
  conditions: ['KYC required', 'Trade $100 in the first 7 days', 'Max 200 USDT per user'],
  startsAt: '2026-10-20T10:00:00Z',
  endsAt: '2026-10-25T10:00:00Z',
  verifiedAt: '2026-10-19',
  ...overrides,
});

const at = (iso: string) => new Date(iso);
const platformIds = new Set(platforms.map((p) => p.id));

describe('deals file', () => {
  it('is valid', () => {
    expect(validateDeals(deals, platformIds)).toEqual([]);
  });

  it('has X posts that fit in one post', () => {
    for (const d of deals) {
      expect(xLength(xPostText(d, 'MEXC', 'https://yieldbasics.com')), d.id).toBeLessThanOrEqual(280);
    }
  });
});

describe('hasEnded / isUpcoming', () => {
  it('ends exactly at endsAt', () => {
    expect(hasEnded(deal(), at('2026-10-25T09:59:59Z'))).toBe(false);
    expect(hasEnded(deal(), at('2026-10-25T10:00:00Z'))).toBe(true);
  });

  it('is upcoming before startsAt', () => {
    expect(isUpcoming(deal(), at('2026-10-20T09:00:00Z'))).toBe(true);
    expect(isUpcoming(deal(), at('2026-10-20T10:00:00Z'))).toBe(false);
  });
});

describe('visibleDeals', () => {
  it('drops ended deals and sorts by soonest end', () => {
    const late = deal({ id: 'late', endsAt: '2026-10-30T00:00:00Z' });
    const soon = deal({ id: 'soon', endsAt: '2026-10-22T00:00:00Z' });
    const over = deal({ id: 'over', endsAt: '2026-10-19T00:00:00Z' });
    expect(visibleDeals([late, over, soon], at('2026-10-21T00:00:00Z')).map((d) => d.id)).toEqual(['soon', 'late']);
  });

  it('keeps upcoming deals', () => {
    expect(visibleDeals([deal()], at('2026-10-19T00:00:00Z'))).toHaveLength(1);
  });
});

describe('timeLeftLabel', () => {
  it('counts down to the start, then to the end', () => {
    expect(timeLeftLabel(deal(), at('2026-10-19T08:00:00Z'))).toBe('Starts in 1d 2h');
    expect(timeLeftLabel(deal(), at('2026-10-25T06:55:00Z'))).toBe('Ends in 3h 5m');
    expect(timeLeftLabel(deal(), at('2026-10-25T09:59:30Z'))).toBe('Ends in 1m');
    expect(timeLeftLabel(deal(), at('2026-10-26T00:00:00Z'))).toBe('Ended');
  });
});

describe('formatDealTime', () => {
  it('shows the time in UTC', () => {
    expect(formatDealTime('2026-10-25T10:00:00Z')).toBe('Oct 25, 2026, 10:00 UTC');
  });
});

describe('xPostText', () => {
  it('builds the post from the deal', () => {
    expect(xPostText(deal(), 'MEXC', 'https://yieldbasics.com/')).toBe(
      [
        'MEXC Launchpad: ZEC, Up to 70% off for new users',
        '• KYC required',
        '• Trade $100 in the first 7 days',
        '• Max 200 USDT per user',
        'Ends Oct 25, 2026, 10:00 UTC',
        'https://yieldbasics.com/deals#mexc-zec-launchpad',
        'Referral link. Not financial advice.',
      ].join('\n')
    );
  });

  it('uses the custom text when given', () => {
    expect(xPostText(deal({ xPost: 'Custom' }), 'MEXC', 'https://yieldbasics.com')).toBe('Custom');
  });

  it('adds the stats and drops conditions that would not fit in one post', () => {
    const long = deal({
      stats: [{ label: 'Your price', value: '367.8 USDT' }],
      conditions: Array.from({ length: 12 }, (_, i) => `Condition number ${i + 1} with some extra words`),
    });
    const text = xPostText(long, 'MEXC', 'https://yieldbasics.com');
    expect(text).toContain('Your price: 367.8 USDT');
    expect(text).toContain('• Condition number 1 ');
    expect(text).not.toContain('Condition number 12');
    expect(xLength(text)).toBeLessThanOrEqual(280);
    expect(text.endsWith('Referral link. Not financial advice.')).toBe(true);
  });

  it('counts links as 23 characters', () => {
    expect(xLength('see https://yieldbasics.com/deals#a-very-long-anchor-name')).toBe(27);
  });
});

describe('validateDeals', () => {
  it('accepts a good deal', () => {
    expect(validateDeals([deal()], platformIds)).toEqual([]);
  });

  it('reports each problem', () => {
    const bad = deal({
      id: 'Bad Id',
      platformId: 'nope',
      endsAt: '2026-10-19T00:00:00Z',
      verifiedAt: '19.10.2026',
      url: 'http://example.com',
      conditions: [],
    });
    expect(validateDeals([bad, bad], platformIds)).toEqual(
      expect.arrayContaining([
        'Bad Id: duplicate id',
        'Bad Id: id must be kebab-case',
        'Bad Id: unknown platform "nope"',
        'Bad Id: endsAt must be after startsAt',
        'Bad Id: verifiedAt must be YYYY-MM-DD',
        'Bad Id: url must use https',
        'Bad Id: list at least one condition',
      ])
    );
  });
});

describe('platformHighlights', () => {
  const row = (id: string, platformId: string, audience: 'all' | 'new-user', rate: number) => ({
    id,
    platformId,
    audience,
    rate,
  });

  it('picks the best new-user and the best everyday offer of the platform', () => {
    const rows = [
      row('a', 'mexc', 'all', 6),
      row('b', 'mexc', 'all', 10),
      row('c', 'mexc', 'new-user', 600),
      row('d', 'mexc', 'new-user', 100),
      row('e', 'okx', 'all', 50),
    ];
    expect(platformHighlights(rows, 'mexc').map((r) => r.id)).toEqual(['c', 'b']);
  });

  it('skips a group the platform has no offer in', () => {
    expect(platformHighlights([row('a', 'mexc', 'all', 6)], 'mexc').map((r) => r.id)).toEqual(['a']);
    expect(platformHighlights([row('a', 'okx', 'all', 6)], 'mexc')).toEqual([]);
  });
});
