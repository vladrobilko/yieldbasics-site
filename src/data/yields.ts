/**
 * Sample yield data for the home page preview. These are NOT live rates:
 * exchange integrations will replace this module later.
 */

export type RateType = 'APR' | 'APY';

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  /** Glyph shown inside the coloured circle. */
  icon: string;
  /** Tailwind background class for the circle. */
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
  { id: 'usdt', symbol: 'USDT', name: 'Tether', icon: '₮', colorClass: 'bg-emerald-500' },
  { id: 'usdc', symbol: 'USDC', name: 'USD Coin', icon: '$', colorClass: 'bg-blue-500' },
  { id: 'btc', symbol: 'BTC', name: 'Bitcoin', icon: '₿', colorClass: 'bg-orange-500' },
  { id: 'eth', symbol: 'ETH', name: 'Ethereum', icon: 'Ξ', colorClass: 'bg-indigo-500' },
  { id: 'sol', symbol: 'SOL', name: 'Solana', icon: 'S', colorClass: 'bg-purple-500' },
];

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
