import { prisma } from '@/lib/prisma';
import { TourForm } from '@/components/admin/tour-form';
import { Link } from '@/i18n/routing';
import { ArrowLeft } from 'lucide-react';

export default async function NewTourPage() {
  const [destinations, categories] = await Promise.all([
    prisma.destination.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }).catch(() => []),
    prisma.category.findMany({ where: { type: 'TOUR' }, orderBy: { name: 'asc' }, select: { id: true, name: true } }).catch(() => []),
  ]);
  return (
    <div className="px-4 py-8 md:px-8">
      <Link href="/admin/tours" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="mb-6 font-display text-2xl font-bold">New Package</h1>
      <TourForm destinations={destinations} categories={categories} />
    </div>
  );
}
