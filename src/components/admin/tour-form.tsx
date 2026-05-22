'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GalleryUpload } from './image-upload';

const DIFFICULTIES = ['', 'easy', 'moderate', 'hard'];

type Tour = {
  id: string;
  slug: string;
  title: string;
  shortDesc?: string | null;
  description?: string | null;
  highlights: string;
  included: string;
  excluded: string;
  itinerary?: string | null;
  durationHours: number;
  durationDays: number;
  meetingPoint?: string | null;
  difficulty?: string | null;
  minAge: number;
  maxGroupSize: number;
  basePrice: number;
  childPrice?: number | null;
  discountPercent: number;
  baseCurrency: string;
  destinationId: string;
  categoryId?: string | null;
  isFeatured: boolean;
  isActive: boolean;
  imageUrls?: string[];
};

const empty: Tour = {
  id: '', slug: '', title: '', shortDesc: '', description: '',
  highlights: '[]', included: '[]', excluded: '[]', itinerary: null,
  durationHours: 8, durationDays: 1, meetingPoint: '', difficulty: '',
  minAge: 0, maxGroupSize: 15, basePrice: 1500000, childPrice: null,
  discountPercent: 0, baseCurrency: 'IDR', destinationId: '', categoryId: null,
  isFeatured: false, isActive: true, imageUrls: [],
};

