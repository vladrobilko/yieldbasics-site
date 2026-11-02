import { canonicalAsset, fractionToPercent, type RateOffer } from '../../../src/utils/rates';
import type { Source } from '../types';

// Official public API (Simple Earn flexible lending rate history):
// https://www.okx.com/docs-v5/en/#financial-product-simple-earn-flexible-get-public-borrow-history-public
// Without `ccy` it returns the last hour for every coin. `rate` is the market rate borrowers pay;
// `lendingRate` is what savers get and matches the APR on okx.com/earn/simple-earn (TRX: 27.9% vs 5.79%).
// Fixed-term offers need an API key, so only flexible rates are listed for now.
const API = 'https://www.okx.com/api/v5/finance/savings/lending-rate-history?limit=100';

interface OkxResponse {
  code: string;
  msg: string;
  data: { ccy: string; lendingRate: string; ts: string }[];
}

export const parseOkx = (response: OkxResponse, assets: readonly string[]): RateOffer[] => {
  if (response.code !== '0') throw new Error(`OKX error ${response.code}: ${response.msg}`);
  const latest = new Map<string, OkxResponse['data'][number]>();
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

export const okx: Source = {
  platformId: 'okx',
  kind: 'api',
  fetch: async (fetchJson, assets) => parseOkx((await fetchJson(API)) as OkxResponse, assets),
};
