import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { platforms } from '~/data/platforms';

// Visible site text must not read as AI-written (Wikipedia "Signs of AI writing").
// This only catches the clearest signs; the rest is checked by hand when writing.
const STRONG_SIGNS = [
  /—/,
  /\bdelve/i,
  /\btapestry\b/i,
  /\btestament\b/i,
  /\bin conclusion\b/i,
  /\bin summary\b/i,
  /\bit'?s important to note\b/i,
  /\bserves as\b/i,
  /\bstands as\b/i,
];

const filesIn = (dir: string, ext: RegExp): string[] =>
  readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((name) => ext.test(name))
    .map((name) => join(dir, name));

const sources = [...filesIn('src/data/post', /\.mdx?$/), ...filesIn('src/pages', /\.(astro|md)$/)].map((file) => ({
  name: file,
  text: readFileSync(file, 'utf8'),
}));

const hits = (text: string) => STRONG_SIGNS.filter((sign) => sign.test(text)).map(String);

describe('writing style', () => {
  it.each(sources)('$name has no strong AI-writing signs', ({ text }) => {
    expect(hits(text)).toEqual([]);
  });

  it('platform summaries have no strong AI-writing signs', () => {
    for (const platform of platforms) {
      expect(hits(platform.profile?.summary ?? ''), platform.id).toEqual([]);
    }
  });
});
