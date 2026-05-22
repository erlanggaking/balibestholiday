import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Price } from '@/components/price';
import { format } from 'date-fns';

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/signin');

  const t = await getTranslations({ locale, namespace: 'account' });

  const bookings = await prisma.booking
    .findMany({
      where: { userId: session.user.id },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
    .catch(() => []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-2 font-display text-3xl font-bold">{t('myAccount')}</h1>
      <p className="mb-8 text-slate-600">
        {session.user.name ?? session.user.email}
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        <aside>
          <nav className="space-y-1">
            <SideLink href="/account" active>{t('myBookings')}</SideLink>
            <SideLink href="/account/wishlist">{t('wishlist')}</SideLink>
            <SideLink href="/account/profile">{t('profile')}</SideLink>
            {(session.user as any).role === 'ADMIN' && (
              <SideLink href="/admin">⚙️ Admin</SideLink>
            )}
          </nav>
        </aside>

        <div>
          <h2 className="mb-4 text-xl font-bold">{t('myBookings')}</h2>
          {bookings.length === 0 ? (
            <p className="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center text-slate-500">
              No bookings yet. Start exploring!
            </p>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <div key={b.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-mono text-xs text-slate-500">{b.bookingCode}</span>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="space-y-1">
                    {b.items.map((it) => (
                      <p key={it.id} className="text-sm font-medium">
                        {it.title}
                        {it.startDate && (
                          <span className="ml-2 text-xs text-slate-500">
                            · {format(new Date(it.startDate), 'd MMM yyyy')}
                          </span>
                        )}
                      </p>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t pt-3 text-sm">
                    <span className="text-slate-500">
                      {format(new Date(b.createdAt), 'd MMM yyyy')}
                    </span>
                    <span className="font-display text-lg font-bold text-brand-700">
                      <Price amountUSD={Number(b.totalAmount)} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SideLink({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href as any}
      className={`block rounded-lg px-3 py-2 text-sm ${
        active ? 'bg-brand-50 font-semibold text-brand-700' : 'text-slate-700 hover:bg-slate-100'
      }`}
    >
      {children}
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    CONFIRMED: 'bg-blue-100 text-blue-700',
    PAID: 'bg-emerald-100 text-emerald-700',
    CANCELLED: 'bg-rose-100 text-rose-700',
    COMPLETED: 'bg-slate-100 text-slate-700',
    REFUNDED: 'bg-purple-100 text-purple-700',
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  );
}
