'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const STATUSES = ['PENDING', 'QUOTED', 'APPROVED', 'CONVERTED', 'REJECTED'];

export function CustomRequestActions({
  id,
  status,
  quoteAmount,
  quoteCurrency,
  adminNotes,
}: {
  id: string;
  status: string;
  quoteAmount?: number | null;
  quoteCurrency: string;
  adminNotes?: string | null;
}) {
  const router = useRouter();
  const [s, setS] = useState(status);
  const [amount, setAmount] = useState(quoteAmount?.toString() ?? '');
  const [currency, setCurrency] = useState(quoteCurrency);
  const [notes, setNotes] = useState(adminNotes ?? '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setMsg(null);
    setSaving(true);
    const res = await fetch(`/api/admin/custom-requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: s,
        quoteAmount: amount ? Number(amount) : null,
        quoteCurrency: currency,
        adminNotes: notes,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setMsg('Saved');
      router.refresh();
    } else setMsg('Failed');
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="mb-3 text-sm font-semibold">Manage request</h3>
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-700">Status</span>
          <select value={s} onChange={(e) => setS(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
            {STATUSES.map((x) => <option key={x}>{x}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-3 gap-2">
          <label className="col-span-2 block">
            <span className="mb-1 block text-xs font-semibold text-slate-700">Quote amount</span>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-700">Currency</span>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <option>IDR</option><option>USD</option><option>EUR</option><option>SGD</option>
            </select>
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-700">Internal notes</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </label>
        <button onClick={save} disabled={saving} className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
          {saving ? 'Saving…' : 'Save'}
        </button>
        {msg && <p className="text-xs font-semibold text-emerald-700">{msg}</p>}
      </div>
    </div>
  );
}
