'use client';

import { useLocale } from 'next-intl';
import { useState, useTransition } from 'react';
import { useRouter, usePathname } from '@/i18n/routing';
import { languages } from '@/i18n/config';
import { Globe, Check } from 'lucide-react';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  const current = languages.find((l) => l.code === locale) ?? languages[0];

  const change = (code: string) => {
    startTransition(() => {
      router.replace(pathname, { locale: code as any });
    });
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm hover:bg-slate-50"
        aria-label="Change language"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">{current.flag} {current.code.toUpperCase()}</span>
        <span className="sm:hidden">{current.flag}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 max-h-96 w-64 overflow-y-auto rounded-xl border border-slate-200 bg-white py-2 shadow-soft">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => change(lang.code)}
                className="flex w-full items-center justify-between gap-3 px-4 py-2 text-sm hover:bg-slate-50"
              >
                <span className="flex items-center gap-3">
                  <span className="text-lg">{lang.flag}</span>
                  <span>
                    <div className="font-medium">{lang.nativeName}</div>
                    <div className="text-xs text-slate-500">{lang.name}</div>
                  </span>
                </span>
                {lang.code === locale && <Check className="h-4 w-4 text-brand-600" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
