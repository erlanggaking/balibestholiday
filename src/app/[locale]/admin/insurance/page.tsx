import { prisma } from '@/lib/prisma';
import { Link } from '@/i18n/routing';
import { Plus, ShieldCheck } from 'lucide-react';
import { CatalogToggle } from '@/components/admin/catalog-toggle';

export default async function AdminInsurancePage() {
  const plans = await prisma.insurancePlan
    .findMany({ orderBy: [{ provider: 'asc' }, { pricePerDay: 'asc' }] })
    .catch(() => []);

  return (
    <div className="px-4 py-8 md:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Insurance Plans</h1>
          <p className="text-sm text-slate-500">{plans.length} plans</p>
        </div>
        <Link href="/admin/insurance/new" className="flex items-center gap-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          <Plus className="h-4 w-4" /> New plan
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Plan</th>
              <th className="py-2.5">Provider</th>
              <th className="py-2.5">Tier</th>
              <th className="py-2.5">Medical</th>
              <th className="py-2.5">Price/day</th>
              <th className="py-2.5 text-center">Active</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/insurance/${p.id}` as any} className="flex items-center gap-2 font-medium text-slate-800 hover:text-brand-700">
                    <ShieldCheck className="h-4 w-4 text-brand-500" /> {p.name}
                  </Link>
                </td>
                <td className="py-3 text-xs text-slate-600">{p.provider}</td>
                <td className="py-3">
                  <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[11px] font-semibold text-brand-700">{p.coverageType}</span>
                </td>
                <td className="py-3 text-xs">
                  {p.baseCurrency === 'IDR' ? 'Rp' : '$'}{Number(p.medicalCoverage).toLocaleString()}
                </td>
                <td className="py-3 font-semibold">
                  {p.baseCurrency === 'IDR' ? 'Rp' : '$'}{Number(p.pricePerDay).toLocaleString()}
                </td>
                <td className="py-3 text-center">
                  <CatalogToggle type="insurance" id={p.id} field="isActive" value={p.isActive} />
                </td>
              </tr>
            ))}
            {plans.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                  No insurance plans yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
