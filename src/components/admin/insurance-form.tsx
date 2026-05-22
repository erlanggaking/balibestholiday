'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Grid, Field, Footer, FormStyles } from './tour-form';

const COVERAGE_TYPES = ['BASIC', 'STANDARD', 'PREMIUM', 'COMPREHENSIVE'];

type Insurance = {
  id: string;
  slug: string;
  provider: string;
  name: string;
  shortDesc?: string | null;
  description?: string | null;
  coverageType: string;
  medicalCoverage: number;
  tripCancellation: number;
  baggageCoverage: number;
  pricePerDay: number;
  baseCurrency: string;
  benefits: string;
  isActive: boolean;
};

const empty: Insurance = {
  id: '', slug: '', provider: '', name: '', shortDesc: '', description: '',
  coverageType: 'STANDARD', medicalCoverage: 50000, tripCancellation: 5000,
  baggageCoverage: 1000, pricePerDay: 5, baseCurrency: 'USD',
  benefits: '[]', isActive: true,
};

export function InsuranceForm({ insurance }: { insurance?: Insurance }) {
  const router = useRouter();
  const [i, setI] = useState<Insurance>(insurance ?? empty);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const isNew = !insurance?.id;

  function set<K extends keyof Insurance>(k: K, v: Insurance[K]) { setI((p) => ({ ...p, [k]: v })); }
  function jsonArr(value: string): string[] {
    try { const v = JSON.parse(value); return Array.isArray(v) ? v : []; } catch { return []; }
  }
  function setJsonArr(items: string[]) { set('benefits', JSON.stringify(items)); }

  async function save() {
    setErr(null);
    setSaving(true);
    const url = isNew ? '/api/admin/crud/insurance' : `/api/admin/crud/insurance/${i.id}`;
    const res = await fetch(url, {
      method: isNew ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(i),
    });
    const j = await res.json();
    setSaving(false);
    if (res.ok) {
      if (isNew) router.push(`/admin/insurance/${j.item.id}` as any);
      else router.refresh();
    } else setErr(j.error ?? 'Save failed');
  }

  async function del() {
    if (!confirm(`Delete plan "${i.name}"?`)) return;
    const res = await fetch(`/api/admin/crud/insurance/${i.id}`, { method: 'DELETE' });
    if (res.ok) router.push('/admin/insurance' as any);
    else alert('Delete failed');
  }

  return (
    <div className="space-y-4">
      <Card title="Plan info">
        <Grid>
          <Field label="Provider *"><input value={i.provider} onChange={(e) => set('provider', e.target.value)} className="input" placeholder="Allianz, Chubb, AIG…" /></Field>
          <Field label="Plan name *"><input value={i.name} onChange={(e) => set('name', e.target.value)} className="input" /></Field>
          <Field label="Slug"><input value={i.slug} onChange={(e) => set('slug', e.target.value)} className="input font-mono" /></Field>
          <Field label="Coverage tier">
            <select value={i.coverageType} onChange={(e) => set('coverageType', e.target.value)} className="input">
              {COVERAGE_TYPES.map((x) => <option key={x}>{x}</option>)}
            </select>
          </Field>
          <Field label="Short description"><input value={i.shortDesc ?? ''} onChange={(e) => set('shortDesc', e.target.value)} className="input" /></Field>
          <Field label="Full description" full>
            <textarea value={i.description ?? ''} onChange={(e) => set('description', e.target.value)} rows={4} className="input" />
          </Field>
        </Grid>
      </Card>

      <Card title="Coverage limits & pricing">
        <Grid cols={4}>
          <Field label="Price per day *"><input type="number" step="0.01" value={i.pricePerDay} onChange={(e) => set('pricePerDay', Number(e.target.value))} className="input" /></Field>
          <Field label="Currency">
            <select value={i.baseCurrency} onChange={(e) => set('baseCurrency', e.target.value)} className="input">
              <option>USD</option><option>IDR</option><option>EUR</option>
            </select>
          </Field>
          <Field label="Medical coverage"><input type="number" value={i.medicalCoverage} onChange={(e) => set('medicalCoverage', Number(e.target.value))} className="input" /></Field>
          <Field label="Trip cancellation"><input type="number" value={i.tripCancellation} onChange={(e) => set('tripCancellation', Number(e.target.value))} className="input" /></Field>
          <Field label="Baggage coverage"><input type="number" value={i.baggageCoverage} onChange={(e) => set('baggageCoverage', Number(e.target.value))} className="input" /></Field>
        </Grid>
      </Card>

      <Card title="Benefits (one per line)">
        <textarea
          value={jsonArr(i.benefits).join('\n')}
          onChange={(e) => setJsonArr(e.target.value.split('\n').filter(Boolean))}
          rows={6} className="input"
          placeholder="24/7 emergency assistance&#10;Adventure sports coverage&#10;Trip delay reimbursement"
        />
      </Card>

      <Footer
        isActive={i.isActive}
        onActiveChange={(v) => set('isActive', v)}
        onSave={save}
        onDelete={isNew ? undefined : del}
        saving={saving}
        canSave={!!i.name && !!i.provider && !!i.pricePerDay}
        isNew={isNew}
        err={err}
      />
      <FormStyles />
    </div>
  );
}
