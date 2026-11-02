import { canonicalAsset, fractionToPercent, roundRate, type RateOffer, type RateTier } from '../../../src/utils/rates';
import type { Source } from '../types';

// The public JSON behind coinw.com/earn/crypto-savings.
const API = 'https://spotapi.coinw.com/web/v3/spot/financial/v1/invest/getFinancialList';
// Flexible products only come back when filtered by class: productType=1 has returned nothing since late Oct 2026.
// For fixed products, productType=2 is the main list and 3 adds BTC terms (7 and 60 days) that 2 misses.
const QUERIES = ['productClassifiy=CURRENT_FINANCIAL', 'productType=2', 'productType=3'];

interface CoinwProduct {
  productId: number;
  productClassifiy: string;
  /** Lock-up in days for fixed products, null for flexible ones. */
  deadline: string | number | null;
  productInvestList: { currencyName: string; userLimitAmount: number; isSellOut: number; isNewerProduct: number }[];
  productIncomeList: { maxExpectedRate: string }[];
  incomeFloatList: { minAmount: string; maxAmount: string; maxExpectedRate: string }[];
  /** Fixed products: a tiny base rate plus a bonus paid in another token (usually CWC). */
  financialProductExpectedCombinationInfoList: {
    isSupportExpectedCombination: boolean;
    totalRate: string;
    baseRate: string;
    financialProductExpectedCombinationAwardInfoList: { targetName: string }[];
  }[];
}

interface CoinwResponse {
  code: number;
  msg?: string;
  data: { total: number; rows: CoinwProduct[] };
}

export const parseCoinw = (response: CoinwResponse, assets: readonly string[]): RateOffer[] => {
  if (response.code !== 200) throw new Error(`CoinW error ${response.code}: ${response.msg ?? ''}`);
  return response.data.rows.flatMap((product): RateOffer[] => {
    const invest = product.productInvestList[0];
    const income = product.productIncomeList[0];
    const asset = invest && canonicalAsset(invest.currencyName, assets);
    const fixed = product.productClassifiy === 'REGULAR_FINANCIAL';
    // isSellOut just means deposits reached the pool cap. Flexible pools keep taking deposits
    // far past it (USDT held 10x its cap in Nov 2026), so only fixed products are skipped.
    if (!asset || !income || (fixed && invest.isSellOut === 1)) return [];
    const newUser = invest.isNewerProduct === 1;
    const tiers: RateTier[] = product.incomeFloatList.map((band, index, list) => ({
      min: Number(band.minAmount),
      // The last band's max is just the product's overall cap.
      max: index === list.length - 1 && list.length > 1 ? null : Number(band.maxAmount),
      rate: fractionToPercent(band.maxExpectedRate),
    }));
    const combo = product.financialProductExpectedCombinationInfoList.find((c) => c.isSupportExpectedCombination);
    const bonusToken = combo?.financialProductExpectedCombinationAwardInfoList[0]?.targetName;
    const rate = fractionToPercent(combo ? combo.totalRate : income.maxExpectedRate);
    const bonus = combo ? roundRate(rate - fractionToPercent(combo.baseRate)) : 0;
    return [
      {
        platformId: 'coinw',
        asset,
        product: fixed ? 'Fixed Savings' : 'Flexible Savings',
        termDays: fixed ? Number(product.deadline ?? 0) : 0,
        rate,
        type: 'APR',
        ...(tiers.length > 1 ? { tiers } : {}),
        ...(bonus > 0 && bonusToken ? { note: `${bonus}% of it paid in ${bonusToken}` } : {}),
        ...(newUser ? { audience: 'new-user' as const } : {}),
        ...(newUser && invest.userLimitAmount > 0 ? { maxAmount: Number(invest.userLimitAmount) } : {}),
      },
    ];
  });
};

/** Joins the lists into one response, keeping each product once (the lists overlap). */
export const mergeCoinwResponses = (responses: CoinwResponse[]): CoinwResponse => {
  const failed = responses.find((response) => response.code !== 200);
  if (failed) return failed;
  const rows = [...new Map(responses.flatMap((r) => r.data.rows).map((row) => [row.productId, row])).values()];
  return { code: 200, data: { total: rows.length, rows } };
};

export const coinw: Source = {
  platformId: 'coinw',
  kind: 'web',
  fetch: async (fetchJson, assets) => {
    const responses = (await Promise.all(
      QUERIES.map((query) => fetchJson(`${API}?pageSize=1000&page=1&${query}`))
    )) as CoinwResponse[];
    return parseCoinw(mergeCoinwResponses(responses), assets);
  },
};
