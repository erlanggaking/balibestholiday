import { prisma } from '@/lib/prisma';
import { Link } from '@/i18n/routing';
import { Wand2 } from 'lucide-react';
import { StatusBadge } from '@/components/admin/status-badge';

export default async function AdminCustomRequestsPage() {
  const requests = await prisma.customPackageRequest
    .findMany({ orderBy: { createdAt: 'desc' }, take: 100 })
    .catch(() => []);

  return (
    <div className="px-4 py-8 md:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Custom Package Requests</h1>
          <p className="text-sm text-slate-500">Customer-built itineraries awaiting quote.</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Customer</th>
              <th className="py-2.5">Travel dates</th>
              <th className="py-2.5">Travelers</th>
              <th className="py-2.5">Budget</th>
              <th className="py-2.5">Status</th>
              <th className="py-2.5 pr-4">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/custom-requests/${r.id}` as any} className="font-medium text-brand-700 hover:underline">
                    {r.guestName ?? '(no name)'}
                  </Link>
                  <p className="text-xs text-slate-500">{r.guestEmail}</p>
                </td>
                <td className="py-3 text-xs text-slate-600">
                  {r.startDate ? r.startDate.toLocaleDateString() : '—'}
                  {r.endDate && r.endDate.getTime() !== r.startDate?.getTime() && (
                    <> → {r.endDate.toLocaleDateString()}</>
                  )}
                </td>
                <td className="py-3 text-xs">
                  {r.travelersAdults} adult{r.travelersAdults !== 1 && 's'}
                  {r.travelersChild > 0 && `, ${r.travelersChild} child`}
                </td>
                <td className="py-3 text-xs">
                  {r.budget ? `${r.budgetCurrency === 'IDR' ? 'Rp' : '$'}${Number(r.budget).toLocaleString()}` : '—'}
                </td>
                <td className="py-3">
                  <StatusBadge status={r.status} />
                </td>
                <td className="py-3 pr-4 text-xs text-slate-500">
                  {r.createdAt.toLocaleDateString()}
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                  <Wand2 className="mx-auto mb-2 h-8 w-8 opacity-30" />
                  No custom requests yet. They&apos;ll appear here when customers submit
                  the &quot;Build my package&quot; form.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
