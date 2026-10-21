import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { parseAave } from './aave';
import { parseBinance } from './binance';
import { bybitHosts, hideProxy, parseBybit, PROXY_ATTEMPTS } from './bybit';
import { parseCoinw } from './coinw';
import { parseGateFixed, parseGateFlexible } from './gate';
import { kucoinNewUserProductIds, parseKucoin, parseKucoinCap } from './kucoin';
import { parseOkx } from './okx';

// Fixtures are trimmed real responses saved on 2026-10-14.
const fixture = (name: string) => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));

const ASSETS = ['USDT', 'USDC', 'BTC', 'ETH', 'BNB', 'DOGE', 'XAUT'];

describe('parseBybit', () => {
  it('reads flexible savings with their APR tiers and skips unlisted coins', () => {
    const offers = parseBybit(fixture('bybit-flexible.json'), ASSETS);
    expect(offers.map((o) => o.asset).sort()).toEqual(['BTC', 'USDT']);
    expect(offers.find((o) => o.asset === 'USDT')).toEqual({
      platformId: 'bybit',
      asset: 'USDT',
      product: 'Flexible Savings',
      termDays: 0,
      rate: 6.93,
      type: 'APR',
      tiers: [
        { min: 0, max: 100, rate: 6.93 },
        { min: 100, max: null, rate: 1.93 },
      ],
    });
  });

  it('reads on-chain products, fixed terms and the token received', () => {
    const offers = parseBybit(fixture('bybit-onchain.json'), ASSETS);
    expect(offers.find((o) => o.asset === 'ETH')).toMatchObject({ termDays: 0, note: 'Staked as STETH' });
    expect(offers.find((o) => o.asset === 'BTC')).toMatchObject({ product: 'On-chain Earn', termDays: 45, rate: 1.2 });
  });

  it('throws on an API error', () => {
    expect(() => parseBybit({ retCode: 10001, retMsg: 'bad', result: { list: [] } }, ASSETS)).toThrow(/10001/);
  });
});

describe('bybitHosts', () => {
  const direct = ['https://api.bybit.com', 'https://api.bytick.com', 'https://api.bybitglobal.com'];

  it('uses only the direct hosts without a proxy', () => {
    expect(bybitHosts()).toEqual(direct);
    expect(bybitHosts('  ')).toEqual(direct);
  });

  it('tries the proxy last, several times, without a trailing slash', () => {
    expect(bybitHosts('https://bybit-proxy.example.workers.dev/')).toEqual([
      ...direct,
      ...Array<string>(PROXY_ATTEMPTS).fill('https://bybit-proxy.example.workers.dev'),
    ]);
    expect(PROXY_ATTEMPTS).toBeGreaterThan(1);
  });
});

describe('hideProxy', () => {
  it('replaces the proxy host in error messages', () => {
    const error = new Error('HTTP 403 from api.bybit.com; HTTP 403 from secret-name.example.workers.dev');
    expect(hideProxy(error, 'https://secret-name.example.workers.dev').message).toBe(
      'HTTP 403 from api.bybit.com; HTTP 403 from bybit-proxy'
    );
    expect(hideProxy(error).message).toBe(error.message);
  });

  it('lists a repeated error once', () => {
    const error = new Error('HTTP 403 from api.bybit.com; HTTP 403 from p.example.dev; HTTP 403 from p.example.dev');
    expect(hideProxy(error, 'https://p.example.dev').message).toBe(
      'HTTP 403 from api.bybit.com; HTTP 403 from bybit-proxy'
    );
  });
});

describe('parseBinance', () => {
  const offers = parseBinance(fixture('binance.json'), ASSETS);

  it('splits the flexible bonus band from the base rate', () => {
    expect(offers.find((o) => o.asset === 'USDT' && o.termDays === 0)).toMatchObject({
      product: 'Simple Earn',
      rate: 6.44,
      tiers: [
        { min: 0, max: 500, rate: 6.44 },
        { min: 500, max: null, rate: 2.44 },
      ],
    });
  });

  it('reads locked products by duration and skips unlisted assets', () => {
    const locked = offers.filter((o) => o.product === 'Simple Earn Locked').map((o) => [o.termDays, o.rate]);
    expect(locked).toEqual([
      [7, 0.3],
      [7, 0.25],
      [90, 0.3],
      [120, 0.3],
    ]);
    expect(offers.some((o) => o.asset === 'SENT')).toBe(false);
  });
});

