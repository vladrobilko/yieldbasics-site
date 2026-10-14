import { canonicalAsset, NEW_USER_ASSETS, roundRate, type RateOffer } from '../../../src/utils/rates';
import type { Source } from '../types';

// The public JSON behind kucoin.com/earn. The official /api/v1/earn
// endpoints need an API key.
const API =
  'https://www.kucoin.com/_pxapi/pool-staking/v5/currencies-products?product_category_group=&layer=3&order_by=&exclude_advanced_group_apr=1&lang=en_US';
/** Product details, including the per-user deposit cap (`user_upper_limit`). */
const DETAIL_API = 'https://www.kucoin.com/_pxapi/pool-staking/v3/products';

interface KucoinProduct {
  id: number;
  currency: string;
  category_group2: string;
  category: string;
  type: string;
  status: string;
  duration: number;
  total_apr: string;
  tags: string[];
}

/** A product, or a group of products/groups (the response nests several levels). */
interface KucoinNode {
  id?: number;
  products?: KucoinNode[];
}

interface KucoinResponse {
  success: boolean;
  code: number;
  msg: string;
  data: { currency: string; products: KucoinNode[] }[];
}

const flatten = (nodes: KucoinNode[]): KucoinProduct[] =>
  nodes.flatMap((node) => (node.id ? [node as KucoinProduct] : flatten(node.products ?? [])));

/**
 * Simple Earn (flexible and fixed) and plain staking. Dual investment, shark
 * fin and the private-wealth funds are structured products, not deposits.
 */
const productName = (product: KucoinProduct): string | null => {
  if (product.category_group2 === 'SIMPLE_EARN') return 'Simple Earn';
  if (product.category_group2 === 'STAKING' && product.category === 'STAKING') return 'Staking';
  return null;
};

const isNewUser = (product: KucoinProduct) => product.tags.includes('NEWBIE');

const listedProducts = (response: KucoinResponse, assets: readonly string[]) =>
  flatten(response.data.flatMap((coin) => coin.products)).flatMap((product) => {
    const asset = canonicalAsset(product.currency, assets);
    const name = productName(product);
    if (!asset || !name || product.status !== 'ONGOING') return [];
    // NEWBIE offers (new users only) are kept for the "New users" tab, USDT/USDC only.
    if (isNewUser(product) && !NEW_USER_ASSETS.includes(asset)) return [];
    return [{ product, asset, name }];
  });

/** Ids of the new-user products, whose per-user cap needs one detail request each. */
export const kucoinNewUserProductIds = (response: KucoinResponse, assets: readonly string[]): number[] =>
  listedProducts(response, assets).flatMap(({ product }) => (isNewUser(product) ? [product.id] : []));

interface KucoinDetailResponse {
  success: boolean;
  data: { user_upper_limit: string } | null;
}

/** The per-user deposit cap from a product detail response, if it has one. */
export const parseKucoinCap = (response: KucoinDetailResponse): number | undefined => {
  const cap = Number(response.data?.user_upper_limit);
  return response.success && cap > 0 ? cap : undefined;
};

/** `caps` maps new-user product ids to their per-user cap (see kucoinNewUserProductIds). */
export const parseKucoin = (
  response: KucoinResponse,
  assets: readonly string[],
  caps: ReadonlyMap<number, number> = new Map()
): RateOffer[] => {
  if (!response.success) throw new Error(`KuCoin error ${response.code}: ${response.msg}`);
  return listedProducts(response, assets).map(({ product, asset, name }) => {
    const cap = caps.get(product.id);
    return {
      platformId: 'kucoin',
      asset,
      product: name,
      termDays: Math.max(0, product.duration),
      rate: roundRate(Number(product.total_apr)),
      type: 'APR',
      ...(isNewUser(product) ? { audience: 'new-user' as const } : {}),
      ...(cap ? { maxAmount: cap } : {}),
    };
  });
};

export const kucoin: Source = {
  platformId: 'kucoin',
  kind: 'web',
  fetch: async (fetchJson, assets) => {
    const response = (await fetchJson(API)) as KucoinResponse;
    const caps = new Map<number, number>();
    for (const id of kucoinNewUserProductIds(response, assets)) {
      const cap = parseKucoinCap((await fetchJson(`${DETAIL_API}/${id}?lang=en_US`)) as KucoinDetailResponse);
      if (cap) caps.set(id, cap);
    }
    return parseKucoin(response, assets, caps);
  },
};
