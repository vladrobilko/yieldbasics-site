import { canonicalAsset, roundRate, type RateOffer, type RateTier } from '../../../src/utils/rates';
import type { Source } from '../types';

// The public JSON behind bitget.com/earning/savings. The official
// /api/v2/earn/savings endpoints need an API key.
const API = 'https://www.bitget.com/v1/finance/savings/product/list';
/** Pause between per-coin requests: Bitget answers 429 to quick bursts. */
const REQUEST_GAP_MS = 1500;
/** "Parameter error: coin": Bitget has no savings product for that coin. */
const COIN_NOT_LISTED = '52041';

interface BitgetProduct {
  coinName: string;
  /** 1 = flexible, 2 = fixed term (`period` days). */
  periodType: number;
  period: number;
  status: number;
  visibleApy: boolean;
  conditionType: number;
  activities: unknown[];
  maxApy: string;
  apyList: { apy: string; minStepValue: string; maxStepValue: string }[];
}

interface BitgetResponse {
  code: string;
  msg?: string;
  data: { bizLineProductList: { productList: BitgetProduct[] }[] }[] | null;
}

/** Products anyone can join: running, with a public rate, and no extra condition or campaign. */
const isOpen = (product: BitgetProduct) =>
  product.status === 2 && product.visibleApy && product.conditionType === 0 && product.activities.length === 0;

export const parseBitget = (response: BitgetResponse, assets: readonly string[]): RateOffer[] => {
  if (response.code === COIN_NOT_LISTED) return [];
  if (response.code !== '200') throw new Error(`Bitget error ${response.code}: ${response.msg ?? ''}`);
  const products = (response.data ?? []).flatMap((coin) => coin.bizLineProductList.flatMap((line) => line.productList));
  return products.flatMap((product): RateOffer[] => {
    const asset = canonicalAsset(product.coinName, assets);
    if (!asset || !isOpen(product)) return [];
    const tiers: RateTier[] = product.apyList.map((tier, index, list) => ({
      min: Number(tier.minStepValue),
      // The last band's max is just the product's overall cap.
      max: index === list.length - 1 && list.length > 1 ? null : Number(tier.maxStepValue),
      rate: roundRate(Number(tier.apy)),
    }));
    return [
      {
        platformId: 'bitget',
        asset,
        product: 'Savings',
        termDays: product.periodType === 2 ? product.period : 0,
        rate: roundRate(Number(product.maxApy)),
        type: 'APR',
        ...(tiers.length ? { tiers } : {}),
      },
    ];
  });
};

export const bitget: Source = {
  platformId: 'bitget',
  kind: 'web',
  fetch: async (fetchJson, assets) => {
    const offers: RateOffer[] = [];
    // One request per coin, spaced out to stay clear of the rate limit.
    for (const [index, asset] of assets.entries()) {
      if (index > 0) await new Promise((resolve) => setTimeout(resolve, REQUEST_GAP_MS));
      const response = await fetchJson(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coinName: asset.toUpperCase(),
          matchUserAssets: false,
          pageNo: 1,
          pageSize: 20,
          savingsType: 0,
          locale: 'en',
        }),
      });
      offers.push(...parseBitget(response as BitgetResponse, assets));
    }
    return offers;
  },
};
