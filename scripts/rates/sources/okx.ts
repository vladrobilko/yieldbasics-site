import { canonicalAsset, fractionToPercent, roundRate, type RateOffer } from '../../../src/utils/rates';
import type { Source } from '../types';

// Official public API (Simple Earn flexible lending rate history):
// https://www.okx.com/docs-v5/en/#financial-product-simple-earn-flexible-get-public-borrow-history-public
// Without `ccy` it returns the last hour for every coin. `rate` is the market rate borrowers pay;
// `lendingRate` is what savers get and matches the APR on okx.com/earn/simple-earn (TRX: 27.9% vs 5.79%).
const RATES_API = 'https://www.okx.com/api/v5/finance/savings/lending-rate-history?limit=100';
// The JSON behind okx.com/earn/simple-earn. It adds what the official API lacks: new-user bonus
// rates and fixed terms. It skips the regular flexible rate of coins that have a bonus, so both are needed.
const PRODUCTS_API = 'https://www.okx.com/priapi/v1/earn/simple-earn/all-products?type=all';
/** Per-user bonus caps from the FAQ on okx.com/earn/simple-earn (checked 2026-11-02); not in the JSON. */
const NEW_USER_CAPS: Record<string, number> = { USDT: 500, USDC: 500, BTC: 0.01, ETH: 0.2, XAUT: 0.1 };

interface OkxRatesResponse {
  code: string;
  msg: string;
  data: { ccy: string; lendingRate: string; ts: string }[];
}

interface OkxProduct {
  productsType: number;
  /** 1 = open, 2 = sold out. */
  purchaseStatus: number;
  bonusDescription: string;
  rate: { rateNum?: { value: string[] } };
  term: { type: string; value: number };
}

interface OkxProductsResponse {
  code: number;
  msg: string;
  data: { allProducts: { currencies: { investCurrency: { currencyName: string }; products: OkxProduct[] }[] } };
}

export const parseOkx = (response: OkxRatesResponse, assets: readonly string[]): RateOffer[] => {
  if (response.code !== '0') throw new Error(`OKX error ${response.code}: ${response.msg}`);
  const latest = new Map<string, OkxRatesResponse['data'][number]>();
  for (const row of response.data) {
    const seen = latest.get(row.ccy);
    if (!seen || Number(row.ts) > Number(seen.ts)) latest.set(row.ccy, row);
  }
  return [...latest.values()].flatMap((row): RateOffer[] => {
    const asset = canonicalAsset(row.ccy, assets);
    const rate = fractionToPercent(row.lendingRate);
    if (!asset || !(rate > 0)) return [];
    return [{ platformId: 'okx', asset, product: 'Simple Earn', termDays: 0, rate, type: 'APR' }];
  });
};

/**
 * New-user bonus offers and open fixed terms. Plain flexible products are skipped: parseOkx covers them.
 * `regular` holds the flexible rates from parseOkx, used for the "then X%" note.
 */
export const parseOkxProducts = (
  response: OkxProductsResponse,
  assets: readonly string[],
  regular: RateOffer[]
): RateOffer[] => {
  if (response.code !== 0) throw new Error(`OKX products error ${response.code}: ${response.msg}`);
  return response.data.allProducts.currencies.flatMap(({ investCurrency, products }) => {
    const asset = canonicalAsset(investCurrency.currencyName, assets);
    if (!asset) return [];
    return products.flatMap((product): RateOffer[] => {
      const rate = roundRate(Number(product.rate.rateNum?.value[0]));
      if (product.purchaseStatus !== 1 || !(rate > 0)) return [];
      const fixed = product.productsType !== 1;
      if (fixed) {
        if (product.term.type !== 'DAY') return [];
        return [{ platformId: 'okx', asset, product: 'Simple Earn', termDays: product.term.value, rate, type: 'APR' }];
      }
      if (!/new users only/i.test(product.bonusDescription)) return [];
      const days = /for (\d+) days/i.exec(product.bonusDescription)?.[1];
      const after = regular.find((offer) => offer.asset === asset)?.rate;
      const then = after === undefined ? '' : `then ${after}%`;
      const joined = [days && `for ${days} days`, then].filter(Boolean).join(', ');
      const note = joined.charAt(0).toUpperCase() + joined.slice(1);
      const cap = NEW_USER_CAPS[asset];
      return [
        {
          platformId: 'okx',
          asset,
          product: 'Simple Earn',
          termDays: 0,
          rate,
          type: 'APR',
          audience: 'new-user',
          ...(cap ? { maxAmount: cap } : {}),
          ...(note ? { note } : {}),
        },
      ];
    });
  });
};

export const okx: Source = {
  platformId: 'okx',
  kind: 'api',
  fetch: async (fetchJson, assets) => {
    const [rates, products] = await Promise.all([fetchJson(RATES_API), fetchJson(PRODUCTS_API)]);
    const regular = parseOkx(rates as OkxRatesResponse, assets);
    return [...regular, ...parseOkxProducts(products as OkxProductsResponse, assets, regular)];
  },
};
