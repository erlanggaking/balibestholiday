import { prisma } from '@/lib/prisma';
import { Bus, Wifi, Snowflake, Coffee } from 'lucide-react';

export const revalidate = 300;
export const metadata = { title: 'Bus Travel · Bali Best Holiday' };

export default async function BusesPage() {
  const routes = await prisma.busRoute
    .findMany({
      where: { isActive: true, operator: { isActive: true } },
      include: {
        operator: { select: { name: true, logoUrl: true } },
        _count: { select: { schedules: true } },
      },
      orderBy: [{ fromCity: 'asc' }, { basePrice: 'asc' }],
      take: 100,
    })
    .catch(() => []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-1.5 text-xs font-semibold text-brand-700">
          <Bus className="h-3.5 w-3.5" /> Comfortable journeys
        </span>
        <h1 className="mt-3 font-display text-4xl font-bold md:text-5xl">Bus Travel</h1>
        <p className="mx-auto mt-2 max-w-2xl text-slate-600">
          Travel between Bali&apos;s top spots in air-conditioned comfort. Pre-book
          your seat, choose pickup point, save with us.
        </p>
      </header>

      <div className="space-y-3">
        {routes.map((r) => {
          let amenities: string[] = [];
          try { amenities = JSON.parse(r.amenities); } catch {}
          return (
            <div
              key={r.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-center gap-4">
                {r.operator.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.operator.logoUrl} alt="" className="h-12 w-12 rounded object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded bg-brand-50 text-brand-700">
                    <Bus className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <p className="font-display text-xl font-bold">
                    {r.fromCity} → {r.toCity}
                  </p>
                  <p className="text-sm text-slate-600">
                    {r.operator.name} · {r.busType} · {Math.round(r.durationMinutes / 60)}h{' '}
                    {r.durationMinutes % 60 > 0 ? `${r.durationMinutes % 60}m` : ''}
                  </p>
                  {amenities.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                      {amenities.map((a) => (
                        <span key={a} className="inline-flex items-center gap-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">
                          {a.toLowerCase().includes('wifi') ? <Wifi className="h-3 w-3" /> :
                           a.toLowerCase().includes('ac') ? <Snowflake className="h-3 w-3" /> :
                           a.toLowerCase().includes('snack') || a.toLowerCase().includes('drink') ? <Coffee className="h-3 w-3" /> : null}
                          {a}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 md:gap-6">
                <div className="text-right">
                  <p className="font-display text-2xl font-bold text-brand-700">
                    {r.baseCurrency === 'IDR' ? 'Rp' : '$'}
                    {Number(r.basePrice).toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500">{r._count.schedules} departures/week</p>
                </div>
                <button className="rounded-lg bg-sunset-500 px-5 py-2 font-semibold text-white hover:bg-sunset-600">
                  Book seat
                </button>
              </div>
            </div>
          );
        })}
        {routes.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center text-slate-500">
            <Bus className="mx-auto mb-2 h-10 w-10 opacity-40" />
            No bus routes published yet. Check back soon.
          </div>
        )}
      </div>
    </div>
  );
}
