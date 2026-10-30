/**
 * Earn-rate data model and pure helpers shared by the daily fetch script
 * (scripts/rates) and the site build (src/data/yields.ts).
 */

export type RateType = 'APR' | 'APY';

/** Where an offer came from: an official API, a platform's own web JSON, or typed in by hand. */
export type SourceKind = 'api' | 'web' | 'manual';

/** One amount band of a tiered rate. Amounts are in units of the asset; `max: null` means no upper limit. */
export interface RateTier {
  min: number;
  max: number | null;
  rate: number;
}

/** A normalised offer, as returned by a source parser. Rates are percentages (6.5 = 6.5%). */
export interface RateOffer {
  platformId: string;
  asset: string;
  product: string;
  /** 0 for flexible products, otherwise the lock-up period in days. */
  termDays: number;
  /** Headline (highest available) rate. */
  rate: number;
  type: RateType;
  /** Present when the rate depends on the amount deposited. */
  tiers?: RateTier[];
  /** Short extra detail, e.g. the chain or the token received. */
  note?: string;
  /** Set for offers only new users (new account or first deposit) can join. */
  audience?: 'new-user';
  /** Most one user can deposit, in units of the asset. */
  maxAmount?: number;
}

export interface StoredOffer extends RateOffer {
  id: string;
  source: SourceKind;
  /** ISO time the rate was last fetched (or, for manual offers, verified). */
  updatedAt: string;
}

export interface SourceStatus {
  status: 'ok' | 'failed' | 'manual';
  /** ISO time of the last attempt. */
  checkedAt: string;
  /** ISO time of the last successful fetch, if any. */
  updatedAt?: string;
  error?: string;
  offers: number;
}

export interface RatesFile {
  generatedAt: string;
  sources: Record<string, SourceStatus>;
  offers: StoredOffer[];
}

/** A manual offer in src/data/manual-rates.json. */
export interface ManualOffer extends RateOffer {
  /** ISO date the rate was checked on the platform's site. */
  verifiedAt: string;
}

export type SourceResult = { ok: true; source: SourceKind; offers: RateOffer[] } | { ok: false; error: string };

const DAY_MS = 24 * 60 * 60 * 1000;

/** Rates older than this are shown with their date so visitors know they may be out of date. */
export const STALE_AFTER_DAYS = 3;

/** Highest rate we accept; anything above is almost certainly a parsing error or a tiny promo. */
export const MAX_RATE = 100;

/** New-user offers are tiny and short, so their APRs run far higher; this only catches parsing errors. */
export const MAX_NEW_USER_RATE = 1000;

/** New-user offers are listed for these assets only (the "New users" tab). */
export const NEW_USER_ASSETS: readonly string[] = ['USDT', 'USDC'];

/** Manual offers are dropped this long after they were last verified, so forgotten entries don't linger. */
export const MANUAL_MAX_AGE_DAYS = 30;

/** Rounds a percentage to two decimals. */
export const roundRate = (rate: number): number => Math.round(rate * 100) / 100;

/** A fraction such as "0.0644" or 0.0644 as a percentage (6.44). */
export const fractionToPercent = (value: string | number): number => roundRate(Number(value) * 100);

/** A percentage string such as "6.93%" or "6.93" as a number (6.93). */
export const parsePercent = (value: string): number => roundRate(Number(value.replace('%', '').trim()));

export const termLabel = (termDays: number): string => (termDays === 0 ? 'Flexible' : `${termDays}-day`);

/**
 * Compact amount for condition text: 500 → "500", 1500 → "1.5K", 300000 → "300K", 2000000 → "2M".
 * Amounts under 1 (BTC tiers) keep three significant digits: 0.003 → "0.003", not "0".
 */
export const formatAmount = (amount: number): string => {
  const compact = (value: number, suffix: string) => `${roundRate(value)}${suffix}`;
  if (amount >= 1e9) return compact(amount / 1e9, 'B');
  if (amount >= 1e6) return compact(amount / 1e6, 'M');
  if (amount >= 1e3) return compact(amount / 1e3, 'K');
  if (amount > 0 && amount < 1) return String(Number(amount.toPrecision(3)));
  return String(roundRate(amount));
};

