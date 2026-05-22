// 20 mata uang yang paling banyak digunakan global
// rateToBase = 1 USD = X currency (approx, di-update via cron / API exchangeratesapi.io)

export interface CurrencyMeta {
  code: string;
  name: string;
  symbol: string;
  decimalDigits: number;
  rateToBase: number; // 1 USD = ?
  sortOrder: number;
}

export const currencies: CurrencyMeta[] = [
  // Indonesia first — primary market
  { code: 'IDR', name: 'Indonesian Rupiah',   symbol: 'Rp',   decimalDigits: 0, rateToBase: 16250.0,   sortOrder: 1 },
  { code: 'USD', name: 'US Dollar',           symbol: '$',    decimalDigits: 2, rateToBase: 1.0,       sortOrder: 2 },
  { code: 'EUR', name: 'Euro',                symbol: '€',    decimalDigits: 2, rateToBase: 0.92,      sortOrder: 3 },
  { code: 'GBP', name: 'British Pound',       symbol: '£',    decimalDigits: 2, rateToBase: 0.79,      sortOrder: 4 },
  { code: 'JPY', name: 'Japanese Yen',        symbol: '¥',    decimalDigits: 0, rateToBase: 156.0,     sortOrder: 5 },
  { code: 'CNY', name: 'Chinese Yuan',        symbol: '¥',    decimalDigits: 2, rateToBase: 7.25,      sortOrder: 6 },
  { code: 'AUD', name: 'Australian Dollar',   symbol: 'A$',   decimalDigits: 2, rateToBase: 1.52,      sortOrder: 7 },
  { code: 'CAD', name: 'Canadian Dollar',     symbol: 'C$',   decimalDigits: 2, rateToBase: 1.37,      sortOrder: 8 },
  { code: 'CHF', name: 'Swiss Franc',         symbol: 'CHF',  decimalDigits: 2, rateToBase: 0.91,      sortOrder: 9 },
  { code: 'HKD', name: 'Hong Kong Dollar',    symbol: 'HK$',  decimalDigits: 2, rateToBase: 7.81,      sortOrder: 10 },
  { code: 'SGD', name: 'Singapore Dollar',    symbol: 'S$',   decimalDigits: 2, rateToBase: 1.34,      sortOrder: 11 },
  { code: 'KRW', name: 'South Korean Won',    symbol: '₩',    decimalDigits: 0, rateToBase: 1380.0,    sortOrder: 12 },
  { code: 'INR', name: 'Indian Rupee',        symbol: '₹',    decimalDigits: 2, rateToBase: 83.4,      sortOrder: 13 },
  { code: 'THB', name: 'Thai Baht',           symbol: '฿',    decimalDigits: 2, rateToBase: 36.5,      sortOrder: 14 },
  { code: 'MYR', name: 'Malaysian Ringgit',   symbol: 'RM',   decimalDigits: 2, rateToBase: 4.71,      sortOrder: 15 },
  { code: 'PHP', name: 'Philippine Peso',     symbol: '₱',    decimalDigits: 2, rateToBase: 58.2,      sortOrder: 16 },
  { code: 'VND', name: 'Vietnamese Dong',     symbol: '₫',    decimalDigits: 0, rateToBase: 25400.0,   sortOrder: 17 },
  { code: 'AED', name: 'UAE Dirham',          symbol: 'د.إ',  decimalDigits: 2, rateToBase: 3.67,      sortOrder: 18 },
  { code: 'SAR', name: 'Saudi Riyal',         symbol: 'ر.س',  decimalDigits: 2, rateToBase: 3.75,      sortOrder: 19 },
  { code: 'RUB', name: 'Russian Ruble',       symbol: '₽',    decimalDigits: 2, rateToBase: 90.5,      sortOrder: 20 },
];

// IDR by default — Bali Best Holiday is Indonesia-based.
// Override per-user via cookie / preferences.
export const defaultCurrency = 'IDR';

export function findCurrency(code: string): CurrencyMeta {
  return currencies.find((c) => c.code === code.toUpperCase()) ?? currencies[0];
}

/**
 * Convert amount from base (USD) to target currency.
 */
export function convertFromBase(amountUSD: number, targetCode: string): number {
  const target = findCurrency(targetCode);
  return amountUSD * target.rateToBase;
}

/**
 * Convert amount from one currency to another via USD base.
 */
export function convert(amount: number, fromCode: string, toCode: string): number {
  const from = findCurrency(fromCode);
  const to = findCurrency(toCode);
  const amountInUSD = amount / from.rateToBase;
  return amountInUSD * to.rateToBase;
}

/**
 * Format currency for display, locale-aware.
 */
export function formatCurrency(amount: number, code: string, locale = 'en'): string {
  const meta = findCurrency(code);
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: meta.code,
      minimumFractionDigits: meta.decimalDigits,
      maximumFractionDigits: meta.decimalDigits,
    }).format(amount);
  } catch {
    return `${meta.symbol}${amount.toFixed(meta.decimalDigits)}`;
  }
}
