import { canonicalAsset, fractionToPercent, type RateOffer } from '../../../src/utils/rates';
import type { Source } from '../types';

// Official public API v4: https://www.gate.com/docs/developers/apiv4/#earn-uni
const FLEXIBLE_API = 'https://api.gateio.ws/api/v4/earn/uni/rate';
const FIXED_API = 'https://api.gateio.ws/api/v4/earn/fixed-term/product';
const PAGE_SIZE = 100;
const MAX_PAGES = 20;

interface GateFlexibleRate {
  currency: string;
  /** Estimated annual rate as a fraction. */
  est_rate: string;
}

interface GateFixedProduct {
  asset: string;
  lock_up_period: number;
  year_rate: string;
  type: number;
  status: number;
  sale_status: number;
  is_for_all_user: number;
  min_vip: number;
  max_vip: number;
}

interface GateFixedResponse {
  code: number;
  message: string;
  data: { total: number; list: GateFixedProduct[] };
}

export const parseGateFlexible = (rates: GateFlexibleRate[], assets: readonly string[]): RateOffer[] =>
  rates.flatMap((row): RateOffer[] => {
    const asset = canonicalAsset(row.currency, assets);
    const rate = fractionToPercent(row.est_rate);
    if (!asset || rate <= 0) return [];
    return [{ platformId: 'gate', asset, product: 'Simple Earn', termDays: 0, rate, type: 'APR' }];
  });

/**
 * Gate lists many fixed products that only some users can buy (VIP levels,
 * invited groups, launch pools). Keep the ones open to everyone and on sale.
 */
export const isOpenGateFixed = (product: GateFixedProduct): boolean =>
  product.type === 1 &&
  product.status === 2 &&
  product.sale_status === 1 &&
  product.is_for_all_user === 1 &&
  product.min_vip === 0 &&
  product.max_vip === 0;

export const parseGateFixed = (response: GateFixedResponse, assets: readonly string[]): RateOffer[] => {
  if (response.code !== 0) throw new Error(`Gate error ${response.code}: ${response.message}`);
  return response.data.list.flatMap((product): RateOffer[] => {
    const asset = canonicalAsset(product.asset, assets);
    if (!asset || !isOpenGateFixed(product)) return [];
    return [
      {
        platformId: 'gate',
        asset,
        product: 'Fixed Earn',
        termDays: product.lock_up_period,
        rate: fractionToPercent(product.year_rate),
        type: 'APR',
      },
    ];
  });
};

export const gate: Source = {
  platformId: 'gate',
  kind: 'api',
  fetch: async (fetchJson, assets) => {
    const offers = parseGateFlexible((await fetchJson(FLEXIBLE_API)) as GateFlexibleRate[], assets);
    for (let page = 1; page <= MAX_PAGES; page++) {
      const response = (await fetchJson(`${FIXED_API}?page=${page}&limit=${PAGE_SIZE}`)) as GateFixedResponse;
      offers.push(...parseGateFixed(response, assets));
      if (page * PAGE_SIZE >= response.data.total || response.data.list.length === 0) break;
    }
    return offers;
  },
};
