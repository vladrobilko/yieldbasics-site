/**
 * Sample yield data for the home page preview. These are NOT live rates:
 * exchange integrations will replace this module later.
 */

export type RateType = 'APR' | 'APY';

/** Where an asset appears in the picker: the main chip row, or the "···" popover sections. */
export type AssetGroup = 'main' | 'stablecoin' | 'coin';

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  group: AssetGroup;
  /**
   * Coin logo from the Web3 Icons "token-branded" Iconify set (MIT), without the
   * `token-branded:` prefix. Assets without a logo there fall back to `icon`.
   */
  logo?: string;
  /** Fallback glyph shown inside the coloured circle when there is no logo. */
  icon: string;
  /** Tailwind classes for the circle (background, and text colour when white is unreadable). */
  colorClass: string;
}

export interface RateRow {
  id: string;
  exchange: string;
  /** Short text mark shown in the exchange avatar. */
  mark: string;
  /** Tailwind classes for the exchange avatar. */
  markClass: string;
  asset: string;
  rate: number;
  type: RateType;
  product: string;
  term: string;
  conditionTop: string;
  conditionBottom: string;
  promotional?: boolean;
}

export const assets: Asset[] = [
  // Main row
  {
    id: 'usdt',
    symbol: 'USDT',
    name: 'Tether',
    group: 'main',
    logo: 'usdt-background',
    icon: '₮',
    colorClass: 'bg-emerald-500',
  },
  {
    id: 'usdc',
    symbol: 'USDC',
    name: 'USD Coin',
    group: 'main',
    logo: 'usdc-background',
    icon: '$',
    colorClass: 'bg-blue-500',
  },
  {
    id: 'btc',
    symbol: 'BTC',
    name: 'Bitcoin',
    group: 'main',
    logo: 'btc-background',
    icon: '₿',
    colorClass: 'bg-orange-500',
  },
  {
    id: 'eth',
    symbol: 'ETH',
    name: 'Ethereum',
    group: 'main',
    logo: 'eth-background',
    icon: 'Ξ',
    colorClass: 'bg-indigo-500',
  },
  {
    id: 'xaut',
    symbol: 'XAUT',
    name: 'Tether Gold',
    group: 'main',
    logo: 'xaut-background',
    icon: 'Au',
    colorClass: 'bg-amber-500',
  },

  // "···" popover: stablecoins
  { id: 'usds', symbol: 'USDS', name: 'Sky Dollar', group: 'stablecoin', icon: 'S', colorClass: 'bg-amber-600' },
  {
    id: 'usde',
    symbol: 'USDe',
    name: 'Ethena USDe',
    group: 'stablecoin',
    logo: 'usde-background',
    icon: 'e',
    colorClass: 'bg-slate-800 dark:bg-slate-600',
  },
  {
    id: 'eurc',
    symbol: 'EURC',
    name: 'Euro Coin',
    group: 'stablecoin',
    logo: 'eurc-background',
    icon: '€',
    colorClass: 'bg-blue-600',
  },

  // "···" popover: other coins
  {
    id: 'sol',
    symbol: 'SOL',
    name: 'Solana',
    group: 'coin',
    logo: 'sol-background',
    icon: 'S',
    colorClass: 'bg-purple-500',
  },
  {
    id: 'bnb',
    symbol: 'BNB',
    name: 'BNB',
    group: 'coin',
    logo: 'bnb-background',
    icon: 'B',
    colorClass: 'bg-yellow-400 text-slate-900',
  },
  {
    id: 'xrp',
    symbol: 'XRP',
    name: 'XRP',
    group: 'coin',
    logo: 'xrp-background',
    icon: '✕',
    colorClass: 'bg-slate-700',
  },
  {
    id: 'doge',
    symbol: 'DOGE',
    name: 'Dogecoin',
    group: 'coin',
    logo: 'doge-background',
    icon: 'Ð',
    colorClass: 'bg-yellow-500',
  },
  {
    id: 'ada',
    symbol: 'ADA',
    name: 'Cardano',
    group: 'coin',
    logo: 'ada-background',
    icon: '₳',
    colorClass: 'bg-blue-700',
  },
  {
    id: 'trx',
    symbol: 'TRX',
    name: 'TRON',
    group: 'coin',
    logo: 'trx-background',
    icon: 'T',
    colorClass: 'bg-red-500',
  },
  {
    id: 'ton',
    symbol: 'TON',
    name: 'Toncoin',
    group: 'coin',
    logo: 'ton-background',
    icon: '◇',
    colorClass: 'bg-sky-500',
  },
  {
    id: 'hype',
    symbol: 'HYPE',
    name: 'Hyperliquid',
    group: 'coin',
    logo: 'hyper-evm-background',
    icon: 'H',
    colorClass: 'bg-teal-400 text-slate-900',
  },
  {
    id: 'link',
    symbol: 'LINK',
    name: 'Chainlink',
    group: 'coin',
    logo: 'link-background',
    icon: '⬡',
    colorClass: 'bg-blue-800',
  },
  {
    id: 'near',
    symbol: 'NEAR',
    name: 'NEAR Protocol',
    group: 'coin',
    logo: 'near-background',
    icon: 'N',
    colorClass: 'bg-slate-900 dark:bg-slate-600',
  },
  {
    id: 'dot',
    symbol: 'DOT',
    name: 'Polkadot',
    group: 'coin',
    logo: 'dot-background',
    icon: '●',
    colorClass: 'bg-pink-500',
  },
  {
    id: 'ltc',
    symbol: 'LTC',
    name: 'Litecoin',
    group: 'coin',
    logo: 'ltc-background',
    icon: 'Ł',
    colorClass: 'bg-slate-400',
  },
  { id: 'sui', symbol: 'SUI', name: 'Sui', group: 'coin', logo: 'sui-background', icon: 'S', colorClass: 'bg-sky-400' },
  {
    id: 'avax',
    symbol: 'AVAX',
    name: 'Avalanche',
    group: 'coin',
    logo: 'avax-background',
    icon: 'A',
    colorClass: 'bg-red-600',
  },
  {
    id: 'pol',
    symbol: 'POL',
    name: 'Polygon',
    group: 'coin',
    logo: 'pol-background',
    icon: 'P',
    colorClass: 'bg-violet-600',
  },
];

