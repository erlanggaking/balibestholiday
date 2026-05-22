'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

const BOOKING_STATUSES = ['PENDING', 'PAID', 'CONFIRMED', 'CANCELLED', 'REFUNDED'] as const;
const PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'] as const;

export function BookingStatusForm({
  id,
  status,
  paymentStatus,
}: {
  id: string;
  status: string;
  paymentStatus: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [s, setS] = useState(status);
  const [ps, setPs] = useState(paymentStatus);
  const [notes, setNotes] = useState('');
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const dirty = s !== status || ps !== paymentStatus || notes.trim().length > 0;

  async function save() {
    setMsg(null);
    const res = await fetch(`/api/admin/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: s,
        paymentStatus: ps,
        appendNote: notes.trim() || undefined,
      }),
    });
    if (res.ok) {
      setMsg({ type: 'ok', text: 'Updated' });
      setNotes('');
      startTransition(() => router.refresh());
    } else {
      const j = await res.json().catch(() => ({}));
      setMsg({ type: 'err', text: j.error ?? 'Failed' });
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="mb-3 text-sm font-semibold">Update status</h3>
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-700">Booking status</span>
          <select
            value={s}
            onChange={(e) => setS(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {BOOKING_STATUSES.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-700">Payment status</span>
          <select
            value={ps}
            onChange={(e) => setPs(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {PAYMENT_STATUSES.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-700">
            Add internal note (optional)
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="e.g. Refund processed via Stripe"
          />
        </label>

        <button
          type="button"
          disabled={!dirty || pending}
          onClick={save}
          className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save changes'}
        </button>

        {msg && (
          <p
            className={`text-xs font-semibold ${
              msg.type === 'ok' ? 'text-emerald-700' : 'text-red-700'
            }`}
          >
            {msg.text}
          </p>
        )}
      </div>
    </div>
  );
}