/** "Up to 500", "1K–10K" or "Above 110K" for one amount band. */
const bandLabel = (tier: RateTier): string => {
  if (tier.max === null) return `Above ${formatAmount(tier.min)}`;
  if (tier.min === 0) return `Up to ${formatAmount(tier.max)}`;
  return `${formatAmount(tier.min)}–${formatAmount(tier.max)}`;
};

/** The amount band with the highest rate. */
const bestTier = (tiers: readonly RateTier[]): RateTier =>
  tiers.reduce((top, tier) => (tier.rate > top.rate ? tier : top));

/**
 * Most a new user can earn from an offer: cap × rate × term. Null without a
 * cap or a fixed term. For the stablecoins in NEW_USER_ASSETS this is dollars.
 */
export const estimatedReward = (offer: RateOffer): number | null => {
  if (!offer.maxAmount || !offer.termDays) return null;
  return Math.round(((offer.maxAmount * offer.rate) / 100) * (offer.termDays / 365) * 100) / 100;
};

/**
 * Two short lines for the "Conditions" column. New-user offers show their cap
 * and the most they can earn. Tiered offers show the band
 * that earns the headline rate, then what other amounts earn (one band, or the
 * range across several); other offers show "Any amount" and their note.
 */
export const conditionLines = (offer: RateOffer): [string, string] => {
  if (offer.audience === 'new-user') {
    const reward = estimatedReward(offer);
    const top = offer.maxAmount ? `New users · max ${formatAmount(offer.maxAmount)} ${offer.asset}` : 'New users only';
    const term = offer.termDays ? `${offer.termDays} days` : 'Flexible';
    return [top, reward === null ? term : `${term} · ≈ $${reward.toFixed(2)} total`];
  }
  const tiers = offer.tiers ?? [];
  const pct = (rate: number) => `${roundRate(rate)}% ${offer.type}`;
  if (tiers.length >= 2) {
    const best = bestTier(tiers);
    const others = tiers.filter((tier) => tier !== best);
    const top = `${bandLabel(best)} ${offer.asset}: ${pct(best.rate)}`;
    if (others.length === 1) return [top, `${bandLabel(others[0])}: ${pct(others[0].rate)}`];
    const rates = others.map((tier) => roundRate(tier.rate));
    return [top, `Other amounts: ${Math.min(...rates)}–${Math.max(...rates)}% ${offer.type}`];
  }
  if (tiers.length === 1 && tiers[0].max !== null) {
    return [`Up to ${formatAmount(tiers[0].max)} ${offer.asset}`, offer.note ?? ''];
  }
  return ['Any amount', offer.note ?? ''];
};

/** True when only part of the deposit earns the headline rate (a capped boost). */
export const isBoosted = (offer: RateOffer): boolean => {
  if (offer.audience === 'new-user') return false;
  const tiers = offer.tiers ?? [];
  return tiers.length >= 2 && bestTier(tiers).rate > tiers[tiers.length - 1].rate;
};

export const isStale = (updatedAt: string, now: Date, maxDays = STALE_AFTER_DAYS): boolean =>
  now.getTime() - new Date(updatedAt).getTime() > maxDays * DAY_MS;

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const offerId = (offer: RateOffer): string =>
  [
    offer.platformId,
    offer.asset,
    offer.product,
    offer.termDays ? `${offer.termDays}d` : 'flexible',
    ...(offer.audience ? [offer.audience] : []),
  ]
    .map(slug)
    .join('-');

/** Old tickers of renamed coins → their current symbol in the asset picker. */
export const ASSET_ALIASES: Readonly<Record<string, string>> = {
  TON: 'GRAM', // Toncoin was renamed Gram
};

/**
 * The canonical symbol for `symbol` from `known` (case-insensitive, old
 * tickers mapped through ASSET_ALIASES), or undefined if it isn't listed.
 */
