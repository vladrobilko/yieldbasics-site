import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { RatesFile, StoredOffer } from '../../src/utils/rates';
import { updateHistory } from './history';

const NOW = '2026-10-30T02:36:24.721Z';

const stored = (id: string, rate: number, overrides: Partial<StoredOffer> = {}): StoredOffer => ({
  platformId: id.split('-')[0],
  asset: 'USDT',
  product: 'Simple Earn',
  termDays: 0,
  rate,
  type: 'APR',
  id,
  source: 'api',
  updatedAt: NOW,
  ...overrides,
});

// Every offer counts as fetched in that run.
const ratesFile = (generatedAt: string, offers: StoredOffer[]): RatesFile => ({
  generatedAt,
  sources: {},
  offers: offers.map((offer) => ({ ...offer, updatedAt: generatedAt })),
});

describe('updateHistory', () => {
  const dirs = () => {
    const root = mkdtempSync(join(tmpdir(), 'history-'));
    return { historyDir: join(root, 'history'), pendingDir: join(root, 'pending') };
  };
  const read = (path: string) => JSON.parse(readFileSync(path, 'utf8'));

  it('creates the month file with today', () => {
    const { historyDir } = dirs();
    const date = updateHistory({ historyDir, rates: ratesFile(NOW, [stored('okx-usdt', 3.5)]) });
    expect(date).toBe('2026-10-30');
    expect(read(join(historyDir, '2026-10.json'))).toEqual({ '2026-10-30': { 'okx-usdt': 3.5 } });
  });

  it('keeps unmerged days from the open PR, including an earlier month', () => {
    const { historyDir, pendingDir } = dirs();
    updateHistory({ historyDir, rates: ratesFile('2026-10-28T02:00:00.000Z', [stored('okx-usdt', 3)]) });
    // The open PR has the 28th (already on master), the 31st (never merged) and a stray file.
    updateHistory({
      historyDir: pendingDir,
      rates: ratesFile('2026-10-28T02:00:00.000Z', [stored('okx-usdt', 3)]),
    });
    updateHistory({
      historyDir: pendingDir,
      rates: ratesFile('2026-10-31T02:00:00.000Z', [stored('okx-usdt', 4)]),
    });
    writeFileSync(join(pendingDir, 'notes.txt'), 'ignored');

    updateHistory({ historyDir, pendingDir, rates: ratesFile('2026-11-01T02:00:00.000Z', [stored('okx-usdt', 5)]) });

    expect(read(join(historyDir, '2026-10.json'))).toEqual({
      '2026-10-28': { 'okx-usdt': 3 },
      '2026-10-31': { 'okx-usdt': 4 },
    });
    expect(read(join(historyDir, '2026-11.json'))).toEqual({ '2026-11-01': { 'okx-usdt': 5 } });
  });

  it('works when the open PR has no history yet', () => {
    const { historyDir, pendingDir } = dirs();
    updateHistory({ historyDir, pendingDir, rates: ratesFile(NOW, [stored('okx-usdt', 3.5)]) });
    expect(read(join(historyDir, '2026-10.json'))).toEqual({ '2026-10-30': { 'okx-usdt': 3.5 } });
  });
});
