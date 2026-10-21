// Cloudflare Worker that forwards Bybit's public earn API.
//
// Bybit answers 403 to GitHub's runners, so the daily rates job reaches it
// through this Worker (the BYBIT_PROXY_URL secret). It forwards only the one
// public endpoint the rates job needs and refuses everything else, so it can't
// be used as an open proxy. It holds no keys: the endpoint is public.
//
// Deploy: Cloudflare dashboard → Compute → Workers & Pages → the Worker →
// Edit code → paste this whole file → Deploy. Keep Settings → Runtime →
// Placement on Region aws:me-central-1: by default the Worker runs next to the
// caller, and from a US runner Bybit blocks it too. See AGENTS.md.

const UPSTREAM = 'https://api.bybit.com';
const PATH = '/v5/earn/product';
const CATEGORIES = ['FlexibleSaving', 'OnChain'];

const forbidden = () => new Response('Forbidden', { status: 403 });

/**
 * @param {Request} request
 * @param {typeof fetch} fetchImpl
 * @returns {Promise<Response>}
 */
export const handle = async (request, fetchImpl = fetch) => {
  const url = new URL(request.url);
  const category = url.searchParams.get('category') ?? '';
  const onlyCategory = [...url.searchParams.keys()].every((key) => key === 'category');
  if (request.method !== 'GET' || url.pathname !== PATH || !CATEGORIES.includes(category) || !onlyCategory) {
    return forbidden();
  }

  const upstream = await fetchImpl(`${UPSTREAM}${PATH}?category=${category}`, {
    headers: { Accept: 'application/json' },
  });
  // Where the request left Cloudflare from, to debug a block by region.
  const colo = /** @type {{ cf?: { colo?: string } }} */ (request).cf?.colo ?? 'unknown';
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json',
      'Cache-Control': 'no-store',
      'X-Proxy-Colo': colo,
    },
  });
};

export default {
  /** @param {Request} request */
  fetch: (request) => handle(request),
};
