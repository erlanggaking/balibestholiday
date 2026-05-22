// Generic image gallery PUT for tour/hotel/car/activity.
// Body: { urls: string[] } — replaces all images in order.
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApi } from '@/lib/admin-auth';

const TYPES: Record<string, { delegate: any; fk: string }> = {
  tour:     { delegate: 'tourImage',     fk: 'tourId'     },
  hotel:    { delegate: 'hotelImage',    fk: 'hotelId'    },
  car:      { delegate: 'carImage',      fk: 'carId'      },
  activity: { delegate: 'activityImage', fk: 'activityId' },
};

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> },
) {
  const auth = await requireAdminApi();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const { type, id } = await params;
  const cfg = TYPES[type];
  if (!cfg) return NextResponse.json({ error: 'Unknown type' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const urls: string[] = Array.isArray(body.urls) ? body.urls : [];

  try {
    await prisma.$transaction([
      (prisma as any)[cfg.delegate].deleteMany({ where: { [cfg.fk]: id } }),
      (prisma as any)[cfg.delegate].createMany({
        data: urls.map((url, i) => ({ [cfg.fk]: id, url, sortOrder: i })),
      }),
    ]);
    return NextResponse.json({ ok: true, count: urls.length });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Failed' }, { status: 500 });
  }
}
