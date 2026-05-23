import { NextRequest, NextResponse } from 'next/server';
import { duffel } from '@/lib/duffel';
import { prisma } from '@/lib/prisma';
import { priceWithMarkup } from '@/lib/markup';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Build a fresh offer-request from an existing (likely expired) offer and pick
 * the closest matching offer. Used as auto-retry when Duffel returns
 * `offer_no_longer_available` — common in sandbox where offers can expire
 * within a couple of minutes (Travelport rotates test inventory aggressively).
 *
 * Match heuristic:
 * 1. Same airline (carrier IATA) + same first-segment departure time → pick cheapest.
 * 2. Same airline → pick cheapest.
 * 3. Same route, any airline → pick cheapest.
 * Returns null if no usable offer found.
 */
async function recreateMatchingOffer(originalOffer: any): Promise<any | null> {
  try {
    const slices = (originalOffer.slices ?? []).map((s: any) => ({
      origin: s.segments?.[0]?.origin?.iata_code ?? s.origin?.iata_code,
      destination:
        s.segments?.[s.segments.length - 1]?.destination?.iata_code ?? s.destination?.iata_code,
      departure_date: (s.segments?.[0]?.departing_at ?? '').slice(0, 10),
    }));
    if (slices.some((s: any) => !s.origin || !s.destination || !s.departure_date)) return null;

    const passengers = (originalOffer.passengers ?? []).map((p: any) => ({ type: p.type }));
    const cabinClass =
      originalOffer.slices?.[0]?.segments?.[0]?.passengers?.[0]?.cabin_class ?? 'economy';

    const req: any = await duffel.offerRequests.create({
      slices,
      passengers,
      cabin_class: cabinClass,
      return_offers: true,
    });

    const allOffers = (req.data?.offers ?? []) as any[];
    if (allOffers.length === 0) return null;

    const targetCarrier = originalOffer.owner?.iata_code;
    const targetDeparture = originalOffer.slices?.[0]?.segments?.[0]?.departing_at;

    const sortByPrice = (a: any, b: any) =>
      parseFloat(a.total_amount) - parseFloat(b.total_amount);

    // Tier 1: same airline + same first departure time
    if (targetCarrier && targetDeparture) {
      const exact = allOffers
        .filter(
          (o: any) =>
            o.owner?.iata_code === targetCarrier &&
            o.slices?.[0]?.segments?.[0]?.departing_at === targetDeparture,
        )
        .sort(sortByPrice);
      if (exact[0]) return exact[0];
    }

    // Tier 2: same airline only
    if (targetCarrier) {
      const sameAirline = allOffers
        .filter((o: any) => o.owner?.iata_code === targetCarrier)
        .sort(sortByPrice);
      if (sameAirline[0]) return sameAirline[0];
    }

    // Tier 3: cheapest matching route
    return allOffers.sort(sortByPrice)[0] ?? null;
  } catch (e: any) {
    console.error('[bookings/flight] recreateMatchingOffer failed:', e?.errors ?? e?.message);
    return null;
  }
}

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
    let offer: any = (await duffel.offers.get(offerId)).data;
    if (!offer) return NextResponse.json({ error: 'Offer not found' }, { status: 404 });

    /** Build the order create payload for whatever the current `offer` is. */
    const buildOrderPayload = (currentOffer: any) => {
      const offerPax: any[] = currentOffer.passengers ?? [];
      const duffelPassengers = passengers.map((p: any, i: number) => ({
        id: offerPax[i]?.id,
        type: p.type ?? offerPax[i]?.type ?? 'adult',
        title: p.title ?? 'mr',
        given_name: p.given_name,
        family_name: p.family_name,
        born_on: p.born_on,
        gender: p.gender ?? 'm',
        email: p.email ?? contact.email,
        phone_number: p.phone_number ?? contact.phone_number,
      }));
      return {
        type: 'instant' as const,
        selected_offers: [currentOffer.id],
        passengers: duffelPassengers,
        payments: [
          {
            type: 'balance' as const,
            currency: currentOffer.total_currency,
            amount: currentOffer.total_amount,
          },
        ],
      };
    };

    let order: any;
    let usedOfferId = offerId;
    try {
      order = await duffel.orders.create(buildOrderPayload(offer));
    } catch (firstErr: any) {
      const expired = firstErr?.errors?.some(
        (x: any) =>
          x?.code === 'offer_no_longer_available' || /no longer available/i.test(x?.message ?? ''),
      );
      if (!expired) throw firstErr;

      // Auto-retry: build a fresh offer request from the original slices/pax,
      // pick the closest match (same airline + departure time), and retry once.
      console.log('[bookings/flight] offer expired, attempting auto-recreate…');
      const fresh = await recreateMatchingOffer(offer);
      if (!fresh) throw firstErr;

      console.log('[bookings/flight] retrying with fresh offer', fresh.id);
      offer = fresh; // swap so summary/booking record uses the fresh offer
      usedOfferId = fresh.id;
      order = await duffel.orders.create(buildOrderPayload(fresh));
    }

    const baseAmount = parseFloat(offer.total_amount);
    const finalAmount = await priceWithMarkup(baseAmount, 'flight');
    const duffelPassengers = (buildOrderPayload(offer)).passengers;

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
                offer_id: usedOfferId,
                original_offer_id: offerId,
                auto_retried: usedOfferId !== offerId,
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