/** Iconify names of every coin logo used, so astro.config.ts bundles only these. */
export const assetLogoNames = assets.flatMap((asset) => (asset.logo ? [asset.logo] : []));

export const mainAssets = assets.filter((asset) => asset.group === 'main');
export const stablecoinAssets = assets.filter((asset) => asset.group === 'stablecoin');
export const coinAssets = assets.filter((asset) => asset.group === 'coin');

export const DEFAULT_ASSET_ID = 'usdt';

export const rateRows: RateRow[] = [
  {
    id: 'binance-usdt-earn',
    exchange: 'Binance',
    mark: 'B',
    markClass: 'bg-[#F0B90B] text-[#17191C]',
    asset: 'USDT',
    rate: 12.5,
    type: 'APY',
    product: 'Simple Earn',
    term: 'Flexible',
    conditionTop: 'Under $500: 12.5% APY',
    conditionBottom: '$500+: 3.8% APY',
    promotional: true,
  },
  {
    id: 'okx-usdt-savings',
    exchange: 'OKX',
    mark: 'OK',
    markClass: 'bg-[#111827] text-white dark:bg-slate-700',
    asset: 'USDT',
    rate: 10,
    type: 'APR',
    product: 'Savings',
    term: 'Flexible',
    conditionTop: 'First $1K: 10% APR',
    conditionBottom: '$1K+: 2.5% APR',
  },
  {
    id: 'coinbase-usdt-rewards',
    exchange: 'Coinbase',
    mark: 'C',
    markClass: 'bg-[#1652F0] text-white',
    asset: 'USDT',
    rate: 8,
    type: 'APY',
    product: 'USDC Rewards',
    term: 'Flexible',
    conditionTop: 'Up to $750: 8% APY',
    conditionBottom: 'Balance above: 1.9% APY',
  },
  {
    id: 'kraken-usdt-bond',
    exchange: 'Kraken',
    mark: 'K',
    markClass: 'bg-[#5741D9] text-white',
    asset: 'USDT',
    rate: 7.25,
    type: 'APR',
    product: 'Opt-in Rewards',
    term: '30-day',
    conditionTop: 'Under $2K: 7.25% APR',
    conditionBottom: '$2K+: 4.1% APR',
  },
  {
    id: 'binance-usdt-fixed',
    exchange: 'Binance',
    mark: 'B',
    markClass: 'bg-[#F0B90B] text-[#17191C]',
    asset: 'USDT',
    rate: 6.8,
    type: 'APR',
    product: 'Locked Earn',
    term: '30-day',
    conditionTop: '$100–$5K: 6.8% APR',
    conditionBottom: '$5K+: 3.2% APR',
  },
];
