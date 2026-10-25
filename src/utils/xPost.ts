/**
 * Text of the daily X post, built from the rates table. No links (X charges far
 * more for posts with a URL; the link lives in the bio). Templates rotate by
 * day, and there is no post when no rate changed since the previous file.
 */
import { summarizeAsset } from '~/utils/assetPages';
import type { RateRow } from '~/utils/rates';
import { formatRate, siteStats } from '~/utils/yields';

/** X's limit; plain ASCII text counts one per character. */
export const X_MAX_LENGTH = 280;

const FOOTER = 'Rates change daily. Not financial advice.';

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

type Template = (rows: readonly RateRow[], name: PlatformName) => string | null;

const templates: Template[] = [
  // Stablecoins
  (rows, name) => {
    const lines = ['USDT', 'USDC']
      .map((symbol) => {
        const best = bestFlexible(rows, symbol);
        return best ? `$${symbol}: ${offerText(best, name)}` : null;
      })
      .filter(Boolean);
    if (lines.length === 0) return null;
    const { offers, platforms } = siteStats(rows);
    return [
      'Best flexible stablecoin earn rates today:',
      ...lines,
      '',
      `Compare all ${offers} offers from ${platforms} platforms: link in bio.`,
      FOOTER,
    ].join('\n');
  },
  // BTC and ETH
  (rows, name) => {
    const lines = ['BTC', 'ETH'].map((symbol) => coinLine(rows, symbol, name)).filter(Boolean);
    if (lines.length === 0) return null;
    return ['Best earn rates for Bitcoin and Ether today:', ...lines, '', 'Full table: link in bio.', FOOTER].join(
      '\n'
    );
  },
  // Overview
  (rows, name) => {
    const { offers, coins, platforms } = siteStats(rows);
    const usdt = bestFlexible(rows, 'USDT');
    const btc = bestFlexible(rows, 'BTC');
    const tops = [usdt && `$USDT ${offerText(usdt, name)}`, btc && `$BTC ${offerText(btc, name)}`].filter(Boolean);
    return [
      `Today we track ${offers} crypto earn offers for ${coins} coins on ${platforms} platforms.`,
      ...(tops.length > 0 ? ['', `Top flexible rates: ${tops.join('; ')}.`] : []),
      '',
      'Full table: link in bio.',
      FOOTER,
    ].join('\n');
  },
];

/**
 * The post for `date`, or null when no rate changed since `previousRows` (pass
 * null when there is no previous file). Rows are the regular table rows.
 */
export const dailyPostText = (
  rows: readonly RateRow[],
  previousRows: readonly RateRow[] | null,
  date: Date,
  name: PlatformName
): string | null => {
  if (rows.length === 0) return null;
  if (previousRows && ratesSignature(previousRows) === ratesSignature(rows)) return null;
  const day = Math.floor(date.getTime() / 86_400_000);
  for (let i = 0; i < templates.length; i++) {
    const text = templates[(day + i) % templates.length](rows, name);
    if (text && text.length <= X_MAX_LENGTH) return text;
  }
  return null;
};
