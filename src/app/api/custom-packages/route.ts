import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/custom-packages — public endpoint, customer submits builder result
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  if (!body.guestEmail || !body.guestName) {
    return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id ?? null;

  try {
    const created = await prisma.customPackageRequest.create({
      data: {
        userId,
        guestEmail: body.guestEmail,
        guestName: body.guestName,
        guestPhone: body.guestPhone ?? null,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        travelersAdults: Math.max(1, Number(body.travelersAdults) || 2),
        travelersChild: Math.max(0, Number(body.travelersChild) || 0),
        budget: body.budget ? Number(body.budget) : null,
        budgetCurrency: body.budgetCurrency ?? 'IDR',
        destinationIds: JSON.stringify(Array.isArray(body.destinationIds) ? body.destinationIds : []),
        activityIds: JSON.stringify(Array.isArray(body.activityIds) ? body.activityIds : []),
        notes: body.notes ?? null,
        status: 'PENDING',
      },
    });
    return NextResponse.json({ ok: true, id: created.id });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Failed' }, { status: 500 });
  }
}
