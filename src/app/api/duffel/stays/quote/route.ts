import { NextRequest, NextResponse } from 'next/server';
import { duffel } from '@/lib/duffel';

/**
 * Re-quote a stay rate immediately before booking.
 * POST /api/duffel/stays/quote { rate_id }
 */
export async function POST(req: NextRequest) {
  try {
    const { rate_id } = await req.json();
    if (!rate_id) return NextResponse.json({ error: 'rate_id required' }, { status: 400 });
    const res = await (duffel as any).stays.quotes.create({ rate_id });
    return NextResponse.json(res.data);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.errors?.[0]?.message ?? e?.message ?? 'Duffel error' },
      { status: 400 },
    );
  }
}
