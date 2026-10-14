/**
 * For platforms whose bot protection rejects plain HTTP requests: open the
 * platform's page in headless Chrome (the system install, so nothing extra is
 * downloaded; GitHub's Ubuntu runners ship it) and call the API from inside
 * the page, with the cookies the page itself received.
 */
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

export const fetchJsonInBrowser = async (pageUrl: string, apiPath: string, timeoutMs = 45_000): Promise<unknown> => {
  // Imported lazily so the tests and the other sources never load it.
  const { chromium } = await import('playwright-core');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--disable-blink-features=AutomationControlled'],
  });
  try {
    const context = await browser.newContext({ locale: 'en-US', userAgent: USER_AGENT });
    const page = await context.newPage();
    await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
    const { status, body } = await page.evaluate(async (path) => {
      const response = await fetch(path, { headers: { Accept: 'application/json' } });
      return { status: response.status, body: await response.text() };
    }, apiPath);
    if (status !== 200) throw new Error(`HTTP ${status} from ${new URL(pageUrl).host} (in browser)`);
    return JSON.parse(body);
  } finally {
    await browser.close();
  }
};
