import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { ActivityForm } from '@/components/admin/activity-form';
import { Link } from '@/i18n/routing';
import { ArrowLeft } from 'lucide-react';

export default async function EditActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [activity, destinations] = await Promise.all([
    prisma.activity.findUnique({ where: { id }, include: { images: { orderBy: { sortOrder: 'asc' } } } }).catch(() => null),
    prisma.destination.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }).catch(() => []),
  ]);
  if (!activity) notFound();

  return (
    <div className="px-4 py-8 md:px-8">
      <Link href="/admin/activities" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="mb-6 font-display text-2xl font-bold">Edit: {activity.name}</h1>
      <ActivityForm
        activity={{
          ...activity,
          imageUrls: activity.images.map((i) => i.url),
        } as any}
        destinations={destinations}
      />
    </div>
  );
}
