/** IndexNow key: public by design, served at /<key>.txt from public/. */
export const INDEXNOW_KEY = '1fac36260a765a168fba1610be9da0ce';

export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

export interface IndexNowBody {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
}

export const indexNowBody = (siteUrl: string, paths: readonly string[], key = INDEXNOW_KEY): IndexNowBody => {
  const site = new URL(siteUrl);
  return {
    host: site.host,
    key,
    keyLocation: new URL(`/${key}.txt`, site).href,
    urlList: [...new Set(paths.map((path) => new URL(path, site).href))],
  };
};
