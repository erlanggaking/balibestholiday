import { StaySearchForm } from '@/components/stay-search-form';

export const metadata = { title: 'Hotels & Stays — Bali Best Holiday' };

export default function HotelsPage() {
  return (
    <div>
      <div className="bg-gradient-to-br from-brand-600 via-brand-500 to-ocean-500 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="mb-2 font-display text-4xl font-bold text-white">
            Find your stay
          </h1>
          <p className="mb-8 text-brand-100">
            Real-time prices from 1M+ hotels worldwide.
          </p>
          <StaySearchForm />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="mb-4 font-display text-2xl font-bold">Top destinations</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {['Bali', 'Tokyo', 'Singapore', 'Bangkok', 'Dubai', 'Paris', 'Sydney', 'Bangkok'].map((c, i) => (
            <div
              key={i}
              className="aspect-[4/3] overflow-hidden rounded-2xl bg-cover bg-center shadow-sm"
              style={{
                backgroundImage: `url(https://source.unsplash.com/600x450/?${c},travel)`,
              }}
            >
              <div className="flex h-full items-end bg-gradient-to-t from-black/60 to-transparent p-4">
                <span className="font-display text-lg font-bold text-white">{c}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
