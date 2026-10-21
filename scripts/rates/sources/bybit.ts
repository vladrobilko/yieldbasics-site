import { canonicalAsset, parsePercent, type RateOffer, type RateTier } from '../../../src/utils/rates';
import { fetchJsonWithFallback } from '../http';
import type { Source } from '../types';

// Official public API: https://bybit-exchange.github.io/docs/v5/earn/product-info
// api.bybit.com answers 403 to some regions (e.g. GitHub's US runners), so
// Bybit's alternate global domains are tried next. Regional hosts (bybit.eu,
// bybit.nl, bybit.kz…) list other products, so they are not used.
const HOSTS = ['https://api.bybit.com', 'https://api.bytick.com', 'https://api.bybitglobal.com'];
const PATH = '/v5/earn/product';

/**
 * Hosts to try in order. All of them block GitHub's runners, so the daily job
 * sets BYBIT_PROXY_URL to our Cloudflare Worker (scripts/rates/proxy/bybit-worker.js),
 * tried last. Local runs don't need it.
 */
export const bybitHosts = (proxyUrl?: string): string[] => {
  const proxy = proxyUrl?.trim().replace(/\/+$/, '');
  return proxy ? [...HOSTS, proxy] : [...HOSTS];
};

/** Keeps the proxy address (a secret) out of error messages and the public PR summary. */
export const hideProxy = (error: unknown, proxyUrl?: string): Error => {
  const message = error instanceof Error ? error.message : String(error);
  const host = proxyUrl && URL.canParse(proxyUrl) ? new URL(proxyUrl).host : '';
  return new Error(host ? message.replaceAll(host, 'bybit-proxy') : message);
};

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
    const proxyUrl = process.env.BYBIT_PROXY_URL;
    const hosts = bybitHosts(proxyUrl);
    const categories = Object.keys(PRODUCT_NAMES);
    const responses = await Promise.all(
      categories.map((category) => fetchJsonWithFallback(fetchJson, hosts, `${PATH}?category=${category}`))
    ).catch((error: unknown) => {
      throw hideProxy(error, proxyUrl);
    });
    return responses.flatMap((response) => parseBybit(response as BybitResponse, assets));
  },
};
