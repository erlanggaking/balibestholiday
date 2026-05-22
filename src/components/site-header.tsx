'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useState } from 'react';
import { Menu, X, User } from 'lucide-react';
import { LanguageSwitcher } from './language-switcher';
import { CurrencySwitcher } from './currency-switcher';
import { useSession, signOut } from 'next-auth/react';

const navItems = [
  { href: '/tours', key: 'tours' },
  { href: '/hotels', key: 'hotels' },
  { href: '/cars', key: 'cars' },
  { href: '/flights', key: 'flights' },
  { href: '/insurance', key: 'insurance' },
  { href: '/blog', key: 'blog' },
] as const;

export function SiteHeader() {
  const t = useTranslations('nav');
  const tSite = useTranslations('site');
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const locale = useLocale();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold text-brand-700">
          <span className="inline-block h-8 w-8 rounded-full bg-gradient-to-br from-brand-400 to-ocean-500" />
          <span>{tSite('name')}</span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="text-sm font-medium text-slate-700 transition hover:text-brand-600"
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <CurrencySwitcher />
          <LanguageSwitcher />
          {session?.user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/account"
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <User className="h-4 w-4" />
                {session.user.name?.split(' ')[0] ?? t('account')}
              </Link>
              <button
                onClick={() => signOut()}
                className="text-sm text-slate-500 hover:text-slate-900"
              >
                {t('signout')}
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                {t('signin')}
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
              >
                {t('signup')}
              </Link>
            </>
          )}
        </div>

        <button
          className="rounded-lg p-2 lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <div className="mx-auto max-w-7xl space-y-1 px-4 py-3">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-100"
              >
                {t(item.key)}
              </Link>
            ))}
            <div className="flex items-center gap-2 px-3 py-2">
              <CurrencySwitcher />
              <LanguageSwitcher />
            </div>
            {session?.user ? (
              <Link
                href="/account"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-100"
              >
                {t('account')}
              </Link>
            ) : (
              <div className="grid grid-cols-2 gap-2 px-3 py-2">
                <Link
                  href="/auth/signin"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-center text-sm font-medium"
                >
                  {t('signin')}
                </Link>
                <Link
                  href="/auth/signup"
                  onClick={() => setOpen(false)}
                  className="rounded-lg bg-brand-600 px-3 py-2 text-center text-sm font-medium text-white"
                >
                  {t('signup')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
