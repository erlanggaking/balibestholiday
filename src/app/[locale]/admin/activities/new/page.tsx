import { prisma } from '@/lib/prisma';
import { ActivityForm } from '@/components/admin/activity-form';
import { Link } from '@/i18n/routing';
import { ArrowLeft } from 'lucide-react';

export default async function NewActivityPage() {
  const destinations = await prisma.destination.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }).catch(() => []);
  return (
    <div className="px-4 py-8 md:px-8">
      <Link href="/admin/activities" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="mb-6 font-display text-2xl font-bold">New Activity</h1>
      <ActivityForm destinations={destinations} />
    </div>
  );
}
