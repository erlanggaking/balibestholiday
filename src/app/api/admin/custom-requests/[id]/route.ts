import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApi } from '@/lib/admin-auth';

const ALLOWED_STATUS = ['PENDING', 'QUOTED', 'APPROVED', 'CONVERTED', 'REJECTED'];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminApi();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const data: any = {};
  if (body.status && ALLOWED_STATUS.includes(body.status)) data.status = body.status;
  if (body.quoteAmount !== undefined) data.quoteAmount = body.quoteAmount === null ? null : Number(body.quoteAmount);
  if (body.quoteCurrency) data.quoteCurrency = body.quoteCurrency;
  if (body.adminNotes !== undefined) data.adminNotes = body.adminNotes;
  if (data.status === 'QUOTED' && !data.quoteSentAt) data.quoteSentAt = new Date();

  if (Object.keys(data).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

  try {
    const updated = await prisma.customPackageRequest.update({ where: { id }, data });
    return NextResponse.json({ ok: true, request: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Update failed' }, { status: 500 });
  }
}
