import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { parseAave } from './aave';
import { parseBinance } from './binance';
import { bybitHosts, hideProxy, parseBybit, PROXY_ATTEMPTS } from './bybit';
import { mergeCoinwResponses, parseCoinw } from './coinw';
import { parseGateFixed, parseGateFlexible } from './gate';
import { kucoinNewUserProductIds, parseKucoin, parseKucoinCap } from './kucoin';
import { parseOkx, parseOkxProducts } from './okx';

// Fixtures are trimmed real responses saved on 2026-10-14 (okx*.json, binance-extras.json and gate-fixed.json on 2026-11-02).
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

  it('reads locked products by duration and skips VIP-only and unlisted ones', () => {
    // The fixture's BNB 7-day product at 0.3% is tagged VIP.
    const locked = offers.filter((o) => o.product === 'Simple Earn Locked').map((o) => [o.termDays, o.rate]);
    expect(locked).toEqual([
      [7, 0.25],
      [90, 0.3],
      [120, 0.3],
    ]);
    expect(offers.some((o) => o.asset === 'SENT')).toBe(false);
  });

  it('reads staking, BFUSD, RWUSD and fixed loan supply with what you end up holding', () => {
    const extras = parseBinance(fixture('binance-extras.json'), [...ASSETS, 'SOL']);
    expect(extras.map((o) => [o.asset, o.product, o.termDays, o.rate, o.note])).toEqual([
      ['ETH', 'ETH Staking', 0, 2.19, 'Staked as WBETH'],
      ['USDT', 'BFUSD', 0, 5.12, 'Held as BFUSD, usable as futures margin'],
      ['USDT', 'RWUSD', 0, 3.61, 'Held as RWUSD'],
      ['USDT', 'Fixed Loan Supply', 90, 3.44, 'Lent at a fixed rate'],
      ['SOL', 'SOL Staking', 0, 4.47, 'Staked as BNSOL'],
    ]);
  });
});

describe('parseOkx', () => {
  it('reads the latest rate savers get, not the borrow rate', () => {
    // The fixture also holds an older USDT row (9.99%) and SHIB, which is not in ASSETS.
    expect(parseOkx(fixture('okx.json'), ASSETS)).toEqual([
      { platformId: 'okx', asset: 'USDT', product: 'Simple Earn', termDays: 0, rate: 3.47, type: 'APR' },
      { platformId: 'okx', asset: 'DOGE', product: 'Simple Earn', termDays: 0, rate: 0.05, type: 'APR' },
      { platformId: 'okx', asset: 'BTC', product: 'Simple Earn', termDays: 0, rate: 0.01, type: 'APR' },
    ]);
  });

  it('drops zero rates', () => {
    const response = { code: '0', msg: '', data: [{ ccy: 'BTC', lendingRate: '0', ts: '1' }] };
    expect(parseOkx(response, ASSETS)).toEqual([]);
  });
});

