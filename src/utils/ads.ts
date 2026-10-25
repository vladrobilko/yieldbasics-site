/**
 * Top ad bar served by A-Ads (now AADS, https://aads.com). The unit ID is
 * public (it appears in every page's HTML), so it is safe in this repo.
 * Leave it empty to hide the bar on every page.
 */
export const A_ADS_UNIT_ID = '2459856';

/** sessionStorage key: a closed bar stays hidden until the visitor closes the tab. */
export const AD_BAR_HIDDEN_KEY = 'adBarHidden';

/** Adaptive A-Ads iframe URL, or null when the unit ID is missing or malformed. */
export const aAdsUnitUrl = (unitId: string): string | null => {
  const id = unitId.trim();
  return /^\d+$/.test(id) ? `https://acceptable.a-ads.com/${id}/?size=Adaptive` : null;
};
