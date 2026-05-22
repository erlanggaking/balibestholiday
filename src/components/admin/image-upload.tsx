'use client';

import { useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

/** Single image picker with preview */
export function ImagePicker({
  value,
  onChange,
  folder = 'misc',
  label = 'Image',
}: {
  value?: string | null;
  onChange: (url: string | null) => void;
  folder?: string;
  label?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle(file: File) {
    setError(null);
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', folder);
    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const j = await res.json();
      if (j.url) onChange(j.url);
      else setError(j.error ?? 'Upload failed');
    } catch {
      setError('Upload failed');
    }
    setUploading(false);
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-slate-700">{label}</label>
      {value ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-32 w-48 rounded-lg border object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white shadow"
            title="Remove"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <label className="flex h-32 w-48 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500 hover:bg-slate-100">
          {uploading ? (
            <span className="text-xs">Uploading…</span>
          ) : (
            <>
              <Upload className="h-5 w-5" />
              <span className="text-xs">Click to upload</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handle(f);
            }}
          />
        </label>
      )}
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}

/** Gallery: array of image URLs with reorder + remove */
export function GalleryUpload({
  value,
  onChange,
  folder = 'gallery',
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: FileList) {
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', folder);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const j = await res.json();
      if (j.url) newUrls.push(j.url);
    }
    onChange([...value, ...newUrls]);
    setUploading(false);
  }

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  function move(idx: number, dir: 'up' | 'down') {
    const next = [...value];
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700">Gallery ({value.length} images)</label>
        <label className="flex cursor-pointer items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700">
          <Upload className="h-3.5 w-3.5" />
          {uploading ? 'Uploading…' : 'Add images'}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </label>
      </div>

      {value.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
          <ImageIcon className="mx-auto mb-1 h-6 w-6 opacity-40" />
          No images yet
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
          {value.map((url, i) => (
            <div key={`${url}-${i}`} className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-24 w-full rounded-lg object-cover" />
              <div className="absolute inset-0 flex items-center justify-center gap-1 rounded-lg bg-black/40 opacity-0 transition group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => move(i, 'up')}
                  disabled={i === 0}
                  className="rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold disabled:opacity-30"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white"
                >
                  Remove
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 'down')}
                  disabled={i === value.length - 1}
                  className="rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold disabled:opacity-30"
                >
                  →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
