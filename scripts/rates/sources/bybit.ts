import { canonicalAsset, parsePercent, type RateOffer, type RateTier } from '../../../src/utils/rates';
import type { Source } from '../types';

// Official public API: https://bybit-exchange.github.io/docs/v5/earn/product-info
const API = 'https://api.bybit.com/v5/earn/product';

interface BybitProduct {
  category: string;
  coin: string;
  estimateApr: string;
  status: string;
  duration: string;
  term: number;
  swapCoin: string;
  hasTieredApr: boolean;
  tierAprDetails: { min: string; max: string; estimateApr: string }[];
}

interface BybitResponse {
  retCode: number;
  retMsg: string;
  result: { list: BybitProduct[] };
}

const PRODUCT_NAMES: Record<string, string> = {
  FlexibleSaving: 'Flexible Savings',
  OnChain: 'On-chain Earn',
};

export const parseBybit = (response: BybitResponse, assets: readonly string[]): RateOffer[] => {
  if (response.retCode !== 0) throw new Error(`Bybit error ${response.retCode}: ${response.retMsg}`);
  return response.result.list.flatMap((product): RateOffer[] => {
    const asset = canonicalAsset(product.coin, assets);
    if (!asset || product.status !== 'Available') return [];
    const tiers: RateTier[] = product.hasTieredApr
      ? product.tierAprDetails.map((tier) => ({
          min: Number(tier.min),
          max: tier.max === '-1' ? null : Number(tier.max),
          rate: parsePercent(tier.estimateApr),
        }))
      : [];
    const rate = Math.max(parsePercent(product.estimateApr), ...tiers.map((tier) => tier.rate));
    return [
      {
        platformId: 'bybit',
        asset,
        product: PRODUCT_NAMES[product.category] ?? product.category,
        termDays: product.duration === 'Fixed' ? product.term : 0,
        rate,
        type: 'APR',
        ...(tiers.length ? { tiers } : {}),
        ...(product.swapCoin ? { note: `Staked as ${product.swapCoin}` } : {}),
      },
    ];
  });
};

export const bybit: Source = {
  platformId: 'bybit',
  kind: 'api',
  fetch: async (fetchJson, assets) => {
    const categories = Object.keys(PRODUCT_NAMES);
    const responses = await Promise.all(categories.map((category) => fetchJson(`${API}?category=${category}`)));
    return responses.flatMap((response) => parseBybit(response as BybitResponse, assets));
  },
};
