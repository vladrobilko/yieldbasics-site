import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { icons as tokenBranded } from '@iconify-json/token-branded';

import { platforms } from '~/data/platforms';
import {
  assetLogoNames,
  assets,
  tokenBrandedLogoNames,
  coinAssets,
  mainAssets,
  rateRows,
  stablecoinAssets,
} from '~/data/yields';
import {
  filterAssets,
  emptyMessage,
  filterByTerm,
  formatRate,
  placePopover,
  productsLabel,
  ratesForAsset,
  sortByRate,
  sortByReward,
  sortLabel,
} from '~/utils/yields';

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
  const rows = [
    { asset: 'USDT', rate: 3 },
    { asset: 'BTC', rate: 1 },
    { asset: 'USDT', rate: 7 },
  ];

  it('returns only rows of the asset, highest rate first', () => {
    expect(ratesForAsset(rows, 'usdt')).toEqual([
      { asset: 'USDT', rate: 7 },
      { asset: 'USDT', rate: 3 },
    ]);
  });

  it('returns an empty list for an asset without offers', () => {
    expect(ratesForAsset(rows, 'DOGE')).toEqual([]);
  });
});

describe('filterByTerm', () => {
  const rows = [
    { termDays: 0, audience: 'all' },
    { termDays: 30, audience: 'all' },
    { termDays: 7, audience: 'all' },
    { termDays: 2, audience: 'new-user' },
  ];

  it('keeps everything, only flexible, or only fixed-term rows, never new-user ones', () => {
    expect(filterByTerm(rows, 'all')).toHaveLength(3);
    expect(filterByTerm(rows, 'flexible').map((r) => r.termDays)).toEqual([0]);
    expect(filterByTerm(rows, 'fixed').map((r) => r.termDays)).toEqual([30, 7]);
  });

  it('shows only new-user rows in the New users tab', () => {
    expect(filterByTerm(rows, 'new-user')).toEqual([{ termDays: 2, audience: 'new-user' }]);
  });
});

describe('sortByReward', () => {
  const rows = [
    { id: 'a', reward: 6.58, rate: 600 },
    { id: 'b', reward: null, rate: 100 },
    { id: 'c', reward: 0.82, rate: 100 },
    { id: 'd', reward: null, rate: 200 },
  ];

  it('ranks by reward and puts unknown rewards last, by rate', () => {
    expect(sortByReward(rows).map((r) => r.id)).toEqual(['a', 'c', 'd', 'b']);
    expect(sortByReward(rows, false).map((r) => r.id)).toEqual(['c', 'a', 'd', 'b']);
  });
});

describe('emptyMessage', () => {
  it('explains which assets have new-user offers', () => {
    expect(emptyMessage('BTC', 'new-user', ['USDT', 'USDC'])).toBe(
      'New-user offers are tracked for USDT and USDC only.'
    );
    expect(emptyMessage('USDT', 'new-user', ['USDT', 'USDC'])).toMatch(/No matching USDT offers/);
    expect(emptyMessage('BTC', 'fixed', ['USDT', 'USDC'])).toMatch(/No matching BTC offers/);
  });
});

describe('productsLabel', () => {
  it('handles plural, singular and empty', () => {
    expect(productsLabel(28, 11)).toBe('28 offers from 11 platforms');
    expect(productsLabel(1, 1)).toBe('1 offer from 1 platform');
    expect(productsLabel(3, 1)).toBe('3 offers from 1 platform');
    expect(productsLabel(0, 0)).toBe('No offers listed yet');
  });
});

describe('sortLabel', () => {
  it('names the current order', () => {
    expect(sortLabel(true)).toBe('Highest APR');
    expect(sortLabel(false)).toBe('Lowest APR');
    expect(sortLabel(true, 'reward')).toBe('Highest reward');
  });
});

describe('rates data', () => {
  it('has unique row ids', () => {
    expect(new Set(rateRows.map((r) => r.id)).size).toBe(rateRows.length);
  });

  it('only uses assets that exist in the selector', () => {
    const symbols = new Set(assets.map((a) => a.symbol));
    expect(rateRows.every((r) => symbols.has(r.asset))).toBe(true);
  });

  it('only uses known platforms', () => {
    const ids = new Set(platforms.map((p) => p.id));
    expect(rateRows.filter((r) => !ids.has(r.platformId))).toEqual([]);
  });
});

