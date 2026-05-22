import 'server-only';
import { cookies } from 'next/headers';
import { defaultCurrency } from './currencies';
import { defaultLocale } from '@/i18n/config';
import { CURRENCY_COOKIE, LOCALE_COOKIE } from './cookie-keys';

export { CURRENCY_COOKIE, LOCALE_COOKIE };

export async function getPreferredCurrency(): Promise<string> {
  const c = await cookies();
  return c.get(CURRENCY_COOKIE)?.value || defaultCurrency;
}

export async function getPreferredLocale(): Promise<string> {
  const c = await cookies();
  return c.get(LOCALE_COOKIE)?.value || defaultLocale;
}
