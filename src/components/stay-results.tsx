import { duffel } from '@/lib/duffel';
import { priceWithMarkup } from '@/lib/markup';
import { Star, MapPin, Wifi, Coffee, Utensils } from 'lucide-react';
import Link from 'next/link';
import { Price } from './price';

interface Params {
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

export async function StayResults({ params }: { params: Params }) {
  const { location, lat, lng, name, checkIn, checkOut, rooms = '1', adults = '2', children = '0' } = params;

  if (!checkIn || !checkOut || (!lat && !location)) {
    return (
      <p className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center text-slate-500">
        Use the form above to start your search.
      </p>
    );
  }

  let results: any[] = [];
  let error: string | null = null;
  let stayDisabled = false;

  try {
    const guests: any[] = [];
    for (let i = 0; i < Number(adults); i++) guests.push({ type: 'adult' });
    for (let i = 0; i < Number(children); i++) guests.push({ type: 'child', age: 8 });

    const searchParams: any = {
      check_in_date: checkIn,
      check_out_date: checkOut,
      rooms: Number(rooms),
      guests,
    };

    if (lat && lng) {
      searchParams.location = {
        radius: 10,
        geographic_coordinates: { latitude: Number(lat), longitude: Number(lng) },
      };
    }

    // Bypass SDK — call REST directly so we can read raw error text
    const res = await fetch('https://api.duffel.com/stays/search', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.DUFFEL_ACCESS_TOKEN ?? ''}`,
        'Content-Type': 'application/json',
        'Duffel-Version': 'v2',
        Accept: 'application/json',
      },
      body: JSON.stringify({ data: searchParams }),
    });

    if (res.status === 403) {
      stayDisabled = true;
    } else if (!res.ok) {
      const txt = await res.text();
      try {
        const j = JSON.parse(txt);
        error = j?.errors?.[0]?.message ?? `HTTP ${res.status}`;
      } catch {
        error = txt.slice(0, 200);
      }
    } else {
      const j = await res.json();
      results = (j?.data?.results ?? []).slice(0, 50);
    }
  } catch (e: any) {
    error = e?.message ?? 'Search failed';
  }

  if (stayDisabled) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <h3 className="mb-2 font-display text-lg font-bold">🏨 Stays not yet enabled on your Duffel account</h3>
        <p className="text-sm">
          Duffel's <strong>Stays</strong> product is gated and must be requested separately from Flights.
          Your test token works for Flights right away, but Stays returns HTTP 403 until your Duffel
          account has Stays enabled.
        </p>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
          <li>
            Request access:{' '}
            <a href="https://duffel.com/contact-us" target="_blank" rel="noopener" className="underline">
              duffel.com/contact-us
            </a>
          </li>
          <li>Once Duffel enables Stays for your account, this page works automatically (no code change).</li>
        </ol>
        <p className="mt-3 text-xs text-amber-800">
          In the meantime, the search form, autocomplete, and booking flow are wired and ready.
          Flight search is fully functional — try the Flights tab.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        <strong>Couldn't fetch stays:</strong> {error}
        <div className="mt-2 text-sm">
          Tip: Duffel test API supports limited locations. Try lat/lng of a major city.
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <p className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center text-slate-500">
        No stays found in this area for these dates.
      </p>
    );
  }

  // Sort by price
  results.sort((a, b) => parseFloat(a.cheapest_rate_total_amount ?? '0') - parseFloat(b.cheapest_rate_total_amount ?? '0'));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="hidden h-fit rounded-2xl border border-slate-200 bg-white p-5 lg:block">
        <h3 className="mb-4 font-semibold">Filter</h3>
        <div className="text-sm text-slate-500">
          {results.length} stays in <span className="font-medium text-slate-900">{name}</span>
        </div>
      </aside>

      <div className="space-y-4">
        <h2 className="font-display text-xl font-bold">
          Stays in {name ?? location}
        </h2>
        {await Promise.all(results.map(async (r) => <StayCard key={r.id} result={r} />))}
      </div>
    </div>
  );
}

async function StayCard({ result }: { result: any }) {
  const acc = result.accommodation ?? {};
  const baseAmount = parseFloat(result.cheapest_rate_total_amount ?? '0');
  const finalAmount = await priceWithMarkup(baseAmount, 'hotel');
  const photo = acc.photos?.[0]?.url ?? `https://source.unsplash.com/600x400/?hotel,${encodeURIComponent(acc.name ?? 'hotel')}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr]">
        <div
          className="aspect-[4/3] bg-cover bg-center md:aspect-auto"
          style={{ backgroundImage: `url(${photo})` }}
        />
        <div className="flex flex-col justify-between p-5">
          <div>
            <div className="mb-1 flex items-center gap-1">
              {Array.from({ length: acc.rating ?? 3 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <h3 className="font-display text-lg font-bold">{acc.name}</h3>
            <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="h-3.5 w-3.5" />
              {acc.location?.address?.line_one}, {acc.location?.address?.city_name}
            </p>
            {acc.review_score && (
              <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                {acc.review_score} / 10
              </div>
            )}
            {acc.amenities && acc.amenities.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {acc.amenities.slice(0, 5).map((a: any, i: number) => (
                  <span key={i} className="rounded bg-slate-100 px-2 py-0.5 text-[10px] capitalize text-slate-600">
                    {a.type?.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <div className="text-xs text-slate-500">From</div>
              <div className="font-display text-2xl font-bold text-brand-700">
                <Price amountUSD={finalAmount} fromCurrency={result.cheapest_rate_currency} />
              </div>
              <div className="text-xs text-slate-500">total stay</div>
            </div>
            <Link
              href={`/stays/checkout/${result.id}`}
              className="rounded-xl bg-brand-600 px-5 py-2 font-semibold text-white transition hover:bg-brand-700"
            >
              View Deal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
