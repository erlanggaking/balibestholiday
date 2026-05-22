import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { ProductCard } from '@/components/product-card';
import { MapPin } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export const revalidate = 600;

export default async function DestinationDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const tHome = await getTranslations({ locale, namespace: 'home' });

  const destination = await prisma.destination
    .findUnique({
      where: { slug },
      include: {
        translations: true,
        tours: {
          where: { isActive: true },
          take: 12,
          include: { images: { take: 1, orderBy: { sortOrder: 'asc' } }, translations: true },
          orderBy: [{ isFeatured: 'desc' }, { rating: 'desc' }],
        },
        hotels: {
          where: { isActive: true },
          take: 12,
          include: { images: { take: 1, orderBy: { sortOrder: 'asc' } }, translations: true },
          orderBy: [{ isFeatured: 'desc' }, { rating: 'desc' }],
        },
      },
    })
    .catch(() => null);

  if (!destination) notFound();

  const tr = (key: string) =>
    destination.translations.find((x) => x.languageCode === locale)?.[
      key as keyof typeof destination.translations[number]
    ];
  const trItem = <T extends { translations: { languageCode: string }[] }>(
    item: T,
    key: string,
  ): string | null => {
    const found = item.translations.find((t: any) => t.languageCode === locale);
    return (found as any)?.[key] ?? null;
  };

  const name = (tr('name') as string) ?? destination.name;
  const description = (tr('description') as string) ?? destination.description ?? '';

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[40vh] min-h-[280px] w-full overflow-hidden md:h-[55vh]">
        <Image
          src={destination.imageUrl ?? 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=1920&q=80'}
          alt={name}
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/70" />
        <div className="absolute inset-0 flex items-end">
          <div className="mx-auto w-full max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
            <div className="mb-2 flex items-center gap-2 text-sm text-white/80">
              <MapPin className="h-4 w-4" />
              {destination.region ? `${destination.region} · ` : ''}{destination.country}
            </div>
            <h1 className="font-display text-4xl font-bold text-white md:text-5xl">{name}</h1>
            {description && (
              <p className="mt-3 max-w-2xl text-white/90">{description}</p>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Tours */}
        <section className="mb-12">
          <h2 className="mb-4 font-display text-2xl font-bold">{tHome('featuredTours')}</h2>
          {destination.tours.length === 0 ? (
            <EmptyMessage message={tHome('emptyDataInfo')} />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {destination.tours.map((tour) => (
                <ProductCard
                  key={tour.id}
                  type="tour"
                  slug={tour.slug}
                  title={trItem(tour, 'title') ?? tour.title}
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
          )}
        </section>

        {/* Hotels */}
        <section>
          <h2 className="mb-4 font-display text-2xl font-bold">{tHome('featuredHotels')}</h2>
          {destination.hotels.length === 0 ? (
            <EmptyMessage message={tHome('emptyDataInfo')} />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {destination.hotels.map((h) => (
                <ProductCard
                  key={h.id}
                  type="hotel"
                  slug={h.slug}
                  title={trItem(h, 'name') ?? h.name}
                  imageUrl={h.images[0]?.url ?? 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600'}
                  rating={Number(h.rating)}
                  reviews={h.totalReviews}
                  priceUSD={Number(h.basePrice)}
                  priceLabel="perNight"
                  badge={`${h.starRating}★`}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function EmptyMessage({ message }: { message: string }) {
  return (
    <p className="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center text-slate-500">
      {message}
    </p>
  );
}
