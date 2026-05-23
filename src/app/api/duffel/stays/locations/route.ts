import { NextRequest, NextResponse } from 'next/server';
import { duffel } from '@/lib/duffel';
import { getOrSet, cacheKey, cacheTTL } from '@/lib/cache';

/**
 * Autocomplete city/region for stays search.
 * GET /api/duffel/stays/locations?q=Bali
 *
 * Cache: 24h, single-flight protected. City list rarely changes.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) return NextResponse.json({ data: [] });

  try {
    const data = await getOrSet(
      cacheKey.duffelStayLocations(q),
      cacheTTL.duffelStayLocations,
      async () => {
        const res = await (duffel as any).suggestions.list({ query: q });
        return (res.data ?? [])
          .filter((p: any) => p.type === 'city' || p.type === 'airport')
          .map((p: any) => ({
            id: p.id,
            iata_code: p.iata_code,
            name: p.name,
            city_name: p.city_name ?? p.city?.name ?? p.name,
            country: p.iata_country_code,
            type: p.type,
          }));
      },
    );
    return NextResponse.json(
      { data },
      {
        headers: {
          'Cache-Control': 'public, max-age=300, s-maxage=86400, stale-while-revalidate=86400',
        },
      },
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Duffel error', data: [] }, { status: 200 });
  }
}
