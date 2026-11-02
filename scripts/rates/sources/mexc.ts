import { canonicalAsset, roundRate, type RateOffer, type RateTier } from '../../../src/utils/rates';
import { fetchJsonInBrowser } from '../browser';
import type { Source } from '../types';

// The JSON behind mexc.com/earn. MEXC's bot protection rejects plain HTTP
// requests, so it is read from inside a headless Chrome page (see ../browser).
const PAGE = 'https://www.mexc.com/earn';
const API_PATH = '/api/financialactivity/financial/products/list/V2';

interface MexcProduct {
  currency: string;
  financialType: 'FLEXIBLE' | 'FIXED';
  fixedInvestPeriodCount: number | null;
  showApr: string;
  baseApr: string;
  tieredSubsidyApr: { startQuantity: string; endQuantity: string | null; apr: string }[] | null;
  financialState: number;
  /** Epoch ms the product opened. */
  startTime: number;
  soldOut: boolean;
  /** NORMAL = everyone; EFTD = first-time depositors only (the "600% APR" offers). */
  memberType: string;
  /** Most one user can deposit; "-1" when unlimited. */
  perPledgeMaxQuantity: string;
}

interface MexcResponse {
  code: number;
  msg?: string;
  data: { financialProductList: MexcProduct[] }[];
}

export const parseMexc = (response: MexcResponse, assets: readonly string[]): RateOffer[] => {
  if (response.code !== 0) throw new Error(`MEXC error ${response.code}: ${response.msg ?? ''}`);
  // A coin can have a second flexible product for everyone. The page labels it
  // "Earn Plus" (USDT, 2026-11-02) but the API doesn't, so the oldest one keeps
  // "Flexible Savings" and newer ones become "Earn Plus" instead of being
  // deduplicated away.
  const extraFlexible = new Set(
    response.data.flatMap((coin) =>
      coin.financialProductList
        .filter((p) => p.financialType === 'FLEXIBLE' && p.memberType === 'NORMAL' && p.financialState === 2)
        .sort((a, b) => a.startTime - b.startTime)
        .slice(1)
    )
  );
  return response.data
    .flatMap((coin) => coin.financialProductList)
    .flatMap((product): RateOffer[] => {
      const asset = canonicalAsset(product.currency, assets);
      const newUser = product.memberType === 'EFTD';
      if (!asset || product.financialState !== 2 || product.soldOut) return [];
      // First-deposit offers go to the "New users" tab.
      if (product.memberType !== 'NORMAL' && !newUser) return [];
      const cap = Number(product.perPledgeMaxQuantity);
      // Each band earns the base APR plus that band's subsidy.
      const base = Number(product.baseApr);
      const tiers: RateTier[] = (product.tieredSubsidyApr ?? []).map((band) => ({
        min: Number(band.startQuantity),
        max: band.endQuantity === null ? null : Number(band.endQuantity),
        rate: roundRate(base + Number(band.apr)),
      }));
      const fixed = product.financialType === 'FIXED';
      return [
        {
          platformId: 'mexc',
          asset,
          product: fixed ? 'Fixed Savings' : extraFlexible.has(product) ? 'Earn Plus' : 'Flexible Savings',
          termDays: fixed ? (product.fixedInvestPeriodCount ?? 0) : 0,
          rate: roundRate(Number(product.showApr)),
          type: 'APR',
          ...(tiers.length ? { tiers } : {}),
          ...(newUser ? { audience: 'new-user' as const } : {}),
          ...(newUser && cap > 0 ? { maxAmount: cap } : {}),
        },
      ];
    });
};

export const mexc: Source = {
  platformId: 'mexc',
  kind: 'web',
  fetch: async (_fetchJson, assets) => parseMexc((await fetchJsonInBrowser(PAGE, API_PATH)) as MexcResponse, assets),
};
