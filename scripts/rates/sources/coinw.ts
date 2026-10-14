import {
  canonicalAsset,
  fractionToPercent,
  NEW_USER_ASSETS,
  roundRate,
  type RateOffer,
  type RateTier,
} from '../../../src/utils/rates';
import type { Source } from '../types';

// The public JSON behind coinw.com/earn/crypto-savings.
const API = 'https://spotapi.coinw.com/web/v3/spot/financial/v1/invest/getFinancialList';
/** productType 1 = flexible savings, 2 = fixed-term savings. */
const PRODUCT_TYPES = [1, 2];

interface CoinwProduct {
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
    if (!asset || !income || invest.isSellOut === 1) return [];
    const newUser = invest.isNewerProduct === 1;
    // New-user offers are kept for the "New users" tab, USDT/USDC only.
    if (newUser && !NEW_USER_ASSETS.includes(asset)) return [];
    const fixed = product.productClassifiy === 'REGULAR_FINANCIAL';
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

export const coinw: Source = {
  platformId: 'coinw',
  kind: 'web',
  fetch: async (fetchJson, assets) => {
    const responses = await Promise.all(
      PRODUCT_TYPES.map((type) => fetchJson(`${API}?pageSize=1000&page=1&productType=${type}`))
    );
    return responses.flatMap((response) => parseCoinw(response as CoinwResponse, assets));
  },
};
