import { describe, expect, it } from 'vitest';

import {
  cleanSlug,
  getAsset,
  getBlogPermalink,
  getCanonical,
  getHomePermalink,
  getPermalink,
  trimSlash,
} from '~/utils/permalinks';

// Values below follow src/config.yaml: base '/', trailingSlash false,
// blog at /blog, categories at /category, tags at /tag.

describe('trimSlash', () => {
  it('removes leading and trailing slashes', () => {
    expect(trimSlash('/a/b/')).toBe('a/b');
  });
});

describe('cleanSlug', () => {
  it('slugifies every path segment', () => {
    expect(cleanSlug('/Hello World/Second Part/')).toBe('hello-world/second-part');
  });
});

describe('getPermalink', () => {
  it('builds page paths', () => {
    expect(getPermalink('/about')).toBe('/about');
    expect(getPermalink('about/')).toBe('/about');
  });

  it('leaves absolute URLs and anchors untouched', () => {
    expect(getPermalink('https://example.com/x')).toBe('https://example.com/x');
    expect(getPermalink('#features')).toBe('#features');
  });

  it('builds blog-related paths', () => {
    expect(getPermalink('Staking', 'category')).toBe('/category/Staking');
    expect(getPermalink('defi', 'tag')).toBe('/tag/defi');
    expect(getPermalink('my-post', 'post')).toBe('/my-post');
  });

  it('builds home and blog paths', () => {
    expect(getHomePermalink()).toBe('/');
    expect(getBlogPermalink()).toBe('/blog');
  });
});

describe('getAsset', () => {
  it('prefixes the base path', () => {
    expect(getAsset('/rss.xml')).toBe('/rss.xml');
  });
});

describe('getCanonical', () => {
  it('builds absolute URLs on the site domain without a trailing slash', () => {
    expect(String(getCanonical('/about/'))).toBe('https://yieldbasics.com/about');
    expect(String(getCanonical('/'))).toBe('https://yieldbasics.com');
    expect(String(getCanonical('/about.html'))).toBe('https://yieldbasics.com/about');
    expect(String(getCanonical('/index.html'))).toBe('https://yieldbasics.com');
  });
});
