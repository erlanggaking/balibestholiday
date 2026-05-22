import { duffel } from '@/lib/duffel';
import { priceWithMarkup } from '@/lib/markup';
import { FlightResultsClient, type NormalizedOffer } from './flight-results-client';

interface Params {
  origin?: string;
  destination?: string;
  departureDate?: string;
  returnDate?: string;
  adults?: string;
  children?: string;
  cabinClass?: string;
}

export async function FlightResults({ params }: { params: Params }) {
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
        Use the form above to start your search.
      </p>
    );
  }

  let offers: any[] = [];
  let error: string | null = null;
  try {
    const slices: any[] = [{ origin, destination, departure_date: departureDate }];
    if (returnDate) slices.push({ origin: destination, destination: origin, departure_date: returnDate });
    const passengers: any[] = [];
    for (let i = 0; i < Number(adults); i++) passengers.push({ type: 'adult' });
    for (let i = 0; i < Number(children); i++) passengers.push({ type: 'child' });

    const res = await duffel.offerRequests.create({
      slices,
      passengers,
      cabin_class: cabinClass as 'economy' | 'premium_economy' | 'business' | 'first',
      return_offers: true,
    });
    offers = res.data?.offers ?? [];
  } catch (e: any) {
    error = e?.errors?.[0]?.message ?? e?.message ?? 'Search failed';
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        <strong>Couldn't fetch flights:</strong> {error}
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <p className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center text-slate-500">
        No flights found for these dates. Try different dates or destinations.
      </p>
    );
  }

  // Filter out dummy "Duffel Airways" carrier (test mode placeholder, ZZ)
  const realOffers = offers.filter((o: any) => o.owner?.iata_code !== 'ZZ');
  const useOffers = realOffers.length > 0 ? realOffers : offers;

  // Normalize for client (apply markup once on the server, ship plain JSON)
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

  // Build carrier facet
  const carriers = Array.from(
    new Map(normalized.map((o) => [o.owner.iata_code, o.owner])).values(),
  ).filter((c) => c.iata_code);

  return (
    <FlightResultsClient
      offers={normalized}
      route={{ origin: origin!, destination: destination! }}
      carriers={carriers as any}
    />
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
