import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { getMarkupPct } from '@/lib/markup';
import { MarkupForm } from '@/components/markup-form';

export const metadata = { title: 'Markup settings — Admin' };

export default async function AdminMarkupPage() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') redirect('/auth/signin');

  const initial = {
    flight: await getMarkupPct('flight'),
    hotel: await getMarkupPct('hotel'),
    tour: await getMarkupPct('tour'),
    car: await getMarkupPct('car'),
    insurance: await getMarkupPct('insurance'),
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-2 font-display text-3xl font-bold">Markup configuration</h1>
      <p className="mb-8 text-slate-600">
        Set the public-facing markup percentage applied on top of supplier prices. Changes
        take effect immediately (60s cache).
      </p>
      <MarkupForm initial={initial} />
    </div>
  );
}
