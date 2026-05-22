// ============================================================
// Image upload to local filesystem (public/uploads/{type}/{filename})
// In production, swap to S3/Cloudflare R2 by changing this file only.
// ============================================================
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const ROOT = path.join(process.cwd(), 'public', 'uploads');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export async function saveUpload(file: File, subfolder = 'misc'): Promise<{ url: string; size: number }> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}`);
  }
  if (file.size > MAX_BYTES) {
    throw new Error(`File too large (max ${Math.round(MAX_BYTES / 1024 / 1024)} MB)`);
  }

  // Sanitize subfolder (no slashes, no traversal)
  const safeFolder = subfolder.replace(/[^a-z0-9_-]/gi, '').toLowerCase() || 'misc';
  const dir = path.join(ROOT, safeFolder);
  await mkdir(dir, { recursive: true });

  // Filename: timestamp-random.ext
  const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const filepath = path.join(dir, filename);

  const arrayBuffer = await file.arrayBuffer();
  await writeFile(filepath, Buffer.from(arrayBuffer));

  return {
    url: `/uploads/${safeFolder}/${filename}`,
    size: file.size,
  };
}
