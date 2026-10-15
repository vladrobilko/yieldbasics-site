/**
 * Order of the guides list: posts with an `order` (frontmatter) come first,
 * lowest first, so the list reads as a "start here" path; the rest follow,
 * newest first.
 */
export const comparePosts = (
  a: { order?: number; publishDate: Date },
  b: { order?: number; publishDate: Date }
): number => {
  const ao = a.order ?? Number.POSITIVE_INFINITY;
  const bo = b.order ?? Number.POSITIVE_INFINITY;
  if (ao !== bo) return ao - bo;
  return b.publishDate.valueOf() - a.publishDate.valueOf();
};
