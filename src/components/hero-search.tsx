'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FlightSearchForm } from './flight-search-form';
import { StaySearchForm } from './stay-search-form';

const tabs = [
  { id: 'flights', icon: '✈️' },
  { id: 'hotels', icon: '🏨' },
  { id: 'tours', icon: '🏝️' },
  { id: 'cars', icon: '🚗' },
  { id: 'insurance', icon: '🛡️' },
] as const;

type TabId = (typeof tabs)[number]['id'];

export function HeroSearch() {
  const t = useTranslations();
  const [tab, setTab] = useState<TabId>('flights');

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-1 rounded-2xl bg-white/95 p-1.5 shadow-soft backdrop-blur">
        {tabs.map((tabItem) => (
          <button
            key={tabItem.id}
            onClick={() => setTab(tabItem.id)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              tab === tabItem.id
                ? 'bg-brand-600 text-white shadow'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="mr-1.5">{tabItem.icon}</span>
            {t(`nav.${tabItem.id}`)}
          </button>
        ))}
      </div>

      <div className="rounded-2xl">
        {tab === 'flights' && <FlightSearchForm />}
        {tab === 'hotels' && <StaySearchForm />}
        {tab === 'tours' && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-xl">
            <p className="text-slate-600">
              Browse curated Bali tours →{' '}
              <a href="/tours" className="font-semibold text-brand-600 underline">
                See all tours
              </a>
            </p>
          </div>
        )}
        {tab === 'cars' && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-xl">
            <p className="text-slate-600">
              Browse car rentals →{' '}
              <a href="/cars" className="font-semibold text-brand-600 underline">
                See all cars
              </a>
            </p>
          </div>
        )}
        {tab === 'insurance' && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-xl">
            <p className="text-slate-600">
              Travel insurance plans →{' '}
              <a href="/insurance" className="font-semibold text-brand-600 underline">
                Compare plans
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
