'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePicker } from './image-upload';
import { Card, Grid, Field, Footer, FormStyles } from './tour-form';

type Destination = {
  id: string;
  slug: string;
  name: string;
  country: string;
  region?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isFeatured: boolean;
};

const empty: Destination = {
  id: '', slug: '', name: '', country: 'Indonesia', region: '', description: '',
  imageUrl: '', latitude: null, longitude: null, isFeatured: false,
};

export function DestinationForm({ destination }: { destination?: Destination }) {
  const router = useRouter();
  const [d, setD] = useState<Destination>(destination ?? empty);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const isNew = !destination?.id;

  function set<K extends keyof Destination>(k: K, v: Destination[K]) { setD((p) => ({ ...p, [k]: v })); }

  async function save() {
    setErr(null);
    setSaving(true);
    const url = isNew ? '/api/admin/crud/destination' : `/api/admin/crud/destination/${d.id}`;
    const res = await fetch(url, {
      method: isNew ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(d),
    });
    const j = await res.json();
    setSaving(false);
    if (res.ok) {
      if (isNew) router.push(`/admin/destinations/${j.item.id}` as any);
      else router.refresh();
    } else setErr(j.error ?? 'Save failed');
  }

  async function del() {
    if (!confirm(`Delete destination "${d.name}"?`)) return;
    const res = await fetch(`/api/admin/crud/destination/${d.id}`, { method: 'DELETE' });
    if (res.ok) router.push('/admin/destinations' as any);
    else alert('Delete failed (may have linked packages/hotels).');
  }

  return (
    <div className="space-y-4">
      <Card title="Destination">
        <Grid>
          <Field label="Name *"><input value={d.name} onChange={(e) => set('name', e.target.value)} className="input" placeholder="Ubud" /></Field>
          <Field label="Slug (auto)"><input value={d.slug} onChange={(e) => set('slug', e.target.value)} className="input font-mono" /></Field>
          <Field label="Country"><input value={d.country} onChange={(e) => set('country', e.target.value)} className="input" /></Field>
          <Field label="Region (e.g. Central Bali)"><input value={d.region ?? ''} onChange={(e) => set('region', e.target.value)} className="input" /></Field>
          <Field label="Description" full>
            <textarea value={d.description ?? ''} onChange={(e) => set('description', e.target.value)} rows={4} className="input" />
          </Field>
          <Field label="Latitude"><input type="number" step="0.000001" value={d.latitude ?? ''} onChange={(e) => set('latitude', e.target.value ? Number(e.target.value) : null)} className="input" /></Field>
          <Field label="Longitude"><input type="number" step="0.000001" value={d.longitude ?? ''} onChange={(e) => set('longitude', e.target.value ? Number(e.target.value) : null)} className="input" /></Field>
        </Grid>
      </Card>

      <Card title="Cover image">
        <ImagePicker value={d.imageUrl} onChange={(url) => set('imageUrl', url ?? '')} folder="destinations" label="Hero image (16:9 ideal)" />
      </Card>

      <Footer
        isActive={!!d.isFeatured}
        onActiveChange={() => {}}
        isFeatured={d.isFeatured}
        onFeaturedChange={(v) => set('isFeatured', v)}
        onSave={save}
        onDelete={isNew ? undefined : del}
        saving={saving}
        canSave={!!d.name}
        isNew={isNew}
        err={err}
      />
      <FormStyles />
    </div>
  );
}
