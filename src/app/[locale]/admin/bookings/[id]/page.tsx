import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Link } from '@/i18n/routing';
import { StatusBadge } from '@/components/admin/status-badge';
import { BookingStatusForm } from '@/components/admin/booking-status-form';
import { ArrowLeft, Mail, Phone, User as UserIcon, Calendar, MapPin } from 'lucide-react';

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const booking = await prisma.booking
    .findUnique({
      where: { id },
      include: {
        items: {
          include: {
            tour: { select: { title: true, slug: true } },
            hotel: { select: { name: true, slug: true } },
            room: { select: { name: true } },
            car: { select: { name: true, slug: true } },
            flight: {
              select: {
                flightNumber: true,
                airline: { select: { name: true, iataCode: true } },
              },
            },
            insurancePlan: { select: { name: true } },
          },
        },
        user: { select: { id: true, name: true, email: true, phone: true } },
        payments: { orderBy: { createdAt: 'desc' } },
      },
    })
    .catch(() => null);

  if (!booking) notFound();

  const customerName = booking.user?.name ?? booking.guestName ?? 'Guest';
  const customerEmail = booking.user?.email ?? booking.guestEmail ?? '—';
  const customerPhone = booking.user?.phone ?? booking.guestPhone ?? '—';

  return (
    <div className="px-4 py-8 md:px-8">
      <Link
        href="/admin/bookings"
        className="mb-6 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to bookings
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Booking</p>
          <h1 className="font-display text-2xl font-bold font-mono">{booking.bookingCode}</h1>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={booking.status} />
          <StatusBadge status={booking.paymentStatus} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* MAIN COLUMN */}
        <div className="space-y-4 lg:col-span-2">
          {/* ITEMS */}
          <div className="rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-3">
              <h3 className="text-sm font-semibold">Items ({booking.items.length})</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {booking.items.map((item) => {
                const productName =
                  item.tour?.title ??
                  item.hotel?.name ??
                  item.car?.name ??
                  (item.flight?.airline?.name && item.flight?.flightNumber
                    ? `${item.flight.airline.name} ${item.flight.flightNumber}`
                    : null) ??
                  item.insurancePlan?.name ??
                  item.title;

                return (
                  <div key={item.id} className="flex items-center justify-between px-5 py-4">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        {item.productType}
                        {item.room && ` · ${item.room.name}`}
                      </p>
                      <p className="truncate font-medium text-slate-900">{productName}</p>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                        {item.startDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {item.startDate.toLocaleDateString()}
                            {item.endDate && item.endDate.getTime() !== item.startDate.getTime() && (
                              <> → {item.endDate.toLocaleDateString()}</>
                            )}
                          </span>
                        )}
                        <span>
                          {item.adults} adult{item.adults !== 1 ? 's' : ''}
                          {item.children > 0 && `, ${item.children} child`}
                        </span>
                        <span>Qty: {item.quantity}</span>
                      </div>
                    </div>
                    <div className="ml-4 shrink-0 text-right">
                      <p className="font-semibold">${Number(item.subtotal).toFixed(2)}</p>
                      <p className="text-xs text-slate-500">
                        ${Number(item.unitPrice).toFixed(2)} × {item.quantity}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-slate-200 bg-slate-50 px-5 py-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total ({booking.currency})</span>
                <span className="font-display text-lg font-bold">
                  ${Number(booking.totalAmount).toFixed(2)}
                </span>
              </div>
              {booking.currency !== 'USD' && (
                <p className="text-xs text-slate-500">
                  Display: {booking.displayAmount} {booking.currency} (rate: {booking.exchangeRate})
                </p>
              )}
            </div>
          </div>

          {/* PAYMENTS */}
          {booking.payments.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-3">
                <h3 className="text-sm font-semibold">Payment history</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {booking.payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <div>
                      <p className="font-medium">
                        {p.provider} · ${Number(p.amount).toFixed(2)} {p.currency}
                      </p>
                      <p className="text-xs text-slate-500">
                        {p.providerRef ?? '(no ref)'} ·{' '}
                        {p.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {booking.notes && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="mb-2 text-sm font-semibold">Notes</h3>
              <p className="whitespace-pre-wrap text-sm text-slate-700">{booking.notes}</p>
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <div className="space-y-4">
          {/* STATUS UPDATER */}
          <BookingStatusForm
            id={booking.id}
            status={booking.status}
            paymentStatus={booking.paymentStatus}
          />

          {/* CUSTOMER */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="mb-3 text-sm font-semibold">Customer</h3>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-slate-400" />
                {customerName}
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-400" />
                <a href={`mailto:${customerEmail}`} className="text-brand-700 hover:underline">
                  {customerEmail}
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-400" />
                {customerPhone}
              </p>
              {booking.user && (
                <Link
                  href={`/admin/users/${booking.user.id}` as any}
                  className="mt-2 block text-xs font-semibold text-brand-700 hover:underline"
                >
                  View customer profile →
                </Link>
              )}
            </div>
          </div>

          {/* META */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm">
            <h3 className="mb-3 text-sm font-semibold">Metadata</h3>
            <dl className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <dt className="text-slate-500">Created</dt>
                <dd>{booking.createdAt.toLocaleString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Updated</dt>
                <dd>{booking.updatedAt.toLocaleString()}</dd>
              </div>
              {booking.stripeSessionId && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Stripe session</dt>
                  <dd className="font-mono text-[10px]">
                    {booking.stripeSessionId.slice(0, 14)}…
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
