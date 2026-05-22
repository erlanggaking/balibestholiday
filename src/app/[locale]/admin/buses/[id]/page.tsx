import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { BusOperatorForm } from '@/components/admin/bus-operator-form';
import { BusRoutesManager } from '@/components/admin/bus-routes-manager';
import { Link } from '@/i18n/routing';
import { ArrowLeft } from 'lucide-react';

export default async function EditBusOperatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const operator = await prisma.busOperator
    .findUnique({
      where: { id },
      include: { routes: { include: { schedules: true }, orderBy: { fromCity: 'asc' } } },
    })
    .catch(() => null);
  if (!operator) notFound();

  return (
    <div className="px-4 py-8 md:px-8">
      <Link href="/admin/buses" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="mb-6 font-display text-2xl font-bold">{operator.name}</h1>

      <div className="space-y-6">
        <BusOperatorForm operator={operator as any} />
        <BusRoutesManager operatorId={operator.id} initialRoutes={operator.routes as any} />
      </div>
    </div>
  );
}
