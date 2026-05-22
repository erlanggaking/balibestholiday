import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApi } from '@/lib/admin-auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminApi();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const allowedBookingStatus = ['PENDING', 'PAID', 'CONFIRMED', 'CANCELLED', 'REFUNDED'];
  const allowedPaymentStatus = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];

  const updates: any = {};
  if (body.status) {
    if (!allowedBookingStatus.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    updates.status = body.status;
  }
  if (body.paymentStatus) {
    if (!allowedPaymentStatus.includes(body.paymentStatus)) {
      return NextResponse.json({ error: 'Invalid paymentStatus' }, { status: 400 });
    }
    updates.paymentStatus = body.paymentStatus;
  }
  if (body.appendNote && typeof body.appendNote === 'string') {
    const existing = await prisma.booking.findUnique({
      where: { id },
      select: { notes: true },
    });
    const stamp = `[${new Date().toISOString().slice(0, 16)}Z by ${auth.session.user.email}]`;
    const newLine = `${stamp} ${body.appendNote.trim()}`;
    updates.notes = existing?.notes ? `${existing.notes}\n${newLine}` : newLine;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  try {
    const updated = await prisma.booking.update({ where: { id }, data: updates });
    return NextResponse.json({ ok: true, booking: { id: updated.id, status: updated.status } });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Update failed' }, { status: 500 });
  }
}
