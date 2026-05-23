import { duffel } from '@/lib/duffel';
import { priceWithMarkup, getMarkupPct, applyMarkup } from '@/lib/markup';
import { getTranslations } from 'next-intl/server';
import { FlightResultsClient, type NormalizedOffer } from './flight-results-client';
import { FlightDateStrip, type DateStripItem } from './flight-date-strip';
import { Plane, Clock, TrendingDown } from 'lucide-react';
import { Price } from './price';

interface Params {
  origin?: string;
  destination?: string;
  departureDate?: string;
  returnDate?: string;
  adults?: string;
  children?: string;
  cabinClass?: string;
  locale?: string;
}

/** Fetch lowest priced direct offer for a single date (used to populate the date strip). */
async function fetchLowestForDate(
  origin: string,
  destination: string,
  date: string,
  adults: number,
  children: number,
  cabinClass: string,
): Promise<{ amount: number; currency: string } | null> {
  try {
    const passengers: any[] = [];
    for (let i = 0; i < adults; i++) passengers.push({ type: 'adult' });
    for (let i = 0; i < children; i++) passengers.push({ type: 'child' });

    const res: any = await duffel.offerRequests.create({
      slices: [{ origin, destination, departure_date: date }],
      passengers,
      cabin_class: cabinClass as any,
      return_offers: true,
      max_connections: 0,
    } as any);
    const offers = (res.data?.offers ?? []).filter((o: any) => o.owner?.iata_code !== 'ZZ');
    if (offers.length === 0) return null;
    let min: { amt: number; cur: string } | null = null;
    for (const o of offers as any[]) {
      const amt = parseFloat(o.total_amount);
      if (!min || amt < min.amt) min = { amt, cur: o.total_currency };
    }
    return min ? { amount: min.amt, currency: min.cur } : null;
  } catch {
    return null;
  }
}

