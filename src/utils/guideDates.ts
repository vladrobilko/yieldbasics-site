/** Last change of a post: `updateDate`, else `publishDate`, from its frontmatter. */
export const postLastmod = (source: string): string | undefined => {
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source)?.[1] ?? '';
  const field = (name: string) => new RegExp(`^${name}:[ \\t]*['"]?([^'"\\s]+)`, 'm').exec(frontmatter)?.[1];
  if (field('draft') === 'true') return undefined;
  const value = field('updateDate') ?? field('publishDate');
  const date = value ? new Date(value) : undefined;
  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : undefined;
};

/** Sitemap dates for /guides/<slug> pages, plus /guides itself (the newest post). */
export const guideLastmods = (posts: readonly { slug: string; source: string }[]): Map<string, string> => {
  const dates = new Map<string, string>();
  for (const { slug, source } of posts) {
    const lastmod = postLastmod(source);
    if (lastmod) dates.set(`/guides/${slug}`, lastmod);
  }
  const newest = [...dates.values()].sort().at(-1);
  if (newest) dates.set('/guides', newest);
  return dates;
};
