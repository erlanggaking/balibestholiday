'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, User, Mail, Phone } from 'lucide-react';

interface PassengerForm {
  type: string;
  title: 'mr' | 'mrs' | 'ms' | 'dr';
  given_name: string;
  family_name: string;
  born_on: string;
  gender: 'm' | 'f';
  email?: string;
  phone_number?: string;
}

interface Props {
  offerId: string;
  passengers: Array<{ id: string; type: string }>;
  identityRequired: boolean;
}

export function FlightCheckoutForm({ offerId, passengers, identityRequired }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contact, setContact] = useState({ email: '', phone_number: '' });
  const [paxList, setPaxList] = useState<PassengerForm[]>(
    passengers.map((p) => ({
      type: p.type,
      title: 'mr',
      given_name: '',
      family_name: '',
      born_on: '',
      gender: 'm',
    })),
  );

  const updatePax = (i: number, patch: Partial<PassengerForm>) => {
    setPaxList((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/bookings/flight', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          offerId,
          passengers: paxList,
          contact,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Booking failed');
      router.push(`/checkout/success?code=${json.booking_code}`);
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
        <h2 className="mb-3 font-display text-lg font-bold">Contact details</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Email" icon={<Mail className="h-4 w-4" />}>
            <input
              type="email"
              required
              value={contact.email}
              onChange={(e) => setContact({ ...contact, email: e.target.value })}
              className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              placeholder="you@email.com"
            />
          </Field>
          <Field label="Phone" icon={<Phone className="h-4 w-4" />}>
            <input
              type="tel"
              required
              value={contact.phone_number}
              onChange={(e) => setContact({ ...contact, phone_number: e.target.value })}
              className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              placeholder="+62 812 ..."
            />
          </Field>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-bold">Passenger details</h2>
        <p className="mb-4 text-xs text-slate-500">
          Please enter names exactly as they appear on the passenger's passport / ID.
          {identityRequired && (
            <span className="ml-1 font-semibold text-amber-700">
              Identity documents are required for this fare.
            </span>
          )}
        </p>
        <div className="space-y-4">
          {paxList.map((p, i) => (
            <div key={i} className="rounded-xl border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold">
                  <User className="h-4 w-4" />
                  Passenger {i + 1}
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs uppercase">
                  {p.type}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Field label="Title">
                  <select
                    value={p.title}
                    onChange={(e) => updatePax(i, { title: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-sm"
                  >
                    <option value="mr">Mr</option>
                    <option value="mrs">Mrs</option>
                    <option value="ms">Ms</option>
                    <option value="dr">Dr</option>
                  </select>
                </Field>
                <Field label="Given name">
                  <input
                    required
                    value={p.given_name}
                    onChange={(e) => updatePax(i, { given_name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-sm"
                  />
                </Field>
                <Field label="Family name">
                  <input
                    required
                    value={p.family_name}
                    onChange={(e) => updatePax(i, { family_name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-sm"
                  />
                </Field>
                <Field label="Date of birth">
                  <input
                    type="date"
                    required
                    value={p.born_on}
                    onChange={(e) => updatePax(i, { born_on: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-sm"
                  />
                </Field>
              </div>
              <div className="mt-3">
                <Field label="Gender">
                  <select
                    value={p.gender}
                    onChange={(e) => updatePax(i, { gender: e.target.value as any })}
                    className="w-full max-w-xs rounded-xl border border-slate-200 py-2.5 px-3 text-sm"
                  >
                    <option value="m">Male</option>
                    <option value="f">Female</option>
                  </select>
                </Field>
              </div>
            </div>
          ))}
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
        <strong>Test mode:</strong> Booking will be created using Duffel test inventory and your
        Duffel test balance. No real money is charged. In production, this would route through Stripe.
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 text-base font-semibold text-white transition hover:bg-brand-700 disabled:cursor-wait disabled:opacity-70"
      >
        {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
        {submitting ? 'Booking...' : 'Confirm & Book Now'}
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
