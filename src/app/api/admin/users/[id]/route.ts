import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApi } from '@/lib/admin-auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminApi();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  // Only full ADMIN can change user roles
  if (auth.session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only ADMIN can change roles' }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const allowedRoles = ['ADMIN', 'STAFF', 'VENDOR', 'CUSTOMER'];

  if (!body.role || !allowedRoles.includes(body.role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  // Prevent self-demote (admin can't drop themselves to non-admin to avoid lockout)
  if (id === auth.session.user.id && body.role !== 'ADMIN') {
    return NextResponse.json(
      { error: "You can't change your own role away from ADMIN" },
      { status: 400 },
    );
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: { role: body.role },
      select: { id: true, role: true, email: true },
    });
    return NextResponse.json({ ok: true, user: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Update failed' }, { status: 500 });
  }
}
