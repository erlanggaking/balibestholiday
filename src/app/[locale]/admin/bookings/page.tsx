import { prisma } from '@/lib/prisma';
import { Link } from '@/i18n/routing';
import { Search, Calendar, Filter } from 'lucide-react';
import { StatusBadge } from '@/components/admin/status-badge';

const PAGE_SIZE = 25;
const STATUSES = ['', 'PENDING', 'PAID', 'CONFIRMED', 'CANCELLED', 'REFUNDED'] as const;

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? '').trim();
  const status = sp.status ?? '';
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const where: any = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { bookingCode: { contains: q, mode: 'insensitive' } },
      { guestEmail: { contains: q, mode: 'insensitive' } },
      { guestName: { contains: q, mode: 'insensitive' } },
      { user: { email: { contains: q, mode: 'insensitive' } } },
      { user: { name: { contains: q, mode: 'insensitive' } } },
    ];
  }

  const [bookings, totalCount, statusCounts] = await Promise.all([
    prisma.booking
      .findMany({
        where,
        include: {
          items: { select: { productType: true, title: true } },
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: PAGE_SIZE,
        skip,
      })
      .catch(() => []),
    prisma.booking.count({ where }).catch(() => 0),
    prisma.booking
      .groupBy({ by: ['status'], _count: true })
      .catch(() => []),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const countByStatus = Object.fromEntries(statusCounts.map((s) => [s.status, s._count]));

  return (
    <div className="px-4 py-8 md:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Bookings</h1>
          <p className="text-sm text-slate-500">{totalCount} total {q || status ? '(filtered)' : ''}</p>
        </div>
      </div>

      {/* FILTERS */}
      <form className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search code, email, name…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-400"
          />
        </div>
        <select
          name="status"
          defaultValue={status}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s ? `${s} (${countByStatus[s] ?? 0})` : `All statuses`}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Filter
        </button>
        {(q || status) && (
          <a
            href="/admin/bookings"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            Clear
          </a>
        )}
      </form>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Code</th>
              <th className="py-2.5">Customer</th>
              <th className="py-2.5">Items</th>
              <th className="py-2.5">Total</th>
              <th className="py-2.5">Status</th>
              <th className="py-2.5">Payment</th>
              <th className="py-2.5 pr-4">Created</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/bookings/${b.id}` as any}
                    className="font-mono text-xs text-brand-700 hover:underline"
                  >
                    {b.bookingCode}
                  </Link>
                </td>
                <td className="py-3">
                  <p className="font-medium text-slate-800">
                    {b.user?.name ?? b.guestName ?? '—'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {b.user?.email ?? b.guestEmail ?? '—'}
                  </p>
                </td>
                <td className="py-3 text-xs text-slate-600">
                  {b.items.length} · {b.items.map((i) => i.productType).join(', ')}
                </td>
                <td className="py-3 font-semibold">
                  ${Number(b.totalAmount).toFixed(2)}
                  <p className="text-xs font-normal text-slate-500">{b.currency}</p>
                </td>
                <td className="py-3">
                  <StatusBadge status={b.status} />
                </td>
                <td className="py-3">
                  <StatusBadge status={b.paymentStatus} />
                </td>
                <td className="py-3 pr-4 text-xs text-slate-500">
                  {b.createdAt.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
              </tr>
            ))}
            {bookings.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                  No bookings found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-slate-500">
            Page {page} of {totalPages} · {totalCount} total
          </p>
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
      )}
    </div>
  );
}
