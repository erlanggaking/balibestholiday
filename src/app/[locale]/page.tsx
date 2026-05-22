import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { HeroSearch } from '@/components/hero-search';
import { ProductCard } from '@/components/product-card';
import { prisma } from '@/lib/prisma';
import { ShieldCheck, Headphones, Award, Lock, ArrowRight } from 'lucide-react';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  const tProduct = await getTranslations({ locale, namespace: 'product' });

  const [featuredTours, featuredHotels, popularCars, destinations] = await Promise.all([
    prisma.tour
      .findMany({
        where: { isActive: true, isFeatured: true },
        include: { images: { take: 1, orderBy: { sortOrder: 'asc' } }, translations: true },
        take: 8,
      })
      .catch(() => []),
    prisma.hotel
      .findMany({
        where: { isActive: true, isFeatured: true },
        include: { images: { take: 1, orderBy: { sortOrder: 'asc' } }, translations: true },
        take: 8,
      })
      .catch(() => []),
    prisma.car
      .findMany({
        where: { isActive: true, isFeatured: true },
        include: { images: { take: 1, orderBy: { sortOrder: 'asc' } }, translations: true },
        take: 8,
      })
      .catch(() => []),
    prisma.destination
      .findMany({
        where: { isFeatured: true },
        include: { translations: true, _count: { select: { tours: true, hotels: true } } },
        take: 6,
      })
      .catch(() => []),
  ]);

  const tr = <T extends { translations: { languageCode: string }[] }, K extends keyof T['translations'][number]>(
    item: T,
    key: K,
  ): any => {
    const t = item.translations.find((tr) => tr.languageCode === locale);
    return (t as any)?.[key];
  };

  return (
    <>
      {/* HERO */}
      <section className="relative">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1920&q=80"
            alt="Bali"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/60" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-24 text-white sm:px-6 lg:px-8 lg:py-36">
          <h1 className="mb-4 max-w-3xl font-display text-4xl font-bold leading-tight md:text-6xl">
            {t('heroTitle')}
          </h1>
          <p className="mb-8 max-w-2xl text-lg text-white/90 md:text-xl">{t('heroSubtitle')}</p>
          <HeroSearch />
        </div>
      </section>

      {/* WHY US */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="mb-8 font-display text-3xl font-bold">{t('whyUs')}</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Feature icon={<Award className="h-6 w-6" />} title={t('whyUs1Title')} desc={t('whyUs1Desc')} />
          <Feature icon={<Headphones className="h-6 w-6" />} title={t('whyUs2Title')} desc={t('whyUs2Desc')} />
          <Feature icon={<ShieldCheck className="h-6 w-6" />} title={t('whyUs3Title')} desc={t('whyUs3Desc')} />
          <Feature icon={<Lock className="h-6 w-6" />} title={t('whyUs4Title')} desc={t('whyUs4Desc')} />
        </div>
      </section>

      {/* DESTINATIONS */}
      {destinations.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <SectionHeader title="Destinations in Bali" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {destinations.map((d) => (
              <Link
                key={d.id}
                href={`/destinations/${d.slug}` as any}
                className="group relative aspect-square overflow-hidden rounded-xl"
              >
                <Image
                  src={d.imageUrl ?? 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=400'}
                  alt={d.name}
                  fill
                  className="object-cover transition group-hover:scale-105"
                  sizes="(max-width: 1024px) 50vw, 16vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2 text-white">
                  <p className="text-sm font-semibold">{tr(d, 'name') ?? d.name}</p>
                  <p className="text-xs opacity-90">{d._count.tours + d._count.hotels} listings</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* FEATURED TOURS */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <SectionHeader title={t('featuredTours')} viewAllHref="/tours" viewAllLabel={t('viewAll')} />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featuredTours.length === 0 && <EmptyState />}
          {featuredTours.map((tour) => (
            <ProductCard
              key={tour.id}
              type="tour"
              slug={tour.slug}
              title={tr(tour, 'title') ?? tour.title}
              imageUrl={tour.images[0]?.url ?? 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=600'}
              rating={Number(tour.rating)}
              reviews={tour.totalReviews}
              priceUSD={Number(tour.basePrice)}
              priceLabel="perPerson"
              meta={[
                { icon: 'clock', text: tour.durationDays > 1 ? `${tour.durationDays}D` : `${tour.durationHours}h` },
                { icon: 'users', text: `${tour.maxGroupSize}` },
              ]}
            />
          ))}
        </div>
      </section>

      {/* FEATURED HOTELS */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <SectionHeader title={t('featuredHotels')} viewAllHref="/hotels" viewAllLabel={t('viewAll')} />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featuredHotels.length === 0 && <EmptyState />}
          {featuredHotels.map((h) => (
            <ProductCard
              key={h.id}
              type="hotel"
              slug={h.slug}
              title={tr(h, 'name') ?? h.name}
              imageUrl={h.images[0]?.url ?? 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600'}
              rating={Number(h.rating)}
              reviews={h.totalReviews}
              priceUSD={Number(h.basePrice)}
              priceLabel="perNight"
              badge={`${h.starRating}★`}
            />
          ))}
        </div>
      </section>

      {/* POPULAR CARS */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <SectionHeader title={t('popularCars')} viewAllHref="/cars" viewAllLabel={t('viewAll')} />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {popularCars.length === 0 && <EmptyState />}
          {popularCars.map((c) => (
            <ProductCard
              key={c.id}
              type="car"
              slug={c.slug}
              title={tr(c, 'name') ?? c.name}
              imageUrl={c.images[0]?.url ?? 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600'}
              rating={Number(c.rating)}
              reviews={c.totalReviews}
              priceUSD={Number(c.dailyPrice)}
              priceLabel="perDay"
              meta={[{ icon: 'users', text: `${c.seats}` }]}
            />
          ))}
        </div>
      </section>
    </>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
        {icon}
      </div>
      <h3 className="mb-1 font-semibold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-600">{desc}</p>
    </div>
  );
}

function SectionHeader({
  title,
  viewAllHref,
  viewAllLabel,
}: {
  title: string;
  viewAllHref?: string;
  viewAllLabel?: string;
}) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h2 className="font-display text-2xl font-bold md:text-3xl">{title}</h2>
      {viewAllHref && (
        <Link
          href={viewAllHref as any}
          className="flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
        >
          {viewAllLabel} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center text-slate-500">
      No data yet. Run <code className="rounded bg-slate-100 px-1.5 py-0.5">npm run db:seed</code> to load samples.
    </div>
  );
}
