'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GalleryUpload } from './image-upload';

const ACTIVITY_TYPES = ['adventure', 'culture', 'wellness', 'food', 'water', 'nightlife'];
const DIFFICULTIES = ['', 'easy', 'moderate', 'hard'];

type Activity = {
  id: string;
  slug: string;
  name: string;
  shortDesc?: string | null;
  description?: string | null;
  type: string;
  durationHours: number;
  difficulty?: string | null;
  minAge: number;
  maxGroupSize: number;
  basePrice: number;
  baseCurrency: string;
  meetingPoint?: string | null;
  destinationId?: string | null;
  included: string;
  excluded: string;
  isFeatured: boolean;
  isActive: boolean;
  imageUrls?: string[];
};

const empty: Activity = {
  id: '', slug: '', name: '', shortDesc: '', description: '', type: 'adventure',
  durationHours: 2, difficulty: '', minAge: 0, maxGroupSize: 20,
  basePrice: 500000, baseCurrency: 'IDR', meetingPoint: '',
  destinationId: null, included: '[]', excluded: '[]',
  isFeatured: false, isActive: true, imageUrls: [],
};

export function ActivityForm({ activity, destinations }: { activity?: Activity; destinations: { id: string; name: string }[] }) {
  const router = useRouter();
  const [a, setA] = useState<Activity>(activity ?? empty);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const isNew = !activity?.id;

  function setField<K extends keyof Activity>(key: K, value: Activity[K]) {
    setA((prev) => ({ ...prev, [key]: value }));
  }

  function jsonArr(value: string): string[] {
    try { const v = JSON.parse(value); return Array.isArray(v) ? v : []; } catch { return []; }
  }

  function setJsonArr(key: 'included' | 'excluded', items: string[]) {
    setField(key, JSON.stringify(items));
  }

  async function save() {
    setErr(null);
    setSaving(true);
    const url = isNew ? '/api/admin/crud/activity' : `/api/admin/crud/activity/${a.id}`;
    const res = await fetch(url, {
      method: isNew ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...a,
        destinationId: a.destinationId || null,
        difficulty: a.difficulty || null,
      }),
    });
    const j = await res.json();
    if (!res.ok) { setErr(j.error ?? 'Save failed'); setSaving(false); return; }

    // Save images
    if (a.imageUrls && a.imageUrls.length > 0) {
      await fetch(`/api/admin/activity-images/${j.item?.id ?? a.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: a.imageUrls }),
      });
    }

    setSaving(false);
    if (isNew) router.push(`/admin/activities/${j.item.id}` as any);
    else router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="mb-3 font-semibold">Basic info</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Name *">
            <input value={a.name} onChange={(e) => setField('name', e.target.value)} className="input" />
          </Field>
          <Field label="Slug (auto if empty)">
            <input value={a.slug} onChange={(e) => setField('slug', e.target.value)} className="input font-mono" />
          </Field>
          <Field label="Type">
            <select value={a.type} onChange={(e) => setField('type', e.target.value)} className="input">
              {ACTIVITY_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Difficulty">
            <select value={a.difficulty ?? ''} onChange={(e) => setField('difficulty', e.target.value || null)} className="input">
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{d || '—'}</option>)}
            </select>
          </Field>
          <Field label="Destination">
            <select value={a.destinationId ?? ''} onChange={(e) => setField('destinationId', e.target.value || null)} className="input">
              <option value="">— none —</option>
              {destinations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
          <Field label="Meeting point">
            <input value={a.meetingPoint ?? ''} onChange={(e) => setField('meetingPoint', e.target.value)} className="input" />
          </Field>
          <Field label="Short description">
            <input value={a.shortDesc ?? ''} onChange={(e) => setField('shortDesc', e.target.value)} className="input" />
          </Field>
          <Field label="Description">
            <textarea value={a.description ?? ''} onChange={(e) => setField('description', e.target.value)} rows={4} className="input" />
          </Field>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="mb-3 font-semibold">Pricing & capacity</h3>
        <div className="grid gap-3 md:grid-cols-4">
          <Field label="Price *"><input type="number" value={a.basePrice} onChange={(e) => setField('basePrice', Number(e.target.value))} className="input" /></Field>
          <Field label="Currency">
            <select value={a.baseCurrency} onChange={(e) => setField('baseCurrency', e.target.value)} className="input">
              <option>IDR</option><option>USD</option><option>EUR</option><option>SGD</option><option>AUD</option>
            </select>
          </Field>
          <Field label="Duration (h)"><input type="number" step="0.5" value={a.durationHours} onChange={(e) => setField('durationHours', Number(e.target.value))} className="input" /></Field>
          <Field label="Min age"><input type="number" value={a.minAge} onChange={(e) => setField('minAge', Number(e.target.value))} className="input" /></Field>
          <Field label="Max group size"><input type="number" value={a.maxGroupSize} onChange={(e) => setField('maxGroupSize', Number(e.target.value))} className="input" /></Field>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="mb-3 font-semibold">What&apos;s included / excluded (one per line)</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Included">
            <textarea
              value={jsonArr(a.included).join('\n')}
              onChange={(e) => setJsonArr('included', e.target.value.split('\n').filter(Boolean))}
              rows={5}
              className="input"
              placeholder="Equipment&#10;Snacks&#10;Insurance"
            />
          </Field>
          <Field label="Excluded">
            <textarea
              value={jsonArr(a.excluded).join('\n')}
              onChange={(e) => setJsonArr('excluded', e.target.value.split('\n').filter(Boolean))}
              rows={5}
              className="input"
            />
          </Field>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="mb-3 font-semibold">Photos</h3>
        <GalleryUpload value={a.imageUrls ?? []} onChange={(urls) => setField('imageUrls', urls)} folder="activities" />
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex gap-4">
          <label className="flex items-center gap-2"><input type="checkbox" checked={a.isActive} onChange={(e) => setField('isActive', e.target.checked)} /><span className="text-sm">Active</span></label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={a.isFeatured} onChange={(e) => setField('isFeatured', e.target.checked)} /><span className="text-sm">Featured</span></label>
        </div>
        <button onClick={save} disabled={saving || !a.name || !a.basePrice} className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
          {saving ? 'Saving…' : isNew ? 'Create' : 'Save'}
        </button>
      </div>

      {err && <p className="text-sm font-semibold text-red-700">{err}</p>}

      <style jsx>{`.input { width: 100%; border: 1px solid rgb(226,232,240); border-radius: 0.5rem; padding: 0.5rem 0.75rem; font-size: 0.875rem; }`}</style>
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
