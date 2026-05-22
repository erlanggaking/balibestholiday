import { NextRequest, NextResponse } from 'next/server';
import { duffel } from '@/lib/duffel';

/**
 * Autocomplete airports & cities for flight search.
 * GET /api/duffel/places?q=Den
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) return NextResponse.json({ data: [] });

  try {
    const res = await duffel.suggestions.list({ query: q });
    const data = (res.data ?? []).map((p: any) => ({
      id: p.id,
      iata_code: p.iata_code,
      name: p.name,
      city_name: p.city_name ?? p.city?.name ?? null,
      iata_country_code: p.iata_country_code,
      type: p.type, // 'airport' | 'city'
    }));
    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Duffel error', data: [] }, { status: 200 });
  }
}
