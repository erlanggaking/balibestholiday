'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePicker } from './image-upload';

type Op = { id: string; slug: string; name: string; logoUrl?: string | null; description?: string | null; isActive: boolean };

const empty: Op = { id: '', slug: '', name: '', logoUrl: '', description: '', isActive: true };

export function BusOperatorForm({ operator }: { operator?: Op }) {
  const router = useRouter();
  const [o, setO] = useState<Op>(operator ?? empty);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const isNew = !operator?.id;

  async function save() {
    setErr(null);
    setSaving(true);
    const url = isNew ? '/api/admin/crud/busoperator' : `/api/admin/crud/busoperator/${o.id}`;
    const res = await fetch(url, {
      method: isNew ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(o),
    });
    const j = await res.json();
    setSaving(false);
    if (res.ok) {
      if (isNew) router.push(`/admin/buses/${j.item.id}` as any);
      else router.refresh();
    } else setErr(j.error ?? 'Save failed');
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="mb-3 font-semibold">Operator info</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Name *"><input value={o.name} onChange={(e) => setO({ ...o, name: e.target.value })} className="input" /></Field>
        <Field label="Slug"><input value={o.slug} onChange={(e) => setO({ ...o, slug: e.target.value })} className="input font-mono" placeholder="auto" /></Field>
        <Field label="Description">
          <textarea value={o.description ?? ''} onChange={(e) => setO({ ...o, description: e.target.value })} rows={2} className="input" />
        </Field>
        <ImagePicker value={o.logoUrl} onChange={(url) => setO({ ...o, logoUrl: url ?? '' })} folder="bus-logos" label="Logo" />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <label className="flex items-center gap-2"><input type="checkbox" checked={o.isActive} onChange={(e) => setO({ ...o, isActive: e.target.checked })} /><span className="text-sm">Active</span></label>
        <button onClick={save} disabled={saving || !o.name} className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
          {saving ? 'Saving…' : isNew ? 'Create operator' : 'Save'}
        </button>
      </div>
      {err && <p className="mt-2 text-sm font-semibold text-red-700">{err}</p>}
      <style jsx>{`.input { width: 100%; border: 1px solid rgb(226,232,240); border-radius: 0.5rem; padding: 0.5rem 0.75rem; font-size: 0.875rem; }`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs font-semibold text-slate-700">{label}</span>{children}</label>;
}
