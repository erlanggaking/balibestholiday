import { prisma } from '@/lib/prisma';
import { Link } from '@/i18n/routing';
import { Star } from 'lucide-react';
import { CatalogToggle, CatalogDeleteButton } from '@/components/admin/catalog-toggle';

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const sp = await searchParams;
  const filter = sp.filter ?? 'all';

  const where: any = {};
  if (filter === 'unverified') where.isVerified = false;
  if (filter === 'verified') where.isVerified = true;

  const reviews = await prisma.review
    .findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        tour: { select: { title: true, slug: true } },
        hotel: { select: { name: true, slug: true } },
        car: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    .catch(() => []);

  return (
    <div className="px-4 py-8 md:px-8">
      <h1 className="mb-6 font-display text-2xl font-bold">Reviews</h1>

      <div className="mb-4 flex gap-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'unverified', label: 'Pending verification' },
          { key: 'verified', label: 'Verified' },
        ].map((f) => (
          <a
            key={f.key}
            href={`?filter=${f.key}`}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
              filter === f.key
                ? 'bg-brand-600 text-white'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      <div className="space-y-3">
        {reviews.map((r) => {
          const product =
            r.tour?.title ?? r.hotel?.name ?? r.car?.name ?? '(no product)';
          const productSlug = r.tour?.slug ?? r.hotel?.slug ?? r.car?.slug;
          const productPath = r.tour
            ? `/tours/${productSlug}`
            : r.hotel
              ? `/hotels/${productSlug}`
              : `/cars/${productSlug}`;

          return (
            <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{r.user?.name ?? '—'}</span>
                  <span className="text-xs text-slate-500">{r.user?.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">
                    Verified
                  </span>
                  <CatalogToggle type="review" id={r.id} field="isVerified" value={r.isVerified} />
                  <CatalogDeleteButton
                    type="review"
                    id={r.id}
                    label="Delete"
                    confirmText="Permanently delete this review?"
                  />
                </div>
              </div>

              {r.title && <h3 className="font-medium">{r.title}</h3>}
              {r.comment && <p className="mt-1 text-sm text-slate-700">{r.comment}</p>}

              <p className="mt-2 text-xs text-slate-500">
                On{' '}
                {productSlug ? (
                  <Link href={productPath as any} className="text-brand-700 hover:underline" target="_blank">
                    {product}
                  </Link>
                ) : (
                  product
                )}{' '}
                · {r.createdAt.toLocaleDateString()}
              </p>
            </div>
          );
        })}

        {reviews.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center text-slate-500">
            No reviews yet.
          </div>
        )}
      </div>
    </div>
  );
}
