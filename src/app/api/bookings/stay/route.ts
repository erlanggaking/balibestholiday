import { NextRequest, NextResponse } from 'next/server';
import { duffel } from '@/lib/duffel';
import { prisma } from '@/lib/prisma';
import { priceWithMarkup } from '@/lib/markup';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Create a Duffel stays booking.
 * POST /api/bookings/stay
 * body: { quote_id, guests, contact: { email, phone_number, given_name, family_name } }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { quote_id, guests, contact, accommodation_special_requests } = body;

    if (!quote_id || !contact?.email || !contact?.given_name || !contact?.family_name) {
      return NextResponse.json(
        { error: 'quote_id, contact.email, contact.given_name, contact.family_name required' },
        { status: 400 },
      );
    }

    const booking = await (duffel as any).stays.bookings.create({
      quote_id,
      guests: guests?.length
        ? guests
        : [
            {
              given_name: contact.given_name,
              family_name: contact.family_name,
            },
          ],
      email: contact.email,
      phone_number: contact.phone_number,
      accommodation_special_requests,
    });

    const data: any = booking.data;
    const baseAmount = parseFloat(data?.total_amount ?? '0');
    const finalAmount = await priceWithMarkup(baseAmount, 'hotel');

    const session = await getServerSession(authOptions);
    const bookingCode = `BBH-ST-${Date.now().toString(36).toUpperCase()}`;
    const dbBooking = await prisma.booking.create({
      data: {
        bookingCode,
        userId: (session?.user as any)?.id ?? null,
        guestEmail: contact.email,
        guestName: `${contact.given_name} ${contact.family_name}`,
        guestPhone: contact.phone_number ?? null,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        totalAmount: finalAmount,
        currency: data?.total_currency ?? 'USD',
        exchangeRate: 1,
        displayAmount: finalAmount,
        notes: `Duffel stays booking: ${data?.id}, ref: ${data?.reference}`,
        items: {
          create: [
            {
              productType: 'HOTEL',
              title: data?.accommodation?.name ?? 'Stay',
              startDate: data?.check_in_date ? new Date(data.check_in_date) : new Date(),
              endDate: data?.check_out_date ? new Date(data.check_out_date) : null,
              quantity: 1,
              unitPrice: finalAmount,
              subtotal: finalAmount,
              metadata: JSON.stringify({
                duffel_booking_id: data?.id,
                duffel_reference: data?.reference,
                quote_id,
              }),
            },
          ],
        },
      },
    });

    return NextResponse.json({
      booking_code: bookingCode,
      booking_id: dbBooking.id,
      duffel_booking_id: data?.id,
      duffel_reference: data?.reference,
      total_amount: finalAmount.toFixed(2),
      currency: data?.total_currency ?? 'USD',
    });
  } catch (e: any) {
    console.error('[bookings/stay]', e?.errors ?? e);
    // Same expired-quote handling as the flight booking endpoint.
    const firstErr = e?.errors?.[0];
    const code = firstErr?.code;
    const msg = (firstErr?.message ?? e?.message ?? '').toString();
    const isExpired =
      code === 'quote_no_longer_available' ||
      code === 'rate_no_longer_available' ||
      code === 'order_creation_failed' ||
      /no longer available|expired|select another/i.test(msg);
    return NextResponse.json(
      { error: msg || 'Booking failed', code: code ?? null, expired: isExpired },
      { status: 400 },
    );
  }
}
