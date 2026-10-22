/**
 * Text and data for the per-coin rate pages (/rates/<coin>). Pure functions
 * over table rows so titles, descriptions and FAQ answers always match the
 * day's rates.
 */
import type { RateRow } from '~/utils/rates';
import { formatRate } from '~/utils/yields';

/** URL segment for a coin: "USDT" → "usdt", "USDe" → "usde". */
export const assetSlug = (symbol: string): string => symbol.toLowerCase();

export interface AssetSummary {
  /** Regular offers (new-user offers excluded). */
  offerCount: number;
  platformCount: number;
  bestFlexible?: RateRow;
  bestFixed?: RateRow;
  bestNewUser?: RateRow;
}

const best = (rows: readonly RateRow[]) =>
  rows.reduce<RateRow | undefined>((top, row) => (!top || row.rate > top.rate ? row : top), undefined);

/** Best offers and counts for one coin's rows. */
export const summarizeAsset = (rows: readonly RateRow[]): AssetSummary => {
  const regular = rows.filter((row) => row.audience !== 'new-user');
  const newUser = rows.filter((row) => row.audience === 'new-user');
  return {
    offerCount: regular.length,
    platformCount: new Set(regular.map((row) => row.platformId)).size,
    bestFlexible: best(regular.filter((row) => row.termDays === 0)),
    bestFixed: best(regular.filter((row) => row.termDays > 0)),
    bestNewUser: [...newUser].sort((a, b) => (b.maxReward ?? -1) - (a.maxReward ?? -1) || b.rate - a.rate)[0],
  };
};

/** "6.93% APR on Bybit" */
const offerText = (row: RateRow, platformName: (id: string) => string) =>
  `${formatRate(row.rate)} ${row.type} on ${platformName(row.platformId)}`;

/** Page title (the site template appends " — YieldBasics"; the whole stays within 60 characters). */
export const assetPageTitle = (symbol: string): string => `${symbol} Earn Rates Today: Best APR / APY`;

/** Meta description, at most 160 characters. */
export const assetPageDescription = (
  symbol: string,
  name: string,
  summary: AssetSummary,
  platformName: (id: string) => string
): string => {
  const lead = `Compare ${summary.offerCount} ${symbol} (${name}) earn offers from ${summary.platformCount} platforms, updated daily.`;
  const top = summary.bestFlexible ?? summary.bestFixed;
  const full = top ? `${lead} Best right now: ${offerText(top, platformName)}.` : lead;
  return full.length <= 160 ? full : lead;
};

const bestRatesText = (symbol: string, summary: AssetSummary, platformName: (id: string) => string) => {
  const { bestFlexible, bestFixed } = summary;
  const parts = [
    bestFlexible && `the best flexible ${symbol} rate is ${offerText(bestFlexible, platformName)}`,
    bestFixed && `the best fixed-term rate is ${offerText(bestFixed, platformName)} for ${bestFixed.term}`,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', and ') : undefined;
};

/** One quotable sentence for the top of the page: "Updated Oct 22, 2026: the best flexible USDT rate is …". */
export const assetAnswerLine = (
  symbol: string,
  summary: AssetSummary,
  platformName: (id: string) => string,
  updated: string
): string | undefined => {
  const bestRates = bestRatesText(symbol, summary, platformName);
  return bestRates ? `Updated ${updated}: ${bestRates}.` : undefined;
};

export const assetPageSchema = (page: {
  title: string;
  description: string;
  url: string;
  dateModified: string;
  siteName: string;
  siteUrl: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: page.title,
  description: page.description,
  url: page.url,
  dateModified: page.dateModified,
  isPartOf: { '@type': 'WebSite', name: page.siteName, url: page.siteUrl },
});

export interface FaqItem {
  title: string;
  description: string;
}

/** Questions people search for, answered from today's data. */
export const assetFaq = (
  symbol: string,
  summary: AssetSummary,
  platformName: (id: string) => string,
  updated: string
): FaqItem[] => {
  const items: FaqItem[] = [];
  const { bestNewUser } = summary;
  const bestRates = bestRatesText(symbol, summary, platformName);
  if (bestRates) {
    items.push({
      title: `What is the best ${symbol} earn rate today?`,
      description: `As of ${updated}, ${bestRates}. Boosted rates often apply only to a limited amount, so check the conditions column before depositing.`,
    });
  }
  items.push({
    title: `Should I choose flexible or fixed-term ${symbol} savings?`,
    description: `Flexible products let you withdraw at any time, and the rate can change daily. Fixed terms lock your ${symbol} for a set number of days, often for a higher rate, but you usually can't withdraw early without losing the interest.`,
  });
  if (bestNewUser) {
    items.push({
      title: `Are there ${symbol} offers for new users?`,
      description: `Yes. Some platforms pay a much higher rate on a small, capped amount for new accounts or first deposits. Right now the most rewarding is ${offerText(bestNewUser, platformName)}${bestNewUser.maxReward !== null ? `, worth about $${bestNewUser.maxReward.toFixed(2)} in total` : ''}. These offers are short and capped, so compare the total reward, not just the APR.`,
    });
  }
  items.push({
    title: 'How often are these rates updated?',
    description: `Every day. We read each platform's published ${symbol} earn rates automatically; a few platforms that only show rates to signed-in users are checked by hand and marked with the date we checked them.`,
  });
  items.push({
    title: 'What is the difference between APR and APY?',
    description:
      'APR is the simple yearly rate. APY includes compounding, the interest earned on your interest, so the same number quoted as APY pays slightly less than the same number as APR. Most exchanges quote APR; DeFi protocols such as Aave usually quote APY. Convert between them with our <a href="/apr-to-apy-calculator">APR to APY calculator</a>.',
  });
  return items;
};

/** Coins that get a /rates/<coin> page: those with at least one regular (not new-user) offer. */
export const assetsWithOffers = <T extends { symbol: string }>(
  assets: readonly T[],
  rows: readonly Pick<RateRow, 'asset' | 'audience'>[]
): T[] => assets.filter((asset) => rows.some((row) => row.asset === asset.symbol && row.audience !== 'new-user'));
