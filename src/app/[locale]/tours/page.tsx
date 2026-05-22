import { prisma } from '@/lib/prisma';
import { ProductCard } from '@/components/product-card';
import { getTranslations } from 'next-intl/server';

export const metadata = { title: 'Tours' };

export default async function ToursPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: 'nav' });

  const where: any = { isActive: true };
  if (sp.q) {
    where.OR = [
      { title: { contains: sp.q, mode: 'insensitive' } },
      { destination: { name: { contains: sp.q, mode: 'insensitive' } } },
    ];
  }

  const tours = await prisma.tour
    .findMany({
      where,
      include: { images: { take: 1 }, translations: true, destination: true },
      orderBy: { isFeatured: 'desc' },
    })
    .catch(() => []);

  const tr = (item: any, key: string) =>
    item.translations.find((x: any) => x.languageCode === locale)?.[key];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-2 font-display text-3xl font-bold">{t('tours')}</h1>
      <p className="mb-8 text-slate-600">{tours.length} results</p>

      {tours.length === 0 ? (
        <p className="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center text-slate-500">
          No tours yet — seed the database first.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tours.map((tour) => (
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
      )}
    </div>
  );
}
