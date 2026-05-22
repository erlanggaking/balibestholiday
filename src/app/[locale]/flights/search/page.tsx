import { Suspense } from 'react';
import { FlightResults } from '@/components/flight-results';
import { FlightSearchForm } from '@/components/flight-search-form';
import { Loader2 } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export const metadata = { title: 'Flight results' };

interface SearchParams {
  origin?: string;
  destination?: string;
  departureDate?: string;
  returnDate?: string;
  adults?: string;
  children?: string;
  cabinClass?: string;
}

export default async function FlightSearchResultsPage({
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
      <div className="bg-gradient-to-br from-ocean-700 via-ocean-600 to-brand-600 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FlightSearchForm
            initial={{
              origin: sp.origin,
              destination: sp.destination,
              departureDate: sp.departureDate,
              returnDate: sp.returnDate,
              adults: sp.adults ? Number(sp.adults) : 1,
              children: sp.children ? Number(sp.children) : 0,
              cabinClass: sp.cabinClass,
              tripType: sp.returnDate ? 'roundtrip' : 'oneway',
            }}
            compact
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
          <FlightResults params={sp as any} locale={locale} />
        </Suspense>
      </div>
    </div>
  );
}
