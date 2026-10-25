/** "/guides/" → "/guides", "" → "/". */
const normalizePath = (path: string): string => '/' + path.replace(/^\/+|\/+$/g, '');

/**
 * Whether a header link is the current section: its own page, any page under
 * it ("/guides" for "/guides/apr-vs-apy"), or pages under `section` (the home
 * page's "Rates" link also covers "/rates/<coin>"). The home link never matches
 * by prefix, or it would light up on every page.
 */
export const isActiveLink = (href: string, currentPath: string, section?: string): boolean => {
  const link = normalizePath(href);
  const current = normalizePath(currentPath);
  if (link === current) return true;
  const prefixes = [link === '/' ? null : link, section ? normalizePath(section) : null];
  return prefixes.some((prefix) => prefix !== null && (current === prefix || current.startsWith(`${prefix}/`)));
};
