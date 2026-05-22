import { NextRequest, NextResponse } from 'next/server';
import { duffel } from '@/lib/duffel';
import { priceWithMarkup } from '@/lib/markup';

/**
 * Search hotels (stays) via Duffel.
 * POST /api/duffel/stays/search
 * body: { location?: { latitude, longitude, radius_km } | { city }, checkIn, checkOut, rooms?, adults?, children? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      location, // { latitude, longitude, radius_km } or { iata_code }
      checkIn,
      checkOut,
      rooms = 1,
      adults = 2,
      children = 0,
    } = body;

    if (!checkIn || !checkOut) {
      return NextResponse.json({ error: 'checkIn & checkOut are required' }, { status: 400 });
    }

    const params: any = {
      check_in_date: checkIn,
      check_out_date: checkOut,
      rooms,
      guests: [
        ...Array.from({ length: adults }, () => ({ type: 'adult' })),
        ...Array.from({ length: children }, () => ({ type: 'child', age: 8 })),
      ],
    };

    if (location?.latitude && location?.longitude) {
      params.location = {
        radius: location.radius_km ?? 5,
        geographic_coordinates: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
      };
    }

    const search = await (duffel as any).stays.search(params);
    const results = (search?.data?.results ?? []).slice(0, 50);

    const data = await Promise.all(
      results.map(async (r: any) => {
        const baseAmount = parseFloat(r.cheapest_rate_total_amount ?? '0');
        const finalAmount = await priceWithMarkup(baseAmount, 'hotel');
        const acc = r.accommodation ?? {};
        return {
          id: r.id,
          search_id: search.data?.id,
          name: acc.name,
          rating: acc.rating, // 1-5
          review_score: acc.review_score,
          photo: acc.photos?.[0]?.url ?? null,
          city: acc.location?.address?.city_name ?? null,
          country: acc.location?.address?.country_code ?? null,
          address: acc.location?.address?.line_one ?? null,
          latitude: acc.location?.geographic_coordinates?.latitude,
          longitude: acc.location?.geographic_coordinates?.longitude,
          amenities: (acc.amenities ?? []).map((a: any) => a.type),
          total_amount: finalAmount.toFixed(2),
          base_amount: baseAmount.toFixed(2),
          currency: r.cheapest_rate_currency,
          public_amount: finalAmount.toFixed(2),
        };
      }),
    );

    return NextResponse.json({
      search_id: search.data?.id,
      results: data,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.errors?.[0]?.message ?? e?.message ?? 'Duffel stays error' },
      { status: 400 },
    );
  }
}
