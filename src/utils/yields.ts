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

/** "5 products across leading exchanges", with singular and empty forms. */
export const productsLabel = (count: number): string =>
  count === 0 ? 'No products listed yet' : `${count} ${count === 1 ? 'product' : 'products'} across leading exchanges`;

/** Label of the sort toggle for the current order. */
export const sortLabel = (descending: boolean): string => (descending ? 'Highest APR' : 'Lowest APR');

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