export const canonicalAsset = (symbol: string, known: readonly string[]): string | undefined => {
  const upper = symbol.trim().toUpperCase();
  const current = ASSET_ALIASES[upper] ?? upper;
  return known.find((k) => k.toUpperCase() === current);
};

/** Why an offer can't be published, or null when it is fine. */
export const offerProblem = (
  offer: RateOffer,
  knownAssets: readonly string[],
  knownPlatforms: readonly string[]
): string | null => {
  if (!knownPlatforms.includes(offer.platformId)) return `unknown platform ${offer.platformId}`;
  if (!knownAssets.includes(offer.asset)) return `unknown asset ${offer.asset}`;
  const newUser = offer.audience === 'new-user';
  if (newUser && !NEW_USER_ASSETS.includes(offer.asset))
    return `new-user offers are listed for ${NEW_USER_ASSETS.join('/')} only`;
  const maxRate = newUser ? MAX_NEW_USER_RATE : MAX_RATE;
  if (!Number.isFinite(offer.rate) || offer.rate <= 0 || offer.rate > maxRate)
    return `rate out of range: ${offer.rate}`;
  if (!Number.isInteger(offer.termDays) || offer.termDays < 0 || offer.termDays > 3650)
    return `bad term: ${offer.termDays}`;
  return null;
};

/** One offer per id (platform, asset, product, term, audience), keeping the highest rate. */
export const dedupeOffers = <T extends RateOffer>(offers: readonly T[]): T[] => {
  const best = new Map<string, T>();
  for (const offer of offers) {
    const id = offerId(offer);
    const current = best.get(id);
    if (!current || offer.rate > current.rate) best.set(id, offer);
  }
  return [...best.values()];
};

export interface MergeInput {
  previous: RatesFile | null;
  results: Record<string, SourceResult>;
  manual: readonly ManualOffer[];
  now: Date;
}

/**
 * Builds the new rates file. Fresh results replace a platform's offers; when a
 * platform fails, its previous offers are kept (with their old `updatedAt`) so
 * one broken source never empties the table. Manual offers fill platforms that
 * have no automatic source, until MANUAL_MAX_AGE_DAYS after they were verified.
 */
export const mergeRates = ({ previous, results, manual, now }: MergeInput): RatesFile => {
  const nowIso = now.toISOString();
  const sources: Record<string, SourceStatus> = {};
  const offers: StoredOffer[] = [];

  for (const [platformId, result] of Object.entries(results)) {
    const before = previous?.sources[platformId];
    if (result.ok) {
      const fresh = dedupeOffers(result.offers).map((offer) => ({
        ...offer,
        id: offerId(offer),
        source: result.source,
        updatedAt: nowIso,
      }));
      offers.push(...fresh);
      sources[platformId] = { status: 'ok', checkedAt: nowIso, updatedAt: nowIso, offers: fresh.length };
    } else {
      const kept = previous?.offers.filter((offer) => offer.platformId === platformId) ?? [];
      offers.push(...kept);
      sources[platformId] = {
        status: 'failed',
        checkedAt: nowIso,
        ...(before?.updatedAt ? { updatedAt: before.updatedAt } : {}),
        error: result.error,
        offers: kept.length,
      };
    }
  }

  return applyManualOffers({ generatedAt: nowIso, sources, offers }, manual, now);
};

/**
 * Replaces the manual offers of a rates file with the current ones from
 * manual-rates.json (dropping those verified more than MANUAL_MAX_AGE_DAYS
 * ago). Fetched offers and `generatedAt` are kept, so `npm run rates:manual`
 * can publish a manual check without fetching every source again.
 */
