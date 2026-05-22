import { prisma } from '@/lib/prisma';
import { Link } from '@/i18n/routing';
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
      <h1 className="mb-6 font-display text-2xl font-bold">Destinations</h1>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {destinations.map((d) => (
          <div key={d.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {d.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={d.imageUrl} alt="" className="h-32 w-full object-cover" />
            )}
            <div className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <Link
                  href={`/destinations/${d.slug}` as any}
                  className="truncate font-medium text-slate-800 hover:text-brand-700"
                  target="_blank"
                >
                  {d.name}
                </Link>
                <CatalogToggle
                  type="destination"
                  id={d.id}
                  field="isFeatured"
                  value={d.isFeatured}
                />
              </div>
              <p className="text-xs text-slate-500">
                {d._count.tours} tours · {d._count.hotels} hotels
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                {d.region ?? d.country}
              </p>
            </div>
          </div>
        ))}
      </div>

      {destinations.length === 0 && (
        <p className="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center text-slate-500">
          No destinations yet.
        </p>
      )}
    </div>
  );
}
