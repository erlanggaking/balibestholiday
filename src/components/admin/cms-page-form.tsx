'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RichEditor } from './rich-editor';
import { slugify } from '@/lib/utils';

type Page = {
  id: string;
  slug: string;
  title: string;
  content: string;
  isPublished: boolean;
};

export function CmsPageForm({ page }: { page: Page }) {
  const router = useRouter();
  const [p, setP] = useState(page);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const isNew = !page.id;

  async function save(publishing?: boolean) {
    setMsg(null);
    setSaving(true);
    const data = { ...p };
    if (publishing !== undefined) data.isPublished = publishing;
    if (isNew && !data.slug) data.slug = slugify(data.title);

    const url = isNew ? '/api/admin/crud/page' : `/api/admin/crud/page/${p.id}`;
    const res = await fetch(url, {
      method: isNew ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const j = await res.json();
    setSaving(false);
    if (res.ok) {
      setMsg({ type: 'ok', text: isNew ? 'Created' : 'Saved' });
      if (isNew && j.item?.id) {
        router.push(`/admin/cms/${j.item.id}` as any);
      } else {
        router.refresh();
      }
    } else {
      setMsg({ type: 'err', text: j.error ?? 'Save failed' });
    }
  }

  async function del() {
    if (!confirm(`Delete page "${p.title}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/crud/page/${p.id}`, { method: 'DELETE' });
    if (res.ok) router.push('/admin/cms' as any);
    else alert('Delete failed');
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Page title">
          <input
            value={p.title}
            onChange={(e) => setP({ ...p, title: e.target.value })}
            className="input"
            placeholder="About Us"
          />
        </Field>
        <Field label="URL slug">
          <input
            value={p.slug}
            onChange={(e) => setP({ ...p, slug: e.target.value })}
            className="input font-mono"
            placeholder="about"
          />
          <p className="mt-1 text-[11px] text-slate-500">Will be available at /pages/{p.slug || 'your-slug'}</p>
        </Field>
      </div>

      <Field label="Content">
        <RichEditor value={p.content} onChange={(html) => setP({ ...p, content: html })} />
      </Field>

      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={p.isPublished}
            onChange={(e) => setP({ ...p, isPublished: e.target.checked })}
          />
          <span className="text-sm font-medium">Published (visible on site)</span>
        </label>

        <div className="flex gap-2">
          {!isNew && (
            <button onClick={del} className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100">
              Delete
            </button>
          )}
          <button
            onClick={() => save()}
            disabled={saving || !p.title || !p.content}
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : isNew ? 'Create' : 'Save'}
          </button>
        </div>
      </div>

      {msg && (
        <p className={`text-sm font-semibold ${msg.type === 'ok' ? 'text-emerald-700' : 'text-red-700'}`}>
          {msg.text}
        </p>
      )}

      <style jsx>{`
        .input {
          width: 100%;
          border: 1px solid rgb(226, 232, 240);
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}
