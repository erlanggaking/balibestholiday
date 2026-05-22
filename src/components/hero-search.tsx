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
  const tHome = useTranslations('home');
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
            {t(tabItem.id === 'tours' ? 'nav.packages' : `nav.${tabItem.id}`)}
          </button>
        ))}
      </div>

      <div className="rounded-2xl">
        {tab === 'flights' && <FlightSearchForm />}
        {tab === 'hotels' && <StaySearchForm />}
        {tab === 'tours' && (
          <BrowseLink href="/tours" label={t('nav.packages')} viewAll={tHome('viewAll')} />
        )}
        {tab === 'cars' && (
          <BrowseLink href="/cars" label={t('nav.cars')} viewAll={tHome('viewAll')} />
        )}
        {tab === 'insurance' && (
          <BrowseLink href="/insurance" label={t('nav.insurance')} viewAll={tHome('viewAll')} />
        )}
      </div>
    </div>
  );
}

function BrowseLink({ href, label, viewAll }: { href: string; label: string; viewAll: string }) {
  return (
    <div className="rounded-2xl bg-white p-8 text-center shadow-xl">
      <p className="text-slate-600">
        {label} →{' '}
        <a href={href} className="font-semibold text-brand-600 underline">
          {viewAll}
        </a>
      </p>
    </div>
  );
}
