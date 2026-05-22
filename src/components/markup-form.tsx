'use client';

import { useState } from 'react';
import { Loader2, Plane, BedDouble, Compass, Car, ShieldCheck, Save } from 'lucide-react';

type MarkupState = {
  flight: number;
  hotel: number;
  tour: number;
  car: number;
  insurance: number;
};

const FIELDS: { key: keyof MarkupState; label: string; icon: React.ReactNode; hint: string }[] = [
  { key: 'flight', label: 'Flights (Duffel)', icon: <Plane className="h-4 w-4" />, hint: 'Recommended 3–8% — flights are price-sensitive.' },
  { key: 'hotel', label: 'Stays / Hotels (Duffel)', icon: <BedDouble className="h-4 w-4" />, hint: 'Recommended 8–15% — hotels carry healthy margin.' },
  { key: 'tour', label: 'Tours', icon: <Compass className="h-4 w-4" />, hint: 'Markup applied on top of vendor net rate.' },
  { key: 'car', label: 'Car rentals', icon: <Car className="h-4 w-4" />, hint: 'Optional — if listing supplier net rates.' },
  { key: 'insurance', label: 'Insurance', icon: <ShieldCheck className="h-4 w-4" />, hint: 'Often defined by supplier — leave 0 if pass-through.' },
];

export function MarkupForm({ initial }: { initial: MarkupState }) {
  const [values, setValues] = useState<MarkupState>(initial);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/markup', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed');
      setSavedAt(new Date());
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      {FIELDS.map((f) => (
        <div key={f.key} className="grid grid-cols-1 items-center gap-3 md:grid-cols-[200px_1fr_auto]">
          <div className="flex items-center gap-2 font-medium">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              {f.icon}
            </span>
            {f.label}
          </div>
          <div>
            <input
              type="number"
              step="0.5"
              min={0}
              max={50}
              value={values[f.key]}
              onChange={(e) =>
                setValues({ ...values, [f.key]: parseFloat(e.target.value) || 0 })
              }
              className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
            <p className="mt-1 text-xs text-slate-500">{f.hint}</p>
          </div>
          <div className="text-right text-sm font-mono text-slate-600 md:w-16">
            {values[f.key].toFixed(1)}%
          </div>
        </div>
      ))}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between border-t pt-4">
        <span className="text-xs text-slate-500">
          {savedAt ? `Saved at ${savedAt.toLocaleTimeString()}` : 'Changes apply within 60 seconds.'}
        </span>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-70"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving…' : 'Save markup'}
        </button>
      </div>
    </form>
  );
}
