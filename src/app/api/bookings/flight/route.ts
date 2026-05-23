import { NextRequest, NextResponse } from 'next/server';
import { duffel } from '@/lib/duffel';
import { prisma } from '@/lib/prisma';
import { priceWithMarkup } from '@/lib/markup';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Create a Duffel order for a flight + persist booking record.
 * POST /api/bookings/flight
 * body: { offerId, passengers: [{type, given_name, family_name, born_on, email, phone_number, gender, title}], paymentRef? }
 *
 * Note: Uses Duffel "balance" payment in test mode. For production, integrate Stripe here:
 * - Create Stripe PaymentIntent (capture=manual)
 * - On payment success, create Duffel order with `payments: [{ type: 'balance', currency, amount }]`
 * - Capture Stripe payment after Duffel confirms
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { offerId, passengers, contact } = body;

    if (!offerId || !Array.isArray(passengers) || passengers.length === 0 || !contact?.email) {
      return NextResponse.json(
        { error: 'offerId, passengers and contact.email are required' },
        { status: 400 },
      );
    }

    // Re-fetch offer to get fresh price + identity doc requirement
    const offer: any = (await duffel.offers.get(offerId)).data;
    if (!offer) return NextResponse.json({ error: 'Offer not found' }, { status: 404 });

    const baseAmount = parseFloat(offer.total_amount);
    const finalAmount = await priceWithMarkup(baseAmount, 'flight');

    // Map passengers to Duffel format. Duffel requires passenger.id to match offer.passengers[].id
    const offerPassengers: any[] = offer.passengers ?? [];
    const duffelPassengers = passengers.map((p: any, i: number) => ({
      id: offerPassengers[i]?.id,
      type: p.type ?? offerPassengers[i]?.type ?? 'adult',
      title: p.title ?? 'mr',
      given_name: p.given_name,
      family_name: p.family_name,
      born_on: p.born_on,
      gender: p.gender ?? 'm',
      email: p.email ?? contact.email,
      phone_number: p.phone_number ?? contact.phone_number,
    }));

    const order = await duffel.orders.create({
      type: 'instant',
      selected_offers: [offerId],
      passengers: duffelPassengers,
      payments: [
        {
          type: 'balance',
          currency: offer.total_currency,
          amount: offer.total_amount,
        },
      ],
    });

    // Persist
    const session = await getServerSession(authOptions);
    const bookingCode = `BBH-FL-${Date.now().toString(36).toUpperCase()}`;
    const booking = await prisma.booking.create({
      data: {
        bookingCode,
        userId: (session?.user as any)?.id ?? null,
        guestEmail: contact.email,
        guestName: `${duffelPassengers[0].given_name} ${duffelPassengers[0].family_name}`,
        guestPhone: contact.phone_number ?? null,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        totalAmount: finalAmount,
        currency: offer.total_currency,
        exchangeRate: 1,
        displayAmount: finalAmount,
        notes: `Duffel order: ${order.data?.id}, booking ref: ${order.data?.booking_reference}`,
        items: {
          create: [
            {
              productType: 'FLIGHT',
              title: `${offer.slices?.[0]?.origin?.iata_code} → ${offer.slices?.[0]?.destination?.iata_code} · ${offer.owner?.name}`,
              startDate: new Date(offer.slices?.[0]?.segments?.[0]?.departing_at ?? Date.now()),
              quantity: duffelPassengers.length,
              adults: duffelPassengers.filter((p) => p.type === 'adult').length,
              children: duffelPassengers.filter((p) => p.type === 'child').length,
              unitPrice: finalAmount / duffelPassengers.length,
              subtotal: finalAmount,
              metadata: JSON.stringify({
                duffel_order_id: order.data?.id,
                duffel_booking_reference: order.data?.booking_reference,
                offer_id: offerId,
              }),
            },
          ],
        },
      },
    });

    return NextResponse.json({
      booking_code: bookingCode,
      booking_id: booking.id,
      duffel_order_id: order.data?.id,
      duffel_booking_reference: order.data?.booking_reference,
      total_amount: finalAmount.toFixed(2),
      currency: offer.total_currency,
    });
  } catch (e: any) {
    console.error('[bookings/flight]', e?.errors ?? e);

    // Duffel returns "offer_no_longer_available" / "Please select another offer"
    // when the offer has expired (Duffel offers live ~20-30 min). Surface this
    // distinctly so the UI can route the user back to search instead of just
    // showing a generic red banner.
    const firstErr = e?.errors?.[0];
    const code = firstErr?.code;
    const msg = (firstErr?.message ?? e?.message ?? '').toString();
    const isExpired =
      code === 'offer_no_longer_available' ||
      code === 'order_creation_failed' ||
      /no longer available|select another offer|expired/i.test(msg);

    return NextResponse.json(
      {
        error: msg || 'Booking failed',
        code: code ?? null,
        expired: isExpired,
      },
      { status: 400 },
    );
  }
}
