/** Formats a yield rate with two decimals, e.g. 12.5 → "12.50%". */
export const formatRate = (rate: number): string => `${rate.toFixed(2)}%`;

/** Returns a new array sorted by `rate`, highest first unless `descending` is false. */
export const sortByRate = <T extends { rate: number }>(items: readonly T[], descending = true): T[] =>
  [...items].sort((a, b) => (descending ? b.rate - a.rate : a.rate - b.rate));

/** Rows for one asset symbol (case-insensitive), sorted by rate. */
export const ratesForAsset = <T extends { asset: string; rate: number }>(
  items: readonly T[],
  symbol: string,
  descending = true
): T[] =>
  sortByRate(
    items.filter((item) => item.asset.toUpperCase() === symbol.toUpperCase()),
    descending
  );

/** "28 offers from 11 platforms", with singular and empty forms. */
export const productsLabel = (count: number, platforms: number): string => {
  if (count === 0) return 'No offers listed yet';
  const offers = `${count} ${count === 1 ? 'offer' : 'offers'}`;
  return `${offers} from ${platforms} ${platforms === 1 ? 'platform' : 'platforms'}`;
};

/** Rows the home table shows before "Show all" is pressed. */
export const COLLAPSED_ROWS = 7;

/**
 * Sorted by estimated max reward (the "New users" tab), highest first unless
 * `descending` is false. Rows without a known reward always go last, by rate.
 */
export const sortByReward = <T extends { reward: number | null; rate: number }>(
  items: readonly T[],
  descending = true
): T[] =>
  [...items].sort((a, b) => {
    if (a.reward === null || b.reward === null) {
      if (a.reward === b.reward) return b.rate - a.rate;
      return a.reward === null ? 1 : -1;
    }
    return descending ? b.reward - a.reward : a.reward - b.reward;
  });

/** Label of the sort toggle for the current order. */
export const sortLabel = (descending: boolean, by: 'rate' | 'reward' = 'rate'): string =>
  `${descending ? 'Highest' : 'Lowest'} ${by === 'reward' ? 'reward' : 'APR'}`;

/** Assets whose symbol or name contains the query (case-insensitive). An empty query returns all. */
export const filterAssets = <T extends { symbol: string; name: string }>(items: readonly T[], query: string): T[] => {
  const q = query.trim().toLowerCase();
  if (!q) return [...items];
  return items.filter((item) => item.symbol.toLowerCase().includes(q) || item.name.toLowerCase().includes(q));
};

export interface PopoverPlacementInput {
  /** Trigger rectangle in viewport coordinates. */
  anchor: { top: number; bottom: number; right: number };
  /** Popover width and its natural (unconstrained) content height. */
  width: number;
  contentHeight: number;
  viewport: { width: number; height: number };
  /** Lowest allowed top edge, e.g. the bottom of a sticky header. */
  minTop?: number;
  gap?: number;
  margin?: number;
  /** Below the trigger is preferred while at least this much room is left there. */
  minHeight?: number;
}

/**
 * Where to put a popover under (or, when there is clearly more room, above) its
 * trigger. The height is capped to the available space so the panel scrolls
 * inside instead of being pushed over the page header.
 */
export const placePopover = ({
  anchor,
  width,
  contentHeight,
  viewport,
  minTop = 0,
  gap = 8,
  margin = 16,
  minHeight = 240,
}: PopoverPlacementInput): { top: number; left: number; maxHeight: number } => {
  const left = Math.max(margin, Math.min(anchor.right - width, viewport.width - width - margin));
  const topLimit = Math.max(margin, minTop);
  const spaceBelow = viewport.height - margin - (anchor.bottom + gap);
  const spaceAbove = anchor.top - gap - topLimit;

  const fitsBelow = contentHeight <= spaceBelow || spaceBelow >= minHeight || spaceBelow >= spaceAbove;
  if (fitsBelow) {
    return { top: anchor.bottom + gap, left, maxHeight: Math.max(0, Math.min(contentHeight, spaceBelow)) };
  }
  const maxHeight = Math.max(0, Math.min(contentHeight, spaceAbove));
  return { top: anchor.top - gap - maxHeight, left, maxHeight };
};

export type TermFilter = 'all' | 'flexible' | 'fixed' | 'new-user';

/**
 * Rows matching the All / Flexible / Fixed / New users toggle (`termDays` 0
 * means flexible). New-user offers appear only in their own tab, so their huge
 * APRs never top the regular ranking.
 */
export const filterByTerm = <T extends { termDays: number; audience: string }>(
  items: readonly T[],
  term: TermFilter
): T[] =>
  items.filter((item) => {
    if (term === 'new-user') return item.audience === 'new-user';
    if (item.audience === 'new-user') return false;
    return term === 'all' || (term === 'flexible') === (item.termDays === 0);
  });

/** Text for an empty table. */
export const emptyMessage = (asset: string, term: TermFilter, newUserAssets: readonly string[]): string =>
  term === 'new-user' && !newUserAssets.includes(asset)
    ? `New-user offers are tracked for ${newUserAssets.join(' and ')} only.`
    : `No matching ${asset} offers right now — try another term or asset.`;

/** Live counts for the home page: offers, platforms and coins that have at least one offer. */
export const siteStats = (rows: readonly { platformId: string; asset: string }[]) => ({
  offers: rows.length,
  platforms: new Set(rows.map((row) => row.platformId)).size,
  coins: new Set(rows.map((row) => row.asset)).size,
});
