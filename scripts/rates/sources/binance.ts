import { canonicalAsset, fractionToPercent, roundRate, type RateOffer } from '../../../src/utils/rates';
import type { Source } from '../types';

// The public JSON behind binance.com/en/earn/simple-earn. The official
// /sapi/v1/simple-earn endpoints need an API key. The include flags add the products the page
// lists next to Simple Earn (ETH/SOL staking, BFUSD, RWUSD, fixed loan supply).
const API =
  'https://www.binance.com/bapi/earn/v1/friendly/finance-earn/simple-earn/homepage/details?requestSource=WEB' +
  '&includeEthStaking=true&includeSolStaking=true&includeBFUSD=true&includeRWUSD=true&includeP2pLoanSupply=true';
const PAGE_SIZE = 200;

/** Single-rate products shown next to Simple Earn, by productType. `note` says what you end up holding. */
const EXTRA_PRODUCTS: Record<string, { product: string; note?: string }> = {
  ETH_TWO: { product: 'ETH Staking', note: 'Staked as WBETH' },
  BN_SOL_STAKING: { product: 'SOL Staking', note: 'Staked as BNSOL' },
  BFUSD: { product: 'BFUSD', note: 'Held as BFUSD, usable as futures margin' },
  RWUSD: { product: 'RWUSD', note: 'Held as RWUSD' },
  FIXED_LOAN_SUPPLY: { product: 'Fixed Loan Supply', note: 'Lent at a fixed rate' },
};
const MAX_PAGES = 20;

interface BinanceDetail {
  productType: string;
  duration: string;
  status: string;
  sellOut: boolean;
  apy: string;
  marketApr: string | null;
  apyTierOption: { beginAmount: string; endAmount: string; ratio: string }[] | null;
  tag: string | null;
}

interface BinanceProduct {
  asset: string;
  productDetailList: BinanceDetail[];
}

interface BinanceResponse {
  code: string;
  message: string | null;
  data: { total: string; list: BinanceProduct[] };
}

const parseDetail = (asset: string, detail: BinanceDetail): RateOffer | null => {
  // VIP products (e.g. "Eth*60*vip") are hidden from regular users on binance.com.
  if (detail.status !== 'ENABLE' || detail.sellOut || detail.tag === 'VIP') return null;
  if (detail.productType === 'LENDING_FLEXIBLE') {
    // `apy` is the base APR plus a bonus that only applies to the first band.
    const base = fractionToPercent(detail.marketApr ?? detail.apy);
    const bonus = detail.apyTierOption?.[0];
    const tiers = bonus
      ? [
          {
            min: Number(bonus.beginAmount),
            max: Number(bonus.endAmount),
            rate: roundRate(base + fractionToPercent(bonus.ratio)),
          },
          { min: Number(bonus.endAmount), max: null, rate: base },
        ]
      : undefined;
    return {
      platformId: 'binance',
      asset,
      product: 'Simple Earn',
      termDays: 0,
      rate: tiers ? tiers[0].rate : base,
      type: 'APR',
      ...(tiers ? { tiers } : {}),
    };
  }
  const extra = EXTRA_PRODUCTS[detail.productType];
  if (extra) {
    const rate = fractionToPercent(detail.apy);
    if (!(rate > 0)) return null;
    return {
      platformId: 'binance',
      asset,
      product: extra.product,
      termDays: Number(detail.duration) || 0,
      rate,
      type: 'APR',
      ...(extra.note ? { note: extra.note } : {}),
    };
  }
  if (detail.productType === 'POS_FIXED') {
    return {
      platformId: 'binance',
      asset,
      product: 'Simple Earn Locked',
      termDays: Number(detail.duration),
      rate: fractionToPercent(detail.apy),
      type: 'APR',
    };
  }
  return null;
};

export const parseBinance = (response: BinanceResponse, assets: readonly string[]): RateOffer[] => {
  if (response.code !== '000000') throw new Error(`Binance error ${response.code}: ${response.message}`);
  return response.data.list.flatMap((product) => {
    const asset = canonicalAsset(product.asset, assets);
    if (!asset) return [];
    return product.productDetailList.flatMap((detail) => parseDetail(asset, detail) ?? []);
  });
};

export const binance: Source = {
  platformId: 'binance',
  kind: 'web',
  fetch: async (fetchJson, assets) => {
    const offers: RateOffer[] = [];
    for (let page = 1; page <= MAX_PAGES; page++) {
      const response = (await fetchJson(`${API}&pageIndex=${page}&pageSize=${PAGE_SIZE}`)) as BinanceResponse;
      offers.push(...parseBinance(response, assets));
      if (page * PAGE_SIZE >= Number(response.data.total) || response.data.list.length === 0) break;
    }
    return offers;
  },
};
