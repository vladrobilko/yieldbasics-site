/**
 * Minimal X API client for posting as the brand account (OAuth 1.0a user
 * context, signed with Node's crypto; no extra dependency).
 */
import { createHmac, randomBytes } from 'node:crypto';

export const X_POST_URL = 'https://api.x.com/2/tweets';

export interface XCredentials {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessSecret: string;
}

/** RFC 3986 encoding, as OAuth 1.0a requires (encodeURIComponent leaves !*'() alone). */
const encode = (value: string) =>
  encodeURIComponent(value).replace(/[!*'()]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

/**
 * The `Authorization` header for one request. `params` are the query or form
 * parameters to sign; a JSON body is not signed. `nonce` and `timestamp` are
 * fixed only in tests.
 */
export const oauthHeader = (
  method: string,
  url: string,
  credentials: XCredentials,
  params: Record<string, string> = {},
  nonce = randomBytes(16).toString('hex'),
  timestamp = Math.floor(Date.now() / 1000).toString()
): string => {
  const oauth: Record<string, string> = {
    oauth_consumer_key: credentials.apiKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_token: credentials.accessToken,
    oauth_version: '1.0',
  };
  const paramString = Object.entries({ ...params, ...oauth })
    .map(([key, value]) => [encode(key), encode(value)])
    .sort(([a, av], [b, bv]) => (a === b ? av.localeCompare(bv) : a.localeCompare(b)))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  const base = [method.toUpperCase(), encode(url), encode(paramString)].join('&');
  const key = `${encode(credentials.apiSecret)}&${encode(credentials.accessSecret)}`;
  const signature = createHmac('sha1', key).update(base).digest('base64');
  return (
    'OAuth ' +
    Object.entries({ ...oauth, oauth_signature: signature })
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${encode(k)}="${encode(v)}"`)
      .join(', ')
  );
};

/** Posts `text` and returns the new post's id. Throws with X's error on failure. */
export const createPost = async (text: string, credentials: XCredentials): Promise<string> => {
  const response = await fetch(X_POST_URL, {
    method: 'POST',
    headers: {
      Authorization: oauthHeader('POST', X_POST_URL, credentials),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });
  const body = (await response.json().catch(() => ({}))) as { data?: { id?: string } };
  if (!response.ok || !body.data?.id) {
    throw new Error(`X API ${response.status} ${response.statusText}: ${JSON.stringify(body)}`);
  }
  return body.data.id;
};
