import { prisma } from '@/lib/prisma';
import { Link } from '@/i18n/routing';
import { Search, Plus } from 'lucide-react';
import { CatalogToggle, CatalogDeleteButton } from '@/components/admin/catalog-toggle';

const PAGE_SIZE = 25;

export default async function AdminToursPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? '').trim();
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);

  const where: any = q
    ? { OR: [{ title: { contains: q, mode: 'insensitive' } }, { slug: { contains: q, mode: 'insensitive' } }] }
    : {};

  const [tours, total] = await Promise.all([
    prisma.tour
      .findMany({
        where,
        include: {
          destination: { select: { name: true, slug: true } },
          images: { take: 1, orderBy: { sortOrder: 'asc' }, select: { url: true } },
          _count: { select: { bookingItems: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
      })
      .catch(() => []),
    prisma.tour.count({ where }).catch(() => 0),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="px-4 py-8 md:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Packages</h1>
          <p className="text-sm text-slate-500">{total} total</p>
        </div>
        <Link href="/admin/tours/new" className="flex items-center gap-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          <Plus className="h-4 w-4" /> New package
        </Link>
      </div>

      <form className="mb-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search title or slug…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-400"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Search
        </button>
        {q && (
          <a href="/admin/tours" className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
            Clear
          </a>
        )}
      </form>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Tour</th>
              <th className="py-2.5">Destination</th>
              <th className="py-2.5">Price</th>
              <th className="py-2.5">Bookings</th>
              <th className="py-2.5 text-center">Active</th>
              <th className="py-2.5 text-center">Featured</th>
              <th className="py-2.5 pr-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tours.map((t) => (
              <tr key={t.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {t.images[0]?.url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={t.images[0].url}
                        alt=""
                        className="h-10 w-14 shrink-0 rounded object-cover"
                      />
                    )}
                    <div className="min-w-0">
                      <Link
                        href={`/admin/tours/${t.id}` as any}
                        className="block truncate font-medium text-slate-800 hover:text-brand-700"
                      >
                        {t.title}
                      </Link>
                      <p className="truncate font-mono text-[11px] text-slate-500">{t.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 text-xs text-slate-600">{t.destination?.name ?? '—'}</td>
                <td className="py-3 font-semibold">${Number(t.basePrice).toFixed(0)}</td>
                <td className="py-3 text-sm">{t._count.bookingItems}</td>
                <td className="py-3 text-center">
                  <CatalogToggle type="tour" id={t.id} field="isActive" value={t.isActive} />
                </td>
                <td className="py-3 text-center">
                  <CatalogToggle type="tour" id={t.id} field="isFeatured" value={t.isFeatured} />
                </td>
                <td className="py-3 pr-4 text-right">
                  <CatalogDeleteButton
                    type="tour"
                    id={t.id}
                    label="Deactivate"
                    confirmText={`Deactivate "${t.title}"?`}
                  />
                </td>
              </tr>
            ))}
            {tours.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                  No tours found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} sp={sp} />
      )}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  sp,
}: {
  page: number;
  totalPages: number;
  sp: Record<string, string | undefined>;
}) {
  return (
    <div className="mt-4 flex justify-between text-sm">
      <p className="text-slate-500">Page {page} of {totalPages}</p>
      <div className="flex gap-2">
        {page > 1 && (
          <a
            href={`?${new URLSearchParams({ ...sp, page: String(page - 1) } as any)}`}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-50"
          >
            ← Previous
          </a>
        )}
        {page < totalPages && (
          <a
            href={`?${new URLSearchParams({ ...sp, page: String(page + 1) } as any)}`}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-50"
          >
            Next →
          </a>
        )}
      </div>
    </div>
  );
}
