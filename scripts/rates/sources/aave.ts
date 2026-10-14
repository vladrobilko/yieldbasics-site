import { roundRate, type RateOffer } from '../../../src/utils/rates';
import type { Source } from '../types';

// Aave v3 supply rates per chain, via the free DefiLlama yields API: https://defillama.com/docs/api
const API = 'https://yields.llama.fi/pools';

/** Pools smaller than this are skipped: thin liquidity makes their rate jumpy and withdrawals harder. */
export const MIN_TVL_USD = 10_000_000;

/**
 * Umbrella is Aave's staking safety module: deposits can be slashed to cover
 * bad debt, so it is not comparable to a plain deposit and is left out.
 */
const EXCLUDED_MARKETS = new Set(['umbrella']);

/** Aave market symbol → asset-picker symbol. Wrapped tokens map to the coin they track. */
const SYMBOLS: Record<string, string> = {
  USDT: 'USDT',
  USDC: 'USDC',
  WETH: 'ETH',
  WBTC: 'BTC',
  EURC: 'EURC',
  USDS: 'USDS',
  USDE: 'USDe',
  XAUT: 'XAUT',
  LINK: 'LINK',
  WAVAX: 'AVAX',
  WPOL: 'POL',
};

interface LlamaPool {
  chain: string;
  project: string;
  symbol: string;
  /** Market name when a chain has several Aave markets, e.g. "Umbrella". */
  poolMeta: string | null;
  tvlUsd: number;
  apy: number | null;
  apyReward: number | null;
}

interface LlamaResponse {
  status: string;
  data: LlamaPool[];
}

const describePool = (pool: LlamaPool): string =>
  [
    `${pool.symbol} on ${pool.chain}`,
    pool.poolMeta ? ` (${pool.poolMeta})` : '',
    pool.apyReward ? `, incl. ${roundRate(pool.apyReward)}% rewards` : '',
  ].join('');

/** For each asset, the Aave v3 supply pool (any chain, TVL ≥ $10M) with the best APY. */
export const parseAave = (response: LlamaResponse, assets: readonly string[]): RateOffer[] => {
  if (response.status !== 'success') throw new Error(`DefiLlama status: ${response.status}`);
  const best = new Map<string, LlamaPool>();
  for (const pool of response.data) {
    const asset = SYMBOLS[pool.symbol.toUpperCase()];
    if (pool.project !== 'aave-v3' || !asset || !assets.includes(asset)) continue;
    if (pool.poolMeta && EXCLUDED_MARKETS.has(pool.poolMeta.toLowerCase())) continue;
    if (pool.tvlUsd < MIN_TVL_USD || !pool.apy || pool.apy <= 0) continue;
    const current = best.get(asset);
    if (!current || pool.apy > (current.apy ?? 0)) best.set(asset, pool);
  }
  return [...best].map(([asset, pool]) => ({
    platformId: 'aave',
    asset,
    product: 'Supply',
    termDays: 0,
    rate: roundRate(pool.apy ?? 0),
    type: 'APY',
    note: describePool(pool),
  }));
};

export const aave: Source = {
  platformId: 'aave',
  kind: 'api',
  fetch: async (fetchJson, assets) => parseAave((await fetchJson(API)) as LlamaResponse, assets),
};
