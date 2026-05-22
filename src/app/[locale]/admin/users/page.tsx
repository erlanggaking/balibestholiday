import { prisma } from '@/lib/prisma';
import { Link } from '@/i18n/routing';
import { Search } from 'lucide-react';

const PAGE_SIZE = 30;
const ROLES = ['', 'ADMIN', 'STAFF', 'VENDOR', 'CUSTOMER'] as const;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? '').trim();
  const role = sp.role ?? '';
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);

  const where: any = {};
  if (role) where.role = role;
  if (q) {
    where.OR = [
      { email: { contains: q, mode: 'insensitive' } },
      { name: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q } },
    ];
  }

  const [users, total, roleCounts] = await Promise.all([
    prisma.user
      .findMany({
        where,
        include: { _count: { select: { bookings: true, reviews: true } } },
        orderBy: { createdAt: 'desc' },
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
      })
      .catch(() => []),
    prisma.user.count({ where }).catch(() => 0),
    prisma.user.groupBy({ by: ['role'], _count: true }).catch(() => []),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const countByRole = Object.fromEntries(roleCounts.map((r) => [r.role, r._count]));

  return (
    <div className="px-4 py-8 md:px-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Users</h1>
        <p className="text-sm text-slate-500">{total} total {q || role ? '(filtered)' : ''}</p>
      </div>

      <form className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search email, name, phone…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-400"
          />
        </div>
        <select
          name="role"
          defaultValue={role}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r ? `${r} (${countByRole[r] ?? 0})` : 'All roles'}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Filter
        </button>
        {(q || role) && (
          <a
            href="/admin/users"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            Clear
          </a>
        )}
      </form>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5">User</th>
              <th className="py-2.5">Role</th>
              <th className="py-2.5">Locale / Currency</th>
              <th className="py-2.5">Bookings</th>
              <th className="py-2.5">Reviews</th>
              <th className="py-2.5 pr-4">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/users/${u.id}` as any}
                    className="font-medium text-slate-800 hover:text-brand-700"
                  >
                    {u.name ?? '(no name)'}
                  </Link>
                  <p className="text-xs text-slate-500">{u.email}</p>
                </td>
                <td className="py-3">
                  <RoleBadge role={u.role} />
                </td>
                <td className="py-3 text-xs text-slate-600">
                  {u.preferredLocale} · {u.preferredCurrency}
                </td>
                <td className="py-3 text-sm">{u._count.bookings}</td>
                <td className="py-3 text-sm">{u._count.reviews}</td>
                <td className="py-3 pr-4 text-xs text-slate-500">
                  {u.createdAt.toLocaleDateString()}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-between text-sm text-slate-500">
          <span>
            Page {page} of {totalPages}
          </span>
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

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    ADMIN: 'bg-purple-100 text-purple-800',
    STAFF: 'bg-blue-100 text-blue-800',
    VENDOR: 'bg-amber-100 text-amber-800',
    CUSTOMER: 'bg-slate-100 text-slate-700',
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        colors[role] ?? 'bg-slate-100 text-slate-700'
      }`}
    >
      {role}
    </span>
  );
}
