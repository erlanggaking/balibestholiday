import { NextRequest, NextResponse } from 'next/server';
import { duffel } from '@/lib/duffel';

/**
 * Autocomplete city/region for stays search.
 * GET /api/duffel/stays/locations?q=Bali
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) return NextResponse.json({ data: [] });

  try {
    // Duffel stays uses places search with locations
    const res = await (duffel as any).suggestions.list({ query: q });
    const data = (res.data ?? [])
      .filter((p: any) => p.type === 'city' || p.type === 'airport')
      .map((p: any) => ({
        id: p.id,
        iata_code: p.iata_code,
        name: p.name,
        city_name: p.city_name ?? p.city?.name ?? p.name,
        country: p.iata_country_code,
        type: p.type,
      }));
    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Duffel error', data: [] }, { status: 200 });
  }
}
