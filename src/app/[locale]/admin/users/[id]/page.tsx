import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Link } from '@/i18n/routing';
import { ArrowLeft, Mail, Phone, Globe, DollarSign } from 'lucide-react';
import { UserRoleForm } from '@/components/admin/user-role-form';
import { StatusBadge } from '@/components/admin/status-badge';
import { requireAdminSession, isFullAdmin } from '@/lib/admin-auth';

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAdminSession();
  const { id } = await params;

  const user = await prisma.user
    .findUnique({
      where: { id },
      include: {
        bookings: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            bookingCode: true,
            status: true,
            totalAmount: true,
            currency: true,
            createdAt: true,
          },
        },
        _count: { select: { bookings: true, reviews: true } },
      },
    })
    .catch(() => null);

  if (!user) notFound();

  const totalSpent = await prisma.booking
    .aggregate({
      where: { userId: id, status: 'PAID' },
      _sum: { totalAmount: true },
    })
    .catch(() => ({ _sum: { totalAmount: 0 } } as any));

  return (
    <div className="px-4 py-8 md:px-8">
      <Link
        href="/admin/users"
        className="mb-6 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to users
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt=""
              className="h-16 w-16 rounded-full object-cover ring-2 ring-slate-200"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-ocean-500 font-display text-xl font-bold text-white">
              {user.name?.[0]?.toUpperCase() ?? user.email[0].toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="font-display text-2xl font-bold">{user.name ?? '(no name)'}</h1>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* MAIN */}
        <div className="space-y-4 lg:col-span-2">
          {/* STATS */}
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Bookings" value={user._count.bookings} />
            <Stat label="Reviews" value={user._count.reviews} />
            <Stat
              label="Lifetime spend"
              value={`$${Number(totalSpent?._sum?.totalAmount ?? 0).toFixed(0)}`}
            />
          </div>

          {/* CONTACT */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="mb-3 text-sm font-semibold">Contact & preferences</h3>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Field icon={<Mail className="h-4 w-4" />} label="Email" value={user.email} />
              <Field icon={<Phone className="h-4 w-4" />} label="Phone" value={user.phone ?? '—'} />
              <Field
                icon={<Globe className="h-4 w-4" />}
                label="Locale"
                value={user.preferredLocale}
              />
              <Field
                icon={<DollarSign className="h-4 w-4" />}
                label="Currency"
                value={user.preferredCurrency}
              />
            </dl>
          </div>

          {/* RECENT BOOKINGS */}
          <div className="rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-3">
              <h3 className="text-sm font-semibold">Recent bookings</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-2">Code</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th className="pr-5">Date</th>
                </tr>
              </thead>
              <tbody>
                {user.bookings.map((b) => (
                  <tr key={b.id} className="border-t border-slate-100">
                    <td className="px-5 py-2.5">
                      <Link
                        href={`/admin/bookings/${b.id}` as any}
                        className="font-mono text-xs text-brand-700 hover:underline"
                      >
                        {b.bookingCode}
                      </Link>
                    </td>
                    <td className="py-2.5">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="py-2.5 font-semibold">
                      ${Number(b.totalAmount).toFixed(2)}
                    </td>
                    <td className="py-2.5 pr-5 text-xs text-slate-500">
                      {b.createdAt.toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {user.bookings.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-6 text-center text-slate-500">
                      No bookings yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-4">
          {/* ROLE FORM (full ADMIN only — STAFF can't change roles) */}
          {isFullAdmin(session) ? (
            <UserRoleForm id={user.id} role={user.role} />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
              <p className="mb-1 text-xs font-semibold uppercase text-slate-700">Role</p>
              <p>{user.role} (read-only)</p>
              <p className="mt-2 text-xs">Only ADMIN can change roles.</p>
            </div>
          )}

          {/* META */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm">
            <h3 className="mb-3 text-sm font-semibold">Metadata</h3>
            <dl className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <dt className="text-slate-500">User ID</dt>
                <dd className="font-mono text-[10px]">{user.id.slice(0, 14)}…</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Email verified</dt>
                <dd>{user.emailVerified ? '✓' : '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Created</dt>
                <dd>{user.createdAt.toLocaleDateString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Updated</dt>
                <dd>{user.updatedAt.toLocaleDateString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Has password</dt>
                <dd>{user.passwordHash ? '✓' : '—'}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="font-display text-xl font-bold">{value}</p>
    </div>
  );
}

function Field({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <dt className="mb-0.5 flex items-center gap-1 text-xs text-slate-500">
        {icon}
        {label}
      </dt>
      <dd className="font-medium text-slate-800">{value}</dd>
    </div>
  );
}
