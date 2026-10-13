import { describe, expect, it } from 'vitest';
import { icons as tokenBranded } from '@iconify-json/token-branded';

import { assetLogoNames, assets, coinAssets, mainAssets, rateRows, stablecoinAssets } from '~/data/yields';
import {
  filterAssets,
  formatRate,
  placePopover,
  productsLabel,
  ratesForAsset,
  sortByRate,
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
        'TON',
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

  it('every logo name exists in the token-branded icon set', () => {
    const missing = assetLogoNames.filter((name) => !available.has(name));
    expect(missing).toEqual([]);
  });

  it('every asset has a logo or a fallback glyph', () => {
    expect(assets.every((a) => a.logo || a.icon)).toBe(true);
  });

  it('only USDS uses the fallback glyph (no logo in the set yet)', () => {
    expect(assets.filter((a) => !a.logo).map((a) => a.symbol)).toEqual(['USDS']);
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
