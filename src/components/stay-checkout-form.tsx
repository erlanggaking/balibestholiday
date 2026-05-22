'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, Phone, User } from 'lucide-react';

interface Props {
  rateId: string;
  checkInDate: string;
  checkOutDate: string;
  accommodationName?: string;
}

export function StayCheckoutForm({ rateId, accommodationName }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    given_name: '',
    family_name: '',
    email: '',
    phone_number: '',
    notes: '',
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      // 1. quote
      const quoteRes = await fetch('/api/duffel/stays/quote', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ rate_id: rateId }),
      });
      const quote = await quoteRes.json();
      if (!quoteRes.ok) throw new Error(quote.error ?? 'Quote failed');

      // 2. book
      const bookRes = await fetch('/api/bookings/stay', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          quote_id: quote.id,
          contact: {
            email: form.email,
            phone_number: form.phone_number,
            given_name: form.given_name,
            family_name: form.family_name,
          },
          accommodation_special_requests: form.notes || undefined,
        }),
      });
      const book = await bookRes.json();
      if (!bookRes.ok) throw new Error(book.error ?? 'Booking failed');

      router.push(`/checkout/success?code=${book.booking_code}`);
    } catch (e: any) {
      setError(e?.message ?? 'Booking failed');
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <section>
        <h2 className="mb-3 font-display text-lg font-bold">Lead guest</h2>
        <p className="mb-4 text-xs text-slate-500">
          We'll send the confirmation to this email. Please use the name as on the guest's ID.
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Given name" icon={<User className="h-4 w-4" />}>
            <input
              required
              value={form.given_name}
              onChange={(e) => setForm({ ...form, given_name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </Field>
          <Field label="Family name">
            <input
              required
              value={form.family_name}
              onChange={(e) => setForm({ ...form, family_name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </Field>
          <Field label="Email" icon={<Mail className="h-4 w-4" />}>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </Field>
          <Field label="Phone" icon={<Phone className="h-4 w-4" />}>
            <input
              type="tel"
              required
              value={form.phone_number}
              onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
              className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </Field>
        </div>
      </section>

      <section>
        <Field label="Special requests (optional)">
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Late check-in, high floor, twin beds..."
            className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </Field>
      </section>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
        <strong>Test mode:</strong> Booking is processed against Duffel test inventory. No real money is charged.
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 text-base font-semibold text-white transition hover:bg-brand-700 disabled:cursor-wait disabled:opacity-70"
      >
        {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
        {submitting ? `Booking ${accommodationName ?? ''}...` : 'Confirm & Book Now'}
      </button>
    </form>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-600">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}
