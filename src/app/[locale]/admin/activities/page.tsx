import { prisma } from '@/lib/prisma';
import { Link } from '@/i18n/routing';
import { Plus } from 'lucide-react';
import { CatalogToggle, CatalogDeleteButton } from '@/components/admin/catalog-toggle';

export default async function AdminActivitiesPage() {
  const activities = await prisma.activity
    .findMany({
      include: { destination: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' },
    })
    .catch(() => []);

  return (
    <div className="px-4 py-8 md:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Activities</h1>
          <p className="text-sm text-slate-500">Standalone activities + add-ons for packages.</p>
        </div>
        <Link href="/admin/activities/new" className="flex items-center gap-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          <Plus className="h-4 w-4" /> New activity
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Activity</th>
              <th className="py-2.5">Destination</th>
              <th className="py-2.5">Type</th>
              <th className="py-2.5">Duration</th>
              <th className="py-2.5">Price</th>
              <th className="py-2.5 text-center">Active</th>
              <th className="py-2.5 text-center">Featured</th>
              <th className="py-2.5 pr-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((a) => (
              <tr key={a.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <Link href={`/admin/activities/${a.id}` as any} className="font-medium text-slate-800 hover:text-brand-700">
                    {a.name}
                  </Link>
                  <p className="font-mono text-[11px] text-slate-500">{a.slug}</p>
                </td>
                <td className="py-3 text-xs text-slate-600">{a.destination?.name ?? '—'}</td>
                <td className="py-3 text-xs">
                  <span className="rounded bg-brand-50 px-1.5 py-0.5 text-brand-700">{a.type}</span>
                </td>
                <td className="py-3 text-xs">{a.durationHours}h</td>
                <td className="py-3 font-semibold">
                  {a.baseCurrency === 'IDR' ? 'Rp' : '$'}
                  {Number(a.basePrice).toLocaleString()}
                </td>
                <td className="py-3 text-center"><CatalogToggle type="activity" id={a.id} field="isActive" value={a.isActive} /></td>
                <td className="py-3 text-center"><CatalogToggle type="activity" id={a.id} field="isFeatured" value={a.isFeatured} /></td>
                <td className="py-3 pr-4 text-right">
                  <CatalogDeleteButton type="activity" id={a.id} confirmText={`Delete "${a.name}"?`} />
                </td>
              </tr>
            ))}
            {activities.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-500">No activities yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
