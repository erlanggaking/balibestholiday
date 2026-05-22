import { prisma } from '@/lib/prisma';
import { Link } from '@/i18n/routing';
import { Plus } from 'lucide-react';
import { CatalogToggle } from '@/components/admin/catalog-toggle';

export default async function AdminDestinationsPage() {
  const destinations = await prisma.destination
    .findMany({
      include: { _count: { select: { tours: true, hotels: true } } },
      orderBy: { name: 'asc' },
    })
    .catch(() => []);

  return (
    <div className="px-4 py-8 md:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Destinations</h1>
        <Link href="/admin/destinations/new" className="flex items-center gap-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          <Plus className="h-4 w-4" /> New destination
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {destinations.map((d) => (
          <Link
            key={d.id}
            href={`/admin/destinations/${d.id}` as any}
            className="block overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:shadow-md"
          >
            {d.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={d.imageUrl} alt="" className="h-32 w-full object-cover" />
            ) : (
              <div className="flex h-32 w-full items-center justify-center bg-gradient-to-br from-brand-100 to-sunset-100 text-brand-700 opacity-60">
                <span className="text-4xl">📍</span>
              </div>
            )}
            <div className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="truncate font-medium text-slate-800">{d.name}</span>
                <CatalogToggle type="destination" id={d.id} field="isFeatured" value={d.isFeatured} />
              </div>
              <p className="text-xs text-slate-500">
                {d._count.tours} packages · {d._count.hotels} hotels
              </p>
              <p className="mt-1 text-[11px] text-slate-400">{d.region ?? d.country}</p>
            </div>
          </Link>
        ))}
      </div>

      {destinations.length === 0 && (
        <p className="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center text-slate-500">
          No destinations yet. Click &quot;New destination&quot; to add one.
        </p>
      )}
    </div>
  );
}
