import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { DestinationForm } from '@/components/admin/destination-form';
import { Link } from '@/i18n/routing';
import { ArrowLeft } from 'lucide-react';

export default async function EditDestinationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const destination = await prisma.destination.findUnique({ where: { id } }).catch(() => null);
  if (!destination) notFound();

  return (
    <div className="px-4 py-8 md:px-8">
      <Link href="/admin/destinations" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="mb-6 font-display text-2xl font-bold">{destination.name}</h1>
      <DestinationForm destination={destination as any} />
    </div>
  );
}
