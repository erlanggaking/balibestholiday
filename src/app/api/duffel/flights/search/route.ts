import { NextRequest, NextResponse } from 'next/server';
import { duffel } from '@/lib/duffel';
import { priceWithMarkup } from '@/lib/markup';

/**
 * Create an offer request and return up to N offers.
 * POST /api/duffel/flights/search
 * body: { origin, destination, departureDate, returnDate?, adults, children?, infants?, cabinClass? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      origin,
      destination,
      departureDate,
      returnDate,
      adults = 1,
      children = 0,
      infants = 0,
      cabinClass = 'economy',
    } = body;

    if (!origin || !destination || !departureDate) {
      return NextResponse.json(
        { error: 'origin, destination & departureDate are required' },
        { status: 400 },
      );
    }

    const slices: any[] = [
      { origin, destination, departure_date: departureDate },
    ];
    if (returnDate) {
      slices.push({ origin: destination, destination: origin, departure_date: returnDate });
    }

    const passengers: any[] = [];
    for (let i = 0; i < adults; i++) passengers.push({ type: 'adult' });
    for (let i = 0; i < children; i++) passengers.push({ type: 'child' });
    for (let i = 0; i < infants; i++) passengers.push({ type: 'infant_without_seat' });

    const offerReq = await duffel.offerRequests.create({
      slices,
      passengers,
      cabin_class: cabinClass as 'economy' | 'premium_economy' | 'business' | 'first',
      return_offers: true,
    });

    // Drop dummy "Duffel Airways" (ZZ) test placeholder if real carriers exist
    const allOffers = offerReq.data?.offers ?? [];
    const real = allOffers.filter((o: any) => o.owner?.iata_code !== 'ZZ');
    const offers = (real.length > 0 ? real : allOffers).slice(0, 200);

    const data = await Promise.all(
      offers.map(async (o: any) => {
        const baseAmount = parseFloat(o.total_amount);
        const finalAmount = await priceWithMarkup(baseAmount, 'flight');
        return {
          id: o.id,
          owner: { name: o.owner?.name, iata_code: o.owner?.iata_code, logo: o.owner?.logo_symbol_url },
          total_amount: finalAmount.toFixed(2),
          base_amount: baseAmount.toFixed(2),
          total_currency: o.total_currency,
          total_emissions_kg: o.total_emissions_kg,
          slices: (o.slices ?? []).map((s: any) => ({
            origin: { iata_code: s.origin?.iata_code, name: s.origin?.name, city: s.origin?.city_name },
            destination: { iata_code: s.destination?.iata_code, name: s.destination?.name, city: s.destination?.city_name },
            duration: s.duration,
            segments: (s.segments ?? []).map((seg: any) => ({
              id: seg.id,
              departing_at: seg.departing_at,
              arriving_at: seg.arriving_at,
              origin_iata: seg.origin?.iata_code,
              destination_iata: seg.destination?.iata_code,
              marketing_carrier: seg.marketing_carrier?.name,
              marketing_carrier_iata: seg.marketing_carrier?.iata_code,
              flight_number: seg.marketing_carrier_flight_number,
              aircraft: seg.aircraft?.name,
              duration: seg.duration,
            })),
          })),
        };
      }),
    );

    return NextResponse.json({
      offer_request_id: offerReq.data?.id,
      offers: data,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.errors?.[0]?.message ?? e?.message ?? 'Duffel error' },
      { status: 400 },
    );
  }
}
