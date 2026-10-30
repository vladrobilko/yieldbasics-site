/**
 * Text and data for the per-platform pages (/platforms/<slug>). Pure functions
 * over table rows, like src/utils/assetPages.ts, so titles, descriptions and
 * FAQ answers always match the day's rates.
 */
import type { AssetSummary, FaqItem } from '~/utils/assetPages';
import type { RateRow } from '~/utils/rates';
import { formatRate } from '~/utils/yields';

/** Platforms that get a page: those with at least one offer. */
export const platformsWithOffers = <T extends { id: string }>(
  platforms: readonly T[],
  rows: readonly Pick<RateRow, 'platformId'>[]
): T[] => platforms.filter((platform) => rows.some((row) => row.platformId === platform.id));

/**
 * The platform's coins, ordered like the site's coin list (`order`, e.g. the
 * symbols of `assets` in src/data/yields.ts).
 */
export const platformAssets = (rows: readonly Pick<RateRow, 'asset'>[], order: readonly string[]): string[] => {
  const present = new Set(rows.map((row) => row.asset));
  return order.filter((symbol) => present.has(symbol));
};

/** Rows grouped by coin (in `order`), highest rate first within a coin. */
export const sortByAssetThenRate = <T extends Pick<RateRow, 'asset' | 'rate'>>(
  rows: readonly T[],
  order: readonly string[]
): T[] => {
  const rank = (asset: string) => {
    const index = order.indexOf(asset);
    return index === -1 ? order.length : index;
  };
  return [...rows].sort((a, b) => rank(a.asset) - rank(b.asset) || b.rate - a.rate);
};

/** "6.93% APR on USDT" */
const offerText = (row: RateRow) => `${formatRate(row.rate)} ${row.type} on ${row.asset}`;

/** Page title (the site template appends " — YieldBasics"; the whole stays within 60 characters). */
export const platformPageTitle = (name: string): string => `${name} Earn Rates Today: Savings & Staking`;

/** Meta description, at most 160 characters. */
export const platformPageDescription = (name: string, summary: AssetSummary, coinCount: number): string => {
  const lead = `Compare ${summary.offerCount} ${name} earn offers on ${coinCount} ${coinCount === 1 ? 'coin' : 'coins'}, updated daily.`;
  const top = summary.bestFlexible ?? summary.bestFixed;
  const full = top ? `${lead} Best right now: ${offerText(top)}.` : lead;
  return full.length <= 160 ? full : lead;
};

/** "the best flexible rate on Bybit is 14.58% APR on GRAM, and the best fixed-term rate is …", or undefined. */
export const platformBestRatesText = (name: string, summary: AssetSummary): string | undefined => {
  const { bestFlexible, bestFixed } = summary;
  const parts = [
    bestFlexible && `the best flexible rate on ${name} is ${offerText(bestFlexible)}`,
    bestFixed &&
      `the best fixed-term rate is ${offerText(bestFixed)} for ${bestFixed.termDays} ${bestFixed.termDays === 1 ? 'day' : 'days'}`,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', and ') : undefined;
};

/** One quotable sentence for the top of the page, or undefined when the platform only has new-user offers. */
export const platformAnswerLine = (name: string, summary: AssetSummary, updated: string): string | undefined => {
  const best = platformBestRatesText(name, summary);
  return best ? `Updated ${updated}: ${best}.` : undefined;
};

const listText = (items: readonly string[]) =>
  items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

export interface PlatformFaqInput {
  name: string;
  summary: AssetSummary;
  coins: readonly string[];
  updated: string;
  /** Rates are typed in by hand from the platform's signed-in pages. */
  manual: boolean;
  hasFlexible: boolean;
  hasFixed: boolean;
  /** The platform's proof-of-reserves page, if any. */
  proofOfReserves?: string;
}

/** Questions people search for about a platform, answered from today's data. */
export const platformFaq = ({
  name,
  summary,
  coins,
  updated,
  manual,
  hasFlexible,
  hasFixed,
  proofOfReserves,
}: PlatformFaqInput): FaqItem[] => {
  const items: FaqItem[] = [];
  const best = platformBestRatesText(name, summary);
  if (best) {
    items.push({
      title: `What is the best ${name} earn rate today?`,
      description: `As of ${updated}, ${best}. Boosted rates often apply only to a limited amount, so check the conditions column before depositing.`,
    });
  }
  items.push({
    title: `Which coins can I earn on with ${name}?`,
    description: `We list ${name} earn offers for ${listText(coins)}. Each coin has its own page comparing ${name} with other platforms.`,
  });
  if (hasFlexible && hasFixed) {
    items.push({
      title: `Does ${name} have flexible and fixed-term earn?`,
      description: `Yes. Flexible products let you withdraw at any time and the rate can change daily; fixed terms lock your coins for a set number of days, usually for a higher rate, and you often lose the interest if you withdraw early.`,
    });
  }
  if (summary.bestNewUser) {
    items.push({
      title: `Is there a ${name} offer for new users?`,
      description: `Yes. New accounts or first deposits can get ${offerText(summary.bestNewUser)} on a capped amount${summary.bestNewUser.maxReward !== null ? `, worth about $${summary.bestNewUser.maxReward.toFixed(2)} in total` : ''}. These offers are short, so compare the total reward, not just the APR.`,
    });
  }
  items.push({
    title: `Is it safe to earn on ${name}?`,
    description: `No platform is risk-free: your coins depend on ${name} staying solvent and secure, and on the rules where you live. ${proofOfReserves ? `${name} publishes <a href="${proofOfReserves}" rel="nofollow noopener" target="_blank">proof of reserves</a>, which shows its holdings at a point in time but not every liability. ` : ''}Read <a href="/guides/is-crypto-earn-safe">is crypto earn safe?</a> before depositing, and don't keep more on one platform than you can afford to lose.`,
  });
  items.push({
    title: `How often are these ${name} rates updated?`,
    description: manual
      ? `${name} shows its rates only to signed-in users, so we check them by hand every few days. Each offer shows the date it was checked.`
      : `Every day. We read ${name}'s published earn rates automatically; if a rate couldn't be refreshed for a few days, it shows the date it was last checked.`,
  });
  return items;
};
