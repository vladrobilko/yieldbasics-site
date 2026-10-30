/**
 * Daily rate history: one file per month in src/data/history/<yyyy-mm>.json,
 * holding every offer's rate for each day the rates were fetched.
 */
import type { RatesFile } from './rates';

/** Offer id → rate (percent) for one day. */
export type HistoryDay = Record<string, number>;

/** Date (yyyy-mm-dd) → that day's rates, for one month. */
export type HistoryMonth = Record<string, HistoryDay>;

/** The UTC date of a rates file, e.g. "2026-10-30". */
export const historyDate = (rates: RatesFile): string => rates.generatedAt.slice(0, 10);

/** "2026-10-30" → "2026-10", the month file a day belongs to. */
export const historyMonthOf = (date: string): string => date.slice(0, 7);

/**
 * The rates as of this file: fresh offers and manual ones. Offers kept from a
 * failed source still carry an older fetch time, so they are left out rather
 * than recorded again as if they were checked that day.
 */
export const snapshotOf = (rates: RatesFile): HistoryDay => {
  const day: HistoryDay = {};
  const offers = rates.offers
    .filter((offer) => offer.source === 'manual' || offer.updatedAt === rates.generatedAt)
    .sort((a, b) => a.id.localeCompare(b.id));
  for (const offer of offers) day[offer.id] = offer.rate;
  return day;
};

const sortedByDate = (month: HistoryMonth): HistoryMonth =>
  Object.fromEntries(Object.entries(month).sort(([a], [b]) => a.localeCompare(b)));

/** Adds or replaces one day. */
export const addDay = (month: HistoryMonth, date: string, day: HistoryDay): HistoryMonth =>
  sortedByDate({ ...month, [date]: day });

/** All days from both months; where both have a day, `primary` wins. */
export const mergeMonths = (primary: HistoryMonth, other: HistoryMonth): HistoryMonth =>
  sortedByDate({ ...other, ...primary });

/** One line per day, so each daily update is a one-line diff. */
export const formatMonth = (month: HistoryMonth): string => {
  const lines = Object.entries(month).map(([date, day]) => `  ${JSON.stringify(date)}: ${JSON.stringify(day)}`);
  return lines.length ? `{\n${lines.join(',\n')}\n}\n` : '{}\n';
};
