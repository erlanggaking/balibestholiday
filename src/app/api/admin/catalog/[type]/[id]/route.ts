import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApi } from '@/lib/admin-auth';

// Generic toggle/update endpoint for catalog items.
// PATCH /api/admin/catalog/{tour|hotel|car|destination|insurance}/{id}
//   body: { isActive?: boolean, isFeatured?: boolean, isVerified?: boolean }
// DELETE /api/admin/catalog/{type}/{id}  -> soft-delete (sets isActive=false)
//
// We intentionally only allow flipping a small whitelist of fields here.
// Full CRUD for individual entities can come in dedicated forms later.

const MODEL_MAP: Record<string, { delegate: any; toggleable: string[] }> = {
  tour: { delegate: 'tour', toggleable: ['isActive', 'isFeatured'] },
  hotel: { delegate: 'hotel', toggleable: ['isActive', 'isFeatured'] },
  car: { delegate: 'car', toggleable: ['isActive', 'isFeatured'] },
  destination: { delegate: 'destination', toggleable: ['isFeatured'] },
  insurance: { delegate: 'insurancePlan', toggleable: ['isActive'] },
  flight: { delegate: 'flight', toggleable: ['isActive'] },
  review: { delegate: 'review', toggleable: ['isVerified'] },
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> },
) {
  const auth = await requireAdminApi();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const { type, id } = await params;
  const cfg = MODEL_MAP[type];
  if (!cfg) return NextResponse.json({ error: 'Unknown catalog type' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const updates: Record<string, boolean> = {};
  for (const key of cfg.toggleable) {
    if (typeof body[key] === 'boolean') updates[key] = body[key];
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No allowed fields to update' }, { status: 400 });
  }

  try {
    const updated = await (prisma as any)[cfg.delegate].update({
      where: { id },
      data: updates,
    });
    return NextResponse.json({ ok: true, id: updated.id });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> },
) {
  const auth = await requireAdminApi();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  // Only ADMIN can hard-delete (we use soft-delete = setting isActive=false)
  if (auth.session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only ADMIN can delete' }, { status: 403 });
  }

  const { type, id } = await params;
  const cfg = MODEL_MAP[type];
  if (!cfg) return NextResponse.json({ error: 'Unknown catalog type' }, { status: 400 });

  try {
    if (type === 'review') {
      // Reviews can be hard-deleted (no booking-link)
      await (prisma as any)[cfg.delegate].delete({ where: { id } });
    } else if (cfg.toggleable.includes('isActive')) {
      // Soft-delete by deactivation
      await (prisma as any)[cfg.delegate].update({
        where: { id },
        data: { isActive: false },
      });
    } else {
      // Fallback to hard delete (e.g., destination)
      await (prisma as any)[cfg.delegate].delete({ where: { id } });
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Delete failed' }, { status: 500 });
  }
}
