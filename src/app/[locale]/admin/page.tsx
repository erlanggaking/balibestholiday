import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Link } from '@/i18n/routing';
import {
  Users, BookOpen, MapPin, Building2, Car, ShieldCheck, Plane, DollarSign,
} from 'lucide-react';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    redirect('/');
  }

  const [
    userCount,
    tourCount,
    hotelCount,
    carCount,
    flightCount,
    insuranceCount,
    bookingCount,
    paidRevenue,
    recentBookings,
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
      .findMany({
        include: { items: true, user: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })
      .catch(() => []),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-2 font-display text-3xl font-bold">Admin Dashboard</h1>
      <p className="mb-8 text-slate-600">Overview of Bali Best Holiday</p>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat icon={<Users className="h-5 w-5" />} label="Users" value={userCount} />
        <Stat icon={<BookOpen className="h-5 w-5" />} label="Bookings" value={bookingCount} />
        <Stat
          icon={<DollarSign className="h-5 w-5" />}
          label="Revenue (paid)"
          value={`$${Number(paidRevenue?._sum?.totalAmount ?? 0).toFixed(0)}`}
        />
        <Stat icon={<MapPin className="h-5 w-5" />} label="Tours" value={tourCount} />
        <Stat icon={<Building2 className="h-5 w-5" />} label="Hotels" value={hotelCount} />
        <Stat icon={<Car className="h-5 w-5" />} label="Cars" value={carCount} />
        <Stat icon={<Plane className="h-5 w-5" />} label="Flights" value={flightCount} />
        <Stat icon={<ShieldCheck className="h-5 w-5" />} label="Insurance plans" value={insuranceCount} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <AdminLink href="/admin/tours" title="Manage Tours" />
        <AdminLink href="/admin/hotels" title="Manage Hotels" />
        <AdminLink href="/admin/cars" title="Manage Cars" />
        <AdminLink href="/admin/flights" title="Manage Flights" />
        <AdminLink href="/admin/insurance" title="Manage Insurance" />
        <AdminLink href="/admin/bookings" title="Manage Bookings" />
        <AdminLink href="/admin/users" title="Manage Users" />
        <AdminLink href="/admin/promo" title="Promo Codes" />
        <AdminLink href="/admin/cms" title="CMS / Content" />
        <AdminLink href="/admin/markup" title="💰 Markup Settings" />
      </div>

      <h2 className="mb-3 mt-10 text-xl font-bold">Recent bookings</h2>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="p-3">Code</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Items</th>
              <th className="p-3">Total</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {recentBookings.map((b) => (
              <tr key={b.id} className="border-t">
                <td className="p-3 font-mono text-xs">{b.bookingCode}</td>
                <td className="p-3">{b.user?.name ?? b.guestName ?? b.guestEmail ?? '-'}</td>
                <td className="p-3">{b.items.length} item(s)</td>
                <td className="p-3">${Number(b.totalAmount).toFixed(2)}</td>
                <td className="p-3">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                    {b.status}
                  </span>
                </td>
              </tr>
            ))}
            {recentBookings.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-500">
                  No bookings yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
        {icon}
      </div>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="font-display text-2xl font-bold">{value}</p>
    </div>
  );
}

function AdminLink({ href, title }: { href: string; title: string }) {
  return (
    <Link
      href={href as any}
      className="rounded-xl border border-slate-200 bg-white p-4 hover:border-brand-400 hover:shadow-soft"
    >
      <p className="font-semibold">{title}</p>
    </Link>
  );
}
