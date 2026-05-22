import { Suspense } from 'react';
import { StayResults } from '@/components/stay-results';
import { StaySearchForm } from '@/components/stay-search-form';
import { Loader2 } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export const metadata = { title: 'Hotel results' };

interface SearchParams {
  location?: string;
  lat?: string;
  lng?: string;
  name?: string;
  checkIn?: string;
  checkOut?: string;
  rooms?: string;
  adults?: string;
  children?: string;
}

export default async function StaySearchResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const ts = await getTranslations({ locale, namespace: 'search' });

  return (
    <div className="bg-slate-50 pb-16">
      <div className="bg-gradient-to-br from-brand-600 via-brand-500 to-ocean-500 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <StaySearchForm
            initial={{
              location: sp.location,
              checkIn: sp.checkIn,
              checkOut: sp.checkOut,
              rooms: sp.rooms ? Number(sp.rooms) : 1,
              adults: sp.adults ? Number(sp.adults) : 2,
              children: sp.children ? Number(sp.children) : 0,
            }}
          />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Suspense
          key={JSON.stringify(sp)}
          fallback={
            <div className="flex items-center justify-center py-16 text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> {ts('searchingFares')}
            </div>
          }
        >
          <StayResults params={sp as any} locale={locale} />
        </Suspense>
      </div>
    </div>
  );
}
