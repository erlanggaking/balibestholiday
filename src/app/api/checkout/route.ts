import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStripe, isStripeConfigured } from '@/lib/stripe';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateBookingCode } from '@/lib/utils';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const itemSchema = z.object({
  productType: z.enum(['TOUR', 'HOTEL', 'CAR', 'FLIGHT', 'INSURANCE']),
  tourId: z.string().optional(),
  hotelId: z.string().optional(),
  roomId: z.string().optional(),
  carId: z.string().optional(),
  flightId: z.string().optional(),
  insurancePlanId: z.string().optional(),
  title: z.string(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  adults: z.number().int().min(1).default(1),
  children: z.number().int().min(0).default(0),
  unitPrice: z.number().positive(),
  quantity: z.number().int().min(1).default(1),
});

const bodySchema = z.object({
  items: z.array(itemSchema).min(1),
  guestEmail: z.string().email().optional(),
  guestName: z.string().optional(),
  guestPhone: z.string().optional(),
  currency: z.string().default('USD'),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const json = await req.json();
    const body = bodySchema.parse(json);

    const subtotalUSD = body.items.reduce((sum, it) => {
      const pax = it.adults + it.children;
      return sum + it.unitPrice * (pax || 1) * it.quantity;
    }, 0);

    const booking = await prisma.booking.create({
      data: {
        bookingCode: generateBookingCode(),
        userId: session?.user?.id ?? null,
        guestEmail: body.guestEmail ?? session?.user?.email ?? null,
        guestName: body.guestName ?? session?.user?.name ?? null,
        guestPhone: body.guestPhone ?? null,
        totalAmount: subtotalUSD,
        currency: body.currency,
        exchangeRate: 1,
        displayAmount: subtotalUSD,
        notes: body.notes,
        items: {
          create: body.items.map((it) => ({
            productType: it.productType as any,
            tourId: it.tourId,
            hotelId: it.hotelId,
            roomId: it.roomId,
            carId: it.carId,
            flightId: it.flightId,
            insurancePlanId: it.insurancePlanId,
            title: it.title,
            startDate: it.startDate ? new Date(it.startDate) : null,
            endDate: it.endDate ? new Date(it.endDate) : null,
            adults: it.adults,
            children: it.children,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            subtotal: it.unitPrice * (it.adults + it.children || 1) * it.quantity,
          })),
        },
      },
      include: { items: true },
    });

    // Create Stripe Checkout Session
    if (isStripeConfigured()) {
      const stripeSession = await getStripe().checkout.sessions.create({
        mode: 'payment',
        line_items: booking.items.map((it) => ({
          price_data: {
            currency: 'usd',
            product_data: { name: it.title },
            unit_amount: Math.round(Number(it.subtotal) * 100),
          },
          quantity: 1,
        })),
        customer_email: booking.guestEmail ?? undefined,
        success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?bookingId=${booking.id}`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/${booking.id}`,
        metadata: { bookingId: booking.id },
      });

      await prisma.booking.update({
        where: { id: booking.id },
        data: { stripeSessionId: stripeSession.id },
      });

      return NextResponse.json({ bookingId: booking.id, url: stripeSession.url });
    }

    // Fallback: return booking page (when Stripe not configured)
    return NextResponse.json({ bookingId: booking.id, code: booking.bookingCode });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Server error' }, { status: 400 });
  }
}
