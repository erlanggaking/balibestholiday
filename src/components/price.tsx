'use client';

import { useEffect, useState } from 'react';
import { convert, convertFromBase, formatCurrency } from '@/lib/currencies';
import { CURRENCY_COOKIE } from '@/lib/cookie-keys';
import { useLocale } from 'next-intl';

interface PriceProps {
  /** Amount expressed in the source currency (defaults to USD if `fromCurrency` is not given). */
  amountUSD: number;
  /** Optional source currency code (e.g. 'EUR'). When omitted, treats `amountUSD` as USD. */
  fromCurrency?: string;
  className?: string;
}

export function Price({ amountUSD, fromCurrency, className }: PriceProps) {
  const locale = useLocale();
  const [code, setCode] = useState('USD');

  useEffect(() => {
    const m = document.cookie.match(new RegExp(`(^|; )${CURRENCY_COOKIE}=([^;]+)`));
    if (m) setCode(m[2]);
  }, []);

  const converted = fromCurrency
    ? convert(amountUSD, fromCurrency, code)
    : convertFromBase(amountUSD, code);
  return <span className={className}>{formatCurrency(converted, code, locale)}</span>;
}
