import { prisma } from '@/lib/prisma';
import { Link } from '@/i18n/routing';
import { Sparkles, Clock, Users } from 'lucide-react';

export const revalidate = 300;

export const metadata = { title: 'Activities · Bali Best Holiday' };

export default async function ActivitiesPage() {
  const activities = await prisma.activity
    .findMany({
      where: { isActive: true },
      include: {
        destination: { select: { name: true } },
        images: { take: 1, orderBy: { sortOrder: 'asc' } },
      },
      orderBy: [{ isFeatured: 'desc' }, { rating: 'desc' }],
      take: 50,
    })
    .catch(() => []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-sunset-100 px-4 py-1.5 text-xs font-semibold text-sunset-700">
          <Sparkles className="h-3.5 w-3.5" /> Adventures await
        </span>
        <h1 className="mt-3 font-display text-4xl font-bold md:text-5xl">Bali Activities</h1>
        <p className="mx-auto mt-2 max-w-2xl text-slate-600">
          Discover unforgettable experiences from snorkeling Nusa Penida cliffs to
          sunset cooking classes in Ubud.
        </p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {activities.map((a) => (
          <Link
            key={a.id}
            href={`/activities/${a.slug}` as any}
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:shadow-lg"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              {a.images[0]?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.images[0].url}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-100 to-sunset-100 text-brand-700">
                  <Sparkles className="h-12 w-12 opacity-60" />
                </div>
              )}
              <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-semibold capitalize text-slate-700 backdrop-blur">
                {a.type}
              </span>
              {a.isFeatured && (
                <span className="absolute right-3 top-3 rounded-full bg-sunset-500 px-2.5 py-0.5 text-[11px] font-bold text-white">
                  Featured
                </span>
              )}
            </div>
            <div className="p-4">
              {a.destination && <p className="mb-1 text-xs text-slate-500">📍 {a.destination.name}</p>}
              <h3 className="line-clamp-1 font-display text-lg font-bold">{a.name}</h3>
              {a.shortDesc && <p className="mt-1 line-clamp-2 text-sm text-slate-600">{a.shortDesc}</p>}
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {a.durationHours}h
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" /> max {a.maxGroupSize}
                </span>
                <span className="font-display text-base font-bold text-slate-900">
                  {a.baseCurrency === 'IDR' ? 'Rp' : '$'}
                  {Number(a.basePrice).toLocaleString()}
                </span>
              </div>
            </div>
          </Link>
        ))}
        {activities.length === 0 && (
          <p className="col-span-full rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center text-slate-500">
            No activities yet. Check back soon.
          </p>
        )}
      </div>
    </div>
  );
}
