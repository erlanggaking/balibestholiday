import { prisma } from '@/lib/prisma';
import { Link } from '@/i18n/routing';
import {
  Users,
  Calendar,
  MapPin,
  Building2,
  Car,
  ShieldCheck,
  Plane,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
} from 'lucide-react';

// Helper: get start of day N days ago
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
};

export default async function AdminDashboard() {
  const [
    userCount,
    tourCount,
    hotelCount,
    carCount,
    flightCount,
    insuranceCount,
    bookingCount,
    paidRevenue,
    pendingPayment,
    paidLast30,
    paidPrev30,
    bookingsLast7Days,
    recentBookings,
    topTours,
  ] = await Promise.all([
    prisma.user.count().catch(() => 0),
    prisma.tour.count().catch(() => 0),
    prisma.hotel.count().catch(() => 0),
    prisma.car.count().catch(() => 0),
    prisma.flight.count().catch(() => 0),
    prisma.insurancePlan.count().catch(() => 0),
    prisma.booking.count().catch(() => 0),
    prisma.booking
      .aggregate({ _sum: { totalAmount: true }, where: { status: 'PAID' } })
      .catch(() => ({ _sum: { totalAmount: 0 } } as any)),
    prisma.booking
      .aggregate({
        _sum: { totalAmount: true },
        _count: true,
        where: { status: 'PENDING' },
      })
      .catch(() => ({ _sum: { totalAmount: 0 }, _count: 0 } as any)),
    prisma.booking
      .aggregate({
        _sum: { totalAmount: true },
        _count: true,
        where: { status: 'PAID', createdAt: { gte: daysAgo(30) } },
      })
      .catch(() => ({ _sum: { totalAmount: 0 }, _count: 0 } as any)),
    prisma.booking
      .aggregate({
        _sum: { totalAmount: true },
        where: {
          status: 'PAID',
          createdAt: { gte: daysAgo(60), lt: daysAgo(30) },
        },
      })
      .catch(() => ({ _sum: { totalAmount: 0 } } as any)),
    prisma.booking
      .findMany({
        where: { createdAt: { gte: daysAgo(7) } },
        select: { createdAt: true, totalAmount: true, status: true },
        orderBy: { createdAt: 'asc' },
      })
      .catch(() => []),
    prisma.booking
      .findMany({
        include: {
          items: { include: { tour: { select: { title: true, slug: true } } } },
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
      })
      .catch(() => []),
    prisma.bookingItem
      .groupBy({
        by: ['tourId'],
        where: { tourId: { not: null }, booking: { status: 'PAID' } },
        _count: true,
        _sum: { subtotal: true },
        orderBy: { _count: { tourId: 'desc' } },
        take: 5,
      })
      .catch(() => []),
  ]);

  // Build top tours with names
  const topTourIds = topTours.map((t) => t.tourId).filter(Boolean) as string[];
  const tourNames =
    topTourIds.length > 0
      ? await prisma.tour
          .findMany({
            where: { id: { in: topTourIds } },
            select: { id: true, title: true, slug: true },
          })
          .catch(() => [])
      : [];
  const tourNameMap = new Map(tourNames.map((t) => [t.id, t.title]));

  // Revenue trend
  const rev30 = Number(paidLast30?._sum?.totalAmount ?? 0);
  const revPrev = Number(paidPrev30?._sum?.totalAmount ?? 0);
  const revChange = revPrev > 0 ? ((rev30 - revPrev) / revPrev) * 100 : rev30 > 0 ? 100 : 0;

  // Bookings by day for last 7 days (simple bar chart data)
  const dayBuckets = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: d.toISOString().slice(0, 10),
      count: 0,
      revenue: 0,
    };
  });
  bookingsLast7Days.forEach((b) => {
    const key = b.createdAt.toISOString().slice(0, 10);
    const bucket = dayBuckets.find((x) => x.date === key);
    if (bucket) {
      bucket.count++;
      if (b.status === 'PAID') bucket.revenue += Number(b.totalAmount);
    }
  });
  const maxRevenue = Math.max(...dayBuckets.map((b) => b.revenue), 1);

  return (
    <div className="px-4 py-8 md:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Dashboard</h1>
          <p className="text-sm text-slate-600">Overview of your travel business</p>
        </div>
      </div>

      {/* TOP STATS */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat
          icon={<DollarSign className="h-5 w-5" />}
          label="Revenue (30d)"
          value={`$${rev30.toFixed(0)}`}
          trend={revChange}
        />
        <Stat
          icon={<Clock className="h-5 w-5" />}
          label="Pending payment"
          value={`$${Number(pendingPayment?._sum?.totalAmount ?? 0).toFixed(0)}`}
          subtext={`${pendingPayment?._count ?? 0} bookings`}
        />
        <Stat
          icon={<Calendar className="h-5 w-5" />}
          label="Bookings"
          value={bookingCount}
        />
        <Stat icon={<Users className="h-5 w-5" />} label="Users" value={userCount} />
      </div>

      {/* CATALOG STATS */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <CatalogStat icon={<MapPin className="h-4 w-4" />} label="Tours" value={tourCount} href="/admin/tours" />
        <CatalogStat icon={<Building2 className="h-4 w-4" />} label="Hotels" value={hotelCount} href="/admin/hotels" />
        <CatalogStat icon={<Car className="h-4 w-4" />} label="Cars" value={carCount} href="/admin/cars" />
        <CatalogStat icon={<Plane className="h-4 w-4" />} label="Flights" value={flightCount} href="/admin/flights" />
        <CatalogStat icon={<ShieldCheck className="h-4 w-4" />} label="Insurance" value={insuranceCount} href="/admin/insurance" />
      </div>

      {/* CHART + TOP TOURS */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        {/* Bookings chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Last 7 days · revenue</h3>
          <div className="flex h-44 items-end justify-between gap-2">
            {dayBuckets.map((b) => {
              const heightPct = (b.revenue / maxRevenue) * 100;
              return (
                <div key={b.date} className="flex flex-1 flex-col items-center justify-end gap-1.5">
                  <span className="text-[10px] font-mono text-slate-600">
                    ${b.revenue.toFixed(0)}
                  </span>
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-brand-500 to-brand-300 transition-all"
                    style={{ height: `${Math.max(heightPct, 2)}%` }}
                    title={`${b.count} bookings · $${b.revenue.toFixed(0)}`}
                  />
                  <span className="text-xs text-slate-500">{b.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top tours */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Top tours (paid)</h3>
          {topTours.length === 0 ? (
            <p className="text-xs text-slate-500">No paid bookings yet.</p>
          ) : (
            <ul className="space-y-3">
              {topTours.map((t, i) => (
                <li key={t.tourId} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2 truncate">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-brand-50 text-[10px] font-bold text-brand-700">
                      {i + 1}
                    </span>
                    <span className="truncate">{tourNameMap.get(t.tourId!) ?? t.tourId}</span>
                  </span>
                  <span className="shrink-0 text-xs text-slate-500">
                    {t._count}× · ${Number(t._sum?.subtotal ?? 0).toFixed(0)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* TOTAL REVENUE PILL */}
      <div className="mb-6 rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-ocean-50 p-6">
        <p className="text-xs uppercase tracking-wide text-brand-700">Total lifetime revenue (paid)</p>
        <p className="font-display text-4xl font-bold text-brand-800">
          ${Number(paidRevenue?._sum?.totalAmount ?? 0).toFixed(2)}
        </p>
      </div>

      {/* RECENT BOOKINGS */}
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h3 className="text-sm font-semibold">Recent bookings</h3>
          <Link href="/admin/bookings" className="text-xs font-semibold text-brand-700 hover:text-brand-800">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-2.5">Code</th>
                <th className="py-2.5">Customer</th>
                <th className="py-2.5">Items</th>
                <th className="py-2.5">Total</th>
                <th className="py-2.5">Status</th>
                <th className="py-2.5 pr-5">Created</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((b) => (
                <tr key={b.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-5 py-3 font-mono text-xs">
                    <Link
                      href={`/admin/bookings/${b.id}` as any}
                      className="text-brand-700 hover:underline"
                    >
                      {b.bookingCode}
                    </Link>
                  </td>
                  <td className="py-3 text-slate-700">
                    {b.user?.name ?? b.guestName ?? b.guestEmail ?? '—'}
                  </td>
                  <td className="py-3 text-slate-600">
                    {b.items.length} item{b.items.length !== 1 ? 's' : ''}
                  </td>
                  <td className="py-3 font-semibold">${Number(b.totalAmount).toFixed(2)}</td>
                  <td className="py-3">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="py-3 pr-5 text-xs text-slate-500">
                    {b.createdAt.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
              {recentBookings.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    No bookings yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  trend,
  subtext,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  trend?: number;
  subtext?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          {icon}
        </div>
        {trend !== undefined && (
          <span
            className={`flex items-center gap-0.5 text-xs font-semibold ${
              trend >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend).toFixed(0)}%
          </span>
        )}
      </div>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="font-display text-2xl font-bold">{value}</p>
      {subtext && <p className="mt-0.5 text-xs text-slate-500">{subtext}</p>}
    </div>
  );
}

function CatalogStat({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href as any}
      className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-brand-300 hover:shadow-sm"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 group-hover:bg-brand-50 group-hover:text-brand-700">
        {icon}
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
        <p className="font-display text-lg font-bold">{value}</p>
      </div>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-800',
    PAID: 'bg-emerald-100 text-emerald-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    CANCELLED: 'bg-red-100 text-red-800',
    REFUNDED: 'bg-slate-100 text-slate-700',
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        colors[status] ?? 'bg-slate-100 text-slate-700'
      }`}
    >
      {status}
    </span>
  );
}
