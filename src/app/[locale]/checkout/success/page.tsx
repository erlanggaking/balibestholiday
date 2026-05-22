import { prisma } from '@/lib/prisma';
import { CheckCircle2 } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ bookingId?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: 'checkout' });

  const booking = sp.bookingId
    ? await prisma.booking.findUnique({ where: { id: sp.bookingId }, include: { items: true } }).catch(() => null)
    : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <CheckCircle2 className="h-12 w-12" />
      </div>
      <h1 className="mb-3 font-display text-3xl font-bold">{t('success')}</h1>
      <p className="mb-8 text-slate-600">{t('successDesc')}</p>

      {booking && (
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 text-left">
          <p className="mb-2 text-sm text-slate-500">Booking code</p>
          <p className="mb-4 font-mono text-lg font-bold">{booking.bookingCode}</p>
          {booking.items.map((it) => (
            <div key={it.id} className="border-t py-2 text-sm">
              <p className="font-medium">{it.title}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-center gap-3">
        <Link
          href="/account"
          className="rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700"
        >
          View bookings
        </Link>
        <Link
          href="/"
          className="rounded-lg border border-slate-200 px-5 py-2.5 font-semibold text-slate-700 hover:bg-slate-50"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
