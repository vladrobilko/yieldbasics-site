// Short-lived offers (launchpads, airdrops, sign-up bonuses) shown on /deals.
// They are entered by hand in src/data/deals.json and hidden once they end:
// at build time here, and in the browser by the page script, because the site
// is only rebuilt when a PR is merged.

export type DealKind = 'launchpad' | 'airdrop' | 'bonus';

export interface Deal {
  /** Unique, kebab-case; also the card's #anchor on /deals. */
  id: string;
  platformId: string;
  kind: DealKind;
  title: string;
  /** Coin the deal is about, e.g. "ZEC". */
  asset: string;
  /** Short hook, e.g. "Up to 70% off". */
  headline: string;
  audience: 'new-user' | 'all';
  /** Up to 3 key numbers shown on the card, e.g. { label: 'Your price', value: '367.8 USDT' }. */
  stats?: { label: string; value: string }[];
  /** Short plain-language conditions: KYC, deposit, trading volume, cap… */
  conditions: string[];
  /** ISO date-times, UTC (e.g. "2026-10-20T10:00:00Z"). */
  startsAt: string;
  endsAt: string;
  /** Where "View deal" sends visitors. Defaults to the platform's referral link. */
  url?: string;
  /** Date (YYYY-MM-DD) the terms were checked on the platform. */
  verifiedAt: string;
  /** Custom X post text; built from the fields when missing. */
  xPost?: string;
}

export const dealKindLabels: Record<DealKind, string> = {
  launchpad: 'Launchpad',
  airdrop: 'Airdrop',
  bonus: 'Bonus',
};

const time = (iso: string) => new Date(iso).getTime();

export const hasEnded = (deal: Pick<Deal, 'endsAt'>, now: Date): boolean => time(deal.endsAt) <= now.getTime();

export const isUpcoming = (deal: Pick<Deal, 'startsAt'>, now: Date): boolean => time(deal.startsAt) > now.getTime();

/** Deals that haven't ended (live ones and upcoming ones), ending soonest first. */
export const visibleDeals = <T extends Pick<Deal, 'endsAt'>>(deals: T[], now: Date): T[] =>
  deals.filter((deal) => !hasEnded(deal, now)).sort((a, b) => time(a.endsAt) - time(b.endsAt));

/** True when at least one deal hasn't ended; the Deals link and indexing depend on it. */
export const hasLiveDeals = (deals: Pick<Deal, 'endsAt'>[], now: Date): boolean => visibleDeals(deals, now).length > 0;

const span = (ms: number): string => {
  const minutes = Math.max(1, Math.floor(ms / 60_000));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
};

/** "Starts in 1d 2h", "Ends in 3h 5m" or "Ended". */
export const timeLeftLabel = (deal: Pick<Deal, 'startsAt' | 'endsAt'>, now: Date): string => {
  if (hasEnded(deal, now)) return 'Ended';
  if (isUpcoming(deal, now)) return `Starts in ${span(time(deal.startsAt) - now.getTime())}`;
  return `Ends in ${span(time(deal.endsAt) - now.getTime())}`;
};

/** "Oct 24, 2026, 10:00 UTC". */
export const formatDealTime = (iso: string): string =>
  `${new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  })} UTC`;

const X_LIMIT = 280;
/** Length as X counts it: every link is 23 characters. */
export const xLength = (text: string): number => text.replace(/https?:\/\/\S+/g, 'x'.repeat(23)).length;

/**
 * Text to paste into an X post: the headline, the key numbers, as many
 * conditions as fit in one post, the end date and the link.
 */
export const xPostText = (deal: Deal, platformName: string, siteUrl: string): string => {
  if (deal.xPost) return deal.xPost;
  const who = deal.audience === 'new-user' ? ' for new users' : '';
  const head = [
    `${platformName} ${dealKindLabels[deal.kind]}: ${deal.asset}, ${deal.headline}${who}`,
    ...(deal.stats ?? []).map((stat) => `${stat.label}: ${stat.value}`),
  ];
  const tail = [
    `Ends ${formatDealTime(deal.endsAt)}`,
    `${siteUrl.replace(/\/$/, '')}/deals#${deal.id}`,
    'Referral link. Not financial advice.',
  ];
  const conditions: string[] = [];
  for (const condition of deal.conditions) {
    const next = [...head, ...conditions, `• ${condition}`, ...tail].join('\n');
    if (xLength(next) > X_LIMIT) break;
    conditions.push(`• ${condition}`);
  }
  return [...head, ...conditions, ...tail].join('\n');
};

/** Problems in the deals file (empty when it's valid); the tests fail on any. */
export const validateDeals = (deals: Deal[], platformIds: Set<string>): string[] => {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const deal of deals) {
    if (ids.has(deal.id)) problems.push(`${deal.id}: duplicate id`);
    ids.add(deal.id);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(deal.id)) problems.push(`${deal.id}: id must be kebab-case`);
    if (!platformIds.has(deal.platformId)) problems.push(`${deal.id}: unknown platform "${deal.platformId}"`);
    if (!(deal.kind in dealKindLabels)) problems.push(`${deal.id}: unknown kind "${deal.kind}"`);
    if (Number.isNaN(time(deal.startsAt)) || Number.isNaN(time(deal.endsAt))) {
      problems.push(`${deal.id}: startsAt and endsAt must be ISO date-times`);
    } else if (time(deal.endsAt) <= time(deal.startsAt)) {
      problems.push(`${deal.id}: endsAt must be after startsAt`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(deal.verifiedAt)) problems.push(`${deal.id}: verifiedAt must be YYYY-MM-DD`);
    if (deal.url && new URL(deal.url).protocol !== 'https:') problems.push(`${deal.id}: url must use https`);
    if (deal.conditions.length === 0) problems.push(`${deal.id}: list at least one condition`);
    if ((deal.stats?.length ?? 0) > 3) problems.push(`${deal.id}: at most 3 stats`);
  }
  return problems;
};

/**
 * The platform's other offers worth a look next to a deal: its best new-user
 * offer and its best everyday offer, highest rate first (up to two rows).
 */
export const platformHighlights = <T extends { platformId: string; audience: 'all' | 'new-user'; rate: number }>(
  rows: readonly T[],
  platformId: string
): T[] => {
  const own = rows.filter((row) => row.platformId === platformId);
  const best = (audience: T['audience']) =>
    own.filter((row) => row.audience === audience).sort((a, b) => b.rate - a.rate)[0];
  return [best('new-user'), best('all')].filter((row): row is T => row !== undefined);
};