export const applyManualOffers = (file: RatesFile, manual: readonly ManualOffer[], now: Date): RatesFile => {
  const fetched = new Set(
    Object.entries(file.sources)
      .filter(([, status]) => status.status !== 'manual')
      .map(([platformId]) => platformId)
  );
  const sources = Object.fromEntries(Object.entries(file.sources).filter(([platformId]) => fetched.has(platformId)));
  const offers = file.offers.filter((offer) => offer.source !== 'manual');

  const manualOffers = dedupeOffers(
    manual.filter((offer) => !fetched.has(offer.platformId) && !isStale(offer.verifiedAt, now, MANUAL_MAX_AGE_DAYS))
  );
  for (const { verifiedAt, ...offer } of manualOffers) {
    offers.push({ ...offer, id: offerId(offer), source: 'manual', updatedAt: new Date(verifiedAt).toISOString() });
  }
  for (const platformId of new Set(manualOffers.map((offer) => offer.platformId))) {
    sources[platformId] = {
      status: 'manual',
      checkedAt: now.toISOString(),
      offers: manualOffers.filter((offer) => offer.platformId === platformId).length,
    };
  }

  offers.sort((a, b) => a.id.localeCompare(b.id));
  return { generatedAt: file.generatedAt, sources, offers };
};

/** A row of the rates table on the home page. */
export interface RateRow {
  id: string;
  /** Platform id from src/data/platforms.json (name, avatar and referral link). */
  platformId: string;
  asset: string;
  rate: number;
  type: RateType;
  product: string;
  term: string;
  termDays: number;
  conditionTop: string;
  conditionBottom: string;
  /** Part of the deposit earns a boosted rate (shown with a "Promo" badge). */
  promotional: boolean;
  /** 'new-user' rows appear only in the "New users" tab. */
  audience: 'all' | 'new-user';
  /** For new-user offers: the most one user can earn (estimatedReward), if known. */
  maxReward: number | null;
  source: SourceKind;
  updatedAt: string;
  /** Fetched more than STALE_AFTER_DAYS ago (or a manual rate verified that long ago). */
  stale: boolean;
}

export const toRateRow = (offer: StoredOffer, now: Date): RateRow => {
  const [conditionTop, conditionBottom] = conditionLines(offer);
  return {
    id: offer.id,
    platformId: offer.platformId,
    asset: offer.asset,
    rate: offer.rate,
    type: offer.type,
    product: offer.product,
    term: termLabel(offer.termDays),
    termDays: offer.termDays,
    conditionTop,
    conditionBottom,
    promotional: isBoosted(offer),
    audience: offer.audience ?? 'all',
    maxReward: offer.audience === 'new-user' ? estimatedReward(offer) : null,
    source: offer.source,
    updatedAt: offer.updatedAt,
    stale: isStale(offer.updatedAt, now),
  };
};

/** "Oct 14, 2026" for an ISO time, in UTC so the build machine's time zone doesn't matter. */
export const formatRateDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

/** What changed between two rates files, as Markdown list lines per group. */
const diffRates = (previous: RatesFile | null, next: RatesFile) => {
  const before = new Map(previous?.offers.map((offer) => [offer.id, offer]) ?? []);
  const after = new Map(next.offers.map((offer) => [offer.id, offer]));
  const bigMoves: string[] = [];
  const changes: string[] = [];
  const added: string[] = [];
  const removed: string[] = [];

  for (const [id, offer] of after) {
    const old = before.get(id);
    if (!old) added.push(`- \`${id}\` ${offer.rate}% ${offer.type}`);
    else if (old.rate !== offer.rate) {
      const line = `- \`${id}\`: ${old.rate}% → ${offer.rate}% ${offer.type}`;
      (isBigMove(old.rate, offer.rate) ? bigMoves : changes).push(line);
    }
  }
  for (const [id, offer] of before) {
    if (!after.has(id)) removed.push(`- \`${id}\`: ${removalReason(offer.platformId, next.sources[offer.platformId])}`);
  }

  const failed = Object.entries(next.sources)
    .filter(([, status]) => status.status === 'failed')
    .map(([platformId, status]) => {
      const since = status.updatedAt ? `, last success ${formatRateDate(status.updatedAt)}` : '';
      return `- ${platformId}: ${status.error} (kept ${status.offers} previous offers${since})`;
    });

  return { bigMoves, changes, added, removed, failed };
};

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

/** Warn this many days before manual offers are dropped. */
export const MANUAL_WARN_DAYS = 7;

