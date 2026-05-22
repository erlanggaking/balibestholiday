import { NextResponse, type NextRequest } from 'next/server';
import { requireAdminApi } from '@/lib/admin-auth';
import { saveUpload } from '@/lib/upload';

// POST /api/admin/upload  (multipart/form-data: file + folder)
export async function POST(req: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  try {
    const form = await req.formData();
    const file = form.get('file');
    const folder = (form.get('folder') as string) || 'misc';
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    const { url, size } = await saveUpload(file, folder);
    return NextResponse.json({ ok: true, url, size });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Upload failed' }, { status: 400 });
  }
}

export const config = {
  api: { bodyParser: false },
};
