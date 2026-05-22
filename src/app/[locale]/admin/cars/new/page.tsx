import { CarForm } from '@/components/admin/car-form';
import { Link } from '@/i18n/routing';
import { ArrowLeft } from 'lucide-react';

export default function NewCarPage() {
  return (
    <div className="px-4 py-8 md:px-8">
      <Link href="/admin/cars" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="mb-6 font-display text-2xl font-bold">New Car</h1>
      <CarForm />
    </div>
  );
}
