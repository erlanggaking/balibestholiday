'use client';

import { useState } from 'react';
import { Price } from './price';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';

interface Props {
  tourId: string;
  title: string;
  priceUSD: number;
  childPriceUSD: number | null;
  maxGroupSize: number;
}

export function BookTourBox({ tourId, title, priceUSD, childPriceUSD, maxGroupSize }: Props) {
  const t = useTranslations('product');
  const tCheckout = useTranslations('checkout');
  const router = useRouter();
  const [date, setDate] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [loading, setLoading] = useState(false);

  const subtotal = priceUSD * adults + (childPriceUSD ?? priceUSD * 0.7) * children;

  const handleBook = async () => {
    if (!date) {
      alert(t('selectDate'));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            {
              productType: 'TOUR',
              tourId,
              title,
              startDate: date,
              adults,
              children,
              unitPrice: priceUSD,
              quantity: 1,
            },
          ],
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.bookingId) {
        router.push(`/checkout/${data.bookingId}` as any);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="mb-4">
        <span className="text-xs text-slate-500">{t('from')}</span>
        <div className="font-display text-3xl font-bold text-brand-700">
          <Price amountUSD={priceUSD} />
        </div>
        <span className="text-sm text-slate-500">{t('perPerson')}</span>
      </div>

      <div className="mb-3">
        <label className="mb-1 block text-xs font-medium text-slate-700">{t('selectDate')}</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">Adults</label>
          <input
            type="number"
            min={1}
            max={maxGroupSize}
            value={adults}
            onChange={(e) => setAdults(parseInt(e.target.value || '1', 10))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">Children</label>
          <input
            type="number"
            min={0}
            max={maxGroupSize}
            value={children}
            onChange={(e) => setChildren(parseInt(e.target.value || '0', 10))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between border-t pt-3 text-sm">
        <span className="font-medium">{tCheckout('total')}</span>
        <span className="font-display text-xl font-bold text-brand-700">
          <Price amountUSD={subtotal} />
        </span>
      </div>

      <button
        onClick={handleBook}
        disabled={loading}
        className="w-full rounded-lg bg-brand-600 px-4 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {loading ? '...' : t('bookNow')}
      </button>
      <p className="mt-2 text-center text-xs text-slate-500">Secure checkout via Stripe</p>
    </div>
  );
}
