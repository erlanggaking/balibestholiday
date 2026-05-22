import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { ArrowLeft, Mail, Phone, Users, DollarSign } from 'lucide-react';
import { StatusBadge } from '@/components/admin/status-badge';
import { CustomRequestActions } from '@/components/admin/custom-request-actions';

export default async function CustomRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const request = await prisma.customPackageRequest.findUnique({ where: { id } }).catch(() => null);
  if (!request) notFound();

  const destinationIds: string[] = (() => { try { return JSON.parse(request.destinationIds); } catch { return []; } })();
  const activityIds: string[] = (() => { try { return JSON.parse(request.activityIds); } catch { return []; } })();

  const [destinations, activities] = await Promise.all([
    destinationIds.length ? prisma.destination.findMany({ where: { id: { in: destinationIds } }, select: { id: true, name: true } }) : [],
    activityIds.length ? prisma.activity.findMany({ where: { id: { in: activityIds } }, select: { id: true, name: true } }) : [],
  ]);

  return (
    <div className="px-4 py-8 md:px-8">
      <Link href="/admin/custom-requests" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">{request.guestName ?? '(no name)'}</h1>
          <p className="text-sm text-slate-500">Custom package request</p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="mb-3 text-sm font-semibold">Trip details</h3>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Cell label="Travel dates" value={
                request.startDate ? `${request.startDate.toLocaleDateString()}${request.endDate ? ` — ${request.endDate.toLocaleDateString()}` : ''}` : '—'
              } />
              <Cell label="Travelers" value={`${request.travelersAdults} adult${request.travelersAdults !== 1 ? 's' : ''}${request.travelersChild > 0 ? `, ${request.travelersChild} child` : ''}`} />
              <Cell label="Budget" value={request.budget ? `${request.budgetCurrency === 'IDR' ? 'Rp' : '$'}${Number(request.budget).toLocaleString()}` : '—'} />
            </dl>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="mb-3 text-sm font-semibold">Preferred destinations ({destinations.length})</h3>
            <div className="flex flex-wrap gap-2">
              {destinations.map((d) => <span key={d.id} className="rounded-full bg-brand-50 px-3 py-1 text-sm text-brand-700">{d.name}</span>)}
              {destinations.length === 0 && <p className="text-sm text-slate-500">No specific destinations.</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="mb-3 text-sm font-semibold">Preferred activities ({activities.length})</h3>
            <div className="flex flex-wrap gap-2">
              {activities.map((a) => <span key={a.id} className="rounded-full bg-sunset-50 px-3 py-1 text-sm text-sunset-700">{a.name}</span>)}
              {activities.length === 0 && <p className="text-sm text-slate-500">No specific activities.</p>}
            </div>
          </div>

          {request.notes && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="mb-2 text-sm font-semibold">Customer notes</h3>
              <p className="whitespace-pre-wrap text-sm text-slate-700">{request.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <CustomRequestActions
            id={request.id}
            status={request.status}
            quoteAmount={request.quoteAmount}
            quoteCurrency={request.quoteCurrency}
            adminNotes={request.adminNotes}
          />

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="mb-3 text-sm font-semibold">Contact</h3>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" />{request.guestEmail ?? '—'}</p>
              <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" />{request.guestPhone ?? '—'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
