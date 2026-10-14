/**
 * Assets for the picker, plus the rates table rows built from ./rates.json,
 * which `npm run rates` (scripts/rates) refreshes daily. Platforms (names,
 * avatars, referral links) live in ./platforms.json.
 */

import { toRateRow, type RateRow, type RatesFile } from '~/utils/rates';
import { platformLogoNames } from './platforms';
import rates from './rates.json';

export type { RateRow, RateType } from '~/utils/rates';

/** Where an asset appears in the picker: the main chip row, or the "···" popover sections. */
export type AssetGroup = 'main' | 'stablecoin' | 'coin';

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  group: AssetGroup;
  /**
   * Coin logo as an astro-icon name: `token-branded:<name>` from the Web3 Icons
   * Iconify set (MIT), or a local file in src/assets/icons (e.g. `coin-usds`).
   * Assets without a logo fall back to `icon`.
   */
  logo?: string;
  /** Fallback glyph shown inside the coloured circle when there is no logo. */
  icon: string;
  /** Tailwind classes for the circle (background, and text colour when white is unreadable). */
  colorClass: string;
}

export const assets: Asset[] = [
  // Main row
  {
    id: 'usdt',
    symbol: 'USDT',
    name: 'Tether',
    group: 'main',
    logo: 'token-branded:usdt-background',
    icon: '₮',
    colorClass: 'bg-emerald-500',
  },
  {
    id: 'usdc',
    symbol: 'USDC',
    name: 'USD Coin',
    group: 'main',
    logo: 'token-branded:usdc-background',
    icon: '$',
    colorClass: 'bg-blue-500',
  },
  {
    id: 'btc',
    symbol: 'BTC',
    name: 'Bitcoin',
    group: 'main',
    logo: 'token-branded:btc-background',
    icon: '₿',
    colorClass: 'bg-orange-500',
  },
  {
    id: 'eth',
    symbol: 'ETH',
    name: 'Ethereum',
    group: 'main',
    logo: 'token-branded:eth-background',
    icon: 'Ξ',
    colorClass: 'bg-indigo-500',
  },
  {
    id: 'xaut',
    symbol: 'XAUT',
    name: 'Tether Gold',
    group: 'main',
    logo: 'token-branded:xaut-background',
    icon: 'Au',
    colorClass: 'bg-amber-500',
  },

  // "···" popover: stablecoins
  {
    id: 'usds',
    symbol: 'USDS',
    name: 'Sky Dollar',
    group: 'stablecoin',
    logo: 'coin-usds',
    icon: 'S',
    colorClass: 'bg-amber-600',
  },
  {
    id: 'usde',
    symbol: 'USDe',
    name: 'Ethena USDe',
    group: 'stablecoin',
    logo: 'token-branded:usde-background',
    icon: 'e',
    colorClass: 'bg-slate-800 dark:bg-slate-600',
  },
  {
    id: 'eurc',
    symbol: 'EURC',
    name: 'Euro Coin',
    group: 'stablecoin',
    logo: 'token-branded:eurc-background',
    icon: '€',
    colorClass: 'bg-blue-600',
  },

  // "···" popover: other coins
  {
    id: 'sol',
    symbol: 'SOL',
    name: 'Solana',
    group: 'coin',
    logo: 'token-branded:sol-background',
    icon: 'S',
    colorClass: 'bg-purple-500',
  },
  {
    id: 'bnb',
    symbol: 'BNB',
    name: 'BNB',
    group: 'coin',
    logo: 'token-branded:bnb-background',
    icon: 'B',
    colorClass: 'bg-yellow-400 text-slate-900',
  },
  {
    id: 'xrp',
    symbol: 'XRP',
    name: 'XRP',
    group: 'coin',
    logo: 'token-branded:xrp-background',
    icon: '✕',
    colorClass: 'bg-slate-700',
  },
  {
    id: 'doge',
    symbol: 'DOGE',
    name: 'Dogecoin',
    group: 'coin',
    logo: 'token-branded:doge-background',
    icon: 'Ð',
    colorClass: 'bg-yellow-500',
  },
  {
    id: 'ada',
    symbol: 'ADA',
    name: 'Cardano',
    group: 'coin',
    logo: 'token-branded:ada-background',
    icon: '₳',
    colorClass: 'bg-blue-700',
  },
  {
    id: 'trx',
    symbol: 'TRX',
    name: 'TRON',
    group: 'coin',
    logo: 'token-branded:trx-background',
    icon: 'T',
    colorClass: 'bg-red-500',
  },
  {
    // Toncoin was renamed Gram; exchanges now list it as GRAM (see ASSET_ALIASES in ~/utils/rates).
    id: 'gram',
    symbol: 'GRAM',
    name: 'Gram (prev. TON)',
    group: 'coin',
    logo: 'token-branded:gram-background',
    icon: '◇',
    colorClass: 'bg-sky-500',
  },
  {
    id: 'hype',
    symbol: 'HYPE',
    name: 'Hyperliquid',
    group: 'coin',
    logo: 'token-branded:hyper-evm-background',
    icon: 'H',
    colorClass: 'bg-teal-400 text-slate-900',
  },
  {
    id: 'link',
    symbol: 'LINK',
    name: 'Chainlink',
    group: 'coin',
    logo: 'token-branded:link-background',
    icon: '⬡',
    colorClass: 'bg-blue-800',
  },
  {
    id: 'near',
    symbol: 'NEAR',
    name: 'NEAR Protocol',
    group: 'coin',
    logo: 'token-branded:near-background',
    icon: 'N',
    colorClass: 'bg-slate-900 dark:bg-slate-600',
  },
  {
    id: 'dot',
    symbol: 'DOT',
    name: 'Polkadot',
    group: 'coin',
    logo: 'token-branded:dot-background',
    icon: '●',
    colorClass: 'bg-pink-500',
  },
  {
    id: 'ltc',
    symbol: 'LTC',
    name: 'Litecoin',
    group: 'coin',
    logo: 'token-branded:ltc-background',
    icon: 'Ł',
    colorClass: 'bg-slate-400',
  },
  {
    id: 'sui',
    symbol: 'SUI',
    name: 'Sui',
    group: 'coin',
    logo: 'token-branded:sui-background',
    icon: 'S',
    colorClass: 'bg-sky-400',
  },
  {
    id: 'avax',
    symbol: 'AVAX',
    name: 'Avalanche',
    group: 'coin',
    logo: 'token-branded:avax-background',
    icon: 'A',
    colorClass: 'bg-red-600',
  },
  {
    id: 'pol',
    symbol: 'POL',
    name: 'Polygon',
    group: 'coin',
    logo: 'token-branded:pol-background',
    icon: 'P',
    colorClass: 'bg-violet-600',
  },
];

/** Every coin logo (astro-icon names), e.g. to pre-render their SVG definitions once. */
export const assetLogoNames = assets.flatMap((asset) => (asset.logo ? [asset.logo] : []));

/** Coin and platform logos, e.g. to pre-render their SVG definitions once. */
export const allLogoNames = [...new Set([...assetLogoNames, ...platformLogoNames])];

/** token-branded icons in use (without prefix), so astro.config.ts bundles only these. */
export const tokenBrandedLogoNames = allLogoNames.flatMap((name) =>
  name.startsWith('token-branded:') ? [name.slice('token-branded:'.length)] : []
);

export const mainAssets = assets.filter((asset) => asset.group === 'main');
export const stablecoinAssets = assets.filter((asset) => asset.group === 'stablecoin');
export const coinAssets = assets.filter((asset) => asset.group === 'coin');

export const DEFAULT_ASSET_ID = 'usdt';

const ratesFile = rates as RatesFile;

/** When the rates were last fetched (ISO time). */
export const ratesUpdatedAt = ratesFile.generatedAt;

/** One table row per offer. Staleness is judged at build time. */
export const rateRows: RateRow[] = ratesFile.offers.map((offer) => toRateRow(offer, new Date()));
