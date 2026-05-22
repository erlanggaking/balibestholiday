'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';

const BUS_TYPES = ['Standard', 'Executive', 'Sleeper', 'VIP'];

type Schedule = {
  id: string;
  routeId: string;
  dayOfWeek?: number | null;
  date?: Date | null;
  departureTime: string;
  arrivalTime: string;
  totalSeats: number;
  priceOverride?: number | null;
  isActive: boolean;
};

type Route = {
  id: string;
  operatorId: string;
  fromCity: string;
  toCity: string;
  busType: string;
  amenities: string;
  durationMinutes: number;
  basePrice: number;
  baseCurrency: string;
  pickupPoints: string;
  dropoffPoints: string;
  isActive: boolean;
  schedules: Schedule[];
};

export function BusRoutesManager({ operatorId, initialRoutes }: { operatorId: string; initialRoutes: Route[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);

  function startNew() {
    setEditingRoute({
      id: '', operatorId, fromCity: '', toCity: '', busType: 'Standard',
      amenities: '[]', durationMinutes: 120, basePrice: 100000, baseCurrency: 'IDR',
      pickupPoints: '[]', dropoffPoints: '[]', isActive: true, schedules: [],
    });
    setShowForm(true);
  }

  async function deleteRoute(id: string, label: string) {
    if (!confirm(`Delete route ${label}?`)) return;
    const res = await fetch(`/api/admin/crud/busroute/${id}`, { method: 'DELETE' });
    if (res.ok) router.refresh();
    else alert('Delete failed');
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">Routes ({initialRoutes.length})</h3>
        <button onClick={startNew} className="flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700">
          <Plus className="h-3.5 w-3.5" /> New route
        </button>
      </div>

      {showForm && editingRoute && (
        <RouteForm route={editingRoute} onClose={() => { setShowForm(false); setEditingRoute(null); router.refresh(); }} />
      )}

      <div className="space-y-2">
        {initialRoutes.map((r) => (
          <div key={r.id} className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{r.fromCity} → {r.toCity}</p>
                <p className="text-xs text-slate-500">
                  {r.busType} · {Math.round(r.durationMinutes / 60)}h · {r.baseCurrency === 'IDR' ? 'Rp' : '$'}
                  {Number(r.basePrice).toLocaleString()} · {r.schedules.length} schedules
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditingRoute(r); setShowForm(true); }} className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold hover:bg-slate-50">
                  Edit
                </button>
                <button onClick={() => deleteRoute(r.id, `${r.fromCity}→${r.toCity}`)} className="rounded-lg p-1.5 text-red-600 hover:bg-red-50">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {initialRoutes.length === 0 && (
          <p className="rounded-lg border-2 border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            No routes yet.
          </p>
        )}
      </div>
    </div>
  );
}

function RouteForm({ route, onClose }: { route: Route; onClose: () => void }) {
  const [r, setR] = useState(route);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const isNew = !r.id;

  function jsonArr(value: string): string[] {
    try { const v = JSON.parse(value); return Array.isArray(v) ? v : []; } catch { return []; }
  }

  function setJson(key: 'amenities' | 'pickupPoints' | 'dropoffPoints', items: string[]) {
    setR({ ...r, [key]: JSON.stringify(items) });
  }

  async function save() {
    setErr(null);
    setSaving(true);
    const url = isNew ? '/api/admin/crud/busroute' : `/api/admin/crud/busroute/${r.id}`;
    const res = await fetch(url, {
      method: isNew ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(r),
    });
    const j = await res.json();
    setSaving(false);
    if (res.ok) onClose();
    else setErr(j.error ?? 'Save failed');
  }

  return (
    <div className="mb-3 rounded-lg border-2 border-brand-200 bg-brand-50/30 p-4">
      <h4 className="mb-3 font-semibold">{isNew ? 'New route' : 'Edit route'}</h4>
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="From city *"><input value={r.fromCity} onChange={(e) => setR({ ...r, fromCity: e.target.value })} className="input" placeholder="Denpasar" /></Field>
        <Field label="To city *"><input value={r.toCity} onChange={(e) => setR({ ...r, toCity: e.target.value })} className="input" placeholder="Ubud" /></Field>
        <Field label="Duration (min) *"><input type="number" value={r.durationMinutes} onChange={(e) => setR({ ...r, durationMinutes: Number(e.target.value) })} className="input" /></Field>
        <Field label="Bus type">
          <select value={r.busType} onChange={(e) => setR({ ...r, busType: e.target.value })} className="input">
            {BUS_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Base price *"><input type="number" value={r.basePrice} onChange={(e) => setR({ ...r, basePrice: Number(e.target.value) })} className="input" /></Field>
        <Field label="Currency">
          <select value={r.baseCurrency} onChange={(e) => setR({ ...r, baseCurrency: e.target.value })} className="input">
            <option>IDR</option><option>USD</option>
          </select>
        </Field>
        <Field label="Amenities (one per line)">
          <textarea
            value={jsonArr(r.amenities).join('\n')}
            onChange={(e) => setJson('amenities', e.target.value.split('\n').filter(Boolean))}
            rows={3}
            className="input"
            placeholder="AC&#10;WiFi&#10;Reclining seats"
          />
        </Field>
        <Field label="Pickup points (one per line)">
          <textarea
            value={jsonArr(r.pickupPoints).join('\n')}
            onChange={(e) => setJson('pickupPoints', e.target.value.split('\n').filter(Boolean))}
            rows={3}
            className="input"
          />
        </Field>
        <Field label="Drop-off points (one per line)">
          <textarea
            value={jsonArr(r.dropoffPoints).join('\n')}
            onChange={(e) => setJson('dropoffPoints', e.target.value.split('\n').filter(Boolean))}
            rows={3}
            className="input"
          />
        </Field>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <label className="flex items-center gap-2"><input type="checkbox" checked={r.isActive} onChange={(e) => setR({ ...r, isActive: e.target.checked })} /><span className="text-sm">Active</span></label>
        <div className="flex gap-2">
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50">Cancel</button>
          <button onClick={save} disabled={saving || !r.fromCity || !r.toCity || !r.basePrice} className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
      {err && <p className="mt-2 text-sm font-semibold text-red-700">{err}</p>}
      <style jsx>{`.input { width: 100%; border: 1px solid rgb(226,232,240); border-radius: 0.5rem; padding: 0.5rem 0.75rem; font-size: 0.875rem; }`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs font-semibold text-slate-700">{label}</span>{children}</label>;
}
