import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  addDay,
  formatMonth,
  historyDate,
  historyMonthOf,
  mergeMonths,
  snapshotOf,
  type HistoryMonth,
} from '../../src/utils/rateHistory';
import type { RatesFile } from '../../src/utils/rates';

const MONTH_FILE = /^\d{4}-\d{2}\.json$/;

const readMonth = (path: string): HistoryMonth =>
  existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as HistoryMonth) : {};

/**
 * Writes the day of `rates` into `historyDir`. `pendingDir` holds the history
 * files of the still-open rates PR: the bot rebuilds that PR from master on
 * every run, so their days are copied in first or unmerged days would be lost.
 */
export const updateHistory = ({
  historyDir,
  pendingDir,
  rates,
}: {
  historyDir: string;
  pendingDir?: string;
  rates: RatesFile;
}): string => {
  mkdirSync(historyDir, { recursive: true });
  if (pendingDir && existsSync(pendingDir)) {
    for (const name of readdirSync(pendingDir).filter((file) => MONTH_FILE.test(file))) {
      const path = join(historyDir, name);
      const merged = mergeMonths(readMonth(path), readMonth(join(pendingDir, name)));
      writeFileSync(path, formatMonth(merged));
    }
  }
  const date = historyDate(rates);
  const path = join(historyDir, `${historyMonthOf(date)}.json`);
  writeFileSync(path, formatMonth(addDay(readMonth(path), date, snapshotOf(rates))));
  return date;
};
