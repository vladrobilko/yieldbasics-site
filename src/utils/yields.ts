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