export interface ManualExpiry {
  platformId: string;
  /** ISO date the oldest manual offer of the platform drops off the site. */
  dropsOn: string;
  daysLeft: number;
}

/**
 * Manual platforms whose oldest offer drops off within MANUAL_WARN_DAYS of the
 * file's `generatedAt`, soonest first. Manual offers carry their `verifiedAt`
 * as `updatedAt`.
 */
export const manualExpiries = (rates: RatesFile): ManualExpiry[] => {
  const oldest = new Map<string, number>();
  for (const offer of rates.offers) {
    if (offer.source !== 'manual') continue;
    const time = new Date(offer.updatedAt).getTime();
    oldest.set(offer.platformId, Math.min(time, oldest.get(offer.platformId) ?? time));
  }
  const now = new Date(rates.generatedAt).getTime();
  return [...oldest]
    .map(([platformId, verified]) => {
      const drops = verified + MANUAL_MAX_AGE_DAYS * DAY_MS;
      return {
        platformId,
        dropsOn: new Date(drops).toISOString().slice(0, 10),
        daysLeft: Math.ceil((drops - now) / DAY_MS),
      };
    })
    .filter((expiry) => expiry.daysLeft <= MANUAL_WARN_DAYS)
    .sort((x, y) => x.daysLeft - y.daysLeft);
};

/**
 * Why the daily rates PR needs a person to look at it: big moves, removed
 * offers, failed sources or manual rates about to drop off. Empty on a quiet day.
 */
export const holdReasons = (previous: RatesFile | null, next: RatesFile): string[] => {
  const { bigMoves, removed, failed } = diffRates(previous, next);
  const expiring = manualExpiries(next);
  return [
    ...(bigMoves.length ? [plural(bigMoves.length, 'big move')] : []),
    ...(removed.length ? [plural(removed.length, 'removed offer')] : []),
    ...(failed.length ? [plural(failed.length, 'failed source')] : []),
    ...(expiring.length ? [`manual rates expiring (${expiring.map((e) => e.platformId).join(', ')})`] : []),
  ];
};

/** Markdown summary of what changed between two rates files, for the daily PR body. */
export const summarizeChanges = (previous: RatesFile | null, next: RatesFile): string => {
  const { bigMoves, changes, added, removed, failed } = diffRates(previous, next);
  const reasons = holdReasons(previous, next);
  const expiring = manualExpiries(next).map(({ platformId, dropsOn, daysLeft }) =>
    daysLeft <= 0
      ? `- ${platformId}: drops off today (${formatRateDate(dropsOn)})`
      : `- ${platformId}: drops off on ${formatRateDate(dropsOn)} (${plural(daysLeft, 'day')} left)`
  );
  const section = (title: string, lines: string[], empty: string) => [
    `### ${title} (${lines.length})`,
    lines.length ? lines.join('\n') : empty,
    '',
  ];
  return [
    reasons.length
      ? `**Needs review:** ${reasons.join(', ')}. Check them before merging.`
      : '**Quiet day:** no big moves, removed offers, failed sources or expiring manual rates. Safe to merge.',
    '',
    ...section('Big moves', bigMoves, 'None.'),
    ...section('Rate changes', changes, 'No rate changes.'),
    ...section('New offers', added, 'None.'),
    ...section('Removed offers', removed, 'None.'),
    ...section('Failed sources', failed, 'None.'),
    ...(expiring.length ? section('Manual rates to re-check', expiring, '') : []),
  ]
    .join('\n')
    .trimEnd();
};

/** A change worth a second look in the daily PR: at least 1 point and at least 30% of the old rate. */
const isBigMove = (from: number, to: number): boolean =>
  Math.abs(to - from) >= 1 && Math.abs(to - from) >= Math.abs(from) * 0.3;

const removalReason = (platformId: string, status: SourceStatus | undefined): string => {
  if (!status) return `${platformId} has no source any more`;
  if (status.status === 'manual')
    return `removed from manual-rates.json or verified more than ${MANUAL_MAX_AGE_DAYS} days ago`;
  return `no longer listed by ${platformId}`;
};
