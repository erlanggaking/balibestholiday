import { NextRequest, NextResponse } from 'next/server';
import { duffel } from '@/lib/duffel';
import { getOrSet, cacheKey, cacheTTL } from '@/lib/cache';

/**
 * Autocomplete airports & cities for flight search.
 * GET /api/duffel/places?q=Den
 *
 * Cache: keyed by lowercased query, 24h TTL. IATA list barely changes.
 * 1,000 users typing "jakarta" → 1 Duffel call instead of 1,000.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) return NextResponse.json({ data: [] });

  try {
    const data = await getOrSet(
      cacheKey.duffelPlaces(q),
      cacheTTL.duffelPlaces,
      async () => {
        const res = await duffel.suggestions.list({ query: q });
        return (res.data ?? []).map((p: any) => ({
          id: p.id,
          iata_code: p.iata_code,
          name: p.name,
          city_name: p.city_name ?? p.city?.name ?? null,
          iata_country_code: p.iata_country_code,
          type: p.type, // 'airport' | 'city'
        }));
      },
    );
    // Add CDN/browser cache headers — places list is shareable across users.
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
