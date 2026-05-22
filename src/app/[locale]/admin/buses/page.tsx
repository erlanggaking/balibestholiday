import { prisma } from '@/lib/prisma';
import { Link } from '@/i18n/routing';
import { Plus, Bus } from 'lucide-react';
import { CatalogToggle } from '@/components/admin/catalog-toggle';

export default async function AdminBusesPage() {
  const operators = await prisma.busOperator
    .findMany({
      include: {
        _count: { select: { routes: true } },
        routes: { include: { _count: { select: { schedules: true } } } },
      },
      orderBy: { name: 'asc' },
    })
    .catch(() => []);

  return (
    <div className="px-4 py-8 md:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Bus Travel</h1>
          <p className="text-sm text-slate-500">Manage bus operators, routes, and schedules.</p>
        </div>
        <Link href="/admin/buses/new" className="flex items-center gap-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          <Plus className="h-4 w-4" /> New operator
        </Link>
      </div>

      <div className="space-y-3">
        {operators.map((op) => (
          <div key={op.id} className="rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <div className="flex items-center gap-3">
                {op.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={op.logoUrl} alt="" className="h-10 w-10 rounded object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-brand-50 text-brand-700">
                    <Bus className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <Link href={`/admin/buses/${op.id}` as any} className="font-semibold hover:text-brand-700">
                    {op.name}
                  </Link>
                  <p className="text-xs text-slate-500">{op._count.routes} routes</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CatalogToggle type="busoperator" id={op.id} field="isActive" value={op.isActive} />
                <Link href={`/admin/buses/${op.id}` as any} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50">
                  Manage
                </Link>
              </div>
            </div>
            {op.routes.length > 0 && (
              <div className="divide-y divide-slate-100 text-sm">
                {op.routes.slice(0, 3).map((r) => (
                  <div key={r.id} className="flex items-center justify-between px-4 py-2">
                    <span>
                      <span className="font-medium">{r.fromCity}</span>
                      {' → '}
                      <span className="font-medium">{r.toCity}</span>
                      <span className="ml-2 text-xs text-slate-500">
                        {r.busType} · {Math.round(r.durationMinutes / 60)}h · {r._count.schedules} schedules
                      </span>
                    </span>
                    <span className="text-xs font-semibold">
                      {r.baseCurrency === 'IDR' ? 'Rp' : '$'}
                      {Number(r.basePrice).toLocaleString()}
                    </span>
                  </div>
                ))}
                {op.routes.length > 3 && (
                  <div className="px-4 py-2 text-xs text-slate-500">+ {op.routes.length - 3} more routes</div>
                )}
              </div>
            )}
          </div>
        ))}
        {operators.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center text-slate-500">
            No bus operators yet.
          </div>
        )}
      </div>
    </div>
  );
}
