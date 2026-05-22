import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Star, Users, Briefcase, Fuel, Settings, Calendar, MapPin } from 'lucide-react';
import { Price } from '@/components/price';
import { getTranslations } from 'next-intl/server';

export const revalidate = 600;

export default async function CarDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: 'product' });

  const car = await prisma.car
    .findUnique({
      where: { slug },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        translations: true,
      },
    })
    .catch(() => null);

  if (!car) notFound();

  const tr = (key: string) =>
    car.translations.find((x) => x.languageCode === locale)?.[key as keyof typeof car.translations[number]];

  const parseList = (v: unknown): string[] => {
    if (Array.isArray(v)) return v as string[];
    if (typeof v === 'string') {
      try { const j = JSON.parse(v); return Array.isArray(j) ? j : []; } catch { return []; }
    }
    return [];
  };

  const name = (tr('name') as string) ?? car.name;
  const description = (tr('description') as string) ?? car.description ?? '';
  const features = parseList(car.features);
  const pickupLocations = parseList(car.pickupLocations);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Gallery */}
      <div className="mb-8 grid grid-cols-1 gap-2 md:grid-cols-4 md:gap-3">
        <div className="relative col-span-full aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100 md:col-span-2 md:row-span-2 md:aspect-[4/3]">
          <Image
            src={car.images[0]?.url ?? 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200'}
            alt={name}
            fill
            priority
            className="object-cover"
          />
        </div>
        {car.images.slice(1, 5).map((img) => (
          <div key={img.id} className="relative hidden aspect-[4/3] overflow-hidden rounded-xl bg-slate-100 md:block">
            <Image src={img.url} alt={img.alt ?? name} fill className="object-cover" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <h1 className="mb-2 font-display text-3xl font-bold md:text-4xl">{name}</h1>

          <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-slate-600">
            {Number(car.rating) > 0 && (
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-slate-900">{Number(car.rating).toFixed(1)}</span>
                <span className="text-slate-500">({car.totalReviews})</span>
              </span>
            )}
            <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
              {car.category}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
              {car.year}
            </span>
          </div>

          {/* Specs */}
          <div className="mb-8 grid grid-cols-2 gap-4 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-4">
            <Spec icon={<Users className="h-5 w-5" />} label={t('groupSize')} value={`${car.seats}`} />
            <Spec icon={<Briefcase className="h-5 w-5" />} label="Luggage" value={`${car.luggage}`} />
            <Spec icon={<Settings className="h-5 w-5" />} label="Transmission" value={car.transmission} />
            <Spec icon={<Fuel className="h-5 w-5" />} label="Fuel" value={car.fuelType} />
          </div>

          {description && (
            <section className="mb-8">
              <h2 className="mb-3 text-xl font-bold">{t('description')}</h2>
              <p className="whitespace-pre-line text-slate-700">{description}</p>
            </section>
          )}

          {features.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 text-xl font-bold">{t('amenities')}</h2>
              <ul className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                    {f}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {pickupLocations.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-xl font-bold">
                <MapPin className="h-5 w-5" /> Pickup locations
              </h2>
              <ul className="flex flex-wrap gap-2">
                {pickupLocations.map((loc, i) => (
                  <li key={i} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                    {loc}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <div className="text-xs text-slate-500">{t('from')}</div>
              <div className="font-display text-3xl font-bold text-brand-700">
                <Price amountUSD={Number(car.dailyPrice)} />
              </div>
              <div className="text-xs text-slate-500">{t('perDay')}</div>
            </div>
            {car.withDriver && (
              <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                ✓ Driver included
              </p>
            )}
            <a
              href={`mailto:bookings@balibestholiday.com?subject=${encodeURIComponent('Car booking — ' + name)}`}
              className="block w-full rounded-lg bg-brand-600 py-3 text-center text-sm font-semibold text-white hover:bg-brand-700"
            >
              {t('bookNow')}
            </a>
            <p className="mt-3 text-center text-xs text-slate-500">
              <Calendar className="mr-1 inline h-3.5 w-3.5" />
              Free cancellation up to 24h
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Spec({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        {icon}
      </span>
      <div>
        <div className="text-[11px] text-slate-500">{label}</div>
        <div className="text-sm font-semibold text-slate-900">{value}</div>
      </div>
    </div>
  );
}