export async function FlightResults({ params, locale }: { params: Params; locale: string }) {
  const t = await getTranslations({ locale, namespace: 'flightResults' });
  const ts = await getTranslations({ locale, namespace: 'search' });
  const {
    origin,
    destination,
    departureDate,
    returnDate,
    adults = '1',
    children = '0',
    cabinClass = 'economy',
  } = params;

  if (!origin || !destination || !departureDate) {
    return (
      <p className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center text-slate-500">
        {ts('useFormAbove')}
      </p>
    );
  }

  // Build the date strip: 2 days before, the active day, 2 days after.
  const stripDates: string[] = [];
  for (let i = -2; i <= 2; i++) {
    const d = new Date(departureDate + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + i);
    stripDates.push(d.toISOString().slice(0, 10));
  }

  const adultsN = Number(adults);
  const childrenN = Number(children);
  const flightMarkup = await getMarkupPct('flight');

  // Run main offer search in parallel with the strip-pricing fetches.
  const mainSlices: any[] = [{ origin, destination, departure_date: departureDate }];
  if (returnDate)
    mainSlices.push({ origin: destination, destination: origin, departure_date: returnDate });
  const passengers: any[] = [];
  for (let i = 0; i < adultsN; i++) passengers.push({ type: 'adult' });
  for (let i = 0; i < childrenN; i++) passengers.push({ type: 'child' });

  const mainPromise = duffel.offerRequests
    .create({
      slices: mainSlices,
      passengers,
      cabin_class: cabinClass as any,
      return_offers: true,
    })
    .then((r) => ({ ok: true as const, offers: r.data?.offers ?? [] }))
    .catch((e: any) => ({
      ok: false as const,
      error: e?.errors?.[0]?.message ?? e?.message ?? 'Search failed',
    }));

  const stripPromise = Promise.all(
    stripDates.map((d) =>
      d === departureDate
        ? Promise.resolve(null) // Will fill from main result to avoid duplicate API call.
        : fetchLowestForDate(origin, destination, d, adultsN, childrenN, cabinClass),
    ),
  );

  const [mainRes, stripPrices] = await Promise.all([mainPromise, stripPromise]);

  if (!mainRes.ok) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        <strong>{t('couldNotFetch')}</strong> {mainRes.error}
      </div>
    );
  }

  // Filter out test placeholder carrier
  const realOffers = mainRes.offers.filter((o: any) => o.owner?.iata_code !== 'ZZ');
  const useOffers = realOffers.length > 0 ? realOffers : mainRes.offers;

  if (useOffers.length === 0) {
    return (
      <p className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center text-slate-500">
        {t('noFlightsFound')}
      </p>
    );
  }

  // Compute date-strip lowest price for the active date from the main offers.
  let activeMin: { amt: number; cur: string } | null = null;
  for (const o of useOffers as any[]) {
    const amt = parseFloat(o.total_amount);
    if (!activeMin || amt < activeMin.amt) activeMin = { amt, cur: o.total_currency };
  }

  const dateStripItems: DateStripItem[] = stripDates.map((d, i) => {
    if (d === departureDate) {
      return {
        date: d,
        priceUSD: activeMin ? applyMarkup(activeMin.amt, flightMarkup) : null,
        currency: activeMin?.cur ?? 'USD',
      };
    }
    const p = stripPrices[i];
    return {
      date: d,
      priceUSD: p ? applyMarkup(p.amount, flightMarkup) : null,
      currency: p?.currency ?? 'USD',
    };
  });

  // Normalize offers for client (apply markup once on the server, ship plain JSON)
  const normalized: NormalizedOffer[] = await Promise.all(
    useOffers.map(async (o: any) => ({
      id: o.id,
      total_amount: parseFloat(o.total_amount),
      total_amount_with_markup: await priceWithMarkup(parseFloat(o.total_amount), 'flight'),
      total_currency: o.total_currency,
      passenger_count: o.passengers?.length ?? 1,
      total_emissions_kg: o.total_emissions_kg,
      conditions: {
        refund_before_departure: o.conditions?.refund_before_departure?.allowed ?? null,
        change_before_departure: o.conditions?.change_before_departure?.allowed ?? null,
      },
      owner: {
        iata_code: o.owner?.iata_code,
        name: o.owner?.name,
        logo: o.owner?.logo_symbol_url ?? null,
      },
      baggages_per_passenger: extractBaggage(o.passengers ?? []),
      slices: (o.slices ?? []).map((s: any) => {
        const segs = s.segments ?? [];
        const first = segs[0];
        const last = segs[segs.length - 1];
        return {
          duration: s.duration as string,
          stops: Math.max(0, segs.length - 1),
          origin_iata: first?.origin?.iata_code,
          origin_city: first?.origin?.city_name,
          destination_iata: last?.destination?.iata_code,
          destination_city: last?.destination?.city_name,
          departing_at: first?.departing_at,
          arriving_at: last?.arriving_at,
          fare_brand_name:
            first?.passengers?.[0]?.fare_basis_code ??
            first?.passengers?.[0]?.cabin?.marketing_name ??
            null,
          segments: segs.map((seg: any) => ({
            departing_at: seg.departing_at,
            arriving_at: seg.arriving_at,
            origin_iata: seg.origin?.iata_code,
            destination_iata: seg.destination?.iata_code,
            duration: seg.duration,
            marketing_carrier: seg.marketing_carrier?.name,
            marketing_carrier_iata: seg.marketing_carrier?.iata_code,
            flight_number: seg.marketing_carrier_flight_number,
            aircraft: seg.aircraft?.name,
          })),
        };
      }),
    })),
  );

  // Resolve airport/city display info from first offer slice for the header card
  const firstSlice = normalized[0]?.slices[0];
  const originCity = firstSlice?.origin_city ?? origin;
  const destCity = firstSlice?.destination_city ?? destination;

  // Cheapest direct + shortest duration stats
  const directs = normalized.filter((o) => o.slices.every((s) => s.stops === 0));
  const cheapestDirect = directs.length
    ? directs.reduce((a, b) => (a.total_amount_with_markup < b.total_amount_with_markup ? a : b))
    : null;
  const shortestDuration = normalized.length
    ? normalized.reduce(
        (acc, o) => Math.min(acc, parseDurationMinutes(o.slices[0]?.duration)),
        Infinity,
      )
    : null;
  const cheapestOverall = normalized.reduce((a, b) =>
    a.total_amount_with_markup < b.total_amount_with_markup ? a : b,
  );

  // Build carrier facet
  const carriers = Array.from(
    new Map(normalized.map((o) => [o.owner.iata_code, o.owner])).values(),
  ).filter((c) => c.iata_code);

  return (
    <div className="space-y-5">
      {/* Route header + date strip */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <Plane className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">
              {returnDate ? ts('roundTrip') : ts('oneWay')}
            </div>
            <div className="font-display text-xl font-bold text-slate-900 sm:text-2xl">
              {originCity} ({origin}) <span className="text-brand-500">→</span> {destCity} ({destination})
            </div>
            <div className="text-xs text-slate-500">
              {adultsN} {t('pax')}
              {childrenN > 0 ? ` + ${childrenN} ${t('pax')}` : ''} · <span className="capitalize">{cabinClass}</span>
            </div>
          </div>
        </div>

        <FlightDateStrip items={dateStripItems} activeDate={departureDate} locale={locale} />
      </div>

      {/* Highlight stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          icon={<TrendingDown className="h-5 w-5" />}
          label={t('cheapest')}
          accent="brand"
        >
          <span className="font-display text-xl font-bold text-brand-700">
            <Price
              amountUSD={cheapestOverall.total_amount_with_markup}
              fromCurrency={cheapestOverall.total_currency}
            />
          </span>
        </StatCard>
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label={t('shortestDuration')}
          accent="ocean"
        >
          <span className="font-display text-xl font-bold text-ocean-700">
            {shortestDuration && shortestDuration !== Infinity
              ? `${Math.floor(shortestDuration / 60)}h ${shortestDuration % 60}m`
              : '—'}
          </span>
        </StatCard>
        <StatCard
          icon={<Plane className="h-5 w-5" />}
          label={t('liveResults')}
          accent="emerald"
        >
          <span className="font-display text-xl font-bold text-emerald-700">
            {normalized.length} · {carriers.length} {t('airline')}
          </span>
        </StatCard>
      </div>

      {/* Best direct flight banner if found */}
      {cheapestDirect && cheapestDirect.id !== cheapestOverall.id && (
        <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4">
          <div className="mb-1 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
            ⚡ {t('cheapest')} · {t('direct')}
          </div>
          <p className="text-sm text-emerald-800">
            {cheapestDirect.owner.name} —{' '}
            <Price
              amountUSD={cheapestDirect.total_amount_with_markup}
              fromCurrency={cheapestDirect.total_currency}
            />
          </p>
        </div>
      )}

      {/* Filtered/sorted offers list */}
      <FlightResultsClient
        offers={normalized}
        route={{ origin: origin!, destination: destination! }}
        carriers={carriers as any}
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  children,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  accent: 'brand' | 'ocean' | 'emerald';
}) {
  const colors: Record<typeof accent, string> = {
    brand: 'bg-brand-100 text-brand-700',
    ocean: 'bg-ocean-100 text-ocean-700',
    emerald: 'bg-emerald-100 text-emerald-700',
  };
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${colors[accent]}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
        <div className="truncate">{children}</div>
      </div>
    </div>
  );
}

function extractBaggage(passengers: any[]): { type: string; quantity: number }[] {
  const first = passengers?.[0];
  if (!first?.baggages) return [];
  return first.baggages.map((b: any) => ({
    type: b.type, // checked | carry_on
    quantity: b.quantity,
  }));
}

function parseDurationMinutes(iso?: string): number {
  if (!iso) return 0;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return 0;
  return parseInt(m[1] ?? '0') * 60 + parseInt(m[2] ?? '0');
}
