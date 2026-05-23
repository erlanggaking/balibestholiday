'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Price } from './price';

export type DateStripItem = {
  date: string; // YYYY-MM-DD
  priceUSD: number | null;
  currency: string;
};

interface Props {
  items: DateStripItem[];
  activeDate: string;
  locale: string;
}

const DAYS_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const MONTH_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function FlightDateStrip({ items, activeDate, locale }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, start] = useTransition();
  const isID = locale === 'id';
  const days = isID ? DAYS_ID : DAYS_EN;
  const months = isID ? MONTH_ID : MONTH_EN;

  function nav(dateOrDelta: string | number) {
    const params = new URLSearchParams(sp?.toString() ?? '');
    let nextDate: string;
    if (typeof dateOrDelta === 'string') {
      nextDate = dateOrDelta;
    } else {
      const base = new Date(activeDate);
      base.setUTCDate(base.getUTCDate() + dateOrDelta);
      nextDate = base.toISOString().slice(0, 10);
    }
    params.set('departureDate', nextDate);
    start(() => router.push(`${pathname}?${params.toString()}`));
  }

  function fmt(d: string) {
    const dt = new Date(d + 'T00:00:00Z');
    return {
      day: days[dt.getUTCDay()],
      dateStr: `${dt.getUTCDate()} ${months[dt.getUTCMonth()]}`,
    };
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-ocean-700 via-ocean-600 to-brand-600 p-1 shadow-lg">
      <div className="flex items-stretch gap-1 rounded-2xl bg-white/5">
        <button
          type="button"
          onClick={() => nav(-1)}
          disabled={pending}
          className="flex w-12 shrink-0 items-center justify-center rounded-l-xl bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-50"
          aria-label="Previous day"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="grid flex-1 grid-cols-5">
          {items.map((it) => {
            const isActive = it.date === activeDate;
            const meta = fmt(it.date);
            return (
              <button
                key={it.date}
                type="button"
                onClick={() => nav(it.date)}
                disabled={pending || isActive}
                className={`group relative flex flex-col items-center justify-center px-2 py-3 text-center transition ${
                  isActive
                    ? 'bg-white/95 text-ocean-700 shadow-lg ring-2 ring-white'
                    : 'text-white/90 hover:bg-white/15'
                } ${
                  pending && !isActive ? 'opacity-60' : ''
                } first:rounded-l-xl last:rounded-r-xl`}
              >
                <span className={`text-xs ${isActive ? 'font-semibold text-ocean-700' : 'text-white/70'}`}>
                  {meta.day}, {meta.dateStr}
                </span>
                {it.priceUSD !== null ? (
                  <span
                    className={`mt-1 text-sm font-bold ${
                      isActive ? 'text-ocean-700' : 'text-white'
                    }`}
                  >
                    <Price amountUSD={it.priceUSD} fromCurrency={it.currency} />
                  </span>
                ) : (
                  <span className={`mt-1 text-xs ${isActive ? 'text-slate-500' : 'text-white/50'}`}>
                    —
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => nav(1)}
          disabled={pending}
          className="flex w-12 shrink-0 items-center justify-center bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-50"
          aria-label="Next day"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => {
            const inp = document.getElementById('flight-date-picker') as HTMLInputElement | null;
            inp?.showPicker?.();
            inp?.click();
          }}
          className="flex w-14 shrink-0 flex-col items-center justify-center rounded-r-xl bg-white/10 text-white transition hover:bg-white/20"
          aria-label="Open calendar"
        >
          <Calendar className="h-5 w-5" />
          <span className="mt-0.5 text-[10px]">{isID ? 'Kalender' : 'Calendar'}</span>
        </button>

        <input
          id="flight-date-picker"
          type="date"
          className="absolute h-0 w-0 opacity-0"
          value={activeDate}
          onChange={(e) => e.target.value && nav(e.target.value)}
        />
      </div>
    </div>
  );
}
