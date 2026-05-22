import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { TourForm } from '@/components/admin/tour-form';
import { Link } from '@/i18n/routing';
import { ArrowLeft, ExternalLink } from 'lucide-react';

export default async function EditTourPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [tour, destinations, categories] = await Promise.all([
    prisma.tour.findUnique({ where: { id }, include: { images: { orderBy: { sortOrder: 'asc' }, select: { url: true } } } }).catch(() => null),
    prisma.destination.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }).catch(() => []),
    prisma.category.findMany({ where: { type: 'TOUR' }, orderBy: { name: 'asc' }, select: { id: true, name: true } }).catch(() => []),
  ]);
  if (!tour) notFound();

  return (
    <div className="px-4 py-8 md:px-8">
      <Link href="/admin/tours" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">{tour.title}</h1>
        <Link href={`/tours/${tour.slug}` as any} target="_blank" className="inline-flex items-center gap-1 text-sm text-brand-700 hover:underline">
          View public <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
      <TourForm
        tour={{ ...tour, imageUrls: tour.images.map((i) => i.url) } as any}
        destinations={destinations}
        categories={categories}
      />
    </div>
  );
}