describe('filterAssets', () => {
  it('returns everything for an empty or blank query', () => {
    expect(filterAssets(assets, '')).toHaveLength(assets.length);
    expect(filterAssets(assets, '   ')).toHaveLength(assets.length);
  });

  it('matches by symbol, case-insensitively', () => {
    expect(filterAssets(assets, 'doge').map((a) => a.symbol)).toEqual(['DOGE']);
  });

  it('matches by name', () => {
    expect(filterAssets(assets, 'Cardano').map((a) => a.symbol)).toEqual(['ADA']);
  });

  it('matches partial text across symbol and name', () => {
    const symbols = filterAssets(assets, 'usd').map((a) => a.symbol);
    expect(symbols).toEqual(expect.arrayContaining(['USDT', 'USDC', 'USDS', 'USDe']));
  });

  it('returns an empty list when nothing matches', () => {
    expect(filterAssets(assets, 'zzz')).toEqual([]);
  });
});

describe('asset groups', () => {
  it('has exactly the five main assets in order', () => {
    expect(mainAssets.map((a) => a.symbol)).toEqual(['USDT', 'USDC', 'BTC', 'ETH', 'XAUT']);
  });

  it('lists the popover stablecoins and coins', () => {
    expect(stablecoinAssets.map((a) => a.symbol)).toEqual(['USDS', 'USDe', 'EURC']);
    expect(coinAssets.map((a) => a.symbol)).toEqual(
      expect.arrayContaining([
        'SOL',
        'BNB',
        'XRP',
        'DOGE',
        'ADA',
        'TRX',
        'GRAM',
        'HYPE',
        'LINK',
        'NEAR',
        'DOT',
        'LTC',
        'SUI',
        'AVAX',
        'POL',
      ])
    );
    expect(coinAssets).toHaveLength(15);
  });

  it('puts every asset in exactly one group', () => {
    expect(mainAssets.length + stablecoinAssets.length + coinAssets.length).toBe(assets.length);
  });

  it('has unique ids and symbols', () => {
    expect(new Set(assets.map((a) => a.id)).size).toBe(assets.length);
    expect(new Set(assets.map((a) => a.symbol.toUpperCase())).size).toBe(assets.length);
  });

  it('no longer lists removed coins', () => {
    const symbols = assets.map((a) => a.symbol);
    for (const removed of ['DAI', 'FDUSD', 'BCH', 'ZEC']) expect(symbols).not.toContain(removed);
  });
});

describe('asset logos', () => {
  const available = new Set([...Object.keys(tokenBranded.icons), ...Object.keys(tokenBranded.aliases ?? {})]);

  it('every token-branded logo exists in the icon set', () => {
    const missing = tokenBrandedLogoNames.filter((name) => !available.has(name));
    expect(missing).toEqual([]);
  });

  it('every local logo has a file in src/assets/icons', () => {
    const local = assetLogoNames.filter((name) => !name.includes(':'));
    expect(local).toEqual(['coin-usds']);
    for (const name of local) expect(existsSync(`src/assets/icons/${name}.svg`)).toBe(true);
  });

  it('every asset has a real logo', () => {
    expect(assets.filter((a) => !a.logo).map((a) => a.symbol)).toEqual([]);
  });
});

describe('placePopover', () => {
  const base = {
    width: 400,
    contentHeight: 470,
    viewport: { width: 1366, height: 700 },
    minTop: 69,
  };

  it('opens below the trigger and shrinks to the room left (the reported bug: it jumped to the top)', () => {
    const p = placePopover({ ...base, anchor: { top: 371, bottom: 427, right: 775 } });
    expect(p.top).toBe(435);
    expect(p.maxHeight).toBe(700 - 16 - 435);
    expect(p.top).toBeGreaterThan(69);
  });

  it('uses the full content height when it fits below', () => {
    const p = placePopover({
      ...base,
      viewport: { width: 1366, height: 1200 },
      anchor: { top: 371, bottom: 427, right: 775 },
    });
    expect(p).toMatchObject({ top: 435, maxHeight: 470 });
  });

  it('flips above only when there is little room below and more above, never over the header', () => {
    const p = placePopover({ ...base, anchor: { top: 600, bottom: 656, right: 775 } });
    expect(p.top + p.maxHeight).toBe(600 - 8);
    expect(p.top).toBeGreaterThanOrEqual(69);
  });

  it('keeps the panel inside the viewport horizontally', () => {
    expect(placePopover({ ...base, anchor: { top: 371, bottom: 427, right: 100 } }).left).toBe(16);
    expect(
      placePopover({
        ...base,
        viewport: { width: 390, height: 700 },
        width: 358,
        anchor: { top: 480, bottom: 541, right: 500 },
      }).left
    ).toBe(16);
  });
});
