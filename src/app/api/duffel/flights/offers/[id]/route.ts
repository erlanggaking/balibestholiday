import { NextRequest, NextResponse } from 'next/server';
import { duffel } from '@/lib/duffel';
import { priceWithMarkup } from '@/lib/markup';

/**
 * Get a single offer with full details for booking.
 * GET /api/duffel/flights/offers/[id]
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const res = await duffel.offers.get(id);
    const o: any = res.data;
    if (!o) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const baseAmount = parseFloat(o.total_amount);
    const finalAmount = await priceWithMarkup(baseAmount, 'flight');

    return NextResponse.json({
      id: o.id,
      owner: o.owner,
      total_amount: finalAmount.toFixed(2),
      base_amount: baseAmount.toFixed(2),
      total_currency: o.total_currency,
      passenger_identity_documents_required: o.passenger_identity_documents_required,
      conditions: o.conditions,
      passengers: o.passengers,
      slices: o.slices,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.errors?.[0]?.message ?? e?.message ?? 'Duffel error' },
      { status: 400 },
    );
  }
}
