'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GalleryUpload } from './image-upload';
import { Card, Grid, Field, Footer, FormStyles } from './tour-form';

const CATEGORIES = ['Economy', 'Compact', 'SUV', 'Luxury', 'Van', 'Sports'];
const TRANSMISSIONS = ['Automatic', 'Manual'];
const FUELS = ['Gasoline', 'Diesel', 'Hybrid', 'Electric'];

type Car = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  category: string;
  transmission: string;
  fuelType: string;
  seats: number;
  luggage: number;
  withDriver: boolean;
  pickupLocations: string;
  dailyPrice: number;
  baseCurrency: string;
  description?: string | null;
  features: string;
  isFeatured: boolean;
  isActive: boolean;
  imageUrls?: string[];
};

const empty: Car = {
  id: '', slug: '', name: '', brand: '', model: '',
  year: new Date().getFullYear(), category: 'SUV', transmission: 'Automatic',
  fuelType: 'Gasoline', seats: 5, luggage: 2, withDriver: false,
  pickupLocations: '[]', dailyPrice: 500000, baseCurrency: 'IDR',
  description: '', features: '[]', isFeatured: false, isActive: true, imageUrls: [],
};

export function CarForm({ car }: { car?: Car }) {
  const router = useRouter();
  const [c, setC] = useState<Car>(car ?? empty);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const isNew = !car?.id;

  function set<K extends keyof Car>(k: K, v: Car[K]) { setC((p) => ({ ...p, [k]: v })); }
  function jsonArr(value: string): string[] {
    try { const v = JSON.parse(value); return Array.isArray(v) ? v : []; } catch { return []; }
  }
  function setJsonArr(key: 'pickupLocations' | 'features', items: string[]) {
    set(key, JSON.stringify(items));
  }

  async function save() {
    setErr(null);
    setSaving(true);
    const url = isNew ? '/api/admin/crud/car' : `/api/admin/crud/car/${c.id}`;
    const res = await fetch(url, {
      method: isNew ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(c),
    });
    const j = await res.json();
    if (!res.ok) { setErr(j.error ?? 'Save failed'); setSaving(false); return; }

    if (c.imageUrls && c.imageUrls.length > 0) {
      await fetch(`/api/admin/images/car/${j.item?.id ?? c.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: c.imageUrls }),
      });
    }
    setSaving(false);
    if (isNew) router.push(`/admin/cars/${j.item.id}` as any);
    else router.refresh();
  }

  async function del() {
    if (!confirm(`Delete car "${c.name}"?`)) return;
    const res = await fetch(`/api/admin/crud/car/${c.id}`, { method: 'DELETE' });
    if (res.ok) router.push('/admin/cars' as any);
    else alert('Delete failed');
  }

  return (
    <div className="space-y-4">
      <Card title="Vehicle info">
        <Grid cols={3}>
          <Field label="Display name *"><input value={c.name} onChange={(e) => set('name', e.target.value)} className="input" placeholder="Toyota Avanza 2024" /></Field>
          <Field label="Slug"><input value={c.slug} onChange={(e) => set('slug', e.target.value)} className="input font-mono" /></Field>
          <Field label="Year"><input type="number" value={c.year} onChange={(e) => set('year', Number(e.target.value))} className="input" /></Field>
          <Field label="Brand *"><input value={c.brand} onChange={(e) => set('brand', e.target.value)} className="input" /></Field>
          <Field label="Model *"><input value={c.model} onChange={(e) => set('model', e.target.value)} className="input" /></Field>
          <Field label="Category *">
            <select value={c.category} onChange={(e) => set('category', e.target.value)} className="input">
              {CATEGORIES.map((x) => <option key={x}>{x}</option>)}
            </select>
          </Field>
          <Field label="Transmission *">
            <select value={c.transmission} onChange={(e) => set('transmission', e.target.value)} className="input">
              {TRANSMISSIONS.map((x) => <option key={x}>{x}</option>)}
            </select>
          </Field>
          <Field label="Fuel type">
            <select value={c.fuelType} onChange={(e) => set('fuelType', e.target.value)} className="input">
              {FUELS.map((x) => <option key={x}>{x}</option>)}
            </select>
          </Field>
          <Field label="Seats"><input type="number" value={c.seats} onChange={(e) => set('seats', Number(e.target.value))} className="input" /></Field>
          <Field label="Luggage"><input type="number" value={c.luggage} onChange={(e) => set('luggage', Number(e.target.value))} className="input" /></Field>
          <Field label="With driver">
            <label className="flex items-center gap-2 pt-2">
              <input type="checkbox" checked={c.withDriver} onChange={(e) => set('withDriver', e.target.checked)} />
              <span className="text-sm">Includes driver</span>
            </label>
          </Field>
        </Grid>
      </Card>

      <Card title="Pricing">
        <Grid cols={3}>
          <Field label="Daily price *"><input type="number" value={c.dailyPrice} onChange={(e) => set('dailyPrice', Number(e.target.value))} className="input" /></Field>
          <Field label="Currency">
            <select value={c.baseCurrency} onChange={(e) => set('baseCurrency', e.target.value)} className="input">
              <option>IDR</option><option>USD</option><option>EUR</option><option>SGD</option>
            </select>
          </Field>
        </Grid>
      </Card>

      <Card title="Description, features, pickup">
        <Grid>
          <Field label="Description" full>
            <textarea value={c.description ?? ''} onChange={(e) => set('description', e.target.value)} rows={3} className="input" />
          </Field>
          <Field label="Features (one per line)">
            <textarea
              value={jsonArr(c.features).join('\n')}
              onChange={(e) => setJsonArr('features', e.target.value.split('\n').filter(Boolean))}
              rows={4} className="input"
              placeholder="AC&#10;Bluetooth&#10;Reverse camera"
            />
          </Field>
          <Field label="Pickup locations (one per line)">
            <textarea
              value={jsonArr(c.pickupLocations).join('\n')}
              onChange={(e) => setJsonArr('pickupLocations', e.target.value.split('\n').filter(Boolean))}
              rows={4} className="input"
              placeholder="Ngurah Rai Airport&#10;Kuta&#10;Ubud"
            />
          </Field>
        </Grid>
      </Card>

      <Card title="Photos">
        <GalleryUpload value={c.imageUrls ?? []} onChange={(urls) => set('imageUrls', urls)} folder="cars" />
      </Card>

      <Footer
        isActive={c.isActive}
        isFeatured={c.isFeatured}
        onActiveChange={(v) => set('isActive', v)}
        onFeaturedChange={(v) => set('isFeatured', v)}
        onSave={save}
        onDelete={isNew ? undefined : del}
        saving={saving}
        canSave={!!c.name && !!c.brand && !!c.model && !!c.dailyPrice}
        isNew={isNew}
        err={err}
      />
      <FormStyles />
    </div>
  );
}