describe('parseOkx', () => {
  it('converts the estimated rate to a percentage', () => {
    expect(parseOkx(fixture('okx.json'), ASSETS)).toEqual([
      { platformId: 'okx', asset: 'BTC', product: 'Simple Earn', termDays: 0, rate: 0.5, type: 'APR' },
      { platformId: 'okx', asset: 'USDT', product: 'Simple Earn', termDays: 0, rate: 3.5, type: 'APR' },
    ]);
  });
});

describe('Gate', () => {
  it('reads flexible rates and drops zero rates', () => {
    const offers = parseGateFlexible(fixture('gate-flexible.json'), ASSETS);
    expect(offers.map((o) => [o.asset, o.rate])).toEqual([
      ['BTC', 0.1],
      ['USDT', 2.36],
    ]);
  });

  it('keeps only fixed products open to everyone and on sale', () => {
    const offers = parseGateFixed(fixture('gate-fixed.json'), ASSETS);
    // The fixture also holds VIP-only, invited-group and sold-out USDT products.
    expect(offers.map((o) => [o.termDays, o.rate])).toEqual([
      [30, 3.2],
      [14, 2.8],
    ]);
  });
});

describe('parseAave', () => {
  const offers = parseAave(fixture('defillama.json'), ASSETS);

  it('picks the best Aave v3 pool per asset and maps wrapped tokens', () => {
    expect(offers.find((o) => o.asset === 'ETH')).toMatchObject({
      type: 'APY',
      rate: 2.13,
      note: 'WETH on Base, incl. 0.74% rewards',
    });
  });

  it('skips Umbrella, small pools and other protocols', () => {
    // Umbrella USDT (4.91%), a tiny 40% pool and Compound at 9% are all ignored.
    expect(offers.find((o) => o.asset === 'USDT')).toMatchObject({ rate: 3.28, note: 'USDT on Ethereum' });
    expect(offers.find((o) => o.asset === 'USDC')?.rate).toBe(5.81);
  });
});

describe('parseKucoin', () => {
  const offers = parseKucoin(fixture('kucoin.json'), ASSETS, new Map([[2310, 100]]));
  const regular = offers.filter((o) => !o.audience);

  it('reads flexible and fixed Simple Earn and plain staking', () => {
    expect(regular.filter((o) => o.asset === 'USDT').map((o) => [o.termDays, o.rate])).toEqual([
      [0, 1.25],
      [7, 1.8],
      [14, 2.2],
      [35, 2.8],
      [90, 3],
      [180, 3.6],
      [365, 4.1],
    ]);
    expect(regular.find((o) => o.product === 'Staking')).toMatchObject({ asset: 'ETH', termDays: 0, rate: 2.01 });
  });

  it('skips structured and private-wealth products', () => {
    // The fixture also has dual investment, shark fin and PWM funds.
    expect(Math.max(...regular.map((o) => o.rate))).toBeLessThan(5);
    expect(new Set(offers.map((o) => o.product))).toEqual(new Set(['Simple Earn', 'Staking']));
  });

  it('marks the NEWBIE offer as new-user, with the cap from its detail request', () => {
    expect(kucoinNewUserProductIds(fixture('kucoin.json'), ASSETS)).toEqual([2310]);
    expect(parseKucoinCap(fixture('kucoin-detail.json'))).toBe(100);
    expect(offers.filter((o) => o.audience)).toEqual([
      {
        platformId: 'kucoin',
        asset: 'USDT',
        product: 'Simple Earn',
        termDays: 7,
        rate: 100,
        type: 'APR',
        audience: 'new-user',
        maxAmount: 100,
      },
    ]);
  });
});

describe('parseCoinw', () => {
  const offers = parseCoinw(fixture('coinw.json'), ASSETS);

  it('reads fixed products with their token bonus', () => {
    expect(offers.find((o) => o.termDays === 30)).toEqual({
      platformId: 'coinw',
      asset: 'USDT',
      product: 'Fixed Savings',
      termDays: 30,
      rate: 7.51,
      type: 'APR',
      note: '7.5% of it paid in CWC',
    });
  });

  it('reads flexible bands', () => {
    expect(offers.find((o) => o.asset === 'XAUT')?.tiers).toEqual([
      { min: 0, max: 0.2, rate: 15 },
      { min: 0.2, max: null, rate: 5 },
    ]);
  });

  it('skips sold-out products', () => {
    // The flexible USDT product (10.8%) is sold out.
    expect(offers.some((o) => o.asset === 'USDT' && o.termDays === 0)).toBe(false);
  });

  it('keeps the new-user offer with its cap', () => {
    expect(offers.filter((o) => o.audience)).toMatchObject([
      { asset: 'USDT', termDays: 3, rate: 100, audience: 'new-user', maxAmount: 100 },
    ]);
  });
});