describe('parseOkxProducts', () => {
  const regular = parseOkx(fixture('okx.json'), ASSETS);
  const products = fixture('okx-products.json');

  it('reads new-user bonuses with their cap and the rate after', () => {
    // DOGE only has a plain flexible rate, and USDT a sold-out 90-day term.
    expect(parseOkxProducts(products, ASSETS, regular)).toEqual([
      {
        platformId: 'okx',
        asset: 'USDT',
        product: 'Simple Earn',
        termDays: 0,
        rate: 10,
        type: 'APR',
        audience: 'new-user',
        maxAmount: 500,
        note: 'For 180 days, then 3.47%',
      },
      {
        platformId: 'okx',
        asset: 'USDC',
        product: 'Simple Earn',
        termDays: 0,
        rate: 10,
        type: 'APR',
        audience: 'new-user',
        maxAmount: 500,
        note: 'For 180 days',
      },
      {
        platformId: 'okx',
        asset: 'XAUT',
        product: 'Simple Earn',
        termDays: 0,
        rate: 13,
        type: 'APR',
        audience: 'new-user',
        maxAmount: 0.1,
        note: 'For 90 days',
      },
    ]);
  });

  it('keeps open fixed terms', () => {
    const open = structuredClone(products);
    open.data.allProducts.currencies[0].products[1].purchaseStatus = 1;
    expect(parseOkxProducts(open, ASSETS, regular)).toContainEqual({
      platformId: 'okx',
      asset: 'USDT',
      product: 'Simple Earn',
      termDays: 90,
      rate: 4,
      type: 'APR',
    });
  });

  it('throws on an API error', () => {
    expect(() => parseOkxProducts({ code: 1, msg: 'bad' } as never, ASSETS, regular)).toThrow(/bad/);
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

  it('keeps only fixed products listed for everyone and on sale, plus the new-user one', () => {
    const offers = parseGateFixed(fixture('gate-fixed.json'), ASSETS);
    // The fixture also holds sold-out, hidden (3 days 6%), VIP-only, invited-group, hidden new-user
    // and "Crazy Wednesday" (needs a 1,000 USDT net deposit) products.
    expect(offers.map((o) => [o.termDays, o.rate, o.audience, o.maxAmount])).toEqual([
      [30, 3.2, undefined, undefined],
      [14, 2.8, undefined, undefined],
      [3, 100, 'new-user', 500],
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

  it('reads plain GHO supply and skips sGHO', () => {
    // GHO pools added 2026-11-01: sGHO pays 4.5% but is a staked savings product, not a supply market.
    const gho = parseAave(fixture('defillama.json'), [...ASSETS, 'GHO']).filter((o) => o.asset === 'GHO');
    expect(gho).toHaveLength(1);
    expect(gho[0]).toMatchObject({ rate: 1.86, note: 'GHO on Ethereum (Prime Instance)' });
  });
});

describe('parseKucoin', () => {
  const offers = parseKucoin(fixture('kucoin.json'), ASSETS, new Map([[2310, 100]]));
  const regular = offers.filter((o) => !o.audience);

  it('reads flexible and fixed Simple Earn and plain staking', () => {
    const simple = regular.filter((o) => o.asset === 'USDT' && o.product === 'Simple Earn');
    expect(simple.map((o) => [o.termDays, o.rate])).toEqual([
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
    expect(new Set(offers.map((o) => o.product))).toEqual(new Set(['Simple Earn', 'Staking', 'KCUSD']));
  });

  it('reads KCUSD with what you end up holding', () => {
    expect(offers.find((o) => o.product === 'KCUSD')).toMatchObject({
      asset: 'USDT',
      termDays: 0,
      rate: 4,
      note: 'Held as KCUSD',
    });
  });

  it('skips VIP-only products, even new-user ones', () => {
    const response = fixture('kucoin.json');
    const regularUsdt = { id: 9, currency: 'USDT', category_group2: 'SIMPLE_EARN', category: 'ACTIVITY' };
    const vipOnly = { ...regularUsdt, type: 'MULTI_TIME', status: 'ONGOING', duration: 30, total_apr: '6' };
    response.data[0].products.push({ ...vipOnly, tags: ['NEWBIE', 'VIP_ONLY'] });
    expect(parseKucoin(response, ASSETS).filter((o) => o.audience)).toHaveLength(1);
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

  it('keeps sold-out flexible products', () => {
    // The flexible USDT product (10.8%) is flagged sold out but still takes deposits.
    expect(offers.find((o) => o.asset === 'USDT' && o.termDays === 0)).toMatchObject({ rate: 10.8 });
  });

  it('skips sold-out fixed products', () => {
    const response = fixture('coinw.json');
    for (const product of response.data.rows) {
      if (product.productClassifiy === 'REGULAR_FINANCIAL') product.productInvestList[0].isSellOut = 1;
    }
    expect(parseCoinw(response, ASSETS).every((o) => o.termDays === 0)).toBe(true);
  });

  it('keeps the new-user offer with its cap', () => {
    expect(offers.filter((o) => o.audience)).toMatchObject([
      { asset: 'USDT', termDays: 3, rate: 100, audience: 'new-user', maxAmount: 100 },
    ]);
  });
});

describe('mergeCoinwResponses', () => {
  const ok = (ids: number[]) => ({
    code: 200,
    data: { total: ids.length, rows: ids.map((productId) => ({ productId })) },
  });

  it('joins the lists and keeps each product once', () => {
    const merged = mergeCoinwResponses([ok([1, 2]), ok([2, 3]), ok([])] as never);
    expect(merged.data.rows.map((row) => row.productId)).toEqual([1, 2, 3]);
  });

  it('passes an API error through so the parser throws', () => {
    const merged = mergeCoinwResponses([ok([1]), { code: 500, msg: 'down', data: { total: 0, rows: [] } }] as never);
    expect(() => parseCoinw(merged, ASSETS)).toThrow(/500/);
  });
});
