import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApi } from '@/lib/admin-auth';

// PUT /api/admin/activity-images/{activityId}  body: { urls: string[] }
// Replaces all images for the activity in order.
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminApi();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const urls: string[] = Array.isArray(body.urls) ? body.urls : [];

  try {
    await prisma.$transaction([
      prisma.activityImage.deleteMany({ where: { activityId: id } }),
      prisma.activityImage.createMany({
        data: urls.map((url, i) => ({ activityId: id, url, sortOrder: i })),
      }),
    ]);
    return NextResponse.json({ ok: true, count: urls.length });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Failed' }, { status: 500 });
  }
}
