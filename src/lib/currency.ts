/**
 * Multi-currency support for Ledgr.
 * Provides currency metadata, formatting, and MVP exchange rate conversion.
 */

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', decimals: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', decimals: 2 },
  { code: 'GBP', name: 'British Pound', symbol: '£', decimals: 2 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', decimals: 2 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimals: 2 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimals: 0 },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimals: 2 },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$', decimals: 2 },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', decimals: 2 },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimals: 2 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimals: 2 },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', decimals: 2 },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', decimals: 2 },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', decimals: 2 },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', decimals: 2 },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', decimals: 2 },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', decimals: 2 },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', decimals: 2 },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', decimals: 2 },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', decimals: 2 },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', decimals: 2 },
];

/**
 * Find currency info by code. Returns USD as fallback if not found.
 */
export function getCurrencyInfo(code: string): CurrencyInfo {
  return (
    SUPPORTED_CURRENCIES.find((c) => c.code === code) ??
    SUPPORTED_CURRENCIES[0]
  );
}

/**
 * Format an amount with the correct symbol and decimal places for a currency.
 */
export function formatCurrencyAmount(amount: number | string, currencyCode: string): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(n) || n == null) {
    const info = getCurrencyInfo(currencyCode);
    return `${info.symbol}0${info.decimals > 0 ? '.' + '0'.repeat(info.decimals) : ''}`;
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: getCurrencyInfo(currencyCode).decimals,
      maximumFractionDigits: getCurrencyInfo(currencyCode).decimals,
    }).format(n);
  } catch {
    // Fallback if Intl doesn't know this currency
    const info = getCurrencyInfo(currencyCode);
    return `${info.symbol}${n.toFixed(info.decimals)}`;
  }
}

/**
 * Hardcoded exchange rates vs USD for MVP.
 * All rates are "1 USD = X <currency>".
 * For real production use, replace with an API call (e.g., Open Exchange Rates).
 */
const RATES_FROM_USD: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.37,
  AUD: 1.54,
  JPY: 151.50,
  CHF: 0.90,
  MXN: 17.10,
  BRL: 4.97,
  INR: 83.50,
  CNY: 7.24,
  HKD: 7.82,
  SGD: 1.35,
  SEK: 10.55,
  NOK: 10.72,
  DKK: 6.87,
  NZD: 1.64,
  ZAR: 18.80,
  AED: 3.67,
  TRY: 32.50,
  PLN: 3.96,
};

/**
 * Get exchange rate from one currency to another.
 * Returns how many units of `to` you get for 1 unit of `from`.
 */
export function getExchangeRate(from: string, to: string): number {
  if (from === to) return 1.0;
  const fromRate = RATES_FROM_USD[from] ?? 1.0;
  const toRate = RATES_FROM_USD[to] ?? 1.0;
  // Convert: from → USD → to
  return toRate / fromRate;
}

/**
 * Convert an amount from one currency to another using hardcoded rates.
 */
export function convertAmount(amount: number, from: string, to: string): number {
  if (from === to) return amount;
  const rate = getExchangeRate(from, to);
  return parseFloat((amount * rate).toFixed(getCurrencyInfo(to).decimals));
}
