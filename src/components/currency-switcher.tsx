'use client';

import { useState, useEffect } from 'react';
import { currencies } from '@/lib/currencies';
import { DollarSign, Check } from 'lucide-react';
import { CURRENCY_COOKIE } from '@/lib/cookie-keys';

export function CurrencySwitcher() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('USD');

  useEffect(() => {
    const m = document.cookie.match(new RegExp(`(^|; )${CURRENCY_COOKIE}=([^;]+)`));
    if (m) setCurrent(m[2]);
  }, []);

  const change = (code: string) => {
    document.cookie = `${CURRENCY_COOKIE}=${code}; path=/; max-age=${60 * 60 * 24 * 365}`;
    setCurrent(code);
    setOpen(false);
    // Refresh page to reflect new prices
    window.location.reload();
  };

  const meta = currencies.find((c) => c.code === current) ?? currencies[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm hover:bg-slate-50"
        aria-label="Change currency"
      >
        <DollarSign className="h-4 w-4" />
        <span>{meta.code}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 max-h-96 w-64 overflow-y-auto rounded-xl border border-slate-200 bg-white py-2 shadow-soft">
            {currencies.map((c) => (
              <button
                key={c.code}
                onClick={() => change(c.code)}
                className="flex w-full items-center justify-between px-4 py-2 text-sm hover:bg-slate-50"
              >
                <span className="flex items-center gap-3">
                  <span className="w-8 text-slate-500">{c.symbol}</span>
                  <span>
                    <div className="font-medium">{c.code}</div>
                    <div className="text-xs text-slate-500">{c.name}</div>
                  </span>
                </span>
                {c.code === current && <Check className="h-4 w-4 text-brand-600" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
