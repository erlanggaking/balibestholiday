import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMarkupPct, setMarkupPct, type MarkupCategory } from '@/lib/markup';

const CATS: MarkupCategory[] = ['flight', 'hotel', 'tour', 'car', 'insurance'];

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.role === 'ADMIN';
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const result: Record<string, number> = {};
  for (const c of CATS) result[c] = await getMarkupPct(c);
  return NextResponse.json(result);
}

export async function PUT(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  for (const c of CATS) {
    if (typeof body[c] === 'number' && body[c] >= 0 && body[c] <= 100) {
      await setMarkupPct(c, body[c]);
    }
  }
  return NextResponse.json({ ok: true });
}
