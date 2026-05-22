'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronRight, Wand2, Send } from 'lucide-react';

type Destination = { id: string; name: string; imageUrl?: string | null; region?: string | null };
type Activity = { id: string; name: string; type: string; basePrice: number; baseCurrency: string; image?: string | null };

export function CustomPackageBuilder({
  destinations,
  activities,
}: {
  destinations: Destination[];
  activities: Activity[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    startDate: '',
    endDate: '',
    travelersAdults: 2,
    travelersChild: 0,
    budget: '',
    budgetCurrency: 'IDR',
    destinationIds: [] as string[],
    activityIds: [] as string[],
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function toggle(arr: string[], id: string): string[] {
    return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
  }

  async function submit() {
    setSubmitting(true);
    const res = await fetch('/api/custom-packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setSubmitting(false);
    if (res.ok) setDone(true);
    else alert('Submission failed. Please try again.');
  }

  if (done) {
    return (
      <div className="rounded-3xl border-2 border-emerald-200 bg-white p-12 text-center shadow-soft">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <Check className="h-8 w-8" />
        </div>
        <h2 className="mb-2 font-display text-3xl font-bold">Request received!</h2>
        <p className="mb-6 text-slate-600">
          Thanks {data.guestName}. We&apos;ll review your preferences and send you a tailored
          quote at <span className="font-semibold">{data.guestEmail}</span> within 24 hours.
        </p>
        <button onClick={() => router.push('/' as any)} className="rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700">
          Back to home
        </button>
      </div>
    );
  }

  // Stepper UI
  const steps = ['When & who', 'Destinations', 'Activities', 'Your details'];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft md:p-8">
      <div className="mb-6 flex items-center gap-2">
        {steps.map((label, i) => {
          const n = i + 1;
          return (
            <div key={n} className="flex flex-1 items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                n < step ? 'bg-emerald-500 text-white' :
                n === step ? 'bg-brand-600 text-white' :
                'bg-slate-100 text-slate-500'
              }`}>
                {n < step ? <Check className="h-4 w-4" /> : n}
              </div>
              <span className={`hidden text-xs font-semibold md:inline ${n === step ? 'text-slate-900' : 'text-slate-500'}`}>
                {label}
              </span>
              {i < steps.length - 1 && <div className={`flex-1 ${n < step ? 'bg-emerald-500' : 'bg-slate-200'} hidden h-0.5 md:block`} />}
            </div>
          );
        })}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h3 className="font-display text-2xl font-bold">When are you traveling?</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Start date">
              <input type="date" value={data.startDate} onChange={(e) => setData({ ...data, startDate: e.target.value })} className="input" />
            </Field>
            <Field label="End date">
              <input type="date" value={data.endDate} onChange={(e) => setData({ ...data, endDate: e.target.value })} className="input" />
            </Field>
            <Field label="Adults">
              <input type="number" min={1} value={data.travelersAdults} onChange={(e) => setData({ ...data, travelersAdults: Number(e.target.value) })} className="input" />
            </Field>
            <Field label="Children (under 12)">
              <input type="number" min={0} value={data.travelersChild} onChange={(e) => setData({ ...data, travelersChild: Number(e.target.value) })} className="input" />
            </Field>
            <Field label="Approximate budget per person (optional)">
              <input type="number" placeholder="e.g. 5,000,000" value={data.budget} onChange={(e) => setData({ ...data, budget: e.target.value })} className="input" />
            </Field>
            <Field label="Currency">
              <select value={data.budgetCurrency} onChange={(e) => setData({ ...data, budgetCurrency: e.target.value })} className="input">
                <option>IDR</option><option>USD</option><option>EUR</option><option>SGD</option><option>AUD</option>
              </select>
            </Field>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h3 className="mb-4 font-display text-2xl font-bold">Which areas excite you?</h3>
          <p className="mb-4 text-sm text-slate-600">Pick as many as you like. We&apos;ll build an itinerary that flows naturally.</p>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {destinations.map((d) => {
              const selected = data.destinationIds.includes(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setData({ ...data, destinationIds: toggle(data.destinationIds, d.id) })}
                  className={`relative overflow-hidden rounded-xl border-2 text-left transition ${
                    selected ? 'border-brand-500 ring-2 ring-brand-200' : 'border-slate-200 hover:border-brand-300'
                  }`}
                >
                  <div className="relative aspect-[4/3] bg-slate-100">
                    {d.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={d.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                    )}
                    {selected && (
                      <div className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-white">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-semibold">{d.name}</p>
                    {d.region && <p className="text-xs text-slate-500">{d.region}</p>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h3 className="mb-4 font-display text-2xl font-bold">What kinds of experiences?</h3>
          <p className="mb-4 text-sm text-slate-600">Tap any activity that interests you. Skip if you want surprises.</p>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {activities.map((a) => {
              const selected = data.activityIds.includes(a.id);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setData({ ...data, activityIds: toggle(data.activityIds, a.id) })}
                  className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition ${
                    selected ? 'border-sunset-500 bg-sunset-50' : 'border-slate-200 hover:border-sunset-300'
                  }`}
                >
                  {a.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.image} alt="" className="h-12 w-12 shrink-0 rounded object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{a.name}</p>
                    <p className="text-[11px] capitalize text-slate-500">{a.type}</p>
                  </div>
                  {selected && (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sunset-500 text-white">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <h3 className="font-display text-2xl font-bold">Almost done — your details</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Full name *">
              <input value={data.guestName} onChange={(e) => setData({ ...data, guestName: e.target.value })} className="input" />
            </Field>
            <Field label="Email *">
              <input type="email" value={data.guestEmail} onChange={(e) => setData({ ...data, guestEmail: e.target.value })} className="input" />
            </Field>
            <Field label="Phone (WhatsApp preferred)">
              <input value={data.guestPhone} onChange={(e) => setData({ ...data, guestPhone: e.target.value })} className="input" placeholder="+62 ..." />
            </Field>
          </div>
          <Field label="Anything special? (dietary needs, mobility, occasion…)">
            <textarea rows={4} value={data.notes} onChange={(e) => setData({ ...data, notes: e.target.value })} className="input" />
          </Field>

          <div className="rounded-xl bg-brand-50 p-4 text-sm text-brand-900">
            <p className="font-semibold">Your selection so far:</p>
            <p className="mt-1 text-xs">
              {data.destinationIds.length} destinations · {data.activityIds.length} activities ·
              {' '}{data.travelersAdults + data.travelersChild} traveler{data.travelersAdults + data.travelersChild !== 1 && 's'}
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-4">
        {step > 1 ? (
          <button onClick={() => setStep(step - 1)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50">
            ← Back
          </button>
        ) : <span />}

        {step < 4 ? (
          <button
            onClick={() => setStep(step + 1)}
            className="flex items-center gap-1 rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={submitting || !data.guestName || !data.guestEmail}
            className="flex items-center gap-2 rounded-lg bg-sunset-500 px-6 py-2.5 font-semibold text-white hover:bg-sunset-600 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {submitting ? 'Sending…' : 'Get my quote'}
          </button>
        )}
      </div>

      <style jsx>{`
        .input { width: 100%; border: 1px solid rgb(226,232,240); border-radius: 0.5rem; padding: 0.625rem 0.875rem; font-size: 0.95rem; }
        .input:focus { outline: none; border-color: rgb(50, 121, 255); box-shadow: 0 0 0 3px rgba(50,121,255,0.1); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}
