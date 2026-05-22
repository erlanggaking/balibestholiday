import { prisma } from '@/lib/prisma';
import { Link } from '@/i18n/routing';
import { Search } from 'lucide-react';
import { CatalogToggle, CatalogDeleteButton } from '@/components/admin/catalog-toggle';

const PAGE_SIZE = 25;

export default async function AdminHotelsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? '').trim();
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);

  const where: any = q
    ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { slug: { contains: q, mode: 'insensitive' } }] }
    : {};

  const [hotels, total] = await Promise.all([
    prisma.hotel
      .findMany({
        where,
        include: {
          destination: { select: { name: true } },
          images: { take: 1, orderBy: { sortOrder: 'asc' }, select: { url: true } },
          _count: { select: { rooms: true, bookingItems: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
      })
      .catch(() => []),
    prisma.hotel.count({ where }).catch(() => 0),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="px-4 py-8 md:px-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Hotels</h1>
        <p className="text-sm text-slate-500">{total} total</p>
      </div>

      <form className="mb-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search hotel name or slug…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Search
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Hotel</th>
              <th className="py-2.5">Destination</th>
              <th className="py-2.5">Stars</th>
              <th className="py-2.5">Rooms</th>
              <th className="py-2.5">Price/night</th>
              <th className="py-2.5">Bookings</th>
              <th className="py-2.5 text-center">Active</th>
              <th className="py-2.5 text-center">Featured</th>
              <th className="py-2.5 pr-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {hotels.map((h) => (
              <tr key={h.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {h.images[0]?.url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={h.images[0].url} alt="" className="h-10 w-14 shrink-0 rounded object-cover" />
                    )}
                    <div>
                      <Link
                        href={`/hotels/${h.slug}` as any}
                        className="font-medium text-slate-800 hover:text-brand-700"
                        target="_blank"
                      >
                        {h.name}
                      </Link>
                      <p className="font-mono text-[11px] text-slate-500">{h.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 text-xs text-slate-600">{h.destination?.name ?? '—'}</td>
                <td className="py-3">{'★'.repeat(h.starRating)}</td>
                <td className="py-3">{h._count.rooms}</td>
                <td className="py-3 font-semibold">${Number(h.basePrice).toFixed(0)}</td>
                <td className="py-3">{h._count.bookingItems}</td>
                <td className="py-3 text-center">
                  <CatalogToggle type="hotel" id={h.id} field="isActive" value={h.isActive} />
                </td>
                <td className="py-3 text-center">
                  <CatalogToggle type="hotel" id={h.id} field="isFeatured" value={h.isFeatured} />
                </td>
                <td className="py-3 pr-4 text-right">
                  <CatalogDeleteButton type="hotel" id={h.id} label="Deactivate" confirmText={`Deactivate "${h.name}"?`} />
                </td>
              </tr>
            ))}
            {hotels.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                  No hotels found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
