// Reusable "coming soon" stub for unbuilt admin pages.
import { Link } from '@/i18n/routing';
import { Construction } from 'lucide-react';

export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="px-4 py-8 md:px-8">
      <h1 className="mb-2 font-display text-2xl font-bold">{title}</h1>
      <p className="mb-6 text-sm text-slate-500">{description ?? 'Coming soon.'}</p>

      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
        <Construction className="mx-auto mb-3 h-10 w-10 text-slate-400" />
        <h2 className="mb-1 font-display text-lg font-semibold">Coming soon</h2>
        <p className="mx-auto mb-4 max-w-md text-sm text-slate-600">
          This admin section is still being built. The DB schema is in place — full
          CRUD UI will land in a future update. For now, you can manage these
          records directly via Prisma Studio or SQL.
        </p>
        <Link href="/admin" className="text-sm font-semibold text-brand-700 hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}
