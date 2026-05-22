import { CmsPageForm } from '@/components/admin/cms-page-form';
import { Link } from '@/i18n/routing';
import { ArrowLeft } from 'lucide-react';

export default async function NewCmsPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string; title?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="px-4 py-8 md:px-8">
      <Link href="/admin/cms" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back to pages
      </Link>
      <h1 className="mb-6 font-display text-2xl font-bold">New CMS Page</h1>
      <CmsPageForm
        page={{
          id: '',
          slug: sp.slug ?? '',
          title: sp.title ?? '',
          content: '<p></p>',
          isPublished: true,
        }}
      />
    </div>
  );
}
