import { prisma } from '@/lib/prisma';
import { ProductCard } from '@/components/product-card';
import { getTranslations } from 'next-intl/server';

export const metadata = { title: 'Car Rentals' };

export default async function CarsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'nav' });

  const cars = await prisma.car
    .findMany({
      where: { isActive: true },
      include: { images: { take: 1 }, translations: true },
      orderBy: { isFeatured: 'desc' },
    })
    .catch(() => []);

  const tr = (item: any, key: string) =>
    item.translations.find((x: any) => x.languageCode === locale)?.[key];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-2 font-display text-3xl font-bold">{t('cars')}</h1>
      <p className="mb-8 text-slate-600">{cars.length} results</p>

      {cars.length === 0 ? (
        <p className="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center text-slate-500">
          No cars yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cars.map((c) => (
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
              badge={c.category}
            />
          ))}
        </div>
      )}
    </div>
  );
}
