import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') ?? '';
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook signature failed: ${err.message}` }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as any;
      const bookingId = session.metadata?.bookingId;
      if (bookingId) {
        await prisma.booking.update({
          where: { id: bookingId },
          data: {
            status: 'PAID',
            paymentStatus: 'SUCCEEDED',
            stripePaymentId: session.payment_intent,
          },
        });
        await prisma.payment.create({
          data: {
            bookingId,
            provider: 'stripe',
            providerRef: session.payment_intent,
            amount: (session.amount_total ?? 0) / 100,
            currency: session.currency?.toUpperCase() ?? 'USD',
            status: 'SUCCEEDED',
            rawResponse: session,
          },
        });
      }
      break;
    }
    case 'checkout.session.expired':
    case 'payment_intent.payment_failed': {
      const session = event.data.object as any;
      const bookingId = session.metadata?.bookingId;
      if (bookingId) {
        await prisma.booking.update({
          where: { id: bookingId },
          data: { paymentStatus: 'FAILED' },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
