import { canonicalAsset, fractionToPercent, type RateOffer } from '../../../src/utils/rates';
import type { Source } from '../types';

// Official public API (Simple Earn flexible lending rates):
// https://www.okx.com/docs-v5/en/#financial-product-simple-earn-flexible-get-public-borrow-info-public
// Fixed-term offers need an API key, so only flexible rates are listed for now.
const API = 'https://www.okx.com/api/v5/finance/savings/lending-rate-summary';

interface OkxResponse {
  code: string;
  msg: string;
  data: { ccy: string; estRate: string }[];
}

export const parseOkx = (response: OkxResponse, assets: readonly string[]): RateOffer[] => {
  if (response.code !== '0') throw new Error(`OKX error ${response.code}: ${response.msg}`);
  return response.data.flatMap((row): RateOffer[] => {
    const asset = canonicalAsset(row.ccy, assets);
    if (!asset) return [];
    return [
      {
        platformId: 'okx',
        asset,
        product: 'Simple Earn',
        termDays: 0,
        rate: fractionToPercent(row.estRate),
        type: 'APR',
      },
    ];
  });
};

export const okx: Source = {
  platformId: 'okx',
  kind: 'api',
  fetch: async (fetchJson, assets) => parseOkx((await fetchJson(API)) as OkxResponse, assets),
};
