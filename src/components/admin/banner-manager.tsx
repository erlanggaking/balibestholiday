'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePicker } from './image-upload';
import { CatalogToggle } from './catalog-toggle';
import { Plus, Trash2 } from 'lucide-react';

const POSITIONS = ['home_hero', 'home_strip', 'tours_hero', 'hotels_hero', 'sidebar'] as const;

type Banner = {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  linkUrl?: string | null;
  position: string;
  sortOrder: number;
  isActive: boolean;
};

export function BannerManager({ initialBanners }: { initialBanners: Banner[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);

  function startNew() {
    setEditing({
      id: '',
      title: '',
      subtitle: '',
      imageUrl: '',
      linkUrl: '',
      position: 'home_hero',
      sortOrder: 0,
      isActive: true,
    });
    setShowForm(true);
  }

  async function del(id: string, title: string) {
    if (!confirm(`Delete banner "${title}"?`)) return;
    const res = await fetch(`/api/admin/crud/banner/${id}`, { method: 'DELETE' });
    if (res.ok) router.refresh();
    else alert('Delete failed');
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={startNew}
          className="flex items-center gap-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> New banner
        </button>
      </div>

      {showForm && editing && (
        <BannerForm
          banner={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
            router.refresh();
          }}
        />
      )}

      <div className="space-y-3">
        {initialBanners.map((b) => (
          <div
            key={b.id}
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-3"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.imageUrl} alt="" className="h-16 w-28 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{b.title}</p>
              {b.subtitle && <p className="truncate text-xs text-slate-600">{b.subtitle}</p>}
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">{b.position}</span>
                {b.linkUrl && <span className="truncate">→ {b.linkUrl}</span>}
              </div>
            </div>
            <CatalogToggle type="banner" id={b.id} field="isActive" value={b.isActive} />
            <button
              onClick={() => {
                setEditing(b);
                setShowForm(true);
              }}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50"
            >
              Edit
            </button>
            <button
              onClick={() => del(b.id, b.title)}
              className="rounded-lg p-2 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {initialBanners.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center text-slate-500">
            No banners yet. Click &quot;New banner&quot; above.
          </div>
        )}
      </div>
    </div>
  );
}

function BannerForm({
  banner,
  onClose,
}: {
  banner: Banner;
  onClose: () => void;
}) {
  const [b, setB] = useState(banner);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const isNew = !banner.id;

  async function save() {
    setErr(null);
    setSaving(true);
    const url = isNew ? '/api/admin/crud/banner' : `/api/admin/crud/banner/${b.id}`;
    const res = await fetch(url, {
      method: isNew ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(b),
    });
    const j = await res.json();
    setSaving(false);
    if (res.ok) onClose();
    else setErr(j.error ?? 'Save failed');
  }

  return (
    <div className="mb-4 rounded-2xl border border-brand-200 bg-brand-50/30 p-5">
      <h3 className="mb-3 font-semibold">{isNew ? 'New banner' : 'Edit banner'}</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Title">
          <input value={b.title} onChange={(e) => setB({ ...b, title: e.target.value })} className="input" />
        </Field>
        <Field label="Subtitle">
          <input value={b.subtitle ?? ''} onChange={(e) => setB({ ...b, subtitle: e.target.value })} className="input" />
        </Field>
        <Field label="Link URL">
          <input value={b.linkUrl ?? ''} onChange={(e) => setB({ ...b, linkUrl: e.target.value })} className="input" placeholder="/tours/some-package" />
        </Field>
        <Field label="Position">
          <select value={b.position} onChange={(e) => setB({ ...b, position: e.target.value })} className="input">
            {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Sort order">
          <input type="number" value={b.sortOrder} onChange={(e) => setB({ ...b, sortOrder: Number(e.target.value) })} className="input" />
        </Field>
        <Field label="Active">
          <label className="flex items-center gap-2 pt-2">
            <input type="checkbox" checked={b.isActive} onChange={(e) => setB({ ...b, isActive: e.target.checked })} />
            <span className="text-sm">Visible on site</span>
          </label>
        </Field>
        <div className="md:col-span-2">
          <ImagePicker value={b.imageUrl} onChange={(url) => setB({ ...b, imageUrl: url ?? '' })} folder="banners" label="Banner image (recommended 1920×600)" />
        </div>
      </div>
      {err && <p className="mt-2 text-sm font-semibold text-red-700">{err}</p>}
      <div className="mt-4 flex gap-2">
        <button
          onClick={save}
          disabled={saving || !b.title || !b.imageUrl}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50">
          Cancel
        </button>
      </div>
      <style jsx>{`
        .input {
          width: 100%;
          border: 1px solid rgb(226, 232, 240);
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }
        .input:focus {
          outline: none;
          border-color: rgb(50, 121, 255);
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
