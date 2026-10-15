/**
 * APR / APY conversions and earnings, for the APR vs APY guide's calculator.
 * Rates are percentages (5 = 5%).
 */

export interface Compounding {
  id: string;
  label: string;
  /** Compounding periods per year; 0 means simple interest (no compounding). */
  periods: number;
}

export const COMPOUNDING: readonly Compounding[] = [
  { id: 'daily', label: 'Daily', periods: 365 },
  { id: 'weekly', label: 'Weekly', periods: 52 },
  { id: 'monthly', label: 'Monthly', periods: 12 },
  { id: 'none', label: 'None (simple interest)', periods: 0 },
];

/** APY for an APR compounded `periods` times a year. */
export const aprToApy = (apr: number, periods: number): number =>
  periods > 0 ? ((1 + apr / 100 / periods) ** periods - 1) * 100 : apr;

/** APR that gives this APY when compounded `periods` times a year. */
export const apyToApr = (apy: number, periods: number): number =>
  periods > 0 ? periods * ((1 + apy / 100) ** (1 / periods) - 1) * 100 : apy;

/** Interest earned on `amount` over `days` at an APR compounded `periods` times a year. */
export const earnings = (amount: number, apr: number, days: number, periods: number): number =>
  periods > 0
    ? amount * ((1 + apr / 100 / periods) ** ((periods * days) / 365) - 1)
    : (amount * apr * days) / 100 / 365;

export interface CalculatorResult {
  apr: number;
  apy: number;
  earned: number;
}

/**
 * Both rates and the earnings for a rate quoted as APR or APY. Returns null
 * when an input is missing, negative or not a number.
 */
export const calculate = (input: {
  rate: number;
  type: 'APR' | 'APY';
  periods: number;
  amount: number;
  days: number;
}): CalculatorResult | null => {
  const { rate, type, periods, amount, days } = input;
  if (![rate, amount, days].every((value) => Number.isFinite(value) && value >= 0)) return null;
  const apr = type === 'APR' ? rate : apyToApr(rate, periods);
  return { apr, apy: aprToApy(apr, periods), earned: earnings(amount, apr, days, periods) };
};
