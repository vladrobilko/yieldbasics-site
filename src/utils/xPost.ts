/**
 * Text of the daily X post, built from the rates table, plus a reply with the
 * links. The post itself has no link: X shows posts with outside links to fewer
 * people, and the API charges far more for them. Templates rotate by day, and
 * there is no post when no rate changed since the previous file.
 */
import { summarizeAsset } from '~/utils/assetPages';
import type { RateRow } from '~/utils/rates';
import { formatRate, siteStats } from '~/utils/yields';

/** X's limit. X counts an emoji as 2, the same as its JavaScript length. */
export const X_MAX_LENGTH = 280;

const FOOTER = 'Rates change daily. Not financial advice.';
const SITE = 'https://yieldbasics.com';

export interface DailyPost {
  text: string;
  /** Posted as a reply right after `text`. */
  reply: string;
}

type PlatformName = (id: string) => string;

/** One string per offer and rate, to tell whether anything changed. */
export const ratesSignature = (rows: readonly Pick<RateRow, 'id' | 'rate' | 'type'>[]): string =>
  rows
    .map((row) => `${row.id}:${row.rate}:${row.type}`)
    .sort()
    .join('|');

const offerText = (row: RateRow, name: PlatformName) =>
  `${formatRate(row.rate)} ${row.type} on ${name(row.platformId)}`;
const days = (n: number) => `${n} ${n === 1 ? 'day' : 'days'}`;

const coinLinks = (symbols: readonly string[]) =>
  symbols.map((symbol) => `All ${symbol} rates: ${SITE}/rates/${symbol.toLowerCase()}`).join('\n');

/** "$BTC: 8.00% APR flexible on WEEX, 15.79% APR for 365 days on CoinW" */
const coinLine = (rows: readonly RateRow[], symbol: string, name: PlatformName): string | null => {
  const { bestFlexible, bestFixed } = summarizeAsset(rows.filter((row) => row.asset === symbol));
  const parts = [
    bestFlexible &&
      `${formatRate(bestFlexible.rate)} ${bestFlexible.type} flexible on ${name(bestFlexible.platformId)}`,
    bestFixed &&
      `${formatRate(bestFixed.rate)} ${bestFixed.type} for ${days(bestFixed.termDays)} on ${name(bestFixed.platformId)}`,
  ].filter(Boolean);
  return parts.length > 0 ? `$${symbol}: ${parts.join(', ')}` : null;
};

const bestFlexible = (rows: readonly RateRow[], symbol: string) =>
  summarizeAsset(rows.filter((row) => row.asset === symbol)).bestFlexible;

type Template = (rows: readonly RateRow[], name: PlatformName) => DailyPost | null;

const templates: Template[] = [
  // Stablecoins
  (rows, name) => {
    const offers = ['USDT', 'USDC'].flatMap((symbol) => {
      const best = bestFlexible(rows, symbol);
      return best ? [{ symbol, best }] : [];
    });
    if (offers.length === 0) return null;
    const stats = siteStats(rows);
    const text = [
      'Best flexible stablecoin earn rates today:',
      ...offers.map(({ symbol, best }) => `$${symbol}: ${offerText(best, name)}`),
      '',
      `Compare all ${stats.offers} offers from ${stats.platforms} platforms in the reply 👇`,
      FOOTER,
    ].join('\n');
    return { text, reply: coinLinks(offers.map(({ symbol }) => symbol)) };
  },
  // BTC and ETH
  (rows, name) => {
    const lines = ['BTC', 'ETH'].flatMap((symbol) => {
      const line = coinLine(rows, symbol, name);
      return line ? [{ symbol, line }] : [];
    });
    if (lines.length === 0) return null;
    const text = [
      'Best earn rates for Bitcoin and Ether today:',
      ...lines.map(({ line }) => line),
      '',
      'Full table in the reply 👇',
      FOOTER,
    ].join('\n');
    return { text, reply: coinLinks(lines.map(({ symbol }) => symbol)) };
  },
  // Overview
  (rows, name) => {
    const { offers, coins, platforms } = siteStats(rows);
    const usdt = bestFlexible(rows, 'USDT');
    const btc = bestFlexible(rows, 'BTC');
    const tops = [usdt && `$USDT ${offerText(usdt, name)}`, btc && `$BTC ${offerText(btc, name)}`].filter(Boolean);
    const text = [
      `Today we track ${offers} crypto earn offers for ${coins} coins on ${platforms} platforms.`,
      ...(tops.length > 0 ? ['', `Top flexible rates: ${tops.join('; ')}.`] : []),
      '',
      'Full table in the reply 👇',
      FOOTER,
    ].join('\n');
    return { text, reply: `Full table: ${SITE}` };
  },
];

/**
 * The post and its reply for `date`, or null when no rate changed since
 * `previousRows` (pass null when there is no previous file). Rows are the
 * regular table rows.
 */
export const dailyPostText = (
  rows: readonly RateRow[],
  previousRows: readonly RateRow[] | null,
  date: Date,
  name: PlatformName
): DailyPost | null => {
  if (rows.length === 0) return null;
  if (previousRows && ratesSignature(previousRows) === ratesSignature(rows)) return null;
  const day = Math.floor(date.getTime() / 86_400_000);
  for (let i = 0; i < templates.length; i++) {
    const post = templates[(day + i) % templates.length](rows, name);
    if (post && post.text.length <= X_MAX_LENGTH) return post;
  }
  return null;
};
