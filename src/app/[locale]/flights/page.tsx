import { FlightSearchForm } from '@/components/flight-search-form';

export const metadata = { title: 'Flights — Bali Best Holiday' };

export default function FlightsPage() {
  return (
    <div className="relative">
      <div className="bg-gradient-to-br from-ocean-700 via-ocean-600 to-brand-600 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="mb-2 font-display text-4xl font-bold text-white">
            Find your flight
          </h1>
          <p className="mb-8 text-ocean-100">
            Compare millions of flights from 300+ airlines, in real-time.
          </p>
          <FlightSearchForm />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="mb-4 font-display text-2xl font-bold">Popular routes</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { from: 'CGK', to: 'DPS', label: 'Jakarta → Bali' },
            { from: 'SIN', to: 'DPS', label: 'Singapore → Bali' },
            { from: 'KUL', to: 'DPS', label: 'KL → Bali' },
            { from: 'SYD', to: 'DPS', label: 'Sydney → Bali' },
          ].map((r) => (
            <div
              key={r.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-2 text-sm text-slate-500">Popular</div>
              <div className="text-lg font-semibold">{r.label}</div>
              <div className="mt-1 text-xs text-slate-500">
                {r.from} → {r.to}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
