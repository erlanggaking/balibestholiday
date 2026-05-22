import { prisma } from '@/lib/prisma';
import { Link } from '@/i18n/routing';
import { Search } from 'lucide-react';
import { CatalogToggle, CatalogDeleteButton } from '@/components/admin/catalog-toggle';

export default async function AdminCarsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? '').trim();

  const where: any = q
    ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { brand: { contains: q, mode: 'insensitive' } },
          { slug: { contains: q, mode: 'insensitive' } },
        ],
      }
    : {};

  const cars = await prisma.car
    .findMany({
      where,
      include: {
        images: { take: 1, orderBy: { sortOrder: 'asc' }, select: { url: true } },
        _count: { select: { bookingItems: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    })
    .catch(() => []);

  return (
    <div className="px-4 py-8 md:px-8">
      <h1 className="mb-6 font-display text-2xl font-bold">Cars</h1>

      <form className="mb-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search car name or brand…"
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
              <th className="px-4 py-2.5">Car</th>
              <th className="py-2.5">Brand</th>
              <th className="py-2.5">Year</th>
              <th className="py-2.5">Seats</th>
              <th className="py-2.5">Daily price</th>
              <th className="py-2.5">Bookings</th>
              <th className="py-2.5 text-center">Active</th>
              <th className="py-2.5 text-center">Featured</th>
              <th className="py-2.5 pr-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cars.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {c.images[0]?.url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.images[0].url} alt="" className="h-10 w-14 shrink-0 rounded object-cover" />
                    )}
                    <div>
                      <Link
                        href={`/cars/${c.slug}` as any}
                        className="font-medium text-slate-800 hover:text-brand-700"
                        target="_blank"
                      >
                        {c.name}
                      </Link>
                      <p className="text-[11px] text-slate-500">{c.transmission}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 text-xs text-slate-600">{c.brand}</td>
                <td className="py-3">{c.year}</td>
                <td className="py-3">{c.seats}</td>
                <td className="py-3 font-semibold">${Number(c.dailyPrice).toFixed(0)}</td>
                <td className="py-3">{c._count.bookingItems}</td>
                <td className="py-3 text-center">
                  <CatalogToggle type="car" id={c.id} field="isActive" value={c.isActive} />
                </td>
                <td className="py-3 text-center">
                  <CatalogToggle type="car" id={c.id} field="isFeatured" value={c.isFeatured} />
                </td>
                <td className="py-3 pr-4 text-right">
                  <CatalogDeleteButton type="car" id={c.id} label="Deactivate" confirmText={`Deactivate "${c.name}"?`} />
                </td>
              </tr>
            ))}
            {cars.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                  No cars.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
