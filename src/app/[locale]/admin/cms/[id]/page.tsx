import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { CmsPageForm } from '@/components/admin/cms-page-form';
import { Link } from '@/i18n/routing';
import { ArrowLeft } from 'lucide-react';

export default async function EditCmsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const page = await prisma.page.findUnique({ where: { id } }).catch(() => null);
  if (!page) notFound();

  return (
    <div className="px-4 py-8 md:px-8">
      <Link href="/admin/cms" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back to pages
      </Link>
      <h1 className="mb-1 font-display text-2xl font-bold">{page.title}</h1>
      <p className="mb-6 font-mono text-xs text-slate-500">/{page.slug}</p>
      <CmsPageForm page={page} />
    </div>
  );
}
