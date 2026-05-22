import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Star, Clock, Users, MapPin, Check, X } from 'lucide-react';
import { Price } from '@/components/price';
import { getTranslations } from 'next-intl/server';
import { BookTourBox } from '@/components/book-tour-box';

export default async function TourDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: 'product' });

  const tour = await prisma.tour
    .findUnique({
      where: { slug },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        translations: true,
        destination: { include: { translations: true } },
        category: true,
        reviews: { include: { user: true }, orderBy: { createdAt: 'desc' }, take: 5 },
      },
    })
    .catch(() => null);

  if (!tour) notFound();

  const tr = (key: string) =>
    tour.translations.find((x) => x.languageCode === locale)?.[key as keyof typeof tour.translations[number]];

  const parseList = (v: unknown): string[] => {
    if (Array.isArray(v)) return v as string[];
    if (typeof v === 'string') {
      try { const j = JSON.parse(v); return Array.isArray(j) ? j : []; } catch { return []; }
    }
    return [];
  };

  const title = (tr('title') as string) ?? tour.title;
  const description = (tr('description') as string) ?? tour.description ?? '';
  const highlights = parseList(tr('highlights') ?? tour.highlights);
  const included = parseList(tr('included') ?? tour.included);
  const excluded = parseList(tr('excluded') ?? tour.excluded);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Gallery */}
      <div className="mb-8 grid grid-cols-1 gap-2 md:grid-cols-4 md:gap-3">
        <div className="relative col-span-full aspect-[16/9] overflow-hidden rounded-2xl md:col-span-2 md:row-span-2 md:aspect-auto">
          <Image
            src={tour.images[0]?.url ?? 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=1200'}
            alt={title}
            fill
            priority
            className="object-cover"
          />
        </div>
        {tour.images.slice(1, 5).map((img) => (
          <div key={img.id} className="relative hidden aspect-[4/3] overflow-hidden rounded-xl md:block">
            <Image src={img.url} alt={img.alt ?? title} fill className="object-cover" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          <h1 className="mb-2 font-display text-3xl font-bold md:text-4xl">{title}</h1>
          <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-slate-600">
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-slate-900">{Number(tour.rating).toFixed(1)}</span>
              ({tour.totalReviews} {t('reviews').toLowerCase()})
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {tour.destination.name}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {tour.durationDays > 1 ? `${tour.durationDays} days` : `${tour.durationHours} hours`}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" /> Max {tour.maxGroupSize}
            </span>
          </div>

          <section className="mb-8">
            <h2 className="mb-3 text-xl font-bold">{t('highlights')}</h2>
            <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {highlights.map((h: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" /> {h}
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-xl font-bold">{t('description')}</h2>
            <p className="whitespace-pre-line text-slate-700">{description}</p>
          </section>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <section>
              <h2 className="mb-3 text-xl font-bold">{t('included')}</h2>
              <ul className="space-y-2">
                {included.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" /> {item}
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h2 className="mb-3 text-xl font-bold">{t('excluded')}</h2>
              <ul className="space-y-2">
                {excluded.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-500" /> {item}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {tour.reviews.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-3 text-xl font-bold">{t('reviews')}</h2>
              <div className="space-y-4">
                {tour.reviews.map((r) => (
                  <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-semibold">{r.user.name ?? 'Anonymous'}</span>
                      <span className="flex items-center gap-0.5">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </span>
                    </div>
                    {r.title && <p className="font-medium">{r.title}</p>}
                    <p className="text-sm text-slate-600">{r.comment}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <BookTourBox
            tourId={tour.id}
            title={title}
            priceUSD={Number(tour.basePrice)}
            childPriceUSD={tour.childPrice ? Number(tour.childPrice) : null}
            maxGroupSize={tour.maxGroupSize}
          />
        </aside>
      </div>
    </div>
  );
}