export function TourForm({
  tour,
  destinations,
  categories,
}: {
  tour?: Tour;
  destinations: { id: string; name: string }[];
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [t, setT] = useState<Tour>(tour ?? empty);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const isNew = !tour?.id;

  function set<K extends keyof Tour>(k: K, v: Tour[K]) { setT((p) => ({ ...p, [k]: v })); }

  function jsonArr(value: string): string[] {
    try { const v = JSON.parse(value); return Array.isArray(v) ? v : []; } catch { return []; }
  }
  function setJsonArr(key: 'highlights' | 'included' | 'excluded', items: string[]) {
    set(key, JSON.stringify(items));
  }

  async function save() {
    setErr(null);
    setSaving(true);
    if (!t.destinationId) { setErr('Destination is required'); setSaving(false); return; }

    const url = isNew ? '/api/admin/crud/tour' : `/api/admin/crud/tour/${t.id}`;
    const res = await fetch(url, {
      method: isNew ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...t, categoryId: t.categoryId || null, difficulty: t.difficulty || null }),
    });
    const j = await res.json();
    if (!res.ok) { setErr(j.error ?? 'Save failed'); setSaving(false); return; }

    if (t.imageUrls && t.imageUrls.length > 0) {
      await fetch(`/api/admin/images/tour/${j.item?.id ?? t.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: t.imageUrls }),
      });
    }
    setSaving(false);
    if (isNew) router.push(`/admin/tours/${j.item.id}` as any);
    else router.refresh();
  }

  async function del() {
    if (!confirm(`Delete package "${t.title}"? Bookings linked will keep their reference.`)) return;
    const res = await fetch(`/api/admin/crud/tour/${t.id}`, { method: 'DELETE' });
    if (res.ok) router.push('/admin/tours' as any);
    else alert('Delete failed (existing bookings might reference this).');
  }

  // CREATE flow with no destinationId picked yet — Tour requires it because of FK.
  // POST is missing 'required' check on destinationId; CRUD endpoint will reject.
  // This client-side check keeps UX clean.
  return (
    <div className="space-y-4">
      <Card title="Basics">
        <Grid>
          <Field label="Title *"><input value={t.title} onChange={(e) => set('title', e.target.value)} className="input" /></Field>
          <Field label="Slug (auto)"><input value={t.slug} onChange={(e) => set('slug', e.target.value)} className="input font-mono" /></Field>
          <Field label="Destination *">
            <select value={t.destinationId} onChange={(e) => set('destinationId', e.target.value)} className="input">
              <option value="">— select —</option>
              {destinations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
          <Field label="Category">
            <select value={t.categoryId ?? ''} onChange={(e) => set('categoryId', e.target.value || null)} className="input">
              <option value="">— none —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Short description (1-2 lines)">
            <input value={t.shortDesc ?? ''} onChange={(e) => set('shortDesc', e.target.value)} className="input" />
          </Field>
          <Field label="Difficulty">
            <select value={t.difficulty ?? ''} onChange={(e) => set('difficulty', e.target.value || null)} className="input">
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{d || '—'}</option>)}
            </select>
          </Field>
          <Field label="Full description" full>
            <textarea value={t.description ?? ''} onChange={(e) => set('description', e.target.value)} rows={5} className="input" />
          </Field>
          <Field label="Meeting point">
            <input value={t.meetingPoint ?? ''} onChange={(e) => set('meetingPoint', e.target.value)} className="input" />
          </Field>
        </Grid>
      </Card>

      <Card title="Pricing & capacity">
        <Grid cols={4}>
          <Field label="Base price (adult) *"><input type="number" value={t.basePrice} onChange={(e) => set('basePrice', Number(e.target.value))} className="input" /></Field>
          <Field label="Child price"><input type="number" value={t.childPrice ?? ''} onChange={(e) => set('childPrice', e.target.value ? Number(e.target.value) : null)} className="input" /></Field>
          <Field label="Currency">
            <select value={t.baseCurrency} onChange={(e) => set('baseCurrency', e.target.value)} className="input">
              <option>IDR</option><option>USD</option><option>EUR</option><option>SGD</option><option>AUD</option>
            </select>
          </Field>
          <Field label="Discount %"><input type="number" min={0} max={100} value={t.discountPercent} onChange={(e) => set('discountPercent', Number(e.target.value))} className="input" /></Field>
          <Field label="Duration (hours)"><input type="number" value={t.durationHours} onChange={(e) => set('durationHours', Number(e.target.value))} className="input" /></Field>
          <Field label="Duration (days)"><input type="number" value={t.durationDays} onChange={(e) => set('durationDays', Number(e.target.value))} className="input" /></Field>
          <Field label="Min age"><input type="number" value={t.minAge} onChange={(e) => set('minAge', Number(e.target.value))} className="input" /></Field>
          <Field label="Max group size"><input type="number" value={t.maxGroupSize} onChange={(e) => set('maxGroupSize', Number(e.target.value))} className="input" /></Field>
        </Grid>
      </Card>

      <Card title="Highlights / Included / Excluded (one per line)">
        <Grid>
          <Field label="Highlights (top selling points)">
            <textarea
              value={jsonArr(t.highlights).join('\n')}
              onChange={(e) => setJsonArr('highlights', e.target.value.split('\n').filter(Boolean))}
              rows={5} className="input"
              placeholder="Sunrise hike on Mount Batur&#10;Hot spring soak&#10;Breakfast at the summit"
            />
          </Field>
          <Field label="Included">
            <textarea
              value={jsonArr(t.included).join('\n')}
              onChange={(e) => setJsonArr('included', e.target.value.split('\n').filter(Boolean))}
              rows={5} className="input"
            />
          </Field>
          <Field label="Excluded" full>
            <textarea
              value={jsonArr(t.excluded).join('\n')}
              onChange={(e) => setJsonArr('excluded', e.target.value.split('\n').filter(Boolean))}
              rows={3} className="input"
            />
          </Field>
        </Grid>
      </Card>

      <Card title="Photos">
        <GalleryUpload value={t.imageUrls ?? []} onChange={(urls) => set('imageUrls', urls)} folder="tours" />
      </Card>

      <Footer
        isActive={t.isActive}
        isFeatured={t.isFeatured}
        onActiveChange={(v) => set('isActive', v)}
        onFeaturedChange={(v) => set('isFeatured', v)}
        onSave={save}
        onDelete={isNew ? undefined : del}
        saving={saving}
        canSave={!!t.title && !!t.destinationId && !!t.basePrice}
        isNew={isNew}
        err={err}
      />

      <FormStyles />
    </div>
  );
}

// --- Reusable layout helpers (used by all CRUD forms) ---
export function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="mb-3 font-semibold">{title}</h3>
      {children}
    </div>
  );
}
export function Grid({ children, cols = 2 }: { children: React.ReactNode; cols?: 2 | 3 | 4 }) {
  const cls = cols === 4 ? 'md:grid-cols-4' : cols === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2';
  return <div className={`grid gap-3 ${cls}`}>{children}</div>;
}
export function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? 'md:col-span-full' : ''}`}>
      <span className="mb-1 block text-xs font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}
export function Footer({
  isActive, isFeatured, onActiveChange, onFeaturedChange,
  onSave, onDelete, saving, canSave, isNew, err,
}: {
  isActive: boolean;
  isFeatured?: boolean;
  onActiveChange: (v: boolean) => void;
  onFeaturedChange?: (v: boolean) => void;
  onSave: () => void;
  onDelete?: () => void;
  saving: boolean;
  canSave: boolean;
  isNew: boolean;
  err: string | null;
}) {
  return (
    <>
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex gap-4">
          <label className="flex items-center gap-2"><input type="checkbox" checked={isActive} onChange={(e) => onActiveChange(e.target.checked)} /><span className="text-sm">Active</span></label>
          {onFeaturedChange && (
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!isFeatured} onChange={(e) => onFeaturedChange(e.target.checked)} /><span className="text-sm">Featured</span></label>
          )}
        </div>
        <div className="flex gap-2">
          {onDelete && <button onClick={onDelete} className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100">Delete</button>}
          <button onClick={onSave} disabled={saving || !canSave} className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
            {saving ? 'Saving…' : isNew ? 'Create' : 'Save'}
          </button>
        </div>
      </div>
      {err && <p className="text-sm font-semibold text-red-700">{err}</p>}
    </>
  );
}
export function FormStyles() {
  return (
    <style jsx global>{`
      .input { width: 100%; border: 1px solid rgb(226,232,240); border-radius: 0.5rem; padding: 0.5rem 0.75rem; font-size: 0.875rem; }
      .input:focus { outline: none; border-color: rgb(50,121,255); }
    `}</style>
  );
}
